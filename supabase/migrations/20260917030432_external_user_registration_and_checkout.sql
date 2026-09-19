-- HC 20 Anos — cadastro direto de usuário externo e checkout individual.
-- Usuários externos possuem conta e perfil privados, mas não entram no diretório
-- público da Turma 2006 e não usam o fluxo legado de aprovação por patrocinador.

alter table public.people
  add column if not exists person_type text not null default 'alumni';

alter table public.people
  drop constraint if exists people_person_type_check;

alter table public.people
  add constraint people_person_type_check
  check (person_type in ('alumni', 'external'));

update public.people
set person_type = 'alumni'
where person_type is null or person_type not in ('alumni', 'external');

-- O fluxo direto de usuário externo não coleta data de nascimento. Contato é
-- suficiente porque esse participante sempre paga o valor integral.
alter table public.order_participants
  drop constraint if exists order_participants_external_guest_contact_check;

alter table public.order_participants
  add constraint order_participants_external_guest_contact_check
  check (
    participant_type <> 'external_guest'
    or (email is not null and phone is not null)
  );

create or replace function public.register_external_user_profile(
  p_full_name text,
  p_contact_email text,
  p_contact_whatsapp text,
  p_current_city text default null,
  p_profession text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_person_id uuid;
  v_existing_type text;
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if nullif(btrim(p_full_name), '') is null then
    raise exception 'external_name_required' using errcode = '22023';
  end if;
  if nullif(btrim(p_contact_email), '') is null or position('@' in p_contact_email) <= 1 then
    raise exception 'external_email_invalid' using errcode = '22023';
  end if;
  if nullif(regexp_replace(coalesce(p_contact_whatsapp, ''), '\D', '', 'g'), '') is null then
    raise exception 'external_whatsapp_required' using errcode = '22023';
  end if;

  select u.email into v_auth_email
  from auth.users u
  where u.id = v_uid;

  if v_auth_email is null or lower(btrim(v_auth_email)) <> lower(btrim(p_contact_email)) then
    raise exception 'external_email_mismatch' using errcode = '42501';
  end if;

  select pr.person_id, pe.person_type
    into v_person_id, v_existing_type
  from public.profiles pr
  join public.people pe on pe.id = pr.person_id
  where pr.user_id = v_uid
  limit 1;

  if v_person_id is not null then
    if coalesce(v_existing_type, 'alumni') <> 'external' then
      raise exception 'external_registration_conflicts_with_alumni_profile' using errcode = 'P0001';
    end if;

    update public.people
       set full_name = btrim(p_full_name),
           display_name = btrim(p_full_name),
           contact_email = lower(btrim(p_contact_email)),
           contact_whatsapp = btrim(p_contact_whatsapp),
           is_visible = false,
           person_type = 'external',
           updated_at = now()
     where id = v_person_id;

    update public.profiles
       set display_name = btrim(p_full_name),
           contact_email = lower(btrim(p_contact_email)),
           contact_whatsapp = btrim(p_contact_whatsapp),
           current_city = nullif(btrim(p_current_city), ''),
           profession = nullif(btrim(p_profession), ''),
           show_current_photo = false,
           show_city = false,
           show_profession = false,
           show_social_links = false,
           allow_photo_tags = false,
           show_confirmed_status = false,
           updated_at = now()
     where user_id = v_uid
     returning * into v_profile;

    return v_profile;
  end if;

  insert into public.people (
    full_name,
    class_year,
    profile_status,
    claimed_by_user_id,
    claimed_at,
    is_visible,
    verification_status,
    contact_email,
    contact_whatsapp,
    display_name,
    person_type
  ) values (
    btrim(p_full_name),
    2006,
    'confirmed',
    v_uid,
    now(),
    false,
    'verified',
    lower(btrim(p_contact_email)),
    btrim(p_contact_whatsapp),
    btrim(p_full_name),
    'external'
  )
  returning id into v_person_id;

  insert into public.profiles (
    person_id,
    user_id,
    display_name,
    current_city,
    current_country,
    profession,
    contact_email,
    contact_whatsapp,
    show_current_photo,
    show_city,
    show_profession,
    show_social_links,
    allow_photo_tags,
    show_confirmed_status
  ) values (
    v_person_id,
    v_uid,
    btrim(p_full_name),
    nullif(btrim(p_current_city), ''),
    'Brasil',
    nullif(btrim(p_profession), ''),
    lower(btrim(p_contact_email)),
    btrim(p_contact_whatsapp),
    false,
    false,
    false,
    false,
    false,
    false
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.register_external_user_profile(text,text,text,text,text) from public, anon;
grant execute on function public.register_external_user_profile(text,text,text,text,text) to authenticated, service_role;

-- O checkout continua recebendo o participante principal com o contrato de UI
-- "alumni" por compatibilidade. O servidor consulta o tipo real da pessoa e,
-- quando o perfil é externo, grava o participante como external_guest.
create or replace function public.create_checkout_order(
  p_buyer_user_id uuid,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_product_code text,
  p_participants jsonb,
  p_extras jsonb default '[]'::jsonb,
  p_idempotency_key text default null
)
returns table(
  order_id uuid, public_token uuid, total_amount_cents integer,
  expires_at timestamptz, lot_id uuid, lot_code text, lot_name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
#variable_conflict use_variable
declare
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_order_id uuid;
  v_public_token uuid;
  v_lot public.ticket_lots%rowtype;
  v_existing_lot_id uuid;
  v_existing_lot_code text;
  v_existing_lot_name text;
  v_ticket_type_id uuid;
  v_base_price integer;
  v_profile_person_id uuid;
  v_person_type text := 'alumni';
  v_participant_count integer;
  v_alumni_count integer;
  v_spouse_count integer;
  v_child_count integer;
  v_total integer := 0;
  v_expires_at timestamptz := v_now + interval '30 minutes';
  v_participant jsonb;
  v_type text;
  v_stored_type text;
  v_birth_date date;
  v_age integer;
  v_unit_price integer;
  v_reserved integer := 0;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if p_buyer_user_id is null or p_buyer_user_id is distinct from v_uid then raise exception 'buyer_user_mismatch' using errcode='42501'; end if;
  if nullif(btrim(p_buyer_name),'') is null then raise exception 'buyer_name_required' using errcode='22023'; end if;
  if nullif(btrim(p_buyer_email),'') is null or position('@' in p_buyer_email)<=1 then raise exception 'buyer_email_invalid' using errcode='22023'; end if;
  if nullif(btrim(p_buyer_phone),'') is null then raise exception 'buyer_phone_required' using errcode='22023'; end if;
  if p_product_code <> 'simple' then raise exception 'unsupported_primary_product' using errcode='22023'; end if;
  if jsonb_typeof(p_participants) <> 'array' then raise exception 'participants_must_be_array' using errcode='22023'; end if;
  if jsonb_typeof(coalesce(p_extras,'[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_extras,'[]'::jsonb))>0 then raise exception 'extras_not_supported' using errcode='22023'; end if;

  if nullif(btrim(p_idempotency_key),'') is not null then
    select o.id,o.public_token,o.total_amount_cents,o.expires_at,o.lot_id,l.code,l.name
      into v_order_id,v_public_token,v_total,v_expires_at,v_existing_lot_id,v_existing_lot_code,v_existing_lot_name
    from public.orders o left join public.ticket_lots l on l.id=o.lot_id
    where o.buyer_user_id=v_uid and o.checkout_idempotency_key=p_idempotency_key limit 1;
    if v_order_id is not null then
      return query select v_order_id,v_public_token,v_total,v_expires_at,v_existing_lot_id,v_existing_lot_code,v_existing_lot_name;
      return;
    end if;
    v_total := 0;
    v_expires_at := v_now + interval '30 minutes';
  end if;

  perform public.release_expired_ticket_reservations(v_now);
  select l.* into v_lot
  from public.ticket_lots l join public.events e on e.id=l.event_id
  where l.event_id=v_event_id and e.event_status='published' and e.sales_status='open'
    and v_now < ((e.event_date+e.event_time) at time zone e.event_timezone)
    and l.status in ('scheduled','open')
    and (l.starts_at is null or l.starts_at<=v_now)
    and (l.ends_at is null or l.ends_at>v_now)
  order by case when l.status='open' then 0 else 1 end,l.sort_order desc
  limit 1 for update of l;
  if v_lot.id is null then raise exception 'no_active_lot' using errcode='P0001'; end if;

  select tt.id,lp.price_cents into v_ticket_type_id,v_base_price
  from public.ticket_types tt join public.ticket_lot_prices lp
    on lp.ticket_type_id=tt.id and lp.lot_id=v_lot.id and lp.is_active
  where tt.event_id=v_event_id and tt.product_code='simple' and tt.status='open'
  limit 1;
  if v_ticket_type_id is null or v_base_price is null or v_base_price<0 then raise exception 'invalid_primary_product' using errcode='P0001'; end if;

  v_participant_count:=jsonb_array_length(p_participants);
  if v_participant_count<1 or v_participant_count>6 then raise exception 'participant_limit_exceeded' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_participants) p where nullif(btrim(p.value->>'client_key'),'') is null or nullif(btrim(p.value->>'full_name'),'') is null or p.value->>'participant_type' not in ('alumni','spouse','child')) then raise exception 'invalid_participant' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_participants) p group by p.value->>'client_key' having count(*)>1) then raise exception 'participant_client_key_duplicate' using errcode='22023'; end if;

  select count(*) filter(where p.value->>'participant_type'='alumni'),count(*) filter(where p.value->>'participant_type'='spouse'),count(*) filter(where p.value->>'participant_type'='child')
    into v_alumni_count,v_spouse_count,v_child_count from jsonb_array_elements(p_participants) p;
  if v_alumni_count<>1 then raise exception 'exactly_one_alumni_required' using errcode='22023'; end if;
  if v_spouse_count>1 then raise exception 'spouse_limit_exceeded' using errcode='22023'; end if;

  select pr.person_id, coalesce(pe.person_type, 'alumni')
    into v_profile_person_id, v_person_type
  from public.profiles pr
  join public.people pe on pe.id=pr.person_id
  where pr.user_id=v_uid
  limit 1;
  if v_profile_person_id is null then raise exception 'alumni_registration_required' using errcode='P0001'; end if;

  if v_person_type = 'external' and (v_participant_count <> 1 or v_spouse_count <> 0 or v_child_count <> 0) then
    raise exception 'external_single_ticket_required' using errcode='22023';
  end if;

  select coalesce(sum(o.quantity),0)::integer into v_reserved from public.orders o
  where o.lot_id=v_lot.id and (o.payment_status='approved' or (o.payment_status in ('pending','in_process') and o.reservation_status='active' and (o.expires_at is null or o.expires_at>v_now)));
  if v_lot.capacity is not null and v_reserved+v_participant_count>v_lot.capacity then raise exception 'lot_capacity_exceeded' using errcode='P0001'; end if;

  for v_participant in select p.value from jsonb_array_elements(p_participants) p loop
    v_type:=v_participant->>'participant_type';
    v_unit_price:=v_base_price;
    if v_type='child' then
      if nullif(v_participant->>'birth_date','') is null or (v_participant->>'birth_date') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'child_birth_date_required' using errcode='22023'; end if;
      begin v_birth_date:=(v_participant->>'birth_date')::date; exception when others then raise exception 'child_birth_date_invalid' using errcode='22023'; end;
      v_age:=public.age_on_event_date(v_birth_date,v_event_id);
      if v_age is null or v_age<0 then raise exception 'child_birth_date_invalid' using errcode='22023'; end if;
      if v_age<=8 then v_unit_price:=0; elsif v_age<=12 then v_unit_price:=v_base_price/2; else v_unit_price:=v_base_price; end if;
    end if;
    v_total:=v_total+v_unit_price;
  end loop;

  insert into public.orders(event_id,buyer_user_id,buyer_name,buyer_email,buyer_phone,ticket_type_id,quantity,subtotal_amount_cents,extras_amount_cents,total_amount_cents,currency_id,payment_provider,payment_status,lot_id,expires_at,reservation_status,payment_environment,checkout_idempotency_key)
  values(v_event_id,v_uid,btrim(p_buyer_name),lower(btrim(p_buyer_email)),nullif(btrim(p_buyer_phone),''),v_ticket_type_id,v_participant_count,v_total,0,v_total,'BRL','mercadopago','pending',v_lot.id,v_expires_at,'active',null,nullif(btrim(p_idempotency_key),''))
  returning id,public_token into v_order_id,v_public_token;

  for v_participant in select p.value from jsonb_array_elements(p_participants) p loop
    v_type:=v_participant->>'participant_type';
    v_stored_type:=case when v_type='alumni' and v_person_type='external' then 'external_guest' else v_type end;
    v_unit_price:=v_base_price;
    v_birth_date:=null;
    if v_type='child' then
      v_birth_date:=(v_participant->>'birth_date')::date;
      v_age:=public.age_on_event_date(v_birth_date,v_event_id);
      if v_age<=8 then v_unit_price:=0; elsif v_age<=12 then v_unit_price:=v_base_price/2; else v_unit_price:=v_base_price; end if;
    end if;
    insert into public.order_participants(order_id,user_id,person_id,participant_type,full_name,email,phone,birth_date,relationship_to_alumni,sponsor_person_id,sponsor_user_id,guest_approval_request_id,unit_price_cents,status,client_key)
    values(
      v_order_id,
      case when v_type='alumni' then v_uid else null end,
      case when v_type='alumni' then v_profile_person_id else null end,
      v_stored_type,
      btrim(v_participant->>'full_name'),
      case when v_stored_type='external_guest' then lower(btrim(p_buyer_email)) else nullif(lower(btrim(v_participant->>'email')),'') end,
      case when v_stored_type='external_guest' then btrim(p_buyer_phone) else nullif(btrim(v_participant->>'phone'),'') end,
      v_birth_date,
      case when v_stored_type='external_guest' then 'external_user' else coalesce(nullif(v_participant->>'relationship_to_alumni',''),case when v_type='spouse' then 'spouse' when v_type='child' then 'child' else null end) end,
      null,null,null,v_unit_price,'reserved',v_participant->>'client_key'
    );
  end loop;

  return query select v_order_id,v_public_token,v_total,v_expires_at,v_lot.id,v_lot.code,v_lot.name;
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public,anon;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to authenticated,service_role;

-- Evita repetição do preço no título da seção; valores ficam no box dedicado.
update public.home_page_content
set tickets_title = 'Garanta sua presença'
where tickets_title = 'Ingresso único — R$ 120 por pessoa';

notify pgrst, 'reload schema';
