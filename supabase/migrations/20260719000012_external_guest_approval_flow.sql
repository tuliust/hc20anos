-- Fluxo completo de aprovação de convidado externo.

alter table public.guest_approval_requests
  add column if not exists expires_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table public.guest_approval_requests
  drop constraint if exists guest_approval_requests_status_check;

alter table public.guest_approval_requests
  add constraint guest_approval_requests_status_check
  check (status in ('pending','approved','rejected','cancelled','expired','archived'));

create index if not exists guest_approval_guest_status_idx
  on public.guest_approval_requests (guest_user_id, status, created_at desc);

create or replace function public.search_external_guest_sponsors(p_search text default null)
returns table (
  person_id uuid,
  full_name text,
  class_group text,
  avatar_url text,
  approved_guests integer,
  available_slots integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.class_group,
    p.avatar_url,
    public.count_approved_external_guests('00000000-0000-0000-0000-000000000001'::uuid, p.id),
    greatest(6 - public.count_approved_external_guests('00000000-0000-0000-0000-000000000001'::uuid, p.id), 0)
  from public.people p
  where p.claimed_by_user_id is not null
    and p.is_visible = true
    and coalesce(p.profile_status, '') = 'confirmed'
    and (
      nullif(btrim(p_search), '') is null
      or p.full_name ilike '%' || btrim(p_search) || '%'
      or coalesce(p.class_group, '') ilike '%' || btrim(p_search) || '%'
    )
  order by p.full_name
  limit 50;
$$;

create or replace function public.create_guest_approval_request(
  p_sponsor_person_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_relationship_to_alumni text
) returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_sponsor public.people%rowtype;
  v_request_id uuid;
  v_sponsor_email text;
  v_guest_email text := lower(btrim(coalesce(p_guest_email, '')));
  v_expires_at timestamptz := least(now() + interval '7 days', '2026-10-23 14:00:00-03'::timestamptz);
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if nullif(btrim(p_guest_name), '') is null then raise exception 'guest_name_required'; end if;
  if v_guest_email = '' or position('@' in v_guest_email) <= 1 then raise exception 'guest_email_invalid'; end if;
  if nullif(regexp_replace(coalesce(p_guest_phone, ''), '\D', '', 'g'), '') is null then raise exception 'guest_phone_required'; end if;
  if nullif(btrim(p_relationship_to_alumni), '') is null then raise exception 'relationship_required'; end if;

  select * into v_sponsor
  from public.people
  where id = p_sponsor_person_id
    and claimed_by_user_id is not null
    and is_visible = true
  for update;
  if not found then raise exception 'sponsor_not_available'; end if;

  if public.count_approved_external_guests(v_event_id, p_sponsor_person_id) >= 6 then
    raise exception 'sponsor_guest_limit_reached';
  end if;

  if exists (
    select 1 from public.guest_approval_requests
    where event_id = v_event_id
      and guest_user_id = v_uid
      and sponsor_person_id = p_sponsor_person_id
      and status = 'pending'
  ) then raise exception 'guest_request_already_pending'; end if;

  insert into public.guest_approval_requests (
    event_id, guest_user_id, guest_name, guest_email, guest_phone,
    relationship_to_alumni, sponsor_person_id, sponsor_user_id,
    status, expires_at
  ) values (
    v_event_id, v_uid, btrim(p_guest_name), v_guest_email,
    regexp_replace(p_guest_phone, '\D', '', 'g'), btrim(p_relationship_to_alumni),
    p_sponsor_person_id, v_sponsor.claimed_by_user_id, 'pending', v_expires_at
  ) returning id into v_request_id;

  select coalesce(pr.contact_email, v_sponsor.contact_email)
    into v_sponsor_email
  from public.people pe
  left join public.profiles pr on pr.person_id = pe.id
  where pe.id = p_sponsor_person_id;

  if nullif(btrim(coalesce(v_sponsor_email, '')), '') is not null then
    insert into public.notification_jobs (
      event_type, recipient_email, idempotency_key, payload_json
    ) values (
      'guest_approval_requested', lower(v_sponsor_email),
      'guest-approval-requested:' || v_request_id,
      jsonb_build_object(
        'request_id', v_request_id,
        'guest_name', btrim(p_guest_name),
        'relationship', btrim(p_relationship_to_alumni),
        'sponsor_name', v_sponsor.full_name,
        'expires_at', v_expires_at
      )
    ) on conflict (idempotency_key) do nothing;
  end if;

  return v_request_id;
end;
$$;

create or replace function public.get_my_guest_approval_requests()
returns table (
  id uuid,
  perspective text,
  guest_name text,
  guest_email text,
  guest_phone text,
  relationship_to_alumni text,
  sponsor_person_id uuid,
  sponsor_name text,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  decided_at timestamptz,
  decision_notes text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    r.id,
    case when r.guest_user_id = auth.uid() then 'guest' else 'sponsor' end,
    r.guest_name,
    r.guest_email,
    r.guest_phone,
    r.relationship_to_alumni,
    r.sponsor_person_id,
    p.full_name,
    r.status,
    r.created_at,
    r.expires_at,
    r.decided_at,
    r.decision_notes
  from public.guest_approval_requests r
  join public.people p on p.id = r.sponsor_person_id
  where r.guest_user_id = auth.uid()
     or r.sponsor_user_id = auth.uid()
  order by r.created_at desc;
$$;

create or replace function public.respond_guest_approval_request(
  p_request_id uuid,
  p_decision text,
  p_notes text default null
) returns public.guest_approval_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_request public.guest_approval_requests;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'invalid_guest_decision'; end if;

  select * into v_request
  from public.guest_approval_requests
  where id = p_request_id
  for update;
  if not found then raise exception 'guest_request_not_found'; end if;
  if v_request.sponsor_user_id is distinct from auth.uid() then raise exception 'guest_request_forbidden'; end if;
  if v_request.status <> 'pending' then raise exception 'guest_request_already_decided'; end if;
  if v_request.expires_at is not null and v_request.expires_at <= now() then
    update public.guest_approval_requests set status='expired', updated_at=now() where id=p_request_id;
    raise exception 'guest_request_expired';
  end if;

  v_request := public.decide_guest_approval_request(p_request_id, p_decision, auth.uid(), p_notes);

  insert into public.notification_jobs (
    event_type, recipient_email, idempotency_key, payload_json
  ) values (
    'guest_approval_' || p_decision,
    lower(v_request.guest_email),
    'guest-approval-' || p_decision || ':' || p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'guest_name', v_request.guest_name,
      'decision', p_decision,
      'decision_notes', v_request.decision_notes
    )
  ) on conflict (idempotency_key) do nothing;

  return v_request;
end;
$$;

create or replace function public.cancel_guest_approval_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.guest_approval_requests
  set status='cancelled', cancelled_at=now(), updated_at=now()
  where id=p_request_id and guest_user_id=auth.uid() and status='pending';
  if not found then raise exception 'guest_request_not_cancellable'; end if;
end;
$$;

create or replace function public.expire_guest_approval_requests(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  with expired as (
    update public.guest_approval_requests
    set status='expired', updated_at=p_now
    where status='pending' and expires_at is not null and expires_at <= p_now
    returning id
  ) select count(*)::integer into v_count from expired;
  return v_count;
end;
$$;

revoke all on function public.search_external_guest_sponsors(text) from public, anon;
revoke all on function public.create_guest_approval_request(uuid,text,text,text,text) from public, anon;
revoke all on function public.get_my_guest_approval_requests() from public, anon;
revoke all on function public.respond_guest_approval_request(uuid,text,text) from public, anon;
revoke all on function public.cancel_guest_approval_request(uuid) from public, anon;
revoke all on function public.expire_guest_approval_requests(timestamptz) from public, anon, authenticated;

grant execute on function public.search_external_guest_sponsors(text) to authenticated;
grant execute on function public.create_guest_approval_request(uuid,text,text,text,text) to authenticated;
grant execute on function public.get_my_guest_approval_requests() to authenticated;
grant execute on function public.respond_guest_approval_request(uuid,text,text) to authenticated;
grant execute on function public.cancel_guest_approval_request(uuid) to authenticated;

select cron.unschedule(jobid) from cron.job where jobname='hc20-guest-approval-expiration';
select cron.schedule('hc20-guest-approval-expiration','*/15 * * * *',$$select public.expire_guest_approval_requests(now());$$);

notify pgrst, 'reload schema';
