-- ================================================================
-- Self-cleaning checkout checks for companions and approved guests.
-- Safe for the Supabase SQL Editor.
-- ================================================================

set role postgres;

drop table if exists pg_temp._checkout_guest_results;
create temporary table _checkout_guest_results (
  scenario text primary key,
  expected_cents integer,
  actual_cents integer,
  guest_unit_price_cents integer,
  expected_guest_unit_price_cents integer
);

do $$
declare
  v_user_id uuid;
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_lot_id uuid;
  v_sponsor_person_id uuid;
  v_approval_id uuid;
  v_simple_price integer;
  v_guest_price integer;
  v_order record;
  v_guest_unit_price integer;
  v_key text := gen_random_uuid()::text;
  v_guest_email text := 'checkout-approved-guest-' || replace(gen_random_uuid()::text, '-', '') || '@example.com';
  v_created_order_ids uuid[] := array[]::uuid[];
begin
  if to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is null then
    raise exception 'Missing create_checkout_order RPC';
  end if;

  select u.id into v_user_id from auth.users u order by u.created_at limit 1;
  if v_user_id is null then
    raise exception 'Test requires at least one auth.users row';
  end if;

  select p.id into v_sponsor_person_id from public.people p order by p.created_at limit 1;
  if v_sponsor_person_id is null then
    raise exception 'Test requires at least one people row';
  end if;

  select l.id into v_lot_id
  from public.get_current_ticket_lot(v_event_id, now()) l
  limit 1;
  if v_lot_id is null then
    raise exception 'No active ticket lot found';
  end if;

  select lp.price_cents into v_simple_price
  from public.ticket_types tt
  join public.ticket_lot_prices lp on lp.ticket_type_id = tt.id
  where tt.event_id = v_event_id
    and tt.product_code = 'simple'
    and tt.status = 'open'
    and lp.lot_id = v_lot_id
    and lp.is_active
  limit 1;

  select lp.price_cents into v_guest_price
  from public.ticket_types tt
  join public.ticket_lot_prices lp on lp.ticket_type_id = tt.id
  where tt.event_id = v_event_id
    and tt.product_code = 'external_guest'
    and tt.status = 'open'
    and lp.lot_id = v_lot_id
    and lp.is_active
  limit 1;

  if v_simple_price is null or v_guest_price is null then
    raise exception 'Simple and external guest prices must be active in the current lot';
  end if;

  insert into public.guest_approval_requests (
    event_id, guest_user_id, guest_name, guest_email, guest_phone,
    relationship_to_alumni, sponsor_person_id, sponsor_user_id,
    status, decided_at, decided_by_user_id
  ) values (
    v_event_id, v_user_id, 'Convidado Aprovado Teste', v_guest_email,
    '5599999999999', 'Amigo da turma', v_sponsor_person_id, v_user_id,
    'approved', now(), v_user_id
  ) returning id into v_approval_id;

  -- Scenario 1: an ex-alumnus buys the base ticket plus one approved guest.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Ex-Aluno Teste',
    'checkout-mixed-' || replace(gen_random_uuid()::text, '-', '') || '@example.com',
    '5599999999999',
    'simple',
    jsonb_build_array(
      jsonb_build_object(
        'client_key', 'alumni-' || v_key,
        'participant_type', 'alumni',
        'full_name', 'Ex-Aluno Teste'
      ),
      jsonb_build_object(
        'client_key', 'guest-mixed-' || v_key,
        'participant_type', 'external_guest',
        'full_name', 'Convidado Aprovado Teste',
        'email', v_guest_email,
        'phone', '5599999999999',
        'sponsor_person_id', v_sponsor_person_id
      )
    ),
    '[]'::jsonb,
    'mixed-guest-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select op.unit_price_cents into v_guest_unit_price
  from public.order_participants op
  where op.order_id = v_order.order_id
    and op.participant_type = 'external_guest'
  limit 1;

  insert into _checkout_guest_results values (
    'simple plus approved guest',
    v_simple_price + v_guest_price,
    v_order.total_amount_cents,
    v_guest_unit_price,
    v_guest_price
  );

  -- Scenario 2: the approved guest buys their own external guest ticket.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Convidado Aprovado Teste',
    v_guest_email,
    '5599999999999',
    'external_guest',
    jsonb_build_array(
      jsonb_build_object(
        'client_key', 'guest-direct-' || v_key,
        'participant_type', 'external_guest',
        'full_name', 'Convidado Aprovado Teste',
        'email', v_guest_email,
        'phone', '5599999999999',
        'user_id', v_user_id,
        'sponsor_person_id', v_sponsor_person_id
      )
    ),
    '[]'::jsonb,
    'direct-guest-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select op.unit_price_cents into v_guest_unit_price
  from public.order_participants op
  where op.order_id = v_order.order_id
    and op.participant_type = 'external_guest'
  limit 1;

  insert into _checkout_guest_results values (
    'direct approved guest',
    v_guest_price,
    v_order.total_amount_cents,
    v_guest_unit_price,
    0
  );

  if exists (
    select 1 from _checkout_guest_results r
    where r.expected_cents <> r.actual_cents
       or r.expected_guest_unit_price_cents <> r.guest_unit_price_cents
  ) then
    raise exception 'Approved guest checkout mismatch: %',
      (select jsonb_agg(to_jsonb(r)) from _checkout_guest_results r
       where r.expected_cents <> r.actual_cents
          or r.expected_guest_unit_price_cents <> r.guest_unit_price_cents);
  end if;

  delete from public.orders o where o.id = any(v_created_order_ids);
  delete from public.guest_approval_requests r where r.id = v_approval_id;
exception
  when others then
    if cardinality(v_created_order_ids) > 0 then
      delete from public.orders o where o.id = any(v_created_order_ids);
    end if;
    if v_approval_id is not null then
      delete from public.guest_approval_requests r where r.id = v_approval_id;
    end if;
    raise;
end;
$$;

select
  scenario,
  expected_cents,
  actual_cents,
  guest_unit_price_cents,
  expected_guest_unit_price_cents,
  case
    when expected_cents = actual_cents
     and guest_unit_price_cents = expected_guest_unit_price_cents then 'PASS'
    else 'FAIL'
  end as result
from _checkout_guest_results
order by scenario;

drop table if exists pg_temp._checkout_guest_results;
