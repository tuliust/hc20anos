-- Testes estruturais da Etapa 3.
with checks as (
  select 'notification_channel_column_exists' as check_name,
    case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='notification_jobs' and column_name='channel') then 'PASS' else 'FAIL' end as result
  union all
  select 'provider_message_id_column_exists',
    case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='notification_jobs' and column_name='provider_message_id') then 'PASS' else 'FAIL' end
  union all
  select 'provider_response_column_exists',
    case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='notification_jobs' and column_name='provider_response_json') then 'PASS' else 'FAIL' end
  union all
  select 'dead_letter_column_exists',
    case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='notification_jobs' and column_name='dead_lettered_at') then 'PASS' else 'FAIL' end
  union all
  select 'guest_whatsapp_trigger_exists',
    case when exists(select 1 from pg_trigger where tgname='enqueue_guest_approval_whatsapp_job' and not tgisinternal) then 'PASS' else 'FAIL' end
  union all
  select 'guest_defer_trigger_removed',
    case when not exists(select 1 from pg_trigger where tgname='defer_guest_approval_notification_job' and not tgisinternal) then 'PASS' else 'FAIL' end
  union all
  select 'complete_notification_rpc_exists',
    case when to_regprocedure('public.complete_notification_job(uuid,boolean,text)') is not null then 'PASS' else 'FAIL' end
  union all
  select 'anon_cannot_complete_notification',
    case when not has_function_privilege('anon','public.complete_notification_job(uuid,boolean,text)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'authenticated_cannot_complete_notification',
    case when not has_function_privilege('authenticated','public.complete_notification_job(uuid,boolean,text)','EXECUTE') then 'PASS' else 'FAIL' end
  union all
  select 'notification_channels_valid',
    case when not exists(select 1 from public.notification_jobs where channel is null or channel not in ('email','whatsapp')) then 'PASS' else 'FAIL' end
)
select * from checks order by check_name;
