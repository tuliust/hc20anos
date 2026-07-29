-- ================================================================
-- Fase 3: garantias de expiração para checkout e preferências.
--
-- Impede pedidos pendentes e preferências ativas sem prazo, repara
-- registros antigos e encerra preferências cujo prazo já terminou.
-- ================================================================

create or replace function public.ensure_pending_order_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.payment_status::text = 'pending'
     and coalesce(new.reservation_status, 'active') = 'active'
     and new.expires_at is null then
    new.expires_at := coalesce(new.created_at, now()) + interval '30 minutes';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_ensure_pending_expiry on public.orders;
create trigger orders_ensure_pending_expiry
before insert or update of payment_status, reservation_status, expires_at
on public.orders
for each row
execute function public.ensure_pending_order_expiry();

create or replace function public.ensure_active_preference_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_order_expiry timestamptz;
begin
  if new.status = 'active' and new.expires_at is null then
    select coalesce(o.expires_at, o.created_at + interval '30 minutes')
      into v_order_expiry
    from public.orders o
    where o.id = new.order_id;

    new.expires_at := coalesce(v_order_expiry, now() + interval '30 minutes');
  end if;
  return new;
end;
$$;

drop trigger if exists payment_preferences_ensure_active_expiry
  on public.payment_preferences;
create trigger payment_preferences_ensure_active_expiry
before insert or update of status, expires_at, order_id
on public.payment_preferences
for each row
execute function public.ensure_active_preference_expiry();

update public.orders
set expires_at = coalesce(created_at, now()) + interval '30 minutes',
    updated_at = now()
where payment_status::text = 'pending'
  and coalesce(reservation_status, 'active') = 'active'
  and expires_at is null;

update public.payment_preferences pp
set expires_at = coalesce(o.expires_at, o.created_at + interval '30 minutes'),
    updated_at = now()
from public.orders o
where o.id = pp.order_id
  and pp.status = 'active'
  and pp.expires_at is null;

update public.payment_preferences
set status = 'expired',
    updated_at = now()
where status = 'active'
  and expires_at is not null
  and expires_at <= now();

do $$
begin
  if to_regprocedure('public.release_expired_ticket_reservations(timestamptz)') is not null then
    perform public.release_expired_ticket_reservations(now());
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from public.orders o
    where o.payment_status::text = 'pending'
      and coalesce(o.reservation_status, 'active') = 'active'
      and o.expires_at is null
  ) then
    raise exception 'pending active order without expiration remains';
  end if;

  if exists (
    select 1
    from public.payment_preferences pp
    where pp.status = 'active'
      and pp.expires_at is null
  ) then
    raise exception 'active payment preference without expiration remains';
  end if;
end;
$$;

notify pgrst, 'reload schema';
