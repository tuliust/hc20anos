-- ================================================================
-- Transactional checkout order creation
-- HC 20 Anos — server-side pricing, participants and 30-minute hold
-- ================================================================
-- This migration also owns the schema and helper dependencies required by
-- create_checkout_order. They previously lived in files with invalid migration
-- timestamps and were therefore ignored by the Supabase CLI.
-- ================================================================

-- Idempotency and stable participant keys ------------------------------------

alter table if exists public.orders
  add column if not exists checkout_idempotency_key text;

create unique index if not exists orders_buyer_checkout_idempotency_unique
  on public.orders (buyer_user_id, checkout_idempotency_key)
  where buyer_user_id is not null and checkout_idempotency_key is not null;

alter table if exists public.order_participants
  add column if not exists client_key text;

create unique index if not exists order_participants_order_client_key_unique
  on public.order_participants (order_id, client_key)
  where client_key is not null;

-- Age helper bound to the event date -----------------------------------------

create or replace function public.age_on_event_date(
  p_birth_date date,
  p_event_id uuid
)
returns integer
language sql
stable
strict
security definer
set search_path = public
as $$
  select public.age_on_date(p_birth_date, e.event_date)
  from public.events e
  where e.id = p_event_id;
$$;

revoke all on function public.age_on_event_date(date, uuid) from public;
grant execute on function public.age_on_event_date(date, uuid) to service_role;

