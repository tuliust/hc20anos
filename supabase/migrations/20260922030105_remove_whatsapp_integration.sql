-- migration-audit: allow-destructive
-- Remoção deliberada do canal WhatsApp, seus jobs e tabela de gate; mudança autorizada pelo responsável do projeto.
-- Remove definitivamente a integração automatizada de WhatsApp/Meta do HC 20 Anos.
-- E-mail permanece como único canal transacional do notification-worker.

drop trigger if exists tickets_enqueue_whatsapp_notification on public.tickets;
drop trigger if exists enqueue_guest_approval_whatsapp_job on public.notification_jobs;

drop function if exists public.enqueue_ticket_whatsapp_notification();
drop function if exists public.enqueue_guest_approval_whatsapp_job();

-- Remove jobs históricos do canal que nunca foi homologado/ativado.
delete from public.notification_jobs
where channel = 'whatsapp'
   or event_type like '%_whatsapp';

-- O status financeiro continua produzindo apenas e-mail.
create or replace function public.enqueue_order_status_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := new.payment_status::text;
  v_event_base text;
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

  return new;
end;
$$;

-- Reenvio de ingresso passa a criar somente o job de e-mail.
create or replace function public.request_ticket_resend(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_ticket record;
  v_nonce text := to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select t.*, o.buyer_user_id, o.buyer_email, o.payment_status,
         op.user_id as participant_user_id, op.email as participant_email,
         op.full_name as participant_name
  into v_ticket
  from public.tickets t
  join public.orders o on o.id = t.order_id
  left join public.order_participants op on op.id = t.order_participant_id
  where t.id = p_ticket_id
    and (
      o.buyer_user_id = v_uid
      or lower(o.buyer_email) = v_email
      or op.user_id = v_uid
      or lower(coalesce(op.email, '')) = v_email
    );

  if not found then
    raise exception 'ticket_not_found' using errcode = 'P0002';
  end if;

  if v_ticket.payment_status <> 'approved' or v_ticket.status <> 'active' then
    raise exception 'ticket_not_eligible_for_resend' using errcode = '23514';
  end if;

  insert into public.notification_jobs (
    event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json, channel
  ) values (
    'ticket_resend_email',
    v_ticket.order_id,
    v_ticket.id,
    coalesce(v_ticket.attendee_email, v_ticket.participant_email, v_ticket.buyer_email),
    'ticket-resend-email:' || v_ticket.id::text || ':' || v_nonce,
    jsonb_build_object(
      'participant_name', coalesce(v_ticket.participant_name, v_ticket.attendee_name),
      'ticket_code', v_ticket.qr_code,
      'qr_token', v_ticket.qr_token,
      'requested_by_user_id', v_uid
    ),
    'email'
  );

  return jsonb_build_object('queued', true, 'ticket_id', v_ticket.id);
end;
$$;

-- A fila continua genérica, mas o único canal válido passa a ser e-mail.
update public.notification_jobs
set channel = 'email'
where channel is null or channel <> 'email';

alter table public.notification_jobs
  alter column channel set default 'email';

alter table public.notification_jobs
  alter column channel set not null;

alter table public.notification_jobs
  drop constraint if exists notification_jobs_channel_check;

alter table public.notification_jobs
  add constraint notification_jobs_channel_check check (channel = 'email');

-- O gate por canal existia exclusivamente para a ativação do WhatsApp.
drop table if exists public.notification_channel_settings;

-- Claim simplificado: não existe mais canal opcional a liberar.
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

comment on function public.enqueue_order_status_notifications() is
  'Enfileira notificações transacionais por e-mail quando o status financeiro muda.';

comment on function public.request_ticket_resend(uuid) is
  'Solicita reenvio do ingresso exclusivamente por e-mail para usuário autorizado.';

comment on function public.claim_notification_jobs(integer,text) is
  'Reivindica jobs de notificação transacional por e-mail com lock concorrente e limite de tentativas.';

notify pgrst, 'reload schema';
