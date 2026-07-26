-- ================================================================
-- Modelo comercial definitivo: Individual, Família e Convidado.
--
-- Individual: somente ex-aluno pré-cadastrado e vinculado à conta.
-- Família: ex-aluno pré-cadastrado, um cônjuge e um ou mais filhos.
-- Convidado: participante adulto que não é ex-aluno.
-- ================================================================

-- ----------------------------------------------------------------
-- Catálogo e metadados dos três produtos vigentes
-- ----------------------------------------------------------------

update public.ticket_types
set name = 'Individual',
    description = 'Exclusivo para ex-aluno pré-cadastrado e vinculado à conta.',
    allows_guest = false,
    status = 'open',
    participant_type = 'alumni',
    package_kind = 'individual',
    included_people_count = 1,
    metadata_json = jsonb_build_object(
      'composition', jsonb_build_object('alumni', 1),
      'eligibility', 'pre_registered_alumni'
    ),
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and product_code = 'simple';

update public.ticket_types
set name = 'Família',
    description = 'Inclui o ex-aluno pré-cadastrado, um cônjuge e seus filhos.',
    allows_guest = true,
    status = 'open',
    participant_type = 'alumni',
    package_kind = 'family',
    included_people_count = 3,
    metadata_json = jsonb_build_object(
      'composition', jsonb_build_object('alumni', 1, 'spouse', 1, 'child_min', 1),
      'children_included', 'all',
      'max_participants_per_order', 6,
      'eligibility', 'pre_registered_alumni'
    ),
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and product_code = 'family_full';

update public.ticket_types
set name = 'Convidado',
    description = 'Ingresso individual para participante adulto que não é ex-aluno.',
    allows_guest = true,
    status = 'open',
    participant_type = 'external_guest',
    package_kind = 'guest',
    included_people_count = 1,
    metadata_json = jsonb_build_object(
      'composition', jsonb_build_object('external_guest', 1),
      'adult_only', true,
      'minimum_age', 18
    ),
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and product_code = 'external_guest';

-- Produtos antigos permanecem no histórico, mas deixam de ser vendáveis.
update public.ticket_types
set status = 'closed',
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and product_code in (
    'family_single_parent',
    'additional_child',
    'extra_drinks',
    'extra_barbecue'
  );

update public.ticket_lot_prices lp
set is_active = false,
    updated_at = now()
from public.ticket_types tt
where tt.id = lp.ticket_type_id
  and tt.event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and tt.product_code in (
    'family_single_parent',
    'additional_child',
    'extra_drinks',
    'extra_barbecue'
  );

-- ----------------------------------------------------------------
-- Catálogo público: somente os três produtos atuais
-- ----------------------------------------------------------------

create or replace function public.get_public_ticket_catalog(
  p_event_id uuid,
  p_at timestamptz default now()
)
returns table (
  lot_id uuid,
  lot_code text,
  lot_name text,
  lot_starts_at timestamptz,
  lot_ends_at timestamptz,
  lot_capacity integer,
  ticket_type_id uuid,
  product_code text,
  product_name text,
  description text,
  participant_type text,
  package_kind text,
  included_people_count integer,
  metadata_json jsonb,
  price_cents integer,
  ticket_status text,
  available_quantity integer,
  sold_quantity integer
)
language sql
stable
security definer
set search_path = public
as $$
  with current_lot as (
    select * from public.get_current_ticket_lot(p_event_id, p_at)
  )
  select
    l.id,
    l.code,
    l.name,
    l.starts_at,
    l.ends_at,
    l.capacity,
    tt.id,
    tt.product_code,
    tt.name,
    tt.description,
    tt.participant_type,
    tt.package_kind,
    tt.included_people_count,
    tt.metadata_json,
    lp.price_cents,
    tt.status::text,
    tt.available_quantity,
    coalesce(tt.sold_quantity, 0)
  from current_lot l
  join public.ticket_lot_prices lp
    on lp.lot_id = l.id
   and lp.is_active = true
  join public.ticket_types tt
    on tt.id = lp.ticket_type_id
   and tt.status in ('open', 'sold_out')
   and tt.product_code in ('simple', 'family_full', 'external_guest')
  order by
    case tt.product_code
      when 'simple' then 10
      when 'family_full' then 20
      when 'external_guest' then 30
      else 100
    end,
    tt.name;
$$;

