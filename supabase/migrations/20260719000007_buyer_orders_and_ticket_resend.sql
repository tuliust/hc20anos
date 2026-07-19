-- Buyer area: authenticated order/ticket read model and safe resend queue.

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
      'ticket_type', jsonb_build_object(
        'id', tt.id,
        'name', tt.name,
        'description', tt.description,
        'product_code', tt.product_code,
        'package_kind', tt.package_kind
      ),
      'lot', case when l.id is null then null else jsonb_build_object(
        'id', l.id, 'code', l.code, 'name', l.name
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
    where o.buyer_user_id = v_uid
       or lower(o.buyer_email) = v_email
       or exists (
         select 1 from public.order_participants op
         where op.order_id = o.id
           and (op.user_id = v_uid or lower(coalesce(op.email, '')) = v_email)
       )
  ) payload;

  return v_result;
end;
$$;

revoke all on function public.get_my_commerce_orders() from public, anon;
grant execute on function public.get_my_commerce_orders() to authenticated;

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
    event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json
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
    )
  );

  if coalesce(v_ticket.attendee_phone, '') <> '' then
    insert into public.notification_jobs (
      event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json
    ) values (
      'ticket_resend_whatsapp',
      v_ticket.order_id,
      v_ticket.id,
      coalesce(v_ticket.attendee_email, v_ticket.buyer_email),
      'ticket-resend-whatsapp:' || v_ticket.id::text || ':' || v_nonce,
      jsonb_build_object(
        'participant_name', coalesce(v_ticket.participant_name, v_ticket.attendee_name),
        'ticket_code', v_ticket.qr_code,
        'qr_token', v_ticket.qr_token,
        'recipient_phone', v_ticket.attendee_phone,
        'requested_by_user_id', v_uid
      )
    );
  end if;

  return jsonb_build_object('queued', true, 'ticket_id', v_ticket.id);
end;
$$;

revoke all on function public.request_ticket_resend(uuid) from public, anon;
grant execute on function public.request_ticket_resend(uuid) to authenticated;

notify pgrst, 'reload schema';
