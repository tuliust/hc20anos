-- ================================================================
-- Admin reporting aligned with the Mercado Pago commerce model
-- HC 20 Anos
-- ================================================================

-- The admin UI already consumes get_admin_orders() and get_event_reports().
-- Replace both RPCs so /admin, /admin/tickets?tab=orders and /admin/reports
-- use the transactional commerce tables introduced in the Mercado Pago flow.

-- ----------------------------------------------------------------
-- Admin orders: source of truth is public.orders.
-- ----------------------------------------------------------------

drop function if exists public.get_admin_orders(text);

create function public.get_admin_orders(p_status text default null)
returns setof public.orders
language sql
security definer
stable
set search_path = public
as $$
  select o.*
  from public.orders o
  where public.is_admin()
    and (p_status is null or o.payment_status::text = p_status)
  order by o.created_at desc;
$$;

revoke all on function public.get_admin_orders(text) from public, anon;
grant execute on function public.get_admin_orders(text) to authenticated, service_role;

-- ----------------------------------------------------------------
-- Keep legacy ticket_types.sold_quantity synchronized with real,
-- approved tickets so the existing dashboard chart no longer shows
-- seed/demo sales.
-- ----------------------------------------------------------------

create or replace function public.refresh_ticket_type_sold_quantity(
  p_event_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  update public.ticket_types tt
     set sold_quantity = coalesce(src.sold_count, 0),
         updated_at = now()
    from (
      select
        tt2.id as ticket_type_id,
        count(t.id)::integer as sold_count
      from public.ticket_types tt2
      left join public.tickets t
        on t.ticket_type_id = tt2.id
      left join public.orders o
        on o.id = t.order_id
       and o.payment_status::text = 'approved'
      where p_event_id is null or tt2.event_id = p_event_id
      group by tt2.id
    ) src
   where tt.id = src.ticket_type_id
     and tt.sold_quantity is distinct from coalesce(src.sold_count, 0);

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

revoke all on function public.refresh_ticket_type_sold_quantity(uuid) from public, anon, authenticated;
grant execute on function public.refresh_ticket_type_sold_quantity(uuid) to service_role;

create or replace function public.sync_ticket_type_sold_quantity_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_ticket_type_sold_quantity(
    coalesce(
      (select event_id from public.orders where id = coalesce(new.order_id, old.order_id)),
      (select event_id from public.ticket_types where id = coalesce(new.ticket_type_id, old.ticket_type_id))
    )
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists tickets_sync_ticket_type_sales on public.tickets;
create trigger tickets_sync_ticket_type_sales
after insert or update of order_id, ticket_type_id or delete
on public.tickets
for each row execute function public.sync_ticket_type_sold_quantity_trigger();

create or replace function public.sync_order_payment_sales_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.payment_status is distinct from new.payment_status then
    perform public.refresh_ticket_type_sold_quantity(new.event_id);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_sync_ticket_type_sales on public.orders;
create trigger orders_sync_ticket_type_sales
after update of payment_status
on public.orders
for each row execute function public.sync_order_payment_sales_trigger();

-- Initial cleanup of demo/legacy counters.
select public.refresh_ticket_type_sold_quantity(null);

-- ----------------------------------------------------------------
-- Mercado Pago-aware event report.
-- All values remain numeric because the current reports UI renders the
-- JSON object generically and formats keys containing "cents" as BRL.
-- ----------------------------------------------------------------

create or replace function public.get_event_reports(p_event_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    -- Commercial totals
    'tickets_sold', coalesce((
      select count(*)
      from public.tickets t
      join public.orders o on o.id = t.order_id
      where o.event_id = p_event_id
        and o.payment_status::text = 'approved'
        and coalesce(t.status, 'valid') not in ('cancelled', 'refunded')
    ), 0),
    'participants_approved', coalesce((
      select count(*)
      from public.order_participants op
      join public.orders o on o.id = op.order_id
      where o.event_id = p_event_id
        and o.payment_status::text = 'approved'
        and op.status in ('active', 'reserved')
    ), 0),
    'revenue_cents', coalesce((
      select sum(o.total_amount_cents)
      from public.orders o
      where o.event_id = p_event_id
        and o.payment_status::text = 'approved'
    ), 0),
    'subtotal_cents', coalesce((
      select sum(o.subtotal_amount_cents)
      from public.orders o
      where o.event_id = p_event_id
        and o.payment_status::text = 'approved'
    ), 0),
    'extras_revenue_cents', coalesce((
      select sum(o.extras_amount_cents)
      from public.orders o
      where o.event_id = p_event_id
        and o.payment_status::text = 'approved'
    ), 0),
    'average_order_cents', coalesce((
      select round(avg(o.total_amount_cents))::bigint
      from public.orders o
      where o.event_id = p_event_id
        and o.payment_status::text = 'approved'
    ), 0),

    -- Payment lifecycle
    'orders_total', coalesce((select count(*) from public.orders where event_id = p_event_id), 0),
    'orders_pending', coalesce((
      select count(*) from public.orders
      where event_id = p_event_id
        and payment_status::text in ('pending', 'in_process', 'authorized')
    ), 0),
    'orders_approved', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_status::text = 'approved'), 0),
    'orders_rejected', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_status::text = 'rejected'), 0),
    'orders_cancelled', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_status::text = 'cancelled'), 0),
    'orders_expired', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_status::text = 'expired'), 0),
    'orders_refunded', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_status::text = 'refunded'), 0),
    'orders_charged_back', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_status::text = 'charged_back'), 0),
    'pix_orders', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_type = 'bank_transfer'), 0),
    'card_orders', coalesce((select count(*) from public.orders where event_id = p_event_id and payment_type in ('credit_card', 'debit_card')), 0),
    'installments_total', coalesce((select sum(coalesce(installments, 0)) from public.orders where event_id = p_event_id and payment_status::text = 'approved'), 0),

    -- Reservation and preference health
    'reservations_active', coalesce((select count(*) from public.orders where event_id = p_event_id and reservation_status = 'active'), 0),
    'reservations_converted', coalesce((select count(*) from public.orders where event_id = p_event_id and reservation_status = 'converted'), 0),
    'reservations_expired', coalesce((select count(*) from public.orders where event_id = p_event_id and reservation_status = 'expired'), 0),
    'preferences_active', coalesce((
      select count(*)
      from public.payment_preferences pp
      join public.orders o on o.id = pp.order_id
      where o.event_id = p_event_id and pp.status = 'active'
    ), 0),
    'preferences_expired', coalesce((
      select count(*)
      from public.payment_preferences pp
      join public.orders o on o.id = pp.order_id
      where o.event_id = p_event_id and pp.status = 'expired'
    ), 0),

    -- Webhook and notification operations
    'payment_events_total', coalesce((
      select count(*)
      from public.payment_events pe
      join public.orders o on o.id = pe.order_id
      where o.event_id = p_event_id
    ), 0),
    'payment_events_failed', coalesce((
      select count(*)
      from public.payment_events pe
      join public.orders o on o.id = pe.order_id
      where o.event_id = p_event_id
        and pe.processing_status in ('failed', 'error')
    ), 0),
    'notification_jobs_pending', coalesce((
      select count(*)
      from public.notification_jobs nj
      join public.orders o on o.id = nj.order_id
      where o.event_id = p_event_id and nj.status in ('pending', 'processing')
    ), 0),
    'notification_jobs_failed', coalesce((
      select count(*)
      from public.notification_jobs nj
      join public.orders o on o.id = nj.order_id
      where o.event_id = p_event_id and nj.status in ('failed', 'cancelled')
    ), 0),

    -- Extras, refunds and transfers
    'drinks_packages', coalesce((
      select sum(pe.quantity)
      from public.participant_extras pe
      join public.orders o on o.id = pe.order_id
      where o.event_id = p_event_id and o.payment_status::text = 'approved' and pe.extra_type = 'drinks'
    ), 0),
    'barbecue_packages', coalesce((
      select sum(pe.quantity)
      from public.participant_extras pe
      join public.orders o on o.id = pe.order_id
      where o.event_id = p_event_id and o.payment_status::text = 'approved' and pe.extra_type = 'barbecue'
    ), 0),
    'vouchers_delivered', coalesce((
      select count(*)
      from public.participant_extras pe
      join public.orders o on o.id = pe.order_id
      where o.event_id = p_event_id and pe.physical_vouchers_delivered_at is not null
    ), 0),
    'refund_requests_open', coalesce((
      select count(*)
      from public.refund_requests rr
      join public.orders o on o.id = rr.order_id
      where o.event_id = p_event_id and rr.status in ('requested', 'under_review', 'approved', 'processing')
    ), 0),
    'refund_amount_cents', coalesce((
      select sum(rr.refund_amount_cents)
      from public.refund_requests rr
      join public.orders o on o.id = rr.order_id
      where o.event_id = p_event_id and rr.status = 'refunded'
    ), 0),
    'transfers_open', coalesce((
      select count(*)
      from public.ticket_transfers tr
      join public.tickets t on t.id = tr.ticket_id
      join public.orders o on o.id = t.order_id
      where o.event_id = p_event_id and tr.status in ('requested', 'accepted', 'processing')
    ), 0),

    -- Check-in
    'checkins_done', coalesce((
      select count(*)
      from public.tickets t
      join public.orders o on o.id = t.order_id
      where o.event_id = p_event_id and t.checked_in = true
    ), 0),
    'checkins_pending', coalesce((
      select count(*)
      from public.tickets t
      join public.orders o on o.id = t.order_id
      where o.event_id = p_event_id
        and o.payment_status::text = 'approved'
        and t.checked_in = false
    ), 0),

    -- Existing content/profile indicators retained
    'people_confirmed', coalesce((select count(*) from public.people where profile_status = 'confirmed'), 0),
    'people_claimed', coalesce((select count(*) from public.people where profile_status = 'claimed'), 0),
    'people_unclaimed', coalesce((select count(*) from public.people where profile_status = 'unclaimed'), 0),
    'photos_total', coalesce((select count(*) from public.photos where event_id = p_event_id), 0),
    'photos_approved', coalesce((select count(*) from public.photos where event_id = p_event_id and status = 'approved'), 0),
    'photos_pending', coalesce((select count(*) from public.photos where event_id = p_event_id and status = 'pending'), 0),
    'photos_rejected', coalesce((select count(*) from public.photos where event_id = p_event_id and status = 'rejected'), 0),
    'claims_pending', coalesce((select count(*) from public.profile_claims where status = 'pending'), 0),
    'disputes_pending', coalesce((select count(*) from public.profile_claim_disputes where status = 'pending'), 0),
    'removals_pending', coalesce((select count(*) from public.photo_removal_requests where status = 'pending'), 0)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_event_reports(uuid) from public, anon;
grant execute on function public.get_event_reports(uuid) to authenticated, service_role;

comment on function public.get_event_reports(uuid) is
  'Admin report sourced from Mercado Pago orders, participants, preferences, webhooks, tickets, extras, refunds, transfers and notification jobs.';
