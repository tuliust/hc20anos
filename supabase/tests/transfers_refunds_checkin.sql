with checks as (
  select 'accept_transfer_rpc_exists' as check_name, to_regprocedure('public.accept_ticket_transfer(uuid)') is not null as passed
  union all select 'cancel_transfer_rpc_exists', to_regprocedure('public.cancel_ticket_transfer(uuid)') is not null
  union all select 'request_transfer_rpc_exists', to_regprocedure('public.request_ticket_transfer(uuid,text,text,text)') is not null
  union all select 'request_refund_rpc_exists', to_regprocedure('public.request_order_refund(uuid,text)') is not null
  union all select 'review_refund_rpc_exists', to_regprocedure('public.review_refund_request(uuid,boolean,text)') is not null
  union all select 'refund_inventory_rpc_exists', to_regprocedure('public.restore_refunded_order_inventory(uuid)') is not null
  union all select 'checkin_search_rpc_exists', to_regprocedure('public.get_checkin_dashboard(text)') is not null
  union all select 'checkin_action_rpc_exists', to_regprocedure('public.perform_ticket_checkin(uuid,boolean,text)') is not null
  union all select 'voucher_action_rpc_exists', to_regprocedure('public.set_participant_vouchers_delivered(uuid,boolean,text)') is not null
  union all select 'checkin_events_table_exists', to_regclass('public.checkin_events') is not null
  union all select 'anon_cannot_transfer', not has_function_privilege('anon','public.request_ticket_transfer(uuid,text,text,text)','EXECUTE')
  union all select 'anon_cannot_refund', not has_function_privilege('anon','public.request_order_refund(uuid,text)','EXECUTE')
  union all select 'authenticated_can_request_transfer', has_function_privilege('authenticated','public.request_ticket_transfer(uuid,text,text,text)','EXECUTE')
  union all select 'authenticated_can_request_refund', has_function_privilege('authenticated','public.request_order_refund(uuid,text)','EXECUTE')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result from checks order by check_name;