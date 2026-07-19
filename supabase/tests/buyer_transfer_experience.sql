with checks as (
  select 'transfer_list_rpc_exists' as check_name,
    case when to_regprocedure('public.get_my_ticket_transfers()') is not null then 'PASS' else 'FAIL' end as result
  union all
  select 'transfer_reject_rpc_exists',
    case when to_regprocedure('public.reject_ticket_transfer(uuid)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'transfer_expiration_rpc_exists',
    case when to_regprocedure('public.expire_ticket_transfers(timestamp with time zone)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'transfer_expiration_cron_exists',
    case when exists(select 1 from cron.job where jobname='hc20-ticket-transfer-expiration') then 'PASS' else 'FAIL' end
  union all
  select 'retry_payment_rpc_exists',
    case when to_regprocedure('public.retry_order_payment(uuid)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'anon_cannot_list_transfers',
    case when not has_function_privilege('anon','public.get_my_ticket_transfers()','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'authenticated_can_list_transfers',
    case when has_function_privilege('authenticated','public.get_my_ticket_transfers()','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'anon_cannot_retry_payment',
    case when not has_function_privilege('anon','public.retry_order_payment(uuid)','EXECUTE') then 'PASS' else 'FAIL' end
)
select * from checks order by check_name;