with checks as (
  select 'anon_cannot_export_checkin'::text as check_name,
    not has_function_privilege('anon','public.export_checkin_report()','EXECUTE') as result
  union all select 'authenticated_can_read_metrics',
    has_function_privilege('authenticated','public.get_checkin_operation_metrics()','EXECUTE')
  union all select 'checkin_activity_rpc_exists',
    to_regprocedure('public.get_checkin_activity(integer)') is not null
  union all select 'checkin_export_rpc_exists',
    to_regprocedure('public.export_checkin_report()') is not null
  union all select 'checkin_metrics_rpc_exists',
    to_regprocedure('public.get_checkin_operation_metrics()') is not null
  union all select 'checkin_events_table_exists',
    to_regclass('public.checkin_events') is not null
  union all select 'checkin_staff_role_supported',
    exists(select 1 from pg_get_functiondef('public.get_checkin_operation_metrics()'::regprocedure) d where d ilike '%checkin_staff%')
)
select check_name, case when result then 'PASS' else 'FAIL' end as result
from checks order by check_name;
