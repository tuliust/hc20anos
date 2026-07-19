-- Run after migration 20260719000005 with Supabase SQL Editor > Run without RLS.

with event_orders as (
  select id
  from public.orders
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid
), checks as (
  select 'orders_zero' as check_name,
         (select count(*) = 0 from event_orders) as passed
  union all
  select 'tickets_zero',
         (select count(*) = 0
          from public.tickets t
          where t.order_id in (select id from event_orders))
  union all
  select 'participants_zero',
         (select count(*) = 0
          from public.order_participants op
          where op.order_id in (select id from event_orders))
  union all
  select 'payment_preferences_zero',
         (select count(*) = 0
          from public.payment_preferences pp
          where pp.order_id in (select id from event_orders))
  union all
  select 'payment_events_zero',
         (select count(*) = 0
          from public.payment_events pe
          where pe.order_id in (select id from event_orders))
  union all
  select 'notification_jobs_zero',
         (select count(*) = 0
          from public.notification_jobs nj
          where nj.order_id in (select id from event_orders))
  union all
  select 'guest_approvals_zero',
         (select count(*) = 0
          from public.guest_approval_requests gar
          where gar.event_id = '00000000-0000-0000-0000-000000000001'::uuid)
  union all
  select 'all_products_capacity_500',
         (select count(*) > 0 and bool_and(available_quantity = 500 and sold_quantity = 0)
          from public.ticket_types
          where event_id = '00000000-0000-0000-0000-000000000001'::uuid)
  union all
  select 'all_lots_capacity_500',
         (select count(*) > 0 and bool_and(capacity = 500)
          from public.ticket_lots
          where event_id = '00000000-0000-0000-0000-000000000001'::uuid)
  union all
  select 'capacity_triggers_installed',
         exists (
           select 1 from pg_trigger
           where tgname = 'ticket_types_enforce_hc20_capacity' and not tgisinternal
         ) and exists (
           select 1 from pg_trigger
           where tgname = 'ticket_lots_enforce_hc20_capacity' and not tgisinternal
         )
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;

-- Expected dashboard source after the reset.
select public.get_event_reports(
  '00000000-0000-0000-0000-000000000001'::uuid
) as admin_report_after_reset;
