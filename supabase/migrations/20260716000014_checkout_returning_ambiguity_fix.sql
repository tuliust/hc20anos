-- ================================================================
-- Checkout RETURNING ambiguity fix
-- Qualifies orders.id and orders.public_token to avoid conflicts with
-- OUT parameter names in create_checkout_order.
-- ================================================================

do $$
declare
  v_signature regprocedure := 'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure;
  v_definition text;
  v_old_insert text := '  insert into public.orders (';
  v_new_insert text := '  insert into public.orders as inserted_order (';
  v_old_returning text := '  ) returning id, public_token into v_order_id, v_public_token;';
  v_new_returning text := '  ) returning inserted_order.id, inserted_order.public_token into v_order_id, v_public_token;';
begin
  select pg_get_functiondef(v_signature) into v_definition;

  if position(v_old_insert in v_definition) = 0 then
    raise exception 'create_checkout_order orders insert block not found';
  end if;

  if position(v_old_returning in v_definition) = 0 then
    raise exception 'create_checkout_order unqualified returning block not found';
  end if;

  v_definition := replace(v_definition, v_old_insert, v_new_insert);
  v_definition := replace(v_definition, v_old_returning, v_new_returning);

  execute v_definition;

  select pg_get_functiondef(v_signature) into v_definition;

  if position(v_new_insert in v_definition) = 0
     or position(v_new_returning in v_definition) = 0 then
    raise exception 'checkout returning ambiguity fix was not installed';
  end if;

  if position(v_old_returning in v_definition) > 0 then
    raise exception 'unqualified checkout returning remains installed';
  end if;
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to service_role;

notify pgrst, 'reload schema';
