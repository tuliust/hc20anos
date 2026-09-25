-- ================================================================
-- Self-cleaning checks for the current single-ticket checkout.
-- The authenticated alumni anchors the order; spouse and children are
-- participants of the same `simple` product with age-based pricing.
-- ================================================================

begin;

set role postgres;

-- O site real permanece cancelado; o teste reabre vendas somente nesta transação.
update public.events
set event_status = 'published', sales_status = 'open'
where id = '00000000-0000-0000-0000-000000000001'::uuid;

drop table if exists pg_temp._single_ticket_checkout_results;

rollback;
create temporary table _single_ticket_checkout_results (
  scenario text primary key,
  expected_cents integer,
  actual_cents integer,
  participant_price_cents integer,
  expected_participants integer,
  actual_participants integer
);

do $$
declare
  v_user_id uuid := '22222222-2222-4222-8222-222222222222'::uuid;
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_lot_id uuid;
  v_person_id uuid;
  v_profile_id uuid;
  v_created_person boolean := false;
  v_created_profile boolean := false;
  v_simple_price integer;
  v_order record;
  v_participant_price integer;
  v_participant_count integer;
  v_key text := gen_random_uuid()::text;
  v_created_order_ids uuid[] := array[]::uuid[];
begin
  if to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is null then
    raise exception 'Missing create_checkout_order RPC';
  end if;

  if not exists (select 1 from auth.users where id = v_user_id) then
    raise exception 'Deterministic authenticated fixture user is missing';
  end if;

  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_user_id::text,
      'role', 'authenticated',
      'email', 'authenticated-tests@local.invalid'
    )::text,
    true
  );

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
      'Ex-aluno Teste Checkout', 2006, 'A', 'claimed',
      v_user_id, now(), false
    ) returning id into v_person_id;
    v_created_person := true;

    insert into public.profiles (person_id, user_id, display_name)
    values (v_person_id, v_user_id, 'Ex-aluno Teste Checkout')
    returning id into v_profile_id;
    v_created_profile := true;
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

  if v_simple_price <> 12000 then
    raise exception 'Simple ticket must cost 12000 cents in the current lot, found %', v_simple_price;
  end if;

  -- Scenario 1: authenticated alumni only.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Ex-aluno Teste',
    'single-ticket-checkout-alumni@example.com',
    '5599999999999',
    'simple',
    jsonb_build_array(
      jsonb_build_object(
        'client_key', 'alumni-' || v_key,
        'participant_type', 'alumni',
        'full_name', 'Nome enviado pelo cliente'
      )
    ),
    '[]'::jsonb,
    'single-alumni-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select coalesce(sum(op.unit_price_cents), 0)::integer, count(*)::integer
    into v_participant_price, v_participant_count
  from public.order_participants op
  where op.order_id = v_order.order_id;

  if not exists (
    select 1
    from public.order_participants op
    where op.order_id = v_order.order_id
      and op.participant_type = 'alumni'
      and op.person_id = v_person_id
      and op.user_id = v_user_id
  ) then
    raise exception 'Alumni participant was not bound to the authenticated pre-registered profile';
  end if;

  insert into _single_ticket_checkout_results values (
    'authenticated alumni', 12000, v_order.total_amount_cents,
    v_participant_price, 1, v_participant_count
  );

  -- Scenario 2: alumni + spouse + children aged 8, 10 and 13 on event date.
  -- Expected: 120 + 120 + 0 + 60 + 120 = R$ 420.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Família Teste',
    'single-ticket-checkout-family@example.com',
    '5599999999999',
    'simple',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-family-' || v_key,'participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-' || v_key,'participant_type','spouse','full_name','Cônjuge Teste','email','spouse@example.com'),
      jsonb_build_object('client_key','child-8-' || v_key,'participant_type','child','full_name','Filho 8','birth_date','2018-09-26'),
      jsonb_build_object('client_key','child-10-' || v_key,'participant_type','child','full_name','Filho 10','birth_date','2016-09-26'),
      jsonb_build_object('client_key','child-13-' || v_key,'participant_type','child','full_name','Filho 13','birth_date','2013-09-26')
    ),
    '[]'::jsonb,
    'single-family-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select coalesce(sum(op.unit_price_cents), 0)::integer, count(*)::integer
    into v_participant_price, v_participant_count
  from public.order_participants op
  where op.order_id = v_order.order_id;

  insert into _single_ticket_checkout_results values (
    'spouse and age-based children', 42000, v_order.total_amount_cents,
    v_participant_price, 5, v_participant_count
  );

  if exists (
    select 1
    from _single_ticket_checkout_results r
    where r.expected_cents <> r.actual_cents
       or r.expected_cents <> r.participant_price_cents
       or r.expected_participants <> r.actual_participants
  ) then
    raise exception 'Single-ticket checkout mismatch: %',
      (select jsonb_agg(to_jsonb(r))
       from _single_ticket_checkout_results r
       where r.expected_cents <> r.actual_cents
          or r.expected_cents <> r.participant_price_cents
          or r.expected_participants <> r.actual_participants);
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
  expected_participants,
  actual_participants,
  case
    when expected_cents = actual_cents
     and expected_cents = participant_price_cents
     and expected_participants = actual_participants then 'PASS'
    else 'FAIL'
  end as result
from _single_ticket_checkout_results
order by scenario;

drop table if exists pg_temp._single_ticket_checkout_results;
