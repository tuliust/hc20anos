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
