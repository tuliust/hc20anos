-- ================================================================
-- HC 20 Anos — visão administrativa consolidada de pedidos
-- Comprador, pagamento, participantes, ingressos/QR, check-in,
-- webhooks e notificações.
-- ================================================================

create or replace function public.admin_get_commerce_orders(
  p_event_id uuid default null,
  p_status text default null
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select coalesce(
    jsonb_agg(order_payload order by (order_payload->>'created_at')::timestamptz desc),
    '[]'::jsonb
  )
  into v_result
  from (
    select jsonb_build_object(
      'id', o.id,
      'event_id', o.event_id,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'buyer_name', o.buyer_name,
      'buyer_email', o.buyer_email,
      'buyer_phone', o.buyer_phone,
      'buyer_user_id', o.buyer_user_id,
      'person_id', o.person_id,
      'ticket_type_id', o.ticket_type_id,
      'ticket_type_name', tt.name,
      'product_code', tt.product_code,
      'lot_id', o.lot_id,
      'lot_name', tl.name,
      'quantity', o.quantity,
      'subtotal_amount_cents', o.subtotal_amount_cents,
      'extras_amount_cents', o.extras_amount_cents,
      'total_amount_cents', o.total_amount_cents,
      'currency_id', o.currency_id,
      'payment_provider', o.payment_provider,
      'payment_provider_order_id', o.payment_provider_order_id,
      'payment_provider_merchant_order_id', o.payment_provider_merchant_order_id,
      'payment_provider_preference_id', o.payment_provider_preference_id,
      'payment_status', o.payment_status,
      'payment_status_detail', o.payment_status_detail,
      'payment_method', o.payment_method,
      'payment_type', o.payment_type,
      'installments', o.installments,
      'payment_environment', o.payment_environment,
      'paid_at', o.paid_at,
      'expires_at', o.expires_at,
      'reservation_status', o.reservation_status,
      'reservation_released_at', o.reservation_released_at,
      'refunded_at', o.refunded_at,
      'cancelled_at', o.cancelled_at,
      'participants', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', op.id,
            'person_id', op.person_id,
            'user_id', op.user_id,
            'participant_type', op.participant_type,
            'full_name', op.full_name,
            'email', op.email,
            'phone', op.phone,
            'birth_date', op.birth_date,
            'relationship_to_alumni', op.relationship_to_alumni,
            'unit_price_cents', op.unit_price_cents,
            'status', op.status,
            'created_at', op.created_at
          )
          order by op.created_at, op.id
        )
        from public.order_participants op
        where op.order_id = o.id
      ), '[]'::jsonb),
      'tickets', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'order_participant_id', t.order_participant_id,
            'person_id', t.person_id,
            'attendee_name', t.attendee_name,
            'attendee_email', t.attendee_email,
            'attendee_phone', t.attendee_phone,
            'guest_name', t.guest_name,
            'qr_code', t.qr_code,
            'status', t.status,
            'checked_in', t.checked_in,
            'checked_in_at', t.checked_in_at,
            'created_at', t.created_at,
            'cancelled_at', t.cancelled_at,
            'cancellation_reason', t.cancellation_reason
          )
          order by t.created_at, t.id
        )
        from public.tickets t
        where t.order_id = o.id
      ), '[]'::jsonb),
      'payment_events', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', pe.id,
            'event_type', pe.event_type,
            'payment_id', pe.payment_id,
            'signature_valid', pe.signature_valid,
            'processing_status', pe.processing_status,
            'processing_error', pe.processing_error,
            'attempt_count', pe.attempt_count,
            'received_at', pe.received_at,
            'processed_at', pe.processed_at
          )
          order by pe.created_at desc
        )
        from public.payment_events pe
        where pe.order_id = o.id
      ), '[]'::jsonb),
      'notifications', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', nj.id,
            'event_type', nj.event_type,
            'ticket_id', nj.ticket_id,
            'channel', nj.channel,
            'recipient_email', nj.recipient_email,
            'status', nj.status,
            'attempts', nj.attempts,
            'processed_at', nj.processed_at,
            'provider_message_id', nj.provider_message_id,
            'last_error', nj.last_error,
            'created_at', nj.created_at
          )
          order by nj.created_at desc
        )
        from public.notification_jobs nj
        where nj.order_id = o.id
      ), '[]'::jsonb)
    ) as order_payload
    from public.orders o
    left join public.ticket_types tt on tt.id = o.ticket_type_id
    left join public.ticket_lots tl on tl.id = o.lot_id
    where (p_event_id is null or o.event_id = p_event_id)
      and (p_status is null or o.payment_status::text = p_status)
  ) rows;

  return v_result;
end;
$$;

revoke all on function public.admin_get_commerce_orders(uuid, text) from public, anon;
grant execute on function public.admin_get_commerce_orders(uuid, text) to authenticated, service_role;

comment on function public.admin_get_commerce_orders(uuid, text) is
  'Admin-only commerce detail feed: buyer, payment, participants, tickets/QR, check-in, webhooks and notification delivery.';
