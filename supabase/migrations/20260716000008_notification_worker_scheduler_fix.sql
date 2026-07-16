-- ================================================================
-- Notification worker scheduler fix
-- HC 20 Anos — use a versioned Vault secret and trim its value
-- ================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'notification_worker_key_v2'
  ) then
    raise exception 'vault secret notification_worker_key_v2 is required before applying this migration';
  end if;
end;
$$;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'hc20anos-notification-worker'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$$;

select cron.schedule(
  'hc20anos-notification-worker',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://tjnqqsbwgjcdzcxykyif.supabase.co/functions/v1/notification-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-key', (
        select btrim(decrypted_secret)
        from vault.decrypted_secrets
        where name = 'notification_worker_key_v2'
        order by created_at desc
        limit 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $cron$
);

notify pgrst, 'reload schema';