-- ----------------------------------------------------------------
-- Administração de lotes: somente os três produtos atuais
-- ----------------------------------------------------------------

create or replace function public.admin_get_ticket_lots(
  p_event_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_products jsonb;
  v_lots jsonb;
begin
  if not exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
      and a.role in ('superadmin', 'admin')
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(row_to_json(product_row)::jsonb order by product_row.sort_order, product_row.name),
    '[]'::jsonb
  )
  into v_products
  from (
    select
      tt.id,
      tt.product_code,
      tt.name,
      tt.description,
      tt.status::text as status,
      tt.available_quantity,
      coalesce(tt.sold_quantity, 0) as sold_quantity,
      case tt.product_code
        when 'simple' then 10
        when 'family_full' then 20
        when 'external_guest' then 30
        else 100
      end as sort_order
    from public.ticket_types tt
    where tt.event_id = p_event_id
      and tt.product_code in ('simple', 'family_full', 'external_guest')
    order by sort_order, tt.name
  ) product_row;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'event_id', l.event_id,
      'code', l.code,
      'name', l.name,
      'sort_order', l.sort_order,
      'starts_at', l.starts_at,
      'ends_at', l.ends_at,
      'capacity', l.capacity,
      'status', l.status,
      'prices', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'ticket_type_id', lp.ticket_type_id,
            'price_cents', lp.price_cents,
            'is_active', lp.is_active
          )
          order by
            case tt.product_code
              when 'simple' then 10
              when 'family_full' then 20
              when 'external_guest' then 30
              else 100
            end
        )
        from public.ticket_lot_prices lp
        join public.ticket_types tt on tt.id = lp.ticket_type_id
        where lp.lot_id = l.id
          and tt.product_code in ('simple', 'family_full', 'external_guest')
      ), '[]'::jsonb)
    )
    order by l.sort_order, l.starts_at nulls first
  ), '[]'::jsonb)
  into v_lots
  from public.ticket_lots l
  where l.event_id = p_event_id;

  return jsonb_build_object(
    'event_id', p_event_id,
    'products', v_products,
    'lots', v_lots
  );
end;
$$;

-- ----------------------------------------------------------------
-- Convidado deixa de depender do fluxo legado de aprovação/patrocínio
-- ----------------------------------------------------------------

drop trigger if exists order_participants_guest_buyer_authorization
  on public.order_participants;

drop function if exists public.enforce_checkout_guest_buyer_authorization();

-- Remove somente o CHECK legado que exigia sponsor_person_id para convidado.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.order_participants'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%external_guest%'
      and pg_get_constraintdef(c.oid) ilike '%sponsor_person_id%'
  loop
    execute format(
      'alter table public.order_participants drop constraint %I',
      v_constraint.conname
    );
  end loop;
end;
$$;

alter table public.order_participants
  drop constraint if exists order_participants_external_guest_contact_check;

alter table public.order_participants
  add constraint order_participants_external_guest_contact_check
  check (
    participant_type <> 'external_guest'
    or (
      email is not null
      and phone is not null
      and birth_date is not null
    )
  );

