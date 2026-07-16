-- ================================================================
-- Notification worker scheduler
-- HC 20 Anos — invokes the Edge Function every minute via pg_cron
--
-- Prerequisite (run manually, replacing the placeholder):
--   select vault.create_secret(
--     'YOUR_NOTIFICATION_WORKER_KEY',
--     'notification_worker_key',
--     'Authentication key used by the notification worker cron job'
--   );
-- ================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'notification_worker_key'
  ) then
    raise exception 'vault secret notification_worker_key is required before applying this migration';
  end if;
end;
$$;

-- Remove an earlier version of this job, if present.
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
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'notification_worker_key'
        limit 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $cron$
);

-- Only privileged roles should inspect or alter cron jobs.
revoke all on table cron.job from public, anon, authenticated;
revoke all on table cron.job_run_details from public, anon, authenticated;

notify pgrst, 'reload schema';
