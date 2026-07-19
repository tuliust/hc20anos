with checks as (
  select 'guest_request_rpc_exists' as check_name,
    case when to_regprocedure('public.create_guest_approval_request(uuid,text,text,text,text)') is not null then 'PASS' else 'FAIL' end as result
  union all
  select 'guest_list_rpc_exists',
    case when to_regprocedure('public.get_my_guest_approval_requests()') is not null then 'PASS' else 'FAIL' end
  union all
  select 'guest_decision_rpc_exists',
    case when to_regprocedure('public.respond_guest_approval_request(uuid,text,text)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'guest_cancel_rpc_exists',
    case when to_regprocedure('public.cancel_guest_approval_request(uuid)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'guest_sponsor_search_rpc_exists',
    case when to_regprocedure('public.search_external_guest_sponsors(text)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'guest_expiration_rpc_exists',
    case when to_regprocedure('public.expire_guest_approval_requests(timestamp with time zone)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'guest_expiration_cron_exists',
    case when exists(select 1 from cron.job where jobname='hc20-guest-approval-expiration') then 'PASS' else 'FAIL' end
  union all
  select 'anon_cannot_create_guest_request',
    case when not has_function_privilege('anon','public.create_guest_approval_request(uuid,text,text,text,text)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'authenticated_can_create_guest_request',
    case when has_function_privilege('authenticated','public.create_guest_approval_request(uuid,text,text,text,text)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'guest_notification_defer_trigger_exists',
    case when exists(select 1 from pg_trigger where tgname='defer_guest_approval_notification_job' and not tgisinternal) then 'PASS' else 'FAIL' end
)
select * from checks order by check_name;
