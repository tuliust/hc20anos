-- ================================================================
-- Transactional family checkout pricing checks
-- HC 20 Anos
--
-- Run in the Supabase SQL Editor after migrations 00001–00009.
-- The transaction is rolled back, so no test orders remain.
-- ================================================================

begin;

set local role postgres;

create temporary table _checkout_family_results (
  scenario text primary key,
  order_id uuid,
  expected_cents integer,
  actual_cents integer
) on commit drop;

do $$
declare
  v_user_id uuid;
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_lot_id uuid;
  v_family_full_price integer;
  v_additional_child_price integer;
  v_order record;
  v_key text := gen_random_uuid()::text;
begin
  select id into v_user_id from auth.users order by created_at limit 1;
  if v_user_id is null then
    raise exception 'Test requires at least one auth.users row';
  end if;

  select id into v_lot_id
  from public.get_current_ticket_lot(v_event_id, now())
  limit 1;

  if v_lot_id is null then
    raise exception 'No active ticket lot found';
  end if;

  select lp.price_cents into v_family_full_price
  from public.ticket_types tt
  join public.ticket_lot_prices lp on lp.ticket_type_id = tt.id
  where tt.event_id = v_event_id
    and tt.product_code = 'family_full'
    and lp.lot_id = v_lot_id
    and lp.is_active
  limit 1;

  select lp.price_cents into v_additional_child_price
  from public.ticket_types tt
  join public.ticket_lot_prices lp on lp.ticket_type_id = tt.id
  where tt.event_id = v_event_id
    and tt.product_code = 'additional_child'
    and lp.lot_id = v_lot_id
    and lp.is_active
  limit 1;

  if v_family_full_price is null or v_additional_child_price is null then
    raise exception 'Required family prices are not configured for the active lot';
  end if;

  -- Scenario 1: family full + one eligible child (included in package).
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Teste Família 1',
    'checkout-test-1@example.com',
    '5599999999999',
    'family_full',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-1','participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-1','participant_type','spouse','full_name','Cônjuge Teste'),
      jsonb_build_object('client_key','child-1','participant_type','child','full_name','Filho 10 anos','birth_date','2016-10-24')
    ),
    '[]'::jsonb,
    'family-test-1-' || v_key
  );

  insert into _checkout_family_results values (
    '1 child <=12', v_order.order_id, v_family_full_price, v_order.total_amount_cents
  );

  -- Scenario 2: family full + two eligible children (one included, one additional).
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Teste Família 2',
    'checkout-test-2@example.com',
    '5599999999999',
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

  insert into _checkout_family_results values (
    '2 children <=12', v_order.order_id,
    v_family_full_price + v_additional_child_price,
    v_order.total_amount_cents
  );

  -- Scenario 3: family full + one child aged 13 at the event (fully additional).
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Teste Família 3',
    'checkout-test-3@example.com',
    '5599999999999',
    'family_full',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-3','participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-3','participant_type','spouse','full_name','Cônjuge Teste'),
      jsonb_build_object('client_key','child-3','participant_type','child','full_name','Filho 13 anos','birth_date','2013-10-24')
    ),
    '[]'::jsonb,
    'family-test-3-' || v_key
  );

  insert into _checkout_family_results values (
    '1 child age 13', v_order.order_id,
    v_family_full_price + v_additional_child_price,
    v_order.total_amount_cents
  );

  if exists (
    select 1 from _checkout_family_results where expected_cents <> actual_cents
  ) then
    raise exception 'Family checkout pricing mismatch: %',
      (select jsonb_agg(to_jsonb(r)) from _checkout_family_results r where expected_cents <> actual_cents);
  end if;
end;
$$;

select
  scenario,
  expected_cents,
  actual_cents,
  case when expected_cents = actual_cents then 'PASS' else 'FAIL' end as result
from _checkout_family_results
order by scenario;

rollback;
