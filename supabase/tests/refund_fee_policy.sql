-- Testes estruturais da política de reembolso.

with checks as (
  select 'refund_policy_table_exists' as check_name,
    case when to_regclass('public.refund_policy') is not null then 'PASS' else 'FAIL' end as result
  union all
  select 'refund_quote_rpc_exists',
    case when to_regprocedure('public.calculate_refund_quote(uuid)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'refund_request_rpc_exists',
    case when to_regprocedure('public.request_order_refund(uuid,text)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'refund_policy_admin_rpc_exists',
    case when to_regprocedure('public.admin_update_refund_policy(boolean,integer,integer,integer,text,text)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'refund_policy_snapshot_column_exists',
    case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='refund_requests' and column_name='policy_snapshot_json') then 'PASS' else 'FAIL' end
  union all
  select 'anon_cannot_calculate_refund',
    case when not has_function_privilege('anon','public.calculate_refund_quote(uuid)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'authenticated_can_calculate_refund',
    case when has_function_privilege('authenticated','public.calculate_refund_quote(uuid)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'default_policy_is_fee_free',
    case when exists(select 1 from public.refund_policy where id=true and enabled=false and percentage_basis_points=0 and fixed_fee_cents=0) then 'PASS' else 'FAIL' end
)
select * from checks order by check_name;
