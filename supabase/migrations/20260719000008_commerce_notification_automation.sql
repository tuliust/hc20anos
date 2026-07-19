-- Queue transactional e-mail and WhatsApp jobs from commerce state changes.

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
    event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json
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
    )
  ) on conflict (idempotency_key) do nothing;

  if coalesce(new.buyer_phone, '') <> '' then
    insert into public.notification_jobs (
      event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json
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
      )
    ) on conflict (idempotency_key) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enqueue_status_notifications on public.orders;
create trigger orders_enqueue_status_notifications
after insert or update of payment_status
on public.orders
for each row execute function public.enqueue_order_status_notifications();

create or replace function public.enqueue_ticket_whatsapp_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.attendee_phone, '') = '' then
    return new;
  end if;

  insert into public.notification_jobs (
    event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json
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
    )
  ) on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

drop trigger if exists tickets_enqueue_whatsapp_notification on public.tickets;
create trigger tickets_enqueue_whatsapp_notification
after insert on public.tickets
for each row execute function public.enqueue_ticket_whatsapp_notification();

notify pgrst, 'reload schema';
