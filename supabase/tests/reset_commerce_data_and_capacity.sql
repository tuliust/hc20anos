-- Final-state validation for the historical event commerce normalization.
-- The automatic migration is intentionally non-destructive: transactional rows
-- are preserved and only safe capacity invariants are enforced.

with checks as (
  select 'event_exists' as check_name,
    exists(
      select 1 from public.events
      where id = '00000000-0000-0000-0000-000000000001'::uuid
    ) as passed
  union all
  select 'event_products_capacity_valid',
    (select count(*) > 0
       and bool_and(
         available_quantity between 0 and 500
         and sold_quantity between 0 and available_quantity
       )
     from public.ticket_types
     where event_id = '00000000-0000-0000-0000-000000000001'::uuid)
  union all
  select 'event_lots_capacity_valid',
    (select count(*) > 0 and bool_and(capacity between 0 and 500)
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
  select au.user_id
    into v_admin_user_id
  from public.admin_users au
  where au.user_id is not null
  order by au.created_at
  limit 1;

  if v_admin_user_id is null then
    raise exception 'FAIL: no admin_users row is available for secured report diagnostics';
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
  '00000000-0000-0000-0000-000000000001'::uuid
) as admin_report_after_capacity_normalization;
