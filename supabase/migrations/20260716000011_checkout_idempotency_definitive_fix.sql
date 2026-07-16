-- ================================================================
-- Definitive idempotency record fix
-- Rewrites only the pre-lot idempotency branch and verifies the result.
-- ================================================================

do $$
declare
  v_signature regprocedure := 'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure;
  v_definition text;
  v_after text;
begin
  select pg_get_functiondef(v_signature) into v_definition;

  if position('v_existing_lot_id uuid;' in v_definition) = 0 then
    v_definition := replace(
      v_definition,
      '  v_public_token uuid;',
      '  v_public_token uuid;\n  v_existing_lot_id uuid;\n  v_existing_lot_code text;\n  v_existing_lot_name text;'
    );
  end if;

  v_definition := regexp_replace(
    v_definition,
    'into[[:space:]]+v_order_id,[[:space:]]+v_public_token,[[:space:]]+v_total,[[:space:]]+v_expires_at,[[:space:]]+v_lot\.id,[[:space:]]+v_lot\.code,[[:space:]]+v_lot\.name',
    'into v_order_id, v_public_token, v_total, v_expires_at,\n           v_existing_lot_id, v_existing_lot_code, v_existing_lot_name',
    'i'
  );

  v_definition := regexp_replace(
    v_definition,
    'return query select v_order_id,[[:space:]]+v_public_token,[[:space:]]+v_total,[[:space:]]+v_expires_at,[[:space:]]+v_lot\.id,[[:space:]]+v_lot\.code,[[:space:]]+v_lot\.name;',
    'return query select v_order_id, v_public_token, v_total, v_expires_at,\n                          v_existing_lot_id, v_existing_lot_code, v_existing_lot_name;',
    'i'
  );

  execute v_definition;

  select pg_get_functiondef(v_signature) into v_after;

  if position('v_existing_lot_id uuid;' in v_after) = 0 then
    raise exception 'idempotency fix failed: scalar lot variables were not installed';
  end if;

  if v_after ~* 'into[[:space:]]+v_order_id,[[:space:]]+v_public_token,[[:space:]]+v_total,[[:space:]]+v_expires_at,[[:space:]]+v_lot\.id' then
    raise exception 'idempotency fix failed: pre-assignment v_lot target remains';
  end if;
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to service_role;

notify pgrst, 'reload schema';
