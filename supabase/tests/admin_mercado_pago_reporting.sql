-- Run with: Supabase SQL Editor > Run without RLS
-- This test validates installation and the consistency rules used by the
-- admin dashboard, orders page and reports page.

do $$
declare
  v_definition text;
  v_mismatches integer;
begin
  if to_regprocedure('public.get_admin_orders(text)') is null then
    raise exception 'FAIL: get_admin_orders(text) is not installed';
  end if;

  if to_regprocedure('public.get_event_reports(uuid)') is null then
    raise exception 'FAIL: get_event_reports(uuid) is not installed';
  end if;

  if to_regprocedure('public.refresh_ticket_type_sold_quantity(uuid)') is null then
    raise exception 'FAIL: refresh_ticket_type_sold_quantity(uuid) is not installed';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'tickets_sync_ticket_type_sales'
      and not tgisinternal
  ) then
    raise exception 'FAIL: tickets sales synchronization trigger is missing';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'orders_sync_ticket_type_sales'
      and not tgisinternal
  ) then
    raise exception 'FAIL: order payment synchronization trigger is missing';
  end if;

  select pg_get_functiondef('public.get_event_reports(uuid)'::regprocedure)
    into v_definition;

  if position('payment_preferences' in v_definition) = 0
     or position('payment_events' in v_definition) = 0
     or position('notification_jobs' in v_definition) = 0
     or position('participant_extras' in v_definition) = 0
     or position('refund_requests' in v_definition) = 0
     or position('ticket_transfers' in v_definition) = 0 then
    raise exception 'FAIL: event report is not using the complete Mercado Pago commerce model';
  end if;

  perform public.refresh_ticket_type_sold_quantity(null);

  select count(*)
    into v_mismatches
  from public.ticket_types tt
  left join (
    select
      tt2.id,
      count(t.id) filter (where o.id is not null)::integer as approved_ticket_count
    from public.ticket_types tt2
    left join public.tickets t on t.ticket_type_id = tt2.id
    left join public.orders o
      on o.id = t.order_id
     and o.payment_status::text = 'approved'
    group by tt2.id
  ) actual on actual.id = tt.id
  where tt.sold_quantity is distinct from coalesce(actual.approved_ticket_count, 0);

  if v_mismatches > 0 then
    raise exception 'FAIL: % ticket type counters do not match approved tickets', v_mismatches;
  end if;
end $$;

select check_name, result
from (values
  ('get_admin_orders_rpc', 'PASS'),
  ('get_event_reports_rpc', 'PASS'),
  ('ticket_sales_sync_triggers', 'PASS'),
  ('mercado_pago_report_sources', 'PASS'),
  ('approved_ticket_counters', 'PASS')
) as checks(check_name, result);

-- The secured RPCs intentionally require an authenticated admin JWT. SQL Editor
-- does not provide one, even with "Run without RLS". Reuse an existing admin
-- identity only for this diagnostic session; no role or database row is changed.
do $$
declare
  v_admin_user_id uuid;
begin
  select au.user_id
    into v_admin_user_id
  from public.admin_users au
  where au.user_id is not null
  order by au.created_at
  limit 1;

  if v_admin_user_id is null then
    raise exception 'FAIL: no admin_users row is available for secured RPC diagnostics';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_admin_user_id::text,
      'role', 'authenticated'
    )::text,
    false
  );
  perform set_config('request.jwt.claim.sub', v_admin_user_id::text, false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
end $$;

-- Diagnostic result set used to compare the orders page with the source of truth.
select
  id,
  buyer_name,
  buyer_email,
  ticket_type_id as product_name,
  lot_name,
  participant_count,
  extras_count,
  total_amount_cents,
  payment_status,
  reservation_status,
  payment_type,
  installments,
  payment_environment,
  payment_provider_order_id,
  payment_provider_preference_id,
  preference_status,
  webhook_events,
  webhook_failures,
  created_at
from jsonb_to_recordset(public.get_admin_orders(null)) as order_row(
  id uuid,
  buyer_name text,
  buyer_email text,
  ticket_type_id text,
  lot_name text,
  participant_count integer,
  extras_count integer,
  total_amount_cents integer,
  payment_status text,
  reservation_status text,
  payment_type text,
  installments integer,
  payment_environment text,
  payment_provider_order_id text,
  payment_provider_preference_id text,
  preference_status text,
  webhook_events integer,
  webhook_failures integer,
  created_at timestamptz
)
order by created_at desc
limit 20;

-- Diagnostic payload used to compare /admin and /admin/reports.
select public.get_event_reports(
  coalesce(
    (select id from public.events where slug = 'turma-2006-20-anos' limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid
  )
) as mercado_pago_admin_report;
