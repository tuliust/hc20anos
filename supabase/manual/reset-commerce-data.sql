-- ================================================================
-- MANUAL ONLY: guarded commerce reset for one event
-- ================================================================
-- This file is intentionally outside supabase/migrations.
-- It must never be executed by supabase db push.
--
-- Before running, open a transaction and set BOTH values explicitly:
--
--   begin;
--   set local app.confirm_commerce_reset = 'RESET_ONE_EVENT_COMMERCE';
--   set local app.commerce_reset_event_id = '00000000-0000-0000-0000-000000000001';
--
-- If the event has approved orders, also set:
--
--   set local app.allow_approved_order_reset = 'YES';
--
-- Then execute the remainder of this file and review the returned counts before
-- committing. Use ROLLBACK instead of COMMIT whenever the result is unexpected.

-- Do not add BEGIN here: the operator must start the transaction and set the
-- local confirmation values before this script can pass the guard.

do $$
declare
  v_confirmation text := current_setting('app.confirm_commerce_reset', true);
  v_event_setting text := current_setting('app.commerce_reset_event_id', true);
  v_event_id uuid;
  v_approved_orders bigint;
begin
  if v_confirmation is distinct from 'RESET_ONE_EVENT_COMMERCE' then
    raise exception 'COMMERCE_RESET_CONFIRMATION_REQUIRED';
  end if;

  begin
    v_event_id := v_event_setting::uuid;
  exception
    when others then
      raise exception 'COMMERCE_RESET_EVENT_ID_REQUIRED';
  end;

  if not exists (select 1 from public.events where id = v_event_id) then
    raise exception 'COMMERCE_RESET_EVENT_NOT_FOUND:%', v_event_id;
  end if;

  select count(*)
  into v_approved_orders
  from public.orders
  where event_id = v_event_id
    and payment_status::text = 'approved';

  if v_approved_orders > 0
     and current_setting('app.allow_approved_order_reset', true) is distinct from 'YES' then
    raise exception 'COMMERCE_RESET_HAS_APPROVED_ORDERS:%', v_approved_orders;
  end if;
end
$$;

-- Snapshot the scope before deletion. Review these counts in the SQL result.
with target_orders as (
  select id from public.orders
  where event_id = current_setting('app.commerce_reset_event_id')::uuid
)
select 'orders'::text as entity, count(*)::bigint as row_count
from public.orders where id in (select id from target_orders)
union all
select 'tickets', count(*) from public.tickets where order_id in (select id from target_orders)
union all
select 'order_participants', count(*) from public.order_participants where order_id in (select id from target_orders)
union all
select 'participant_extras', count(*) from public.participant_extras where order_id in (select id from target_orders)
union all
select 'payment_preferences', count(*) from public.payment_preferences where order_id in (select id from target_orders)
union all
select 'payment_events', count(*) from public.payment_events where order_id in (select id from target_orders)
union all
select 'refund_requests', count(*) from public.refund_requests where order_id in (select id from target_orders)
union all
select 'guest_approval_requests', count(*) from public.guest_approval_requests
where event_id = current_setting('app.commerce_reset_event_id')::uuid
order by entity;

create temporary table _commerce_reset_target_orders (
  id uuid primary key
) on commit drop;

insert into _commerce_reset_target_orders (id)
select id
from public.orders
where event_id = current_setting('app.commerce_reset_event_id')::uuid;

delete from public.ticket_transfers tr
where tr.ticket_id in (
  select t.id from public.tickets t
  join _commerce_reset_target_orders target on target.id = t.order_id
);

delete from public.refund_requests rr
where rr.order_id in (select id from _commerce_reset_target_orders)
   or rr.ticket_id in (
     select t.id from public.tickets t
     join _commerce_reset_target_orders target on target.id = t.order_id
   );

delete from public.notification_jobs nj
where nj.order_id in (select id from _commerce_reset_target_orders)
   or nj.ticket_id in (
     select t.id from public.tickets t
     join _commerce_reset_target_orders target on target.id = t.order_id
   );

delete from public.participant_extras
where order_id in (select id from _commerce_reset_target_orders);

delete from public.payment_preferences
where order_id in (select id from _commerce_reset_target_orders);

delete from public.payment_events
where order_id in (select id from _commerce_reset_target_orders);

delete from public.tickets
where order_id in (select id from _commerce_reset_target_orders);

delete from public.order_participants
where order_id in (select id from _commerce_reset_target_orders);

delete from public.orders
where id in (select id from _commerce_reset_target_orders);

delete from public.guest_approval_requests
where event_id = current_setting('app.commerce_reset_event_id')::uuid;

select public.refresh_ticket_type_sold_quantity(
  current_setting('app.commerce_reset_event_id')::uuid
);

-- Intentionally no COMMIT. Review the output, then run COMMIT or ROLLBACK
-- manually in the same SQL session.
