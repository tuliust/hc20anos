-- ================================================================
-- Corrective global commerce reset and capacity normalization
-- HC 20 Anos
-- ================================================================
-- The previous reset targeted a fixed event UUID that is not the UUID used by
-- the live event records. This corrective migration clears every transactional
-- commerce record while preserving events, people, content, photos, admins,
-- products, lots and configured prices.

begin;

-- Delete dependent transactional records in explicit dependency order.
delete from public.ticket_transfers;
delete from public.refund_requests;
delete from public.notification_jobs;
delete from public.participant_extras;
delete from public.payment_preferences;
delete from public.payment_events;
delete from public.tickets;
delete from public.order_participants;
delete from public.orders;
delete from public.guest_approval_requests;

-- Normalize all products and lots, including legacy/demo catalog entries.
update public.ticket_types
set available_quantity = 500,
    sold_quantity = 0,
    updated_at = now();

update public.ticket_lots
set capacity = 500,
    updated_at = now();

-- Replace the event-specific guard with a global maximum of 500.
create or replace function public.enforce_hc20_commerce_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_table_name = 'ticket_types' then
    if new.available_quantity is null or new.available_quantity < 0 or new.available_quantity > 500 then
      raise exception 'Product capacity must be between 0 and 500';
    end if;
    if coalesce(new.sold_quantity, 0) < 0 or coalesce(new.sold_quantity, 0) > new.available_quantity then
      raise exception 'Sold quantity must be between 0 and product capacity';
    end if;
  elsif tg_table_name = 'ticket_lots' then
    if new.capacity is null or new.capacity < 0 or new.capacity > 500 then
      raise exception 'Lot capacity must be between 0 and 500';
    end if;
  end if;

  return new;
end;
$$;

-- Triggers may already exist from migration 00005; recreate deterministically.
drop trigger if exists ticket_types_enforce_hc20_capacity on public.ticket_types;
create trigger ticket_types_enforce_hc20_capacity
before insert or update of event_id, available_quantity, sold_quantity
on public.ticket_types
for each row execute function public.enforce_hc20_commerce_capacity();

drop trigger if exists ticket_lots_enforce_hc20_capacity on public.ticket_lots;
create trigger ticket_lots_enforce_hc20_capacity
before insert or update of event_id, capacity
on public.ticket_lots
for each row execute function public.enforce_hc20_commerce_capacity();

-- Recalculate once after deletion to keep the dashboard source synchronized.
select public.refresh_ticket_type_sold_quantity(null);

comment on function public.enforce_hc20_commerce_capacity() is
  'Enforces a global maximum capacity of 500 for commerce products and lots.';

commit;
