-- ================================================================
-- Checkout idempotency record fix
-- HC 20 Anos — avoids assigning fields on an uninitialized PL/pgSQL
-- record when an idempotency key is checked before the active lot is loaded.
-- ================================================================

do $$
declare
  v_definition text;
  v_signature regprocedure := 'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure;
  v_old_declaration text := '  v_order_id uuid;
  v_public_token uuid;
  v_lot record;';
  v_new_declaration text := '  v_order_id uuid;
  v_public_token uuid;
  v_existing_lot_id uuid;
  v_existing_lot_code text;
  v_existing_lot_name text;
  v_lot record;';
  v_old_select text := '    select o.id, o.public_token, o.total_amount_cents, o.expires_at, o.lot_id,
           l.code, l.name
      into v_order_id, v_public_token, v_total, v_expires_at, v_lot.id,
           v_lot.code, v_lot.name
    from public.orders o
    left join public.ticket_lots l on l.id = o.lot_id
    where o.buyer_user_id = p_buyer_user_id
      and o.checkout_idempotency_key = p_idempotency_key
    limit 1;';
  v_new_select text := '    select o.id, o.public_token, o.total_amount_cents, o.expires_at, o.lot_id,
           l.code, l.name
      into v_order_id, v_public_token, v_total, v_expires_at, v_existing_lot_id,
           v_existing_lot_code, v_existing_lot_name
    from public.orders o
    left join public.ticket_lots l on l.id = o.lot_id
    where o.buyer_user_id = p_buyer_user_id
      and o.checkout_idempotency_key = p_idempotency_key
    limit 1;';
  v_old_return text := '    if v_order_id is not null then
      return query select v_order_id, v_public_token, v_total, v_expires_at,
                          v_lot.id, v_lot.code, v_lot.name;
      return;
    end if;';
  v_new_return text := '    if v_order_id is not null then
      return query select v_order_id, v_public_token, v_total, v_expires_at,
                          v_existing_lot_id, v_existing_lot_code, v_existing_lot_name;
      return;
    end if;';
begin
  select pg_get_functiondef(v_signature) into v_definition;

  if position(v_old_declaration in v_definition) = 0 then
    raise exception 'create_checkout_order declaration block not found';
  end if;
  if position(v_old_select in v_definition) = 0 then
    raise exception 'create_checkout_order idempotency select block not found';
  end if;
  if position(v_old_return in v_definition) = 0 then
    raise exception 'create_checkout_order idempotency return block not found';
  end if;

  v_definition := replace(v_definition, v_old_declaration, v_new_declaration);
  v_definition := replace(v_definition, v_old_select, v_new_select);
  v_definition := replace(v_definition, v_old_return, v_new_return);

  execute v_definition;
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to service_role;

notify pgrst, 'reload schema';
