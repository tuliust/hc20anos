begin;

drop function public.get_checkout_status_by_token(uuid);

create function public.get_checkout_status_by_token(p_public_token uuid)
returns table (
  order_id uuid,
  payment_status text,
  payment_status_detail text,
  reservation_status text,
  expires_at timestamptz,
  paid_at timestamptz,
  total_amount_cents integer,
  currency_id text,
  ticket_count bigint
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    o.id,
    o.payment_status::text,
    o.payment_status_detail,
    o.reservation_status,
    o.expires_at,
    o.paid_at,
    o.total_amount_cents,
    o.currency_id,
    count(t.id)
  from public.orders o
  left join public.tickets t
    on t.order_id = o.id
   and coalesce(t.status, 'active') not in ('cancelled', 'refunded', 'chargeback', 'transferred')
  where o.public_token = p_public_token
  group by o.id;
$function$;

alter function public.get_checkout_status_by_token(uuid) owner to postgres;

grant execute on function public.get_checkout_status_by_token(uuid) to public;
grant execute on function public.get_checkout_status_by_token(uuid)
  to anon, authenticated, service_role;

commit;
