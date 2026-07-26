-- ================================================================
-- Self-cleaning checks for Individual and Convidado tickets.
-- Safe for the Supabase SQL Editor.
-- ================================================================

set role postgres;

drop table if exists pg_temp._three_ticket_checkout_results;
create temporary table _three_ticket_checkout_results (
  scenario text primary key,
  expected_cents integer,
  actual_cents integer,
  participant_price_cents integer,
  expected_participants integer,
  actual_participants integer
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
  v_simple_price integer;
  v_guest_price integer;
  v_order record;
  v_participant_price integer;
  v_participant_count integer;
  v_key text := gen_random_uuid()::text;
  v_created_order_ids uuid[] := array[]::uuid[];
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
      'Ex-aluno Teste Individual', 2006, 'A', 'claimed',
      v_user_id, now(), false
    ) returning id into v_person_id;
    v_created_person := true;

    insert into public.profiles (person_id, user_id, display_name)
    values (v_person_id, v_user_id, 'Ex-aluno Teste Individual')
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
    raise exception 'Individual and guest prices must be active in the current lot';
  end if;

  delete from public.orders o
  where o.buyer_email like 'three-ticket-checkout-%@example.com'
    and o.payment_status <> 'approved';

  -- Individual: the server binds the participant to the buyer's pre-registration.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Comprador Individual Teste',
    'three-ticket-checkout-individual@example.com',
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
    'three-individual-' || v_key
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
    raise exception 'Individual participant was not bound to the pre-registered alumni';
  end if;

  insert into _three_ticket_checkout_results values (
    'individual pre-registered alumni',
    v_simple_price,
    v_order.total_amount_cents,
    v_participant_price,
    1,
    v_participant_count
  );

  -- Convidado: direct adult purchase, without sponsor or approval request.
  select * into v_order
  from public.create_checkout_order(
    v_user_id,
    'Convidado Adulto Teste',
    'three-ticket-checkout-guest@example.com',
    '5599999999999',
    'external_guest',
    jsonb_build_array(
      jsonb_build_object(
        'client_key', 'guest-' || v_key,
        'participant_type', 'external_guest',
        'full_name', 'Convidado Adulto Teste',
        'email', 'three-ticket-checkout-guest@example.com',
        'phone', '5599999999999',
        'birth_date', '1990-01-01'
      )
    ),
    '[]'::jsonb,
    'three-guest-' || v_key
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
      and op.participant_type = 'external_guest'
      and op.guest_approval_request_id is null
      and op.sponsor_person_id is null
      and op.birth_date = '1990-01-01'::date
  ) then
    raise exception 'Adult guest was not stored without the legacy approval flow';
  end if;

  insert into _three_ticket_checkout_results values (
    'direct adult guest',
    v_guest_price,
    v_order.total_amount_cents,
    v_participant_price,
    1,
    v_participant_count
  );

  if exists (
    select 1
    from _three_ticket_checkout_results r
    where r.expected_cents <> r.actual_cents
       or r.participant_price_cents <> 0
       or r.expected_participants <> r.actual_participants
  ) then
    raise exception 'Three-ticket checkout mismatch: %',
      (select jsonb_agg(to_jsonb(r))
       from _three_ticket_checkout_results r
       where r.expected_cents <> r.actual_cents
          or r.participant_price_cents <> 0
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
     and participant_price_cents = 0
     and expected_participants = actual_participants then 'PASS'
    else 'FAIL'
  end as result
from _three_ticket_checkout_results
order by scenario;

drop table if exists pg_temp._three_ticket_checkout_results;
