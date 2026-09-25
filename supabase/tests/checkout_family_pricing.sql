-- ================================================================
-- Self-cleaning checks for spouse/child pricing in the current `simple` ticket.
-- There is no separate family product: each participant is priced individually.
-- ================================================================

begin;

set role postgres;

-- Reabre o evento apenas para validar a precificação histórica; rollback restaura cancelado/fechado.
update public.events
set event_status = 'published', sales_status = 'open'
where id = '00000000-0000-0000-0000-000000000001'::uuid;

drop table if exists pg_temp._checkout_family_results;

create temporary table _checkout_family_results (
  scenario text primary key,
  expected_cents integer,
  actual_cents integer,
  participant_price_cents integer
);

do $$
declare
  v_user_id uuid := '22222222-2222-4222-8222-222222222222'::uuid;
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_person_id uuid;
  v_profile_id uuid;
  v_created_person boolean := false;
  v_created_profile boolean := false;
  v_order record;
  v_key text := gen_random_uuid()::text;
  v_created_order_ids uuid[] := array[]::uuid[];
  v_participant_price integer;
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
      'Ex-aluno Teste Família', 2006, 'A', 'claimed',
      v_user_id, now(), false
    ) returning id into v_person_id;
    v_created_person := true;

    insert into public.profiles (person_id, user_id, display_name)
    values (v_person_id, v_user_id, 'Ex-aluno Teste Família')
    returning id into v_profile_id;
    v_created_profile := true;
  end if;

  -- Scenario 1: alumni + spouse + child aged 8: R$ 120 + 120 + 0.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Família 1',
    'single-ticket-family-test-1@example.com',
    '5599999999999',
    'simple',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-1-' || v_key,'participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-1-' || v_key,'participant_type','spouse','full_name','Cônjuge Teste','email','spouse1@example.com'),
      jsonb_build_object('client_key','child-8-' || v_key,'participant_type','child','full_name','Filho 8','birth_date','2018-09-26')
    ),
    '[]'::jsonb,
    'single-family-1-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select coalesce(sum(op.unit_price_cents), 0)::integer
    into v_participant_price
  from public.order_participants op
  where op.order_id = v_order.order_id;

  insert into _checkout_family_results values (
    'child aged 8 is free', 24000, v_order.total_amount_cents, v_participant_price
  );

  -- Scenario 2: alumni + spouse + children aged 10, 12 and 13.
  -- R$ 120 + 120 + 60 + 60 + 120 = R$ 480.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Família 2',
    'single-ticket-family-test-2@example.com',
    '5599999999999',
    'simple',
    jsonb_build_array(
      jsonb_build_object('client_key','alumni-2-' || v_key,'participant_type','alumni','full_name','Ex-aluno Teste'),
      jsonb_build_object('client_key','spouse-2-' || v_key,'participant_type','spouse','full_name','Cônjuge Teste','email','spouse2@example.com'),
      jsonb_build_object('client_key','child-10-' || v_key,'participant_type','child','full_name','Filho 10','birth_date','2016-09-26'),
      jsonb_build_object('client_key','child-12-' || v_key,'participant_type','child','full_name','Filho 12','birth_date','2014-09-26'),
      jsonb_build_object('client_key','child-13-' || v_key,'participant_type','child','full_name','Filho 13','birth_date','2013-09-26')
    ),
    '[]'::jsonb,
    'single-family-2-' || v_key
  );
  v_created_order_ids := array_append(v_created_order_ids, v_order.order_id);

  select coalesce(sum(op.unit_price_cents), 0)::integer
    into v_participant_price
  from public.order_participants op
  where op.order_id = v_order.order_id;

  insert into _checkout_family_results values (
    'age bands 10 12 and 13', 48000, v_order.total_amount_cents, v_participant_price
  );

  if exists (
    select 1
    from _checkout_family_results r
    where r.expected_cents <> r.actual_cents
       or r.expected_cents <> r.participant_price_cents
  ) then
    raise exception 'Age-based family checkout mismatch: %',
      (select jsonb_agg(to_jsonb(r))
       from _checkout_family_results r
       where r.expected_cents <> r.actual_cents
          or r.expected_cents <> r.participant_price_cents);
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
    when expected_cents = actual_cents and expected_cents = participant_price_cents then 'PASS'
    else 'FAIL'
  end as result
from _checkout_family_results
order by scenario;

drop table if exists pg_temp._checkout_family_results;

rollback;
