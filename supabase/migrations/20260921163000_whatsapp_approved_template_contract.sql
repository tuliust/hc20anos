-- Alinha a fila de WhatsApp aos dois templates atualmente aprovados na Meta.
--
-- Contrato aprovado:
--   {{1}} nome
--   {{2}} referência do pedido
--   {{3}} URL da Área do Comprador
--
-- Enquanto não existirem templates específicos para outros eventos, somente:
--   - payment_approved_whatsapp
--   - ticket_issued_whatsapp
-- podem ser enfileirados.
--
-- O canal continua controlado por notification_channel_settings.

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

  -- O único template financeiro aprovado hoje é hc20_pagamento_aprovado.
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

  select o.buyer_phone
    into v_buyer_phone
  from public.orders o
  where o.id = new.order_id;

  v_buyer_digits := regexp_replace(coalesce(v_buyer_phone, ''), '\D', '', 'g');

  -- O comprador já recebe payment_approved_whatsapp. Evita mensagem duplicada
  -- quando o ingresso pertence ao mesmo telefone do comprador.
  if v_buyer_digits <> ''
     and right(v_recipient_digits, 11) = right(v_buyer_digits, 11) then
    return new;
  end if;

  -- O template hc20_ingresso é orientado ao pedido, não ao ticket individual.
  -- Um mesmo telefone recebe no máximo uma mensagem por pedido.
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

-- Ainda não há templates aprovados/configurados para guest_approval_*.
-- Removemos o enfileiramento desse canal para impedir jobs que o worker
-- necessariamente rejeitaria ao habilitar o gate global do WhatsApp.
drop trigger if exists enqueue_guest_approval_whatsapp_job on public.notification_jobs;

comment on function public.enqueue_order_status_notifications() is
  'Enfileira e-mail para estados financeiros suportados e WhatsApp apenas para pagamento aprovado enquanto este for o único template financeiro aprovado.';

comment on function public.enqueue_ticket_whatsapp_notification() is
  'Enfileira WhatsApp de ingresso uma vez por pedido/telefone e evita duplicidade quando o telefone do participante é o mesmo do comprador.';

notify pgrst, 'reload schema';
