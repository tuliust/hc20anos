-- ================================================================
-- Reset fallback commerce data and cap product capacity at 500
-- HC 20 Anos
-- ================================================================
-- Destructive only for commerce records linked to the HC 20 Anos event.
-- Preserves people, content, photos, admins, event settings, products, lots
-- and configured prices.

begin;

create temporary table _hc20_target_orders (
  id uuid primary key
) on commit drop;

insert into _hc20_target_orders (id)
select o.id
from public.orders o
where o.event_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Delete dependent transactional records in explicit dependency order.
delete from public.ticket_transfers tr
where tr.ticket_id in (
  select t.id
  from public.tickets t
  join _hc20_target_orders target on target.id = t.order_id
);

delete from public.refund_requests rr
where rr.order_id in (select id from _hc20_target_orders)
   or rr.ticket_id in (
     select t.id
     from public.tickets t
     join _hc20_target_orders target on target.id = t.order_id
   );

delete from public.notification_jobs nj
where nj.order_id in (select id from _hc20_target_orders)
   or nj.ticket_id in (
     select t.id
     from public.tickets t
     join _hc20_target_orders target on target.id = t.order_id
   );

delete from public.participant_extras pe
where pe.order_id in (select id from _hc20_target_orders);

delete from public.payment_preferences pp
where pp.order_id in (select id from _hc20_target_orders);

delete from public.payment_events pe
where pe.order_id in (select id from _hc20_target_orders);

delete from public.tickets t
where t.order_id in (select id from _hc20_target_orders);

delete from public.order_participants op
where op.order_id in (select id from _hc20_target_orders);

delete from public.orders o
where o.id in (select id from _hc20_target_orders);

-- Guest approval records are part of the commerce flow but are not tied to an
-- order until checkout. Clear them for a completely clean commercial state.
delete from public.guest_approval_requests gar
where gar.event_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Normalize every product and lot for this event.
update public.ticket_types
set available_quantity = 500,
    sold_quantity = 0,
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

update public.ticket_lots
set capacity = 500,
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Enforce the maximum for future admin changes and new products/lots.
create or replace function public.enforce_hc20_commerce_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.event_id = '00000000-0000-0000-0000-000000000001'::uuid then
    if tg_table_name = 'ticket_types' then
      if new.available_quantity is null or new.available_quantity < 0 or new.available_quantity > 500 then
        raise exception 'HC 20 Anos product capacity must be between 0 and 500';
      end if;
      if coalesce(new.sold_quantity, 0) < 0 or coalesce(new.sold_quantity, 0) > new.available_quantity then
        raise exception 'HC 20 Anos sold quantity must be between 0 and product capacity';
      end if;
    elsif tg_table_name = 'ticket_lots' then
      if new.capacity is null or new.capacity < 0 or new.capacity > 500 then
        raise exception 'HC 20 Anos lot capacity must be between 0 and 500';
      end if;
    end if;
  end if;

  return new;
end;
$$;

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

comment on function public.enforce_hc20_commerce_capacity() is
  'Enforces a maximum capacity of 500 for HC 20 Anos products and lots.';

commit;
