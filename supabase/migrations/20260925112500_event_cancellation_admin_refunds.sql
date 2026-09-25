-- HC 20 Anos — reembolso administrativo integral por cancelamento do evento
-- Cria uma solicitação aprovada e auditável para um pedido pago.
-- O processamento financeiro continua sendo feito exclusivamente pela Edge Function refund-processor.

create or replace function public.admin_prepare_event_cancellation_refund(
  p_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.admin_users;
  v_order public.orders;
  v_existing public.refund_requests;
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select *
  into v_admin
  from public.admin_users
  where user_id = auth.uid()
    and role in ('superadmin', 'admin')
  limit 1;

  if not found then
    raise exception 'admin_required';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.payment_status::text = 'refunded' then
    select *
    into v_existing
    from public.refund_requests
    where order_id = p_order_id
      and status = 'refunded'
    order by processed_at desc nulls last, created_at desc
    limit 1;

    if found then
      return v_existing.id;
    end if;

    raise exception 'order_already_refunded';
  end if;

  if v_order.payment_status::text <> 'approved' then
    raise exception 'order_not_refundable';
  end if;

  if nullif(btrim(coalesce(v_order.payment_provider_order_id, '')), '') is null then
    raise exception 'payment_id_missing';
  end if;

  select *
  into v_existing
  from public.refund_requests
  where order_id = p_order_id
    and status in ('requested', 'under_review', 'approved', 'processing', 'refunded')
  order by created_at desc
  limit 1;

  if found then
    if v_existing.status in ('requested', 'under_review') then
      update public.refund_requests
      set
        reason = 'Cancelamento do evento por baixa adesão',
        status = 'approved',
        gross_amount_cents = v_order.total_amount_cents,
        non_recoverable_fee_cents = 0,
        refund_amount_cents = v_order.total_amount_cents,
        provider_payment_id = v_order.payment_provider_order_id,
        reviewed_at = now(),
        reviewed_by_admin_id = v_admin.id,
        notes = trim(both E'\n' from concat_ws(
          E'\n',
          nullif(notes, ''),
          'Reembolso integral aprovado administrativamente após cancelamento do evento.'
        )),
        updated_at = now()
      where id = v_existing.id;
    end if;

    return v_existing.id;
  end if;

  insert into public.refund_requests (
    order_id,
    requested_by_user_id,
    reason,
    status,
    gross_amount_cents,
    non_recoverable_fee_cents,
    refund_amount_cents,
    provider_payment_id,
    reviewed_at,
    reviewed_by_admin_id,
    notes
  )
  values (
    p_order_id,
    auth.uid(),
    'Cancelamento do evento por baixa adesão',
    'approved',
    v_order.total_amount_cents,
    0,
    v_order.total_amount_cents,
    v_order.payment_provider_order_id,
    now(),
    v_admin.id,
    'Reembolso integral aprovado administrativamente após cancelamento do evento.'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.admin_prepare_event_cancellation_refund(uuid) from public, anon;
grant execute on function public.admin_prepare_event_cancellation_refund(uuid) to authenticated;

comment on function public.admin_prepare_event_cancellation_refund(uuid) is
  'Prepara reembolso integral, auditável e já aprovado para pedido pago após cancelamento do evento. O Mercado Pago é acionado separadamente por refund-processor.';

notify pgrst, 'reload schema';
