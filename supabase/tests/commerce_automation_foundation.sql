-- Testes estruturais da automação comercial.

with checks as (
  select 'commerce_automation_rpc_exists' as check_name,
    case when to_regprocedure('public.run_commerce_automation(timestamp with time zone)') is not null then 'PASS' else 'FAIL' end as result
  union all
  select 'lot_sync_rpc_exists',
    case when to_regprocedure('public.sync_ticket_lot_statuses(timestamp with time zone)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'automation_cron_exists',
    case when exists(select 1 from cron.job where jobname='hc20-commerce-automation') then 'PASS' else 'FAIL' end
  union all
  select 'anon_cannot_run_automation',
    case when not has_function_privilege('anon','public.run_commerce_automation(timestamp with time zone)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'authenticated_cannot_run_automation',
    case when not has_function_privilege('authenticated','public.run_commerce_automation(timestamp with time zone)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'single_open_lot_per_event',
    case when not exists(
      select event_id from public.ticket_lots where status='open' group by event_id having count(*)>1
    ) then 'PASS' else 'FAIL' end
)
select * from checks order by check_name;
