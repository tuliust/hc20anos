-- ================================================================
-- Phase 2 — rate-limit pgcrypto portability
-- ================================================================
-- Supabase installs pgcrypto in the extensions schema. The historical
-- function used digest(text, text) with search_path=public, which fails in a
-- replayed environment. Keep the contract and qualify the bytea overload.
-- The synchronized branch validates this migration in the complete Phase 2 run.

create or replace function public.enforce_rate_limit(
  p_action text,
  p_limit integer,
  p_window_seconds integer,
  p_subject text default null
) returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_subject text := coalesce(nullif(btrim(p_subject), ''), coalesce(v_uid::text, 'anonymous'));
  v_bucket_key text;
  v_now timestamptz := now();
  v_count integer;
begin
  if nullif(btrim(p_action), '') is null then raise exception 'rate_limit_action_required'; end if;
  if p_limit < 1 or p_limit > 1000 then raise exception 'invalid_rate_limit'; end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then raise exception 'invalid_rate_limit_window'; end if;

  v_bucket_key := encode(
    extensions.digest(convert_to(p_action || ':' || v_subject, 'UTF8'), 'sha256'),
    'hex'
  );

  insert into public.rate_limit_buckets(
    bucket_key, action, actor_user_id, window_started_at, request_count, expires_at
  ) values (
    v_bucket_key, p_action, v_uid, v_now, 1,
    v_now + make_interval(secs => p_window_seconds)
  )
  on conflict(bucket_key) do update
  set window_started_at = case
        when public.rate_limit_buckets.expires_at <= v_now then v_now
        else public.rate_limit_buckets.window_started_at
      end,
      request_count = case
        when public.rate_limit_buckets.expires_at <= v_now then 1
        else public.rate_limit_buckets.request_count + 1
      end,
      expires_at = case
        when public.rate_limit_buckets.expires_at <= v_now
          then v_now + make_interval(secs => p_window_seconds)
        else public.rate_limit_buckets.expires_at
      end,
      updated_at = v_now
  returning request_count into v_count;

  if v_count > p_limit then
    perform public.write_security_audit(
      'rate_limit_exceeded',
      'rate_limit_bucket',
      v_bucket_key,
      p_action,
      jsonb_build_object(
        'limit', p_limit,
        'window_seconds', p_window_seconds,
        'count', v_count
      )
    );
    raise exception 'rate_limit_exceeded' using errcode='P0001';
  end if;

  return greatest(p_limit - v_count, 0);
end;
$$;

revoke all on function public.enforce_rate_limit(text,integer,integer,text) from public, anon;
grant execute on function public.enforce_rate_limit(text,integer,integer,text) to authenticated;

notify pgrst, 'reload schema';