-- ----------------------------------------------------------------
-- Checkout: preço único por produto e composição validada no servidor
-- ----------------------------------------------------------------

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
returns table (
  order_id uuid,
  public_token uuid,
  total_amount_cents integer,
  expires_at timestamptz,
  lot_id uuid,
  lot_code text,
  lot_name text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_now timestamptz := now();
  v_order_id uuid;
  v_public_token uuid;
  v_lot public.ticket_lots%rowtype;
  v_existing_lot_id uuid;
  v_existing_lot_code text;
  v_existing_lot_name text;
  v_product record;
  v_profile_person_id uuid;
  v_participant_count integer;
  v_alumni_count integer;
  v_spouse_count integer;
  v_child_count integer;
  v_external_count integer;
  v_total integer;
  v_expires_at timestamptz := v_now + interval '30 minutes';
  v_participant jsonb;
  v_participant_age integer;
begin
  if p_buyer_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;
  if nullif(btrim(p_buyer_name), '') is null then
    raise exception 'buyer_name_required' using errcode = 'P0001';
  end if;
  if nullif(btrim(p_buyer_email), '') is null or position('@' in p_buyer_email) <= 1 then
    raise exception 'buyer_email_invalid' using errcode = 'P0001';
  end if;
  if p_product_code not in ('simple', 'family_full', 'external_guest') then
    raise exception 'unsupported_primary_product' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_participants) <> 'array' then
    raise exception 'participants_must_be_array' using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_extras, '[]'::jsonb)) <> 'array' then
    raise exception 'extras_must_be_array' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(p_extras, '[]'::jsonb)) > 0 then
    raise exception 'invalid_extra' using errcode = 'P0001';
  end if;

  if nullif(btrim(p_idempotency_key), '') is not null then
    select o.id, o.public_token, o.total_amount_cents, o.expires_at,
           o.lot_id, l.code, l.name
      into v_order_id, v_public_token, v_total, v_expires_at,
           v_existing_lot_id, v_existing_lot_code, v_existing_lot_name
    from public.orders o
    left join public.ticket_lots l on l.id = o.lot_id
    where o.buyer_user_id = p_buyer_user_id
      and o.checkout_idempotency_key = p_idempotency_key
    limit 1;

    if v_order_id is not null then
      return query select v_order_id, v_public_token, v_total, v_expires_at,
                          v_existing_lot_id, v_existing_lot_code, v_existing_lot_name;
      return;
    end if;
  end if;

  perform public.release_expired_ticket_reservations(v_now);

  select l.* into v_lot
  from public.get_current_ticket_lot(v_event_id, v_now) l
  limit 1;
  if v_lot.id is null then
    raise exception 'no_active_lot' using errcode = 'P0001';
  end if;

  select tt.*, lp.price_cents as current_price_cents into v_product
  from public.ticket_types tt
  join public.ticket_lot_prices lp
    on lp.ticket_type_id = tt.id
   and lp.lot_id = v_lot.id
   and lp.is_active
  where tt.event_id = v_event_id
    and tt.product_code = p_product_code
    and tt.product_code in ('simple', 'family_full', 'external_guest')
    and tt.status = 'open'
  limit 1;

  if v_product.id is null then
    raise exception 'invalid_primary_product' using errcode = 'P0001';
  end if;

  v_participant_count := jsonb_array_length(p_participants);
  if v_participant_count < 1 or v_participant_count > 6 then
    raise exception 'participant_limit_exceeded' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_participants) p
    where nullif(btrim(p.value->>'client_key'), '') is null
       or nullif(btrim(p.value->>'full_name'), '') is null
       or p.value->>'participant_type' not in ('alumni', 'spouse', 'child', 'external_guest')
  ) then
    raise exception 'invalid_participant' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_participants) p
    group by p.value->>'client_key'
    having count(*) > 1
  ) then
    raise exception 'participant_client_key_duplicate' using errcode = 'P0001';
  end if;

  select
    count(*) filter (where p.value->>'participant_type' = 'alumni'),
    count(*) filter (where p.value->>'participant_type' = 'spouse'),
    count(*) filter (where p.value->>'participant_type' = 'child'),
    count(*) filter (where p.value->>'participant_type' = 'external_guest')
  into v_alumni_count, v_spouse_count, v_child_count, v_external_count
  from jsonb_array_elements(p_participants) p;

  if p_product_code in ('simple', 'family_full') then
    select pr.person_id
      into v_profile_person_id
    from public.profiles pr
    join public.people pe on pe.id = pr.person_id
    where pr.user_id = p_buyer_user_id
    limit 1;

    if v_profile_person_id is null then
      raise exception 'exactly_one_alumni_required' using errcode = 'P0001';
    end if;
  end if;

  case p_product_code
    when 'simple' then
      if v_alumni_count <> 1
         or v_spouse_count <> 0
         or v_child_count <> 0
         or v_external_count <> 0 then
        raise exception 'simple_package_invalid_composition' using errcode = 'P0001';
      end if;
    when 'family_full' then
      if v_alumni_count <> 1
         or v_spouse_count <> 1
         or v_child_count < 1
         or v_external_count <> 0 then
        raise exception 'family_full_invalid_composition' using errcode = 'P0001';
      end if;
    when 'external_guest' then
      if v_alumni_count <> 0
         or v_spouse_count <> 0
         or v_child_count <> 0
         or v_external_count <> 1 then
        raise exception 'external_guest_package_invalid_composition' using errcode = 'P0001';
      end if;
  end case;

  for v_participant in
    select p.value from jsonb_array_elements(p_participants) p
  loop
    if v_participant->>'participant_type' = 'child' then
      if nullif(v_participant->>'birth_date', '') is null then
        raise exception 'child_birth_date_required' using errcode = 'P0001';
      end if;
      v_participant_age := public.age_on_event_date(
        (v_participant->>'birth_date')::date,
        v_event_id
      );
      if v_participant_age < 0 then
        raise exception 'child_birth_date_invalid' using errcode = 'P0001';
      end if;
    elsif v_participant->>'participant_type' = 'external_guest' then
      if nullif(btrim(v_participant->>'email'), '') is null
         or position('@' in v_participant->>'email') <= 1
         or nullif(btrim(v_participant->>'phone'), '') is null
         or nullif(v_participant->>'birth_date', '') is null then
        raise exception 'external_guest_data_required' using errcode = 'P0001';
      end if;

      v_participant_age := public.age_on_event_date(
        (v_participant->>'birth_date')::date,
        v_event_id
      );
      if v_participant_age < 18 then
        -- Código já tratado pela Edge Function; a interface informa a regra adulta.
        raise exception 'child_birth_date_invalid' using errcode = 'P0001';
      end if;
    end if;
  end loop;

  v_total := v_product.current_price_cents;

  insert into public.orders as inserted_order (
    event_id, buyer_user_id, buyer_name, buyer_email, buyer_phone,
    ticket_type_id, quantity, subtotal_amount_cents, extras_amount_cents,
    total_amount_cents, currency_id, payment_provider, payment_status,
    lot_id, expires_at, reservation_status, payment_environment,
    checkout_idempotency_key
  ) values (
    v_event_id, p_buyer_user_id, btrim(p_buyer_name), lower(btrim(p_buyer_email)), nullif(btrim(p_buyer_phone), ''),
    v_product.id, v_participant_count, v_total, 0,
    v_total, 'BRL', 'mercadopago', 'pending',
    v_lot.id, v_expires_at, 'active', null,
    nullif(btrim(p_idempotency_key), '')
  ) returning inserted_order.id, inserted_order.public_token
    into v_order_id, v_public_token;

  for v_participant in
    select p.value from jsonb_array_elements(p_participants) p
  loop
    insert into public.order_participants (
      order_id, user_id, person_id, participant_type, full_name, email, phone,
      birth_date, relationship_to_alumni, sponsor_person_id, sponsor_user_id,
      guest_approval_request_id, unit_price_cents, status, client_key
    ) values (
      v_order_id,
      case
        when v_participant->>'participant_type' = 'alumni' then p_buyer_user_id
        when v_participant->>'participant_type' = 'external_guest' then p_buyer_user_id
        else nullif(v_participant->>'user_id', '')::uuid
      end,
      case
        when v_participant->>'participant_type' = 'alumni' then v_profile_person_id
        else nullif(v_participant->>'person_id', '')::uuid
      end,
      v_participant->>'participant_type',
      btrim(v_participant->>'full_name'),
      nullif(lower(btrim(v_participant->>'email')), ''),
      nullif(btrim(v_participant->>'phone'), ''),
      nullif(v_participant->>'birth_date', '')::date,
      nullif(v_participant->>'relationship_to_alumni', ''),
      null,
      null,
      null,
      0,
      'reserved',
      v_participant->>'client_key'
    );
  end loop;

  return query select v_order_id, v_public_token, v_total, v_expires_at,
                      v_lot.id, v_lot.code, v_lot.name;
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to service_role;

-- ----------------------------------------------------------------
-- Installation assertions
-- ----------------------------------------------------------------

do $$
declare
  v_catalog_codes text[];
  v_definition text;
begin
  select array_agg(tt.product_code order by tt.product_code)
    into v_catalog_codes
  from public.ticket_types tt
  where tt.event_id = '00000000-0000-0000-0000-000000000001'::uuid
    and tt.status = 'open'
    and tt.product_code in ('simple', 'family_full', 'external_guest');

  if v_catalog_codes is distinct from array['external_guest', 'family_full', 'simple']::text[] then
    raise exception 'three ticket products were not installed: %', v_catalog_codes;
  end if;

  select pg_get_functiondef(
    'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure
  ) into v_definition;

  if position('v_total := v_product.current_price_cents' in v_definition) = 0 then
    raise exception 'single product price checkout was not installed';
  end if;
  if position('pr.user_id = p_buyer_user_id' in v_definition) = 0 then
    raise exception 'pre-registered alumni validation was not installed';
  end if;
end;
$$;

notify pgrst, 'reload schema';