-- Checkout RPC ---------------------------------------------------------------

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
declare
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_now timestamptz := now();
  v_order_id uuid;
  v_public_token uuid;
  v_lot record;
  v_product record;
  v_additional_child record;
  v_external_guest record;
  v_extra_drinks record;
  v_extra_barbecue record;
  v_participant_count integer;
  v_alumni_count integer;
  v_spouse_count integer;
  v_child_count integer;
  v_external_count integer;
  v_included_children integer := 0;
  v_included_external integer := 0;
  v_subtotal integer := 0;
  v_extras_total integer := 0;
  v_total integer := 0;
  v_expires_at timestamptz := v_now + interval '30 minutes';
  v_participant jsonb;
  v_participant_id uuid;
  v_extra jsonb;
  v_extra_type text;
  v_extra_quantity integer;
  v_extra_price integer;
  v_target_key text;
  v_guest_approval_id uuid;
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

  if jsonb_typeof(p_participants) <> 'array' then
    raise exception 'participants_must_be_array' using errcode = 'P0001';
  end if;

  if jsonb_typeof(coalesce(p_extras, '[]'::jsonb)) <> 'array' then
    raise exception 'extras_must_be_array' using errcode = 'P0001';
  end if;

  -- Idempotency is scoped to the authenticated buyer.
  if nullif(btrim(p_idempotency_key), '') is not null then
    select o.id, o.public_token, o.total_amount_cents, o.expires_at, o.lot_id,
           l.code, l.name
      into v_order_id, v_public_token, v_total, v_expires_at, v_lot.id,
           v_lot.code, v_lot.name
    from public.orders o
    left join public.ticket_lots l on l.id = o.lot_id
    where o.buyer_user_id = p_buyer_user_id
      and o.checkout_idempotency_key = p_idempotency_key
    limit 1;

    if v_order_id is not null then
      return query select v_order_id, v_public_token, v_total, v_expires_at,
                          v_lot.id, v_lot.code, v_lot.name;
      return;
    end if;
  end if;

  perform public.expire_checkout_reservations(v_now);

  select * into v_lot
  from public.get_current_ticket_lot(v_event_id, v_now)
  limit 1;

  if v_lot.id is null then
    raise exception 'no_active_lot' using errcode = 'P0001';
  end if;

  select tt.*, lp.price_cents as current_price_cents
    into v_product
  from public.ticket_types tt
  join public.ticket_lot_prices lp
    on lp.ticket_type_id = tt.id
   and lp.lot_id = v_lot.id
   and lp.is_active
  where tt.event_id = v_event_id
    and tt.product_code = p_product_code
    and tt.status = 'open'
  limit 1;

  if v_product.id is null or v_product.package_kind = 'extra' then
    raise exception 'invalid_primary_product' using errcode = 'P0001';
  end if;

  select tt.*, lp.price_cents as current_price_cents into v_additional_child
  from public.ticket_types tt join public.ticket_lot_prices lp on lp.ticket_type_id=tt.id and lp.lot_id=v_lot.id and lp.is_active
  where tt.event_id=v_event_id and tt.product_code='additional_child' limit 1;

  select tt.*, lp.price_cents as current_price_cents into v_external_guest
  from public.ticket_types tt join public.ticket_lot_prices lp on lp.ticket_type_id=tt.id and lp.lot_id=v_lot.id and lp.is_active
  where tt.event_id=v_event_id and tt.product_code='external_guest' limit 1;

  select tt.*, lp.price_cents as current_price_cents into v_extra_drinks
  from public.ticket_types tt join public.ticket_lot_prices lp on lp.ticket_type_id=tt.id and lp.lot_id=v_lot.id and lp.is_active
  where tt.event_id=v_event_id and tt.product_code='extra_drinks' limit 1;

  select tt.*, lp.price_cents as current_price_cents into v_extra_barbecue
  from public.ticket_types tt join public.ticket_lot_prices lp on lp.ticket_type_id=tt.id and lp.lot_id=v_lot.id and lp.is_active
  where tt.event_id=v_event_id and tt.product_code='extra_barbecue' limit 1;

  v_participant_count := jsonb_array_length(p_participants);
  if v_participant_count < 1 or v_participant_count > 6 then
    raise exception 'participant_limit_exceeded' using errcode = 'P0001';
  end if;

  select
    count(*) filter (where value->>'participant_type' = 'alumni'),
    count(*) filter (where value->>'participant_type' = 'spouse'),
    count(*) filter (where value->>'participant_type' = 'child'),
    count(*) filter (where value->>'participant_type' = 'external_guest')
  into v_alumni_count, v_spouse_count, v_child_count, v_external_count
  from jsonb_array_elements(p_participants);

  if v_alumni_count <> 1 then
    raise exception 'exactly_one_alumni_required' using errcode = 'P0001';
  end if;

  case p_product_code
    when 'simple' then
      if v_spouse_count <> 0 or v_child_count <> 0 then
        raise exception 'simple_package_invalid_composition' using errcode = 'P0001';
      end if;
    when 'family_full' then
      if v_spouse_count <> 1 or v_child_count < 1 then
        raise exception 'family_full_invalid_composition' using errcode = 'P0001';
      end if;
      v_included_children := 1;
    when 'family_single_parent' then
      if v_spouse_count <> 0 or v_child_count < 1 then
        raise exception 'family_single_parent_invalid_composition' using errcode = 'P0001';
      end if;
      v_included_children := 1;
    when 'external_guest' then
      if v_alumni_count <> 1 or v_external_count < 1 then
        raise exception 'external_guest_package_invalid_composition' using errcode = 'P0001';
      end if;
      v_included_external := 1;
    else
      raise exception 'unsupported_primary_product' using errcode = 'P0001';
  end case;

  -- Validate each participant and approved external guests.
  for v_participant in select value from jsonb_array_elements(p_participants)
  loop
    if nullif(btrim(v_participant->>'full_name'), '') is null then
      raise exception 'participant_name_required' using errcode = 'P0001';
    end if;

    if v_participant->>'participant_type' = 'child' then
      if nullif(v_participant->>'birth_date', '') is null then
        raise exception 'child_birth_date_required' using errcode = 'P0001';
      end if;
      if public.age_on_event_date((v_participant->>'birth_date')::date, v_event_id) > 12 then
        raise exception 'child_age_limit_exceeded' using errcode = 'P0001';
      end if;
    elsif v_participant->>'participant_type' = 'external_guest' then
      if nullif(v_participant->>'email', '') is null
         or nullif(v_participant->>'phone', '') is null
         or nullif(v_participant->>'sponsor_person_id', '') is null then
        raise exception 'external_guest_data_required' using errcode = 'P0001';
      end if;

      select gar.id into v_guest_approval_id
      from public.guest_approval_requests gar
      where gar.event_id = v_event_id
        and gar.guest_user_id = coalesce(nullif(v_participant->>'user_id','')::uuid, p_buyer_user_id)
        and gar.sponsor_person_id = (v_participant->>'sponsor_person_id')::uuid
        and gar.status = 'approved'
      order by gar.decided_at desc nulls last
      limit 1;

      if v_guest_approval_id is null then
        raise exception 'external_guest_not_approved' using errcode = 'P0001';
      end if;
    end if;
  end loop;

  v_subtotal := v_product.current_price_cents;
  if v_child_count > v_included_children then
    v_subtotal := v_subtotal + ((v_child_count - v_included_children) * v_additional_child.current_price_cents);
  end if;
  if v_external_count > v_included_external then
    v_subtotal := v_subtotal + ((v_external_count - v_included_external) * v_external_guest.current_price_cents);
  end if;

  -- Validate and price extras. client_key identifies a participant inside the payload.
  for v_extra in select value from jsonb_array_elements(coalesce(p_extras, '[]'::jsonb))
  loop
    v_extra_type := v_extra->>'extra_type';
    v_extra_quantity := coalesce((v_extra->>'quantity')::integer, 0);
    v_target_key := v_extra->>'participant_key';
    if v_extra_type not in ('drinks','barbecue') or v_extra_quantity <= 0 or nullif(v_target_key,'') is null then
      raise exception 'invalid_extra' using errcode = 'P0001';
    end if;
    if not exists (select 1 from jsonb_array_elements(p_participants) p where p.value->>'client_key' = v_target_key) then
      raise exception 'extra_participant_not_found' using errcode = 'P0001';
    end if;
    v_extra_price := case when v_extra_type='drinks' then v_extra_drinks.current_price_cents else v_extra_barbecue.current_price_cents end;
    v_extras_total := v_extras_total + (v_extra_quantity * v_extra_price);
  end loop;

  v_total := v_subtotal + v_extras_total;

  insert into public.orders (
    event_id, buyer_user_id, buyer_name, buyer_email, buyer_phone,
    ticket_type_id, quantity, subtotal_amount_cents, extras_amount_cents,
    total_amount_cents, currency_id, payment_provider, payment_status,
    lot_id, expires_at, reservation_status, payment_environment,
    checkout_idempotency_key
  ) values (
    v_event_id, p_buyer_user_id, btrim(p_buyer_name), lower(btrim(p_buyer_email)), nullif(btrim(p_buyer_phone),''),
    v_product.id, v_participant_count, v_subtotal, v_extras_total,
    v_total, 'BRL', 'mercadopago', 'pending',
    v_lot.id, v_expires_at, 'active', null,
    nullif(btrim(p_idempotency_key),'')
  ) returning id, public_token into v_order_id, v_public_token;

  for v_participant in select value from jsonb_array_elements(p_participants)
  loop
    v_guest_approval_id := null;
    if v_participant->>'participant_type' = 'external_guest' then
      select gar.id into v_guest_approval_id
      from public.guest_approval_requests gar
      where gar.event_id=v_event_id
        and gar.guest_user_id=coalesce(nullif(v_participant->>'user_id','')::uuid,p_buyer_user_id)
        and gar.sponsor_person_id=(v_participant->>'sponsor_person_id')::uuid
        and gar.status='approved'
      order by gar.decided_at desc nulls last limit 1;
    end if;

    insert into public.order_participants (
      order_id, user_id, person_id, participant_type, full_name, email, phone,
      birth_date, relationship_to_alumni, sponsor_person_id, sponsor_user_id,
      guest_approval_request_id, unit_price_cents, status, client_key
    ) values (
      v_order_id,
      nullif(v_participant->>'user_id','')::uuid,
      nullif(v_participant->>'person_id','')::uuid,
      v_participant->>'participant_type',
      btrim(v_participant->>'full_name'),
      nullif(lower(btrim(v_participant->>'email')),''),
      nullif(btrim(v_participant->>'phone'),''),
      nullif(v_participant->>'birth_date','')::date,
      nullif(v_participant->>'relationship_to_alumni',''),
      nullif(v_participant->>'sponsor_person_id','')::uuid,
      nullif(v_participant->>'sponsor_user_id','')::uuid,
      v_guest_approval_id,
      0,
      'reserved',
      v_participant->>'client_key'
    ) returning id into v_participant_id;
  end loop;

  for v_extra in select value from jsonb_array_elements(coalesce(p_extras, '[]'::jsonb))
  loop
    v_extra_type := v_extra->>'extra_type';
    v_extra_quantity := (v_extra->>'quantity')::integer;
    v_target_key := v_extra->>'participant_key';
    v_extra_price := case when v_extra_type='drinks' then v_extra_drinks.current_price_cents else v_extra_barbecue.current_price_cents end;

    select id into v_participant_id
    from public.order_participants
    where order_id=v_order_id and client_key=v_target_key
    limit 1;

    insert into public.participant_extras (
      order_id, order_participant_id, extra_type, quantity, units_per_package, unit_price_cents
    ) values (
      v_order_id, v_participant_id, v_extra_type, v_extra_quantity, 10, v_extra_price
    );
  end loop;

  return query select v_order_id, v_public_token, v_total, v_expires_at,
                      v_lot.id, v_lot.code, v_lot.name;
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to service_role;

notify pgrst, 'reload schema';
