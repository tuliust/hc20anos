-- ================================================================
-- Notification jobs worker support
-- HC 20 Anos — claim/complete transactional e-mail jobs safely
-- ================================================================

create or replace function public.claim_notification_jobs(
  p_limit integer default 20,
  p_worker_id text default null
)
returns setof public.notification_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'invalid_notification_job_limit' using errcode = '22023';
  end if;

  return query
  with candidates as (
    select j.id
    from public.notification_jobs j
    where j.status in ('pending', 'failed')
      and j.next_attempt_at <= now()
      and j.attempts < 8
    order by j.next_attempt_at, j.created_at
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.notification_jobs j
    set status = 'processing',
        attempts = j.attempts + 1,
        last_error = null,
        updated_at = now(),
        payload_json = j.payload_json || jsonb_build_object(
          'worker_id', coalesce(nullif(btrim(p_worker_id), ''), 'notification-worker'),
          'claimed_at', now()
        )
    from candidates c
    where j.id = c.id
    returning j.*
  )
  select * from claimed;
end;
$$;

create or replace function public.complete_notification_job(
  p_job_id uuid,
  p_success boolean,
  p_error text default null
)
returns public.notification_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.notification_jobs;
  v_backoff_minutes integer;
begin
  select * into v_job
  from public.notification_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'notification_job_not_found' using errcode = 'P0002';
  end if;

  if p_success then
    update public.notification_jobs
    set status = 'sent',
        processed_at = now(),
        last_error = null,
        updated_at = now()
    where id = p_job_id
    returning * into v_job;
  else
    v_backoff_minutes := least(60, greatest(1, power(2, least(v_job.attempts, 6))::integer));

    update public.notification_jobs
    set status = case when attempts >= 8 then 'cancelled' else 'failed' end,
        last_error = left(coalesce(nullif(btrim(p_error), ''), 'unknown_notification_error'), 2000),
        next_attempt_at = now() + make_interval(mins => v_backoff_minutes),
        updated_at = now()
    where id = p_job_id
    returning * into v_job;
  end if;

  return v_job;
end;
$$;

revoke execute on function public.claim_notification_jobs(integer, text) from public, anon, authenticated;
revoke execute on function public.complete_notification_job(uuid, boolean, text) from public, anon, authenticated;

grant execute on function public.claim_notification_jobs(integer, text) to service_role;
grant execute on function public.complete_notification_job(uuid, boolean, text) to service_role;

notify pgrst, 'reload schema';
