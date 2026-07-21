-- ================================================================
-- Notification worker scheduler foundation
-- HC 20 Anos
-- ================================================================
-- Scheduling the Edge Function is environment-specific and is handled by
-- .github/workflows/notification-worker-cron.yml. Database migrations must be
-- reproducible without production Vault secrets and must never call a
-- production endpoint from a local, preview or staging database.
-- ================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Remove the legacy database cron job when replaying this history. The external
-- GitHub Actions scheduler is the single source of truth for worker invocation.
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

  raise notice 'Notification worker scheduling is external; no database cron job was created.';
end;
$$;

-- Only privileged roles should inspect or alter cron jobs.
revoke all on table cron.job from public, anon, authenticated;
revoke all on table cron.job_run_details from public, anon, authenticated;

notify pgrst, 'reload schema';
