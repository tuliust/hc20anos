-- Support columns required by the transactional checkout RPC.

alter table if exists public.orders
  add column if not exists checkout_idempotency_key text;

create unique index if not exists orders_buyer_checkout_idempotency_unique
  on public.orders (buyer_user_id, checkout_idempotency_key)
  where buyer_user_id is not null and checkout_idempotency_key is not null;

alter table if exists public.order_participants
  add column if not exists client_key text;

create unique index if not exists order_participants_order_client_key_unique
  on public.order_participants (order_id, client_key)
  where client_key is not null;

notify pgrst, 'reload schema';
