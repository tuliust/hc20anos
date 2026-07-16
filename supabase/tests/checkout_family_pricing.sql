-- ================================================================
-- Self-cleaning family checkout pricing checks
-- HC 20 Anos
--
-- Safe for Supabase SQL Editor: does not depend on BEGIN/ROLLBACK or
-- ON COMMIT DROP. Test orders are removed before the script finishes.
-- ================================================================

set role postgres;

drop table if exists pg_temp._checkout_family_results;
create temporary table _checkout_family_results (
  scenario text primary key,
  order_id uuid,
  expected_cents integer,
  actual_cents integer,
  participant_price_cents integer
);

do $$
declare
  v_user_id uuid;
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_lot_id uuid;
  v_family_full_price integer;
  v_additional_child_price integer;
  v_order record;
  v_key text := gen_random_uuid()::text;
  v_created_order_ids uuid[] := array[]::uuid[];
  v_participant_price integer;
begin
  -- Preflight: fail once with a precise dependency report.
  if to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is null then
    raise exception 'Missing create_checkout_order RPC';
  end if;
  if to_regprocedure('public.get_current_ticket_lot(uuid,timestamptz)') is null then
    raise exception 'Missing get_current_ticket_lot';
  end if;
  if to_regprocedure('public.release_expired_ticket_reservations(timestamptz)') is null then
    raise exception 'Missing release_expired_ticket_reservations';
  end if;
  if to_regprocedure('public.age_on_event_date(date,uuid)') is null then
    raise exception 'Missing age_on_event_date';
  end if;

  select u.id into v_user_id from auth.users u order by u.created_at limit 1;
  if v_user_id is null then
    raise exception 'Test requires at least one auth.users row';
  end if;

  select l.id into v_lot_id
  from public.get_current_ticket_lot(v_event_id, now()) l
  limit 1;
  if v_lot_id is null then
    raise exception 'No active ticket lot found';
  end if;

  select lp.price_cents into v_family_full_price
  from public.ticket_types tt
  join public.ticket_lot_prices lp on lp.ticket_type_id = tt.id
  where tt.event_id = v_event_id
    and tt.product_code = 'family_full'
    and tt.status = 'open'
    and lp.lot_id = v_lot_id
    and lp.is_active
  limit 1;

  select lp.price_cents into v_additional_child_price
  from public.ticket_types tt
  join public.ticket_lot_prices lp on lp.ticket_type_id = tt.id
  where tt.event_id = v_event_id
    and tt.product_code = 'additional_child'
    and tt.status = 'open'
    and lp.lot_id = v_lot_id
    and lp.is_active
  limit 1;

  if v_family_full_price is null or v_additional_child_price is null then
    raise exception 'Required family prices are not configured for the active lot';
  end if;

  -- Remove leftovers from prior failed versions of this test.
  delete from public.orders o
  where o.buyer_email like 'checkout-test-%@example.com'
    and o.payment_status <> 'approved';

  -- Scenario 1: one eligible child is included.
  select * into v_order
  from public.create_checkout_order(
    v_user_id, 'Teste Família 1', 'checkout-test-1@example.com', '5599999999999',
    'family_full',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-1','participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-1','participant_type','spouse','full_name','Cônjuge Teste'),
      jsonb_build_object('client_key','child-1','participant_type','child','full_name','Filho 10 anos','birth_date','2016-10-24')
    ),
    '[]'::jsonb,
    'family-test-1-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);
  select coalesce(sum(op.unit_price_cents),0)::integer into v_participant_price
  from public.order_participants op where op.order_id = v_order.order_id;
  insert into _checkout_family_results values (
    '1 child <=12', v_order.order_id, v_family_full_price,
    v_order.total_amount_cents, v_participant_price
  );

  -- Scenario 2: second eligible child is additional.
  select * into v_order
  from public.create_checkout_order(
    v_user_id, 'Teste Família 2', 'checkout-test-2@example.com', '5599999999999',
    'family_full',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-2','participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-2','participant_type','spouse','full_name','Cônjuge Teste'),
      jsonb_build_object('client_key','child-2a','participant_type','child','full_name','Filho 10 anos','birth_date','2016-10-24'),
      jsonb_build_object('client_key','child-2b','participant_type','child','full_name','Filho 8 anos','birth_date','2018-10-24')
    ),
    '[]'::jsonb,
    'family-test-2-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);
  select coalesce(sum(op.unit_price_cents),0)::integer into v_participant_price
  from public.order_participants op where op.order_id = v_order.order_id;
  insert into _checkout_family_results values (
    '2 children <=12', v_order.order_id,
    v_family_full_price + v_additional_child_price,
    v_order.total_amount_cents, v_participant_price
  );

  -- Scenario 3: child aged 13 is additional.
  select * into v_order
  from public.create_checkout_order(
    v_user_id, 'Teste Família 3', 'checkout-test-3@example.com', '5599999999999',
    'family_full',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-3','participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-3','participant_type','spouse','full_name','Cônjuge Teste'),
      jsonb_build_object('client_key','child-3','participant_type','child','full_name','Filho 13 anos','birth_date','2013-10-24')
    ),
    '[]'::jsonb,
    'family-test-3-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);
  select coalesce(sum(op.unit_price_cents),0)::integer into v_participant_price
  from public.order_participants op where op.order_id = v_order.order_id;
  insert into _checkout_family_results values (
    '1 child age 13', v_order.order_id,
    v_family_full_price + v_additional_child_price,
    v_order.total_amount_cents, v_participant_price
  );

  if exists (
    select 1 from _checkout_family_results r
    where r.expected_cents <> r.actual_cents
       or r.participant_price_cents <> r.expected_cents - v_family_full_price
  ) then
    raise exception 'Family checkout pricing mismatch: %',
      (select jsonb_agg(to_jsonb(r)) from _checkout_family_results r
       where r.expected_cents <> r.actual_cents
          or r.participant_price_cents <> r.expected_cents - v_family_full_price);
  end if;

  delete from public.orders o where o.id = any(v_created_order_ids);
exception
  when others then
    if cardinality(v_created_order_ids) > 0 then
      delete from public.orders o where o.id = any(v_created_order_ids);
    end if;
    raise;
end;
$$;

select
  r.scenario,
  r.expected_cents,
  r.actual_cents,
  r.participant_price_cents,
  case
    when r.expected_cents = r.actual_cents then 'PASS'
    else 'FAIL'
  end as result
from _checkout_family_results r
order by r.scenario;

drop table if exists pg_temp._checkout_family_results;
