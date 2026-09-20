-- Guardrail operacional para WhatsApp transacional.
-- O canal só produz/consome jobs após ativação explícita em
-- public.notification_channel_settings.

create table if not exists public.notification_channel_settings (
  channel text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint notification_channel_settings_channel_check
    check (channel in ('email','whatsapp'))
);

alter table public.notification_channel_settings enable row level security;
revoke all on public.notification_channel_settings from anon, authenticated;
grant select on public.notification_channel_settings to service_role;

insert into public.notification_channel_settings(channel, enabled)
values ('email', true), ('whatsapp', false)
on conflict (channel) do nothing;

update public.notification_jobs
set channel = case when event_type like '%_whatsapp' then 'whatsapp' else 'email' end,
    updated_at = now()
where channel is null;

alter table public.notification_jobs alter column channel set default 'email';

create or replace function public.enqueue_order_status_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := new.payment_status::text;
  v_event_base text;
  v_whatsapp_enabled boolean := false;
begin
  if tg_op = 'UPDATE' and old.payment_status is not distinct from new.payment_status then
    return new;
  end if;

  if v_status not in ('pending', 'in_process', 'approved', 'rejected', 'expired', 'cancelled', 'refunded', 'charged_back') then
    return new;
  end if;

  v_event_base := 'payment_' || v_status;

  insert into public.notification_jobs (
    event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json, channel
  ) values (
    v_event_base || '_email',
    new.id,
    null,
    new.buyer_email,
    'order-status-email:' || new.id::text || ':' || v_status,
    jsonb_build_object(
      'buyer_name', new.buyer_name,
      'payment_status', v_status,
      'payment_status_detail', new.payment_status_detail,
      'order_id', new.id,
      'total_amount_cents', new.total_amount_cents,
      'currency_id', new.currency_id,
      'expires_at', new.expires_at
    ),
    'email'
  ) on conflict (idempotency_key) do nothing;

  select coalesce(s.enabled, false)
    into v_whatsapp_enabled
  from public.notification_channel_settings s
  where s.channel = 'whatsapp';

  if v_whatsapp_enabled and coalesce(new.buyer_phone, '') <> '' then
    insert into public.notification_jobs (
      event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json, channel
    ) values (
      v_event_base || '_whatsapp',
      new.id,
      null,
      new.buyer_email,
      'order-status-whatsapp:' || new.id::text || ':' || v_status,
      jsonb_build_object(
        'buyer_name', new.buyer_name,
        'recipient_phone', new.buyer_phone,
        'payment_status', v_status,
        'payment_status_detail', new.payment_status_detail,
        'order_id', new.id,
        'total_amount_cents', new.total_amount_cents,
        'currency_id', new.currency_id,
        'expires_at', new.expires_at
      ),
      'whatsapp'
    ) on conflict (idempotency_key) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.enqueue_ticket_whatsapp_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_whatsapp_enabled boolean := false;
begin
  select coalesce(s.enabled, false)
    into v_whatsapp_enabled
  from public.notification_channel_settings s
  where s.channel = 'whatsapp';

  if not v_whatsapp_enabled or coalesce(new.attendee_phone, '') = '' then
    return new;
  end if;

  insert into public.notification_jobs (
    event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json, channel
  ) values (
    'ticket_issued_whatsapp',
    new.order_id,
    new.id,
    new.attendee_email,
    'ticket-issued-whatsapp:' || new.id::text,
    jsonb_build_object(
      'participant_name', new.attendee_name,
      'recipient_phone', new.attendee_phone,
      'ticket_code', new.qr_code,
      'qr_token', new.qr_token
    ),
    'whatsapp'
  ) on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

create or replace function public.enqueue_guest_approval_whatsapp_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_request public.guest_approval_requests;
  v_phone text;
  v_whatsapp_enabled boolean := false;
begin
  if new.event_type not in ('guest_approval_requested','guest_approval_approved','guest_approval_rejected') then
    return new;
  end if;

  select coalesce(s.enabled, false)
    into v_whatsapp_enabled
  from public.notification_channel_settings s
  where s.channel = 'whatsapp';

  if not v_whatsapp_enabled then
    return new;
  end if;

  v_request_id := nullif(new.payload_json->>'request_id','')::uuid;
  if v_request_id is null then return new; end if;

  select * into v_request
  from public.guest_approval_requests
  where id = v_request_id;
  if not found then return new; end if;

  if new.event_type='guest_approval_requested' then
    select coalesce(pr.contact_whatsapp,p.contact_whatsapp)
      into v_phone
    from public.people p
    left join public.profiles pr on pr.person_id=p.id
    where p.id=v_request.sponsor_person_id;
  else
    v_phone := v_request.guest_phone;
  end if;

  if nullif(regexp_replace(coalesce(v_phone,''),'\D','','g'),'') is null then
    return new;
  end if;

  insert into public.notification_jobs(
    event_type,order_id,ticket_id,recipient_email,idempotency_key,payload_json,channel
  ) values (
    new.event_type||'_whatsapp',
    new.order_id,
    new.ticket_id,
    new.recipient_email,
    new.idempotency_key||':whatsapp',
    new.payload_json||jsonb_build_object('recipient_phone',v_phone),
    'whatsapp'
  ) on conflict(idempotency_key) do nothing;

  return new;
end;
$$;

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
      and (
        j.channel <> 'whatsapp'
        or exists (
          select 1
          from public.notification_channel_settings s
          where s.channel = 'whatsapp'
            and s.enabled
        )
      )
    order by j.next_attempt_at, j.created_at
    for update of j skip locked
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

revoke all on function public.claim_notification_jobs(integer, text) from public, anon, authenticated;
grant execute on function public.claim_notification_jobs(integer, text) to service_role;

comment on table public.notification_channel_settings is
  'Server-side gate for transactional notification channels. WhatsApp must remain disabled until provider secrets and approved templates are configured.';

notify pgrst, 'reload schema';
