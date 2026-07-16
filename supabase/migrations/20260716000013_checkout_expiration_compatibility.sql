-- ================================================================
-- Checkout reservation expiration compatibility
-- Keeps create_checkout_order compatible with the canonical helper name.
-- ================================================================

create or replace function public.expire_checkout_reservations(
  p_now timestamptz default now()
)
returns integer
language sql
security definer
set search_path = public
as $$
  select public.release_expired_ticket_reservations(p_now);
$$;

revoke all on function public.expire_checkout_reservations(timestamptz) from public, anon, authenticated;
grant execute on function public.expire_checkout_reservations(timestamptz) to service_role;

-- Fail the migration if either side of the compatibility contract is missing.
do $$
begin
  if to_regprocedure('public.release_expired_ticket_reservations(timestamptz)') is null then
    raise exception 'release_expired_ticket_reservations(timestamptz) is missing';
  end if;
  if to_regprocedure('public.expire_checkout_reservations(timestamptz)') is null then
    raise exception 'expire_checkout_reservations(timestamptz) was not installed';
  end if;
end;
$$;

notify pgrst, 'reload schema';
