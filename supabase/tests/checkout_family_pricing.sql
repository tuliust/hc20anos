-- ================================================================
-- Self-cleaning checks for the Família ticket.
--
-- The single configured family price includes the pre-registered alumni,
-- one spouse and every child in the order (up to the global limit of six).
-- ================================================================

set role postgres;

drop table if exists pg_temp._checkout_family_results;
create temporary table _checkout_family_results (
  scenario text primary key,
  expected_cents integer,
  actual_cents integer,
  participant_price_cents integer
);

do $$
declare
  v_user_id uuid;
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_lot_id uuid;
  v_person_id uuid;
  v_profile_id uuid;
  v_created_person boolean := false;
  v_created_profile boolean := false;
  v_family_price integer;
  v_order record;
  v_key text := gen_random_uuid()::text;
  v_created_order_ids uuid[] := array[]::uuid[];
  v_participant_price integer;
begin
  if to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is null then
    raise exception 'Missing create_checkout_order RPC';
  end if;

  select u.id into v_user_id
  from auth.users u
  order by u.created_at
  limit 1;
  if v_user_id is null then
    raise exception 'Test requires at least one auth.users row';
  end if;

  select pr.id, pr.person_id
    into v_profile_id, v_person_id
  from public.profiles pr
  where pr.user_id = v_user_id
  limit 1;

  if v_person_id is null then
    insert into public.people (
      full_name, class_year, class_group, profile_status,
      claimed_by_user_id, claimed_at, is_visible
    ) values (
      'Ex-aluno Teste Família', 2006, 'A', 'claimed',
      v_user_id, now(), false
    ) returning id into v_person_id;
    v_created_person := true;

    insert into public.profiles (person_id, user_id, display_name)
    values (v_person_id, v_user_id, 'Ex-aluno Teste Família')
    returning id into v_profile_id;
    v_created_profile := true;
  end if;

  select l.id into v_lot_id
  from public.get_current_ticket_lot(v_event_id, now()) l
  limit 1;
  if v_lot_id is null then
    raise exception 'No active ticket lot found';
  end if;

  select lp.price_cents into v_family_price
  from public.ticket_types tt
  join public.ticket_lot_prices lp on lp.ticket_type_id = tt.id
  where tt.event_id = v_event_id
    and tt.product_code = 'family_full'
    and tt.status = 'open'
    and lp.lot_id = v_lot_id
    and lp.is_active
  limit 1;

  if v_family_price is null then
    raise exception 'Family price is not configured for the active lot';
  end if;

  delete from public.orders o
  where o.buyer_email like 'three-ticket-family-test-%@example.com'
    and o.payment_status <> 'approved';

  -- Scenario 1: minimum family composition.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Família 1',
    'three-ticket-family-test-1@example.com',
    '5599999999999',
    'family_full',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-1','participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-1','participant_type','spouse','full_name','Cônjuge Teste','email','spouse1@example.com'),
      jsonb_build_object('client_key','child-1','participant_type','child','full_name','Filho Teste','birth_date','2016-10-24')
    ),
    '[]'::jsonb,
    'three-family-1-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select coalesce(sum(op.unit_price_cents), 0)::integer
    into v_participant_price
  from public.order_participants op
  where op.order_id = v_order.order_id;

  insert into _checkout_family_results values (
    'minimum family', v_family_price, v_order.total_amount_cents, v_participant_price
  );

  -- Scenario 2: spouse and three children remain within the same family price.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Família 2',
    'three-ticket-family-test-2@example.com',
    '5599999999999',
    'family_full',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-2','participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-2','participant_type','spouse','full_name','Cônjuge Teste','email','spouse2@example.com'),
      jsonb_build_object('client_key','child-2a','participant_type','child','full_name','Filho A','birth_date','2016-10-24'),
      jsonb_build_object('client_key','child-2b','participant_type','child','full_name','Filho B','birth_date','2012-10-24'),
      jsonb_build_object('client_key','child-2c','participant_type','child','full_name','Filho C','birth_date','2006-10-24')
    ),
    '[]'::jsonb,
    'three-family-2-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select coalesce(sum(op.unit_price_cents), 0)::integer
    into v_participant_price
  from public.order_participants op
  where op.order_id = v_order.order_id;

  insert into _checkout_family_results values (
    'family with three children', v_family_price, v_order.total_amount_cents, v_participant_price
  );

  if exists (
    select 1
    from _checkout_family_results r
    where r.expected_cents <> r.actual_cents
       or r.participant_price_cents <> 0
  ) then
    raise exception 'Family checkout mismatch: %',
      (select jsonb_agg(to_jsonb(r))
       from _checkout_family_results r
       where r.expected_cents <> r.actual_cents
          or r.participant_price_cents <> 0);
  end if;

  delete from public.orders o where o.id = any(v_created_order_ids);
  if v_created_profile then delete from public.profiles where id = v_profile_id; end if;
  if v_created_person then delete from public.people where id = v_person_id; end if;
exception
  when others then
    if cardinality(v_created_order_ids) > 0 then
      delete from public.orders o where o.id = any(v_created_order_ids);
    end if;
    if v_created_profile then delete from public.profiles where id = v_profile_id; end if;
    if v_created_person then delete from public.people where id = v_person_id; end if;
    raise;
end;
$$;

select
  scenario,
  expected_cents,
  actual_cents,
  participant_price_cents,
  case
    when expected_cents = actual_cents and participant_price_cents = 0 then 'PASS'
    else 'FAIL'
  end as result
from _checkout_family_results
order by scenario;

drop table if exists pg_temp._checkout_family_results;
