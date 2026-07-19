-- Run after migrations 20260719000007 and 20260719000008.

with checks as (
  select 'buyer_orders_rpc_exists' as check_name,
         to_regprocedure('public.get_my_commerce_orders()') is not null as passed
  union all
  select 'ticket_resend_rpc_exists',
         to_regprocedure('public.request_ticket_resend(uuid)') is not null
  union all
  select 'order_notification_trigger_exists',
         exists (
           select 1 from pg_trigger
           where tgname = 'orders_enqueue_status_notifications'
             and not tgisinternal
         )
  union all
  select 'ticket_whatsapp_trigger_exists',
         exists (
           select 1 from pg_trigger
           where tgname = 'tickets_enqueue_whatsapp_notification'
             and not tgisinternal
         )
  union all
  select 'authenticated_can_read_buyer_orders',
         has_function_privilege('authenticated', 'public.get_my_commerce_orders()', 'EXECUTE')
  union all
  select 'authenticated_can_request_resend',
         has_function_privilege('authenticated', 'public.request_ticket_resend(uuid)', 'EXECUTE')
  union all
  select 'anon_cannot_read_buyer_orders',
         not has_function_privilege('anon', 'public.get_my_commerce_orders()', 'EXECUTE')
  union all
  select 'anon_cannot_request_resend',
         not has_function_privilege('anon', 'public.request_ticket_resend(uuid)', 'EXECUTE')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;

-- Current queue overview. No mutation is performed by this test.
select event_type, status, count(*) as jobs
from public.notification_jobs
group by event_type, status
order by event_type, status;
