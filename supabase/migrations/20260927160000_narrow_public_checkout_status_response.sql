-- Keep the bearer-token checkout return flow, but disclose only the field the UI uses.
begin;

drop function public.get_checkout_status_by_token(uuid);

create function public.get_checkout_status_by_token(p_public_token uuid)
returns table (payment_status text)
language sql
stable
security definer
set search_path = ''
as $function$
  select o.payment_status::text
  from public.orders o
  where o.public_token = p_public_token;
$function$;

alter function public.get_checkout_status_by_token(uuid) owner to postgres;

revoke all on function public.get_checkout_status_by_token(uuid) from public;
grant execute on function public.get_checkout_status_by_token(uuid)
  to anon, authenticated, service_role;

commit;
