-- Validates the public buyer read model after migration 20260726060000.

do $$
declare
  v_definition text;
begin
  if to_regprocedure('public.get_my_commerce_orders()') is null then
    raise exception 'FAIL: get_my_commerce_orders() is not installed';
  end if;

  select pg_get_functiondef('public.get_my_commerce_orders()'::regprocedure)
    into v_definition;

  if position('payment_preferences' in v_definition) = 0 then
    raise exception 'FAIL: buyer orders do not require a Mercado Pago preference for pending drafts';
  end if;

  if position('payment_events' in v_definition) = 0 then
    raise exception 'FAIL: buyer orders do not recognize recorded payment events';
  end if;

  if position('has_payment_attempt' in v_definition) = 0 then
    raise exception 'FAIL: buyer orders payload does not expose the payment-attempt flag';
  end if;

  if position('tickets t_visible' in v_definition) = 0 then
    raise exception 'FAIL: legacy issued tickets are not preserved in the buyer read model';
  end if;

  if position('pp_visible.order_id = o.id' in v_definition) = 0 then
    raise exception 'FAIL: pending buyer orders are not filtered by an order-bound payment preference';
  end if;

  if not has_function_privilege('authenticated', 'public.get_my_commerce_orders()', 'EXECUTE') then
    raise exception 'FAIL: authenticated users cannot execute get_my_commerce_orders()';
  end if;

  if has_function_privilege('anon', 'public.get_my_commerce_orders()', 'EXECUTE') then
    raise exception 'FAIL: anon can execute get_my_commerce_orders()';
  end if;
end $$;

select check_name, 'PASS' as result
from (values
  ('buyer_orders_requires_payment_attempt'),
  ('buyer_orders_preserves_issued_tickets'),
  ('buyer_orders_authenticated_only')
) as checks(check_name)
order by check_name;
