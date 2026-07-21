-- ================================================================
-- Notification worker scheduler compatibility fix
-- HC 20 Anos
-- ================================================================
-- Historical versions scheduled a production Edge Function through pg_cron
-- and required a Vault secret during migration replay. The scheduler is now
-- externalized to .github/workflows/notification-worker-cron.yml.
-- ================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Ensure no legacy database job survives a clean replay or an upgrade from an
-- environment where the original migration had already scheduled it.
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

  raise notice 'Legacy notification worker database cron is disabled; GitHub Actions owns scheduling.';
end;
$$;

revoke all on table cron.job from public, anon, authenticated;
revoke all on table cron.job_run_details from public, anon, authenticated;

notify pgrst, 'reload schema';
