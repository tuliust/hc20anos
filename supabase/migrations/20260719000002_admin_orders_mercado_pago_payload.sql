-- ================================================================
-- Enriched admin order payload for the existing orders page
-- ================================================================

-- services.getOrdersByStatus() treats the RPC response as an array at runtime.
-- Returning JSON allows the current table to receive a human-readable product
-- label in ticket_type_id while retaining the original UUID and Mercado Pago
-- operational fields as additional properties.

drop function if exists public.get_admin_orders(text);

create function public.get_admin_orders(p_status text default null)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select case
    when not public.is_admin() then
      (select jsonb_agg(x) from (select 1 where false) x)
    else coalesce((
      select jsonb_agg(payload order by payload_created_at desc)
      from (
        select
          o.created_at as payload_created_at,
          jsonb_build_object(
            'id', o.id,
            'event_id', o.event_id,
            'buyer_name', o.buyer_name,
            'buyer_email', o.buyer_email,
            'buyer_phone', o.buyer_phone,
            'person_id', o.person_id,
            'ticket_type_id', coalesce(tt.name, tt.product_code, o.ticket_type_id::text),
            'ticket_type_uuid', o.ticket_type_id,
            'product_code', tt.product_code,
            'lot_id', o.lot_id,
            'lot_name', tl.name,
            'quantity', o.quantity,
            'participant_count', coalesce(participants.participant_count, 0),
            'extras_count', coalesce(extras.extras_count, 0),
            'subtotal_amount_cents', o.subtotal_amount_cents,
            'extras_amount_cents', o.extras_amount_cents,
            'total_amount_cents', o.total_amount_cents,
            'currency_id', o.currency_id,
            'payment_provider', o.payment_provider,
            'payment_provider_order_id', o.payment_provider_order_id,
            'payment_provider_preference_id', o.payment_provider_preference_id,
            'payment_status', o.payment_status,
            'payment_status_detail', o.payment_status_detail,
            'payment_method', o.payment_method,
            'payment_type', o.payment_type,
            'installments', o.installments,
            'payment_environment', o.payment_environment,
            'reservation_status', o.reservation_status,
            'paid_at', o.paid_at,
            'expires_at', o.expires_at,
            'created_at', o.created_at,
            'updated_at', o.updated_at,
            'preference_status', preference.status,
            'preference_expires_at', preference.expires_at,
            'webhook_events', coalesce(webhooks.webhook_events, 0),
            'webhook_failures', coalesce(webhooks.webhook_failures, 0)
          ) as payload
        from public.orders o
        left join public.ticket_types tt on tt.id = o.ticket_type_id
        left join public.ticket_lots tl on tl.id = o.lot_id
        left join lateral (
          select count(*)::integer as participant_count
          from public.order_participants op
          where op.order_id = o.id
        ) participants on true
        left join lateral (
          select coalesce(sum(pe.quantity), 0)::integer as extras_count
          from public.participant_extras pe
          where pe.order_id = o.id
        ) extras on true
        left join lateral (
          select pp.status, pp.expires_at
          from public.payment_preferences pp
          where pp.order_id = o.id
          order by pp.created_at desc
          limit 1
        ) preference on true
        left join lateral (
          select
            count(*)::integer as webhook_events,
            count(*) filter (where pe.processing_status in ('failed', 'error'))::integer as webhook_failures
          from public.payment_events pe
          where pe.order_id = o.id
        ) webhooks on true
        where p_status is null or o.payment_status::text = p_status
      ) rows
    ), '[]'::jsonb)
  end;
$$;

revoke all on function public.get_admin_orders(text) from public, anon;
grant execute on function public.get_admin_orders(text) to authenticated, service_role;

comment on function public.get_admin_orders(text) is
  'Mercado Pago-aware admin order list with product, lot, participants, extras, preference and webhook metadata.';
