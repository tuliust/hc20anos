-- Etapa 7: relatórios, auditoria, rate limiting e reforço de segurança.

create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  request_key text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_log_created_idx on public.security_audit_log (created_at desc);
create index if not exists security_audit_log_entity_idx on public.security_audit_log (entity_type, entity_id, created_at desc);
create index if not exists security_audit_log_actor_idx on public.security_audit_log (actor_user_id, created_at desc);

alter table public.security_audit_log enable row level security;
revoke all on public.security_audit_log from public, anon, authenticated;

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  action text not null,
  actor_user_id uuid references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_expires_idx on public.rate_limit_buckets (expires_at);
alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from public, anon, authenticated;

create or replace function public.current_security_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select a.role::text from public.admin_users a where a.user_id = auth.uid() limit 1),
    case when auth.uid() is null then 'anonymous' else 'authenticated' end
  );
$$;

create or replace function public.write_security_audit(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_request_key text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if nullif(btrim(p_action), '') is null or nullif(btrim(p_entity_type), '') is null then
    raise exception 'audit_action_and_entity_required';
  end if;
  insert into public.security_audit_log(actor_user_id,actor_role,action,entity_type,entity_id,request_key,metadata_json)
  values(auth.uid(),public.current_security_role(),btrim(p_action),btrim(p_entity_type),
    nullif(btrim(coalesce(p_entity_id,'')),''),nullif(btrim(coalesce(p_request_key,'')),''),coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.enforce_rate_limit(
  p_action text,
  p_limit integer,
  p_window_seconds integer,
  p_subject text default null
) returns integer
language plpgsql security definer set search_path = public as $$
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
  v_bucket_key := encode(digest(p_action || ':' || v_subject, 'sha256'), 'hex');
  insert into public.rate_limit_buckets(bucket_key,action,actor_user_id,window_started_at,request_count,expires_at)
  values(v_bucket_key,p_action,v_uid,v_now,1,v_now + make_interval(secs => p_window_seconds))
  on conflict(bucket_key) do update
  set window_started_at=case when public.rate_limit_buckets.expires_at<=v_now then v_now else public.rate_limit_buckets.window_started_at end,
      request_count=case when public.rate_limit_buckets.expires_at<=v_now then 1 else public.rate_limit_buckets.request_count+1 end,
      expires_at=case when public.rate_limit_buckets.expires_at<=v_now then v_now+make_interval(secs=>p_window_seconds) else public.rate_limit_buckets.expires_at end,
      updated_at=v_now
  returning request_count into v_count;
  if v_count > p_limit then
    perform public.write_security_audit('rate_limit_exceeded','rate_limit_bucket',v_bucket_key,p_action,
      jsonb_build_object('limit',p_limit,'window_seconds',p_window_seconds,'count',v_count));
    raise exception 'rate_limit_exceeded' using errcode='P0001';
  end if;
  return greatest(p_limit-v_count,0);
end;
$$;

create or replace function public.audit_sensitive_row_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
  v_new jsonb := case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
  v_entity_id text;
begin
  v_entity_id := coalesce(v_new->>'id',v_old->>'id');
  perform public.write_security_audit(lower(tg_op)||'_row',tg_table_name,v_entity_id,null,
    jsonb_build_object('operation',tg_op,'table',tg_table_name,'old_status',v_old->>'status','new_status',v_new->>'status'));
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_ticket_transfers_change on public.ticket_transfers;
create trigger audit_ticket_transfers_change after insert or update or delete on public.ticket_transfers
for each row execute function public.audit_sensitive_row_change();
drop trigger if exists audit_refund_requests_change on public.refund_requests;
create trigger audit_refund_requests_change after insert or update or delete on public.refund_requests
for each row execute function public.audit_sensitive_row_change();
drop trigger if exists audit_guest_approval_requests_change on public.guest_approval_requests;
create trigger audit_guest_approval_requests_change after insert or update or delete on public.guest_approval_requests
for each row execute function public.audit_sensitive_row_change();

create or replace function public.get_admin_commerce_report()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  if not exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role in ('superadmin','admin')) then
    raise exception 'admin_required';
  end if;
  select jsonb_build_object(
    'generated_at',now(),
    'orders',jsonb_build_object(
      'total',count(*),
      'approved',count(*) filter(where payment_status='approved'),
      'pending',count(*) filter(where payment_status in ('pending','in_process')),
      'refunded',count(*) filter(where payment_status='refunded'),
      'gross_revenue_cents',coalesce(sum(total_amount_cents) filter(where payment_status='approved'),0)
    ),
    'tickets',(select jsonb_build_object('total',count(*),'active',count(*) filter(where status='active'),'checked_in',count(*) filter(where checked_in),'invalid',count(*) filter(where status in ('cancelled','refunded','transferred','chargeback'))) from public.tickets),
    'transfers',(select jsonb_build_object('total',count(*),'pending',count(*) filter(where status='requested'),'completed',count(*) filter(where status='completed')) from public.ticket_transfers),
    'refunds',(select jsonb_build_object('total',count(*),'pending',count(*) filter(where status in ('requested','under_review','approved','processing')),'completed',count(*) filter(where status='refunded'),'refunded_amount_cents',coalesce(sum(refund_amount_cents) filter(where status='refunded'),0)) from public.refund_requests),
    'notifications',(select jsonb_build_object('pending',count(*) filter(where status in ('pending','processing','failed')),'sent',count(*) filter(where status='sent'),'dead_letter',count(*) filter(where dead_lettered_at is not null)) from public.notification_jobs)
  ) into v_result from public.orders;
  perform public.write_security_audit('read_report','commerce_report',null,null,'{}'::jsonb);
  return v_result;
end;
$$;

create or replace function public.get_admin_security_audit(p_limit integer default 100,p_entity_type text default null)
returns setof public.security_audit_log
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role='superadmin') then
    raise exception 'superadmin_required';
  end if;
  if p_limit<1 or p_limit>500 then raise exception 'invalid_audit_limit'; end if;
  return query select l.* from public.security_audit_log l
  where p_entity_type is null or l.entity_type=p_entity_type
  order by l.created_at desc limit p_limit;
