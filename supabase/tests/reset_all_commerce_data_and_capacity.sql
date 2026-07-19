-- Run after migration 20260719000006 with Supabase SQL Editor > Run without RLS.

with checks as (
  select 'orders_zero' as check_name, (select count(*) = 0 from public.orders) as passed
  union all select 'tickets_zero', (select count(*) = 0 from public.tickets)
  union all select 'participants_zero', (select count(*) = 0 from public.order_participants)
  union all select 'participant_extras_zero', (select count(*) = 0 from public.participant_extras)
  union all select 'payment_preferences_zero', (select count(*) = 0 from public.payment_preferences)
  union all select 'payment_events_zero', (select count(*) = 0 from public.payment_events)
  union all select 'notification_jobs_zero', (select count(*) = 0 from public.notification_jobs)
  union all select 'refund_requests_zero', (select count(*) = 0 from public.refund_requests)
  union all select 'ticket_transfers_zero', (select count(*) = 0 from public.ticket_transfers)
  union all select 'guest_approvals_zero', (select count(*) = 0 from public.guest_approval_requests)
  union all select 'all_products_capacity_500',
    (select count(*) > 0 and bool_and(available_quantity = 500 and sold_quantity = 0) from public.ticket_types)
  union all select 'all_lots_capacity_500',
    (select count(*) > 0 and bool_and(capacity = 500) from public.ticket_lots)
  union all select 'capacity_triggers_installed',
    exists (select 1 from pg_trigger where tgname = 'ticket_types_enforce_hc20_capacity' and not tgisinternal)
    and exists (select 1 from pg_trigger where tgname = 'ticket_lots_enforce_hc20_capacity' and not tgisinternal)
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;

-- Authenticate the protected report RPC only for this SQL Editor session.
do $$
declare
  v_admin_user_id uuid;
begin
  select user_id into v_admin_user_id
  from public.admin_users
  where user_id is not null
  order by created_at
  limit 1;

  if v_admin_user_id is null then
    raise exception 'FAIL: no admin_users row is available for secured RPC diagnostics';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_admin_user_id::text, 'role', 'authenticated')::text,
    false
  );
  perform set_config('request.jwt.claim.sub', v_admin_user_id::text, false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
end $$;

select public.get_event_reports(
  coalesce(
    (select id from public.events where slug = 'turma-2006-20-anos' limit 1),
    (select id from public.events order by created_at limit 1)
  )
) as admin_report_after_global_reset;
