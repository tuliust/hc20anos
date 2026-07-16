-- ================================================================
-- Payment processing portability fix
-- Removes runtime dependency on pgcrypto functions that may live in
-- the Supabase `extensions` schema while the RPC search_path is public.
-- Also validates the database objects required by the payment flow.
-- ================================================================

-- Fail early with a clear message when the installed schema is incomplete.
do $$
declare
  v_missing text[] := array[]::text[];
begin
  if to_regclass('public.orders') is null then v_missing := array_append(v_missing, 'public.orders'); end if;
  if to_regclass('public.order_participants') is null then v_missing := array_append(v_missing, 'public.order_participants'); end if;
  if to_regclass('public.tickets') is null then v_missing := array_append(v_missing, 'public.tickets'); end if;
  if to_regclass('public.notification_jobs') is null then v_missing := array_append(v_missing, 'public.notification_jobs'); end if;
  if to_regclass('public.audit_logs') is null then v_missing := array_append(v_missing, 'public.audit_logs'); end if;

  if to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is null then
    v_missing := array_append(v_missing, 'public.create_checkout_order(...)');
  end if;
  if to_regprocedure('public.release_expired_ticket_reservations(timestamptz)') is null then
    v_missing := array_append(v_missing, 'public.release_expired_ticket_reservations(timestamptz)');
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='payment_provider_order_id') then
    v_missing := array_append(v_missing, 'orders.payment_provider_order_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='payment_provider_preference_id') then
    v_missing := array_append(v_missing, 'orders.payment_provider_preference_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='total_amount_cents') then
    v_missing := array_append(v_missing, 'orders.total_amount_cents');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tickets' and column_name='order_participant_id') then
    v_missing := array_append(v_missing, 'tickets.order_participant_id');
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tickets' and column_name='qr_token_hash') then
    v_missing := array_append(v_missing, 'tickets.qr_token_hash');
  end if;

  if cardinality(v_missing) > 0 then
    raise exception 'checkout_schema_prerequisites_missing: %', array_to_string(v_missing, ', ');
  end if;
end;
$$;

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
  v_resulting_status text;
  v_created integer := 0;
  v_participant record;
  v_qr_token text;
  v_existing_payment_order uuid;
begin
  if nullif(btrim(p_payment_id), '') is null then
    raise exception 'payment_id_required' using errcode = '22023';
  end if;

  if p_payment_status not in ('approved','rejected','pending','in_process','cancelled','refunded','charged_back') then
    raise exception 'payment_status_unsupported' using errcode = '22023';
  end if;

  if p_transaction_amount_cents is null or p_transaction_amount_cents < 0 then
    raise exception 'payment_amount_invalid' using errcode = '22023';
  end if;

  if p_installments is not null and (p_installments < 1 or p_installments > 3) then
    raise exception 'payment_installments_invalid' using errcode = '23514';
  end if;

  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;

  if p_transaction_amount_cents is distinct from v_order.total_amount_cents then
    raise exception 'payment_amount_mismatch' using errcode = '23514';
  end if;

  if upper(coalesce(nullif(btrim(p_currency_id), ''), '')) <> upper(coalesce(v_order.currency_id, 'BRL')) then
    raise exception 'payment_currency_mismatch' using errcode = '23514';
  end if;

  if nullif(btrim(p_preference_id), '') is null then
    raise exception 'payment_preference_required' using errcode = '23514';
  end if;

  if v_order.payment_provider_preference_id is null
     or p_preference_id is distinct from v_order.payment_provider_preference_id then
    raise exception 'payment_preference_mismatch' using errcode = '23514';
  end if;

  select o.id into v_existing_payment_order
  from public.orders o
  where o.payment_provider_order_id = p_payment_id
    and o.id <> p_order_id
  limit 1;

  if v_existing_payment_order is not null then
    raise exception 'payment_id_already_linked' using errcode = '23505';
  end if;

  if v_order.payment_provider_order_id is not null
     and v_order.payment_provider_order_id is distinct from p_payment_id then
    raise exception 'order_payment_id_mismatch' using errcode = '23514';
  end if;

  v_resulting_status := p_payment_status;

  if v_order.payment_status in ('refunded', 'charged_back') then
    v_resulting_status := v_order.payment_status::text;
  elsif v_order.payment_status = 'approved'
        and p_payment_status in ('pending','in_process','rejected','cancelled') then
    v_resulting_status := 'approved';
  elsif v_order.payment_status in ('rejected','cancelled')
        and p_payment_status in ('pending','in_process') then
    v_resulting_status := v_order.payment_status::text;
  end if;

  update public.orders o
  set payment_status = v_resulting_status::public.payment_status,
      payment_status_detail = p_status_detail,
      payment_provider_order_id = p_payment_id,
      payment_method = p_payment_method,
      payment_type = p_payment_type,
      installments = p_installments,
      paid_at = case when v_resulting_status='approved' then coalesce(p_paid_at,o.paid_at,now()) else o.paid_at end,
      refunded_at = case when v_resulting_status='refunded' then coalesce(o.refunded_at,now()) else o.refunded_at end,
      reservation_status = case
        when v_resulting_status='approved' then 'converted'
        when v_resulting_status in ('refunded','charged_back','cancelled') then 'released'
        else o.reservation_status
      end,
      reservation_released_at = case
        when v_resulting_status in ('refunded','charged_back','cancelled') then coalesce(o.reservation_released_at,now())
        else o.reservation_released_at
      end,
      updated_at = now()
  where o.id = p_order_id
  returning o.* into v_order;

  if v_resulting_status = 'approved' then
    update public.order_participants op
    set status='active', updated_at=now()
    where op.order_id=p_order_id and op.status in ('reserved','expired');

    for v_participant in
      select op.* from public.order_participants op
      where op.order_id=p_order_id
      order by op.created_at, op.id
    loop
      if not exists (select 1 from public.tickets t where t.order_participant_id=v_participant.id) then
        -- 64 hex characters using only gen_random_uuid(), which is already used by
        -- the schema defaults and is available in Supabase without relying on the
        -- `extensions` schema being present in this function's search_path.
        v_qr_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

        insert into public.tickets (
          order_id, ticket_type_id, person_id, order_participant_id,
          attendee_name, attendee_email, attendee_phone,
          qr_code, qr_token, qr_token_hash, status, checked_in
        ) values (
          p_order_id, v_order.ticket_type_id, v_participant.person_id, v_participant.id,
          v_participant.full_name,
          coalesce(v_participant.email,v_order.buyer_email),
          coalesce(v_participant.phone,v_order.buyer_phone),
          upper(substr(v_qr_token,1,12)),
          v_qr_token,
          md5(v_qr_token),
          'active', false
        )
        on conflict (order_participant_id) where order_participant_id is not null do nothing;

        if found then v_created := v_created + 1; end if;
      end if;
    end loop;

    update public.orders o
    set approved_inventory_applied_at=coalesce(o.approved_inventory_applied_at,now()), updated_at=now()
    where o.id=p_order_id;

    insert into public.notification_jobs (
      event_type, order_id, ticket_id, recipient_email, idempotency_key, payload_json
    )
    select 'ticket_issued', t.order_id, t.id, t.attendee_email,
           'ticket-issued:' || t.id::text,
           jsonb_build_object('ticket_id',t.id,'order_id',t.order_id)
    from public.tickets t
    where t.order_id=p_order_id
    on conflict (idempotency_key) do nothing;

  elsif v_resulting_status in ('refunded','charged_back','cancelled') then
    update public.order_participants op
    set status=case when v_resulting_status='refunded' then 'refunded' else 'cancelled' end,
        updated_at=now()
    where op.order_id=p_order_id and op.status not in ('transferred');

    update public.tickets t
    set status=case
          when v_resulting_status='refunded' then 'refunded'
          when v_resulting_status='charged_back' then 'chargeback'
          else 'cancelled'
        end,
        cancelled_at=coalesce(t.cancelled_at,now()),
        cancellation_reason=coalesce(t.cancellation_reason,'payment_' || v_resulting_status),
        updated_at=now()
    where t.order_id=p_order_id and t.status not in ('used','transferred');
  end if;

  insert into public.audit_logs (action, entity_type, entity_id, metadata_json)
  values (
    'payment_' || v_resulting_status,
    'orders', p_order_id,
    jsonb_build_object(
      'payment_id',p_payment_id,
      'provider_status',p_payment_status,
      'resulting_status',v_resulting_status,
      'status_detail',p_status_detail,
      'preference_id',p_preference_id,
      'amount_cents',p_transaction_amount_cents,
      'currency_id',p_currency_id,
      'tickets_created',v_created
    )
  );

  return query select p_order_id, v_resulting_status, v_created;
end;
$$;

revoke all on function public.apply_mercado_pago_payment(
  uuid,text,text,text,text,text,integer,integer,text,text,timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_mercado_pago_payment(
  uuid,text,text,text,text,text,integer,integer,text,text,timestamptz
) to service_role;

create unique index if not exists orders_payment_provider_order_unique
  on public.orders (payment_provider, payment_provider_order_id)
  where payment_provider_order_id is not null;

-- Installation assertions: no hidden pgcrypto dependency remains.
do $$
declare
  v_definition text;
begin
  select pg_get_functiondef(
    'public.apply_mercado_pago_payment(uuid,text,text,text,text,text,integer,integer,text,text,timestamptz)'::regprocedure
  ) into v_definition;

  if position('gen_random_bytes' in v_definition) > 0 then
    raise exception 'payment RPC still depends on gen_random_bytes';
  end if;
  if position('digest(' in v_definition) > 0 then
    raise exception 'payment RPC still depends on digest';
  end if;
  if position('md5(v_qr_token)' in v_definition) = 0 then
    raise exception 'portable QR hash implementation was not installed';
  end if;
end;
$$;

notify pgrst, 'reload schema';
