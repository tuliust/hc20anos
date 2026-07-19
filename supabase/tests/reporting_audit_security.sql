with checks as (
  select 'security_audit_table_exists'::text as check_name,
    to_regclass('public.security_audit_log') is not null as passed
  union all
  select 'rate_limit_table_exists', to_regclass('public.rate_limit_buckets') is not null
  union all
  select 'rate_limit_rpc_exists', to_regprocedure('public.enforce_rate_limit(text,integer,integer,text)') is not null
  union all
  select 'commerce_report_rpc_exists', to_regprocedure('public.get_admin_commerce_report()') is not null
  union all
  select 'security_audit_rpc_exists', to_regprocedure('public.get_admin_security_audit(integer,text)') is not null
  union all
  select 'security_cleanup_rpc_exists', to_regprocedure('public.cleanup_security_operational_data(timestamp with time zone)') is not null
  union all
  select 'security_cleanup_cron_exists', exists(select 1 from cron.job where jobname='hc20-security-cleanup')
  union all
  select 'transfer_audit_trigger_exists', exists(select 1 from pg_trigger where tgname='audit_ticket_transfers_change' and not tgisinternal)
  union all
  select 'refund_audit_trigger_exists', exists(select 1 from pg_trigger where tgname='audit_refund_requests_change' and not tgisinternal)
  union all
  select 'guest_audit_trigger_exists', exists(select 1 from pg_trigger where tgname='audit_guest_approval_requests_change' and not tgisinternal)
  union all
  select 'anon_cannot_read_commerce_report', not has_function_privilege('anon','public.get_admin_commerce_report()','EXECUTE')
  union all
  select 'anon_cannot_use_rate_limit', not has_function_privilege('anon','public.enforce_rate_limit(text,integer,integer,text)','EXECUTE')
  union all
  select 'authenticated_cannot_write_audit', not has_function_privilege('authenticated','public.write_security_audit(text,text,text,text,jsonb)','EXECUTE')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
