-- ================================================================
-- Normalize HC 20 Anos commerce capacity without deleting transactions
-- ================================================================
-- Historical versions of this migration reset commerce data. Destructive
-- maintenance was removed from the automatic migration path and is now kept
-- under supabase/manual/reset-commerce-data.sql.

begin;

-- Do not silently truncate a real sold quantity. An environment with more than
-- 500 sold units requires an explicit business decision before migration.
do $$
begin
  if exists (
    select 1
    from public.ticket_types
    where event_id = '00000000-0000-0000-0000-000000000001'::uuid
      and coalesce(sold_quantity, 0) > 500
  ) then
    raise exception 'HC20_COMMERCE_SOLD_QUANTITY_ABOVE_CAPACITY';
  end if;
end
$$;

-- Normalize only invalid capacity values. Existing transactional counters are
-- preserved and available_quantity never becomes lower than sold_quantity.
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
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and (
    available_quantity is null
    or available_quantity < 0
    or available_quantity > 500
    or sold_quantity is null
    or sold_quantity < 0
    or sold_quantity > available_quantity
  );

update public.ticket_lots
set capacity = least(500, greatest(coalesce(capacity, 500), 0)),
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and (capacity is null or capacity < 0 or capacity > 500);

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
  'Enforces a maximum capacity of 500 for HC 20 Anos products and lots without deleting commerce data.';

commit;
