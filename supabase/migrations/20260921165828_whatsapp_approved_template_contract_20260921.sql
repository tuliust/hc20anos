-- Histórico reconciliado com a migration aplicada no Supabase em 2026-09-21.
-- Este arquivo preserva a sequência remota; a integração é removida pela migration posterior.

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

  if v_status <> 'approved' then
    return new;
  end if;

  select coalesce(s.enabled, false)
    into v_whatsapp_enabled
  from public.notification_channel_settings s
  where s.channel = 'whatsapp';

  if v_whatsapp_enabled and coalesce(new.buyer_phone, '') <> '' then
    insert into public.notification_jobs (
      event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json, channel
    ) values (
      'payment_approved_whatsapp',
      new.id,
      null,
      new.buyer_email,
      'order-status-whatsapp:' || new.id::text || ':approved',
      jsonb_build_object(
        'buyer_name', new.buyer_name,
        'recipient_phone', new.buyer_phone,
        'payment_status', 'approved',
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
  v_buyer_phone text;
  v_recipient_digits text;
  v_buyer_digits text;
  v_phone_key text;
begin
  select coalesce(s.enabled, false)
    into v_whatsapp_enabled
  from public.notification_channel_settings s
  where s.channel = 'whatsapp';

  if not v_whatsapp_enabled or coalesce(new.attendee_phone, '') = '' then
    return new;
  end if;

  v_recipient_digits := regexp_replace(coalesce(new.attendee_phone, ''), '\D', '', 'g');
  if v_recipient_digits = '' then
    return new;
  end if;

  select o.buyer_phone into v_buyer_phone
  from public.orders o
  where o.id = new.order_id;

  v_buyer_digits := regexp_replace(coalesce(v_buyer_phone, ''), '\D', '', 'g');

  if v_buyer_digits <> '' and right(v_recipient_digits, 11) = right(v_buyer_digits, 11) then
    return new;
  end if;

  v_phone_key := right(v_recipient_digits, 11);

  insert into public.notification_jobs (
    event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json, channel
  ) values (
    'ticket_issued_whatsapp',
    new.order_id,
    new.id,
    new.attendee_email,
    'ticket-issued-whatsapp:' || new.order_id::text || ':' || v_phone_key,
    jsonb_build_object(
      'participant_name', new.attendee_name,
      'recipient_phone', new.attendee_phone,
      'order_id', new.order_id,
      'ticket_code', new.qr_code,
      'qr_token', new.qr_token
    ),
    'whatsapp'
  ) on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

drop trigger if exists enqueue_guest_approval_whatsapp_job on public.notification_jobs;

notify pgrst, 'reload schema';
