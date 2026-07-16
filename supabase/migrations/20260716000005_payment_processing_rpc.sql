-- ================================================================
-- Idempotent payment processing and ticket issuance
-- HC 20 Anos — Mercado Pago Checkout Pro
-- ================================================================

create or replace function public.apply_mercado_pago_payment(
  p_order_id uuid,
  p_payment_id text,
  p_payment_status text,
  p_status_detail text,
  p_payment_method text,
  p_payment_type text,
  p_installments integer,
  p_transaction_amount_cents integer,
  p_currency_id text,
  p_preference_id text,
  p_paid_at timestamptz default null
)
returns table (
  order_id uuid,
  resulting_status text,
  tickets_created integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_expected_status text;
  v_created integer := 0;
  v_participant record;
  v_qr_token text;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if p_transaction_amount_cents is distinct from v_order.total_amount_cents then
    raise exception 'payment_amount_mismatch' using errcode = '23514';
  end if;

  if upper(coalesce(p_currency_id, '')) <> upper(coalesce(v_order.currency_id, 'BRL')) then
    raise exception 'payment_currency_mismatch' using errcode = '23514';
  end if;

  if v_order.payment_provider_preference_id is not null
     and p_preference_id is distinct from v_order.payment_provider_preference_id then
    raise exception 'payment_preference_mismatch' using errcode = '23514';
  end if;

  v_expected_status := case p_payment_status
    when 'approved' then 'approved'
    when 'rejected' then 'rejected'
    when 'pending' then 'pending'
    when 'in_process' then 'in_process'
    when 'cancelled' then 'cancelled'
    when 'refunded' then 'refunded'
    when 'charged_back' then 'charged_back'
    else 'pending'
  end;

  -- Do not regress terminal states to pending/in_process.
  if v_order.payment_status in ('approved', 'refunded', 'charged_back')
     and v_expected_status in ('pending', 'in_process') then
    v_expected_status := v_order.payment_status::text;
  end if;

  update public.orders
  set payment_status = v_expected_status::public.payment_status,
      payment_status_detail = p_status_detail,
      payment_provider_order_id = p_payment_id,
      payment_method = p_payment_method,
      payment_type = p_payment_type,
      installments = p_installments,
      paid_at = case
        when v_expected_status = 'approved' then coalesce(p_paid_at, paid_at, now())
        else paid_at
      end,
      refunded_at = case when v_expected_status = 'refunded' then coalesce(refunded_at, now()) else refunded_at end,
      reservation_status = case when v_expected_status = 'approved' then 'converted' else reservation_status end,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if v_expected_status = 'approved' then
    update public.order_participants
    set status = 'active', updated_at = now()
    where order_id = p_order_id and status in ('reserved', 'expired');

    for v_participant in
      select op.*
      from public.order_participants op
      where op.order_id = p_order_id
      order by op.created_at, op.id
    loop
      if not exists (
        select 1 from public.tickets t
        where t.order_participant_id = v_participant.id
      ) then
        v_qr_token := encode(gen_random_bytes(24), 'hex');

        insert into public.tickets (
          order_id,
          ticket_type_id,
          person_id,
          order_participant_id,
          attendee_name,
          attendee_email,
          attendee_phone,
          qr_code,
          qr_token,
          qr_token_hash,
          status,
          checked_in
        ) values (
          p_order_id,
          v_order.ticket_type_id,
          v_participant.person_id,
          v_participant.id,
          v_participant.full_name,
          coalesce(v_participant.email, v_order.buyer_email),
          coalesce(v_participant.phone, v_order.buyer_phone),
          upper(substr(v_qr_token, 1, 12)),
          v_qr_token,
          encode(digest(v_qr_token, 'sha256'), 'hex'),
          'active',
          false
        );

        v_created := v_created + 1;
      end if;
    end loop;

    update public.orders
    set approved_inventory_applied_at = coalesce(approved_inventory_applied_at, now()),
        updated_at = now()
    where id = p_order_id;

    insert into public.notification_jobs (
      event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json
    )
    select
      'ticket_issued',
      t.order_id,
      t.id,
      t.attendee_email,
      'ticket-issued:' || t.id::text,
      jsonb_build_object('ticket_id', t.id, 'order_id', t.order_id)
    from public.tickets t
    where t.order_id = p_order_id
    on conflict (idempotency_key) do nothing;
  elsif v_expected_status in ('refunded', 'charged_back', 'cancelled') then
    update public.tickets
    set status = case
          when v_expected_status = 'refunded' then 'refunded'
          when v_expected_status = 'charged_back' then 'chargeback'
          else 'cancelled'
        end,
        cancelled_at = coalesce(cancelled_at, now()),
        cancellation_reason = coalesce(cancellation_reason, 'payment_' || v_expected_status),
        updated_at = now()
    where order_id = p_order_id
      and status not in ('used', 'transferred');
  end if;

  insert into public.audit_logs (action, entity_type, entity_id, metadata_json)
  values (
    'payment_' || v_expected_status,
    'orders',
    p_order_id,
    jsonb_build_object(
      'payment_id', p_payment_id,
      'status', p_payment_status,
      'status_detail', p_status_detail,
      'tickets_created', v_created
    )
  );

  return query select p_order_id, v_expected_status, v_created;
end;
$$;

revoke execute on function public.apply_mercado_pago_payment(uuid, text, text, text, text, text, integer, integer, text, text, timestamptz) from public, anon, authenticated;

notify pgrst, 'reload schema';