end;
$$;

create or replace function public.cleanup_security_operational_data(p_now timestamptz default now())
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_buckets integer; v_audit integer;
begin
  delete from public.rate_limit_buckets where expires_at < p_now - interval '1 day';
  get diagnostics v_buckets = row_count;
  delete from public.security_audit_log where created_at < p_now - interval '730 days';
  get diagnostics v_audit = row_count;
  return jsonb_build_object('rate_limit_buckets_deleted',v_buckets,'audit_rows_deleted',v_audit);
end;
$$;

revoke all on function public.current_security_role() from public,anon;
revoke all on function public.write_security_audit(text,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.enforce_rate_limit(text,integer,integer,text) from public,anon;
revoke all on function public.get_admin_commerce_report() from public,anon;
revoke all on function public.get_admin_security_audit(integer,text) from public,anon;
revoke all on function public.cleanup_security_operational_data(timestamptz) from public,anon,authenticated;
grant execute on function public.current_security_role() to authenticated;
grant execute on function public.enforce_rate_limit(text,integer,integer,text) to authenticated;
grant execute on function public.get_admin_commerce_report() to authenticated;
grant execute on function public.get_admin_security_audit(integer,text) to authenticated;
grant execute on function public.write_security_audit(text,text,text,text,jsonb) to service_role;
grant execute on function public.cleanup_security_operational_data(timestamptz) to service_role;

select cron.unschedule(jobid) from cron.job where jobname='hc20-security-cleanup';
select cron.schedule('hc20-security-cleanup','17 3 * * *',$$select public.cleanup_security_operational_data(now());$$);
notify pgrst, 'reload schema';
