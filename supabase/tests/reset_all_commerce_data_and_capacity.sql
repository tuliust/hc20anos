-- Final-state validation for the historical global commerce normalization.
-- The automatic migration is intentionally non-destructive: transactional rows
-- are not expected to be deleted and product sold counters are preserved.

with checks as (
  select 'commerce_tables_available' as check_name,
    to_regclass('public.orders') is not null
    and to_regclass('public.tickets') is not null
    and to_regclass('public.order_participants') is not null
    and to_regclass('public.payment_preferences') is not null
    and to_regclass('public.notification_jobs') is not null as passed
  union all
  select 'all_products_capacity_valid',
    (select count(*) > 0
       and bool_and(
         available_quantity between 0 and 500
         and sold_quantity between 0 and available_quantity
       )
     from public.ticket_types)
  union all
  select 'all_lots_capacity_valid',
    (select count(*) > 0 and bool_and(capacity between 0 and 500)
     from public.ticket_lots)
  union all
  select 'capacity_triggers_installed',
    exists (select 1 from pg_trigger where tgname = 'ticket_types_enforce_hc20_capacity' and not tgisinternal)
    and exists (select 1 from pg_trigger where tgname = 'ticket_lots_enforce_hc20_capacity' and not tgisinternal)
  union all
  select 'capacity_guard_function_exists',
    to_regprocedure('public.enforce_hc20_commerce_capacity()') is not null
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;

-- Authenticate the protected report RPC only for this test session. The local
-- workflow installs a deterministic superadmin fixture before running tests.
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
) as admin_report_after_global_normalization;
