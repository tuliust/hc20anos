-- Integração operacional do notification-worker com WhatsApp Cloud API.

alter table public.notification_jobs
  add column if not exists channel text,
  add column if not exists provider_message_id text,
  add column if not exists provider_response_json jsonb,
  add column if not exists dead_lettered_at timestamptz;

update public.notification_jobs
set channel = case when event_type like '%_whatsapp' then 'whatsapp' else 'email' end
where channel is null;

alter table public.notification_jobs
  drop constraint if exists notification_jobs_channel_check;
alter table public.notification_jobs
  add constraint notification_jobs_channel_check check (channel in ('email','whatsapp'));

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
  select * into v_job from public.notification_jobs where id=p_job_id for update;
  if not found then raise exception 'notification_job_not_found'; end if;

  if p_success then
    update public.notification_jobs
    set status='sent', processed_at=now(), last_error=null, dead_lettered_at=null, updated_at=now()
    where id=p_job_id returning * into v_job;
  else
    v_backoff_minutes := least(60, greatest(1, power(2, least(v_job.attempts,6))::integer));
    update public.notification_jobs
    set status=case when attempts>=8 then 'cancelled' else 'failed' end,
        last_error=left(coalesce(nullif(btrim(p_error),''),'unknown_notification_error'),2000),
        next_attempt_at=now()+make_interval(mins=>v_backoff_minutes),
        dead_lettered_at=case when attempts>=8 then now() else null end,
        updated_at=now()
    where id=p_job_id returning * into v_job;
  end if;
  return v_job;
end;
$$;

-- Remove o bloqueio temporário criado na etapa anterior.
drop trigger if exists defer_guest_approval_notification_job on public.notification_jobs;
drop function if exists public.defer_guest_approval_notification_job();

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
begin
  if new.event_type not in ('guest_approval_requested','guest_approval_approved','guest_approval_rejected') then
    return new;
  end if;

  v_request_id := nullif(new.payload_json->>'request_id','')::uuid;
  if v_request_id is null then return new; end if;
  select * into v_request from public.guest_approval_requests where id=v_request_id;
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

  if nullif(regexp_replace(coalesce(v_phone,''),'\D','','g'),'') is null then return new; end if;

  insert into public.notification_jobs(
    event_type,order_id,ticket_id,recipient_email,idempotency_key,payload_json,channel
  ) values (
    new.event_type||'_whatsapp',new.order_id,new.ticket_id,new.recipient_email,
    new.idempotency_key||':whatsapp',
    new.payload_json||jsonb_build_object('recipient_phone',v_phone),
    'whatsapp'
  ) on conflict(idempotency_key) do nothing;
  return new;
end;
$$;

drop trigger if exists enqueue_guest_approval_whatsapp_job on public.notification_jobs;
create trigger enqueue_guest_approval_whatsapp_job
after insert on public.notification_jobs
for each row execute function public.enqueue_guest_approval_whatsapp_job();

-- Reativa os e-mails de convidado que haviam sido preservados para auditoria.
update public.notification_jobs
set status='pending',last_error=null,processed_at=null,next_attempt_at=now(),channel='email',updated_at=now()
where status='cancelled'
  and last_error='deferred_until_notification_templates_are_configured'
  and event_type in ('guest_approval_requested','guest_approval_approved','guest_approval_rejected');

-- Backfill do canal WhatsApp para jobs de convidado já existentes.
insert into public.notification_jobs(event_type,order_id,ticket_id,recipient_email,idempotency_key,payload_json,channel)
select
  j.event_type||'_whatsapp',j.order_id,j.ticket_id,j.recipient_email,j.idempotency_key||':whatsapp',
  j.payload_json||jsonb_build_object('recipient_phone',
    case when j.event_type='guest_approval_requested'
      then coalesce(pr.contact_whatsapp,p.contact_whatsapp)
      else r.guest_phone end),
  'whatsapp'
from public.notification_jobs j
join public.guest_approval_requests r on r.id=nullif(j.payload_json->>'request_id','')::uuid
left join public.people p on p.id=r.sponsor_person_id
left join public.profiles pr on pr.person_id=p.id
where j.event_type in ('guest_approval_requested','guest_approval_approved','guest_approval_rejected')
  and nullif(regexp_replace(case when j.event_type='guest_approval_requested' then coalesce(pr.contact_whatsapp,p.contact_whatsapp) else r.guest_phone end,'\D','','g'),'') is not null
on conflict(idempotency_key) do nothing;

revoke all on function public.enqueue_guest_approval_whatsapp_job() from public,anon,authenticated;
notify pgrst, 'reload schema';
