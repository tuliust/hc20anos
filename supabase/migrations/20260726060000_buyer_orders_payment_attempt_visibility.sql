-- ================================================================
-- Área do comprador: exibir apenas compras com tentativa real de pagamento
--
-- O checkout reserva o pedido antes de criar a preferência no Mercado Pago.
-- Pedidos interrompidos entre essas duas etapas são rascunhos técnicos, não
-- transações do comprador, e não devem aparecer em /meus-pedidos.
-- ================================================================

create or replace function public.get_my_commerce_orders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select coalesce(jsonb_agg(order_payload order by (order_payload ->> 'created_at') desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', o.id,
      'public_token', o.public_token,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'buyer_name', o.buyer_name,
      'buyer_email', o.buyer_email,
      'buyer_phone', o.buyer_phone,
      'quantity', o.quantity,
      'subtotal_amount_cents', o.subtotal_amount_cents,
      'extras_amount_cents', o.extras_amount_cents,
      'total_amount_cents', o.total_amount_cents,
      'currency_id', o.currency_id,
      'payment_status', o.payment_status,
      'payment_status_detail', o.payment_status_detail,
      'payment_method', o.payment_method,
      'payment_type', o.payment_type,
      'installments', o.installments,
      'paid_at', o.paid_at,
      'expires_at', o.expires_at,
      'reservation_status', o.reservation_status,
      'has_payment_attempt', (
        o.payment_status in ('approved', 'in_process', 'rejected', 'refunded', 'charged_back')
        or exists (
          select 1
          from public.payment_preferences pp_attempt
          where pp_attempt.order_id = o.id
        )
        or exists (
          select 1
          from public.payment_events pe_attempt
          where pe_attempt.order_id = o.id
        )
        or exists (
          select 1
          from public.tickets t_attempt
          where t_attempt.order_id = o.id
        )
      ),
      'ticket_type', jsonb_build_object(
        'id', tt.id,
        'name', tt.name,
        'description', tt.description,
        'product_code', tt.product_code,
        'package_kind', tt.package_kind
      ),
      'lot', case when l.id is null then null else jsonb_build_object(
        'id', l.id,
        'code', l.code,
        'name', l.name
      ) end,
      'participants', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', op.id,
          'participant_type', op.participant_type,
          'full_name', op.full_name,
          'email', op.email,
          'phone', op.phone,
          'relationship_to_alumni', op.relationship_to_alumni,
          'status', op.status,
          'unit_price_cents', op.unit_price_cents,
          'extras', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', pe.id,
              'extra_type', pe.extra_type,
              'quantity', pe.quantity,
              'units_per_package', pe.units_per_package,
              'unit_price_cents', pe.unit_price_cents,
              'total_price_cents', pe.total_price_cents,
              'physical_vouchers_delivered_at', pe.physical_vouchers_delivered_at
            ) order by pe.extra_type)
            from public.participant_extras pe
            where pe.order_participant_id = op.id
          ), '[]'::jsonb),
          'ticket', (
            select jsonb_build_object(
              'id', t.id,
              'attendee_name', t.attendee_name,
              'attendee_email', t.attendee_email,
              'qr_code', t.qr_code,
              'qr_token', t.qr_token,
              'status', t.status,
              'checked_in', t.checked_in,
              'checked_in_at', t.checked_in_at,
              'cancelled_at', t.cancelled_at,
              'cancellation_reason', t.cancellation_reason,
              'transferred_from_ticket_id', t.transferred_from_ticket_id,
              'created_at', t.created_at
            )
            from public.tickets t
            where t.order_participant_id = op.id
            order by t.created_at desc
            limit 1
          )
        ) order by op.created_at, op.id)
        from public.order_participants op
        where op.order_id = o.id
      ), '[]'::jsonb)
    ) as order_payload
    from public.orders o
    join public.ticket_types tt on tt.id = o.ticket_type_id
    left join public.ticket_lots l on l.id = o.lot_id
    where (
      o.buyer_user_id = v_uid
      or lower(o.buyer_email) = v_email
      or exists (
        select 1
        from public.order_participants op_identity
        where op_identity.order_id = o.id
          and (
            op_identity.user_id = v_uid
            or lower(coalesce(op_identity.email, '')) = v_email
          )
      )
    )
    and (
      -- Estados que só existem depois de uma interação financeira real.
      o.payment_status in ('approved', 'in_process', 'rejected', 'refunded', 'charged_back')
      -- Pedidos pendentes, expirados ou cancelados só entram quando o Mercado
      -- Pago chegou a criar uma preferência ou registrar um evento.
      or exists (
        select 1
        from public.payment_preferences pp_visible
        where pp_visible.order_id = o.id
      )
      or exists (
        select 1
        from public.payment_events pe_visible
        where pe_visible.order_id = o.id
      )
      -- Compatibilidade com pedidos antigos já convertidos em ingresso.
      or exists (
        select 1
        from public.tickets t_visible
        where t_visible.order_id = o.id
      )
    )
  ) payload;

  return v_result;
end;
$$;

revoke all on function public.get_my_commerce_orders() from public, anon;
grant execute on function public.get_my_commerce_orders() to authenticated;

comment on function public.get_my_commerce_orders() is
  'Retorna somente pedidos do usuário que já alcançaram uma tentativa real de pagamento ou emissão de ingresso.';

notify pgrst, 'reload schema';
