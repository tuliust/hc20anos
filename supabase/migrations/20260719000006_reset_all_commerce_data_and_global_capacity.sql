-- ================================================================
-- Global commerce capacity normalization without deleting transactions
-- ================================================================
-- Historical versions of this migration cleared every commerce table. That
-- operation is no longer allowed in the automatic migration path. The guarded
-- maintenance script lives at supabase/manual/reset-commerce-data.sql.

begin;

-- Remove the event-specific triggers before normalizing all catalog rows.
drop trigger if exists ticket_types_enforce_hc20_capacity on public.ticket_types;
drop trigger if exists ticket_lots_enforce_hc20_capacity on public.ticket_lots;

-- Do not silently truncate real sales. A catalog with more than 500 sold units
-- must be handled through an explicit business migration.
do $$
begin
  if exists (
    select 1
    from public.ticket_types
    where coalesce(sold_quantity, 0) > 500
  ) then
    raise exception 'COMMERCE_SOLD_QUANTITY_ABOVE_GLOBAL_CAPACITY';
  end if;
end
$$;

update public.ticket_types
set available_quantity = least(
      500,
      greatest(
        coalesce(available_quantity, 500),
        greatest(coalesce(sold_quantity, 0), 0)
      )
    ),
    sold_quantity = greatest(coalesce(sold_quantity, 0), 0),
    updated_at = now()
where available_quantity is null
   or available_quantity < 0
   or available_quantity > 500
   or sold_quantity is null
   or sold_quantity < 0
   or sold_quantity > available_quantity;

update public.ticket_lots
set capacity = least(500, greatest(coalesce(capacity, 500), 0)),
    updated_at = now()
where capacity is null or capacity < 0 or capacity > 500;

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

create trigger ticket_types_enforce_hc20_capacity
before insert or update of event_id, available_quantity, sold_quantity
on public.ticket_types
for each row execute function public.enforce_hc20_commerce_capacity();

create trigger ticket_lots_enforce_hc20_capacity
before insert or update of event_id, capacity
on public.ticket_lots
for each row execute function public.enforce_hc20_commerce_capacity();

-- Recalculate counters from approved tickets without deleting orders or tickets.
select public.refresh_ticket_type_sold_quantity(null);

comment on function public.enforce_hc20_commerce_capacity() is
  'Enforces a global maximum capacity of 500 without deleting commerce data.';

commit;
