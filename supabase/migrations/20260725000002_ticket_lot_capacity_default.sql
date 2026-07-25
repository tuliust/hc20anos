-- Mantém o Admin de lotes compatível com o limite global de 500 lugares.

alter table public.ticket_lots
  alter column capacity set default 500;

update public.ticket_lots
set capacity = 500,
    updated_at = now()
where capacity is null;

create or replace function public.normalize_ticket_lot_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.capacity := coalesce(new.capacity, 500);

  if new.capacity < 0 or new.capacity > 500 then
    raise exception 'invalid_lot_capacity' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists a_ticket_lots_normalize_capacity on public.ticket_lots;
create trigger a_ticket_lots_normalize_capacity
before insert or update of capacity
on public.ticket_lots
for each row execute function public.normalize_ticket_lot_capacity();

notify pgrst, 'reload schema';
