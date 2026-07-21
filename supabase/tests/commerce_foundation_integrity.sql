-- Structural and data-integrity checks for the commerce foundation.

with checks as (
  select 'ticket_lots_table_exists'::text as check_name,
    to_regclass('public.ticket_lots') is not null as passed
  union all
  select 'ticket_lot_prices_table_exists',
    to_regclass('public.ticket_lot_prices') is not null
  union all
  select 'order_participants_table_exists',
    to_regclass('public.order_participants') is not null
  union all
  select 'checkout_idempotency_column_exists',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'orders'
        and column_name = 'checkout_idempotency_key'
    )
  union all
  select 'participant_client_key_column_exists',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'order_participants'
        and column_name = 'client_key'
    )
  union all
  select 'checkout_idempotency_index_exists',
    exists(
      select 1 from pg_indexes
      where schemaname = 'public'
        and indexname = 'orders_buyer_checkout_idempotency_unique'
    )
  union all
  select 'participant_client_key_index_exists',
    exists(
      select 1 from pg_indexes
      where schemaname = 'public'
        and indexname = 'order_participants_order_client_key_unique'
    )
  union all
  select 'age_on_event_date_rpc_exists',
    to_regprocedure('public.age_on_event_date(date,uuid)') is not null
  union all
  select 'create_checkout_order_rpc_exists',
    to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is not null
  union all
  select 'anon_cannot_create_checkout_order',
    not has_function_privilege(
      'anon',
      'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)',
      'EXECUTE'
    )
  union all
  select 'service_role_can_create_checkout_order',
    has_function_privilege(
      'service_role',
      'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)',
      'EXECUTE'
    )
  union all
  select 'product_capacity_trigger_exists',
    exists(
      select 1 from pg_trigger
      where tgname = 'ticket_types_enforce_hc20_capacity'
        and not tgisinternal
    )
  union all
  select 'lot_capacity_trigger_exists',
    exists(
      select 1 from pg_trigger
      where tgname = 'ticket_lots_enforce_hc20_capacity'
        and not tgisinternal
    )
  union all
  select 'product_capacities_are_valid',
    not exists(
      select 1 from public.ticket_types
      where available_quantity is null
         or available_quantity < 0
         or available_quantity > 500
         or coalesce(sold_quantity, 0) < 0
         or coalesce(sold_quantity, 0) > available_quantity
    )
  union all
  select 'lot_capacities_are_valid',
    not exists(
      select 1 from public.ticket_lots
      where capacity is null or capacity < 0 or capacity > 500
    )
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
