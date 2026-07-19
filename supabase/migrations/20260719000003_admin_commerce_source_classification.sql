-- ================================================================
-- Classify legacy commerce records versus the Mercado Pago flow
-- ================================================================

-- Preserve the already validated Mercado Pago-aware implementations once.
do $$
begin
  if to_regprocedure('public.get_event_reports_mercado_pago_base(uuid)') is null
     and to_regprocedure('public.get_event_reports(uuid)') is not null then
    alter function public.get_event_reports(uuid)
      rename to get_event_reports_mercado_pago_base;
  end if;

  if to_regprocedure('public.get_admin_orders_mercado_pago_base(text)') is null
     and to_regprocedure('public.get_admin_orders(text)') is not null then
    alter function public.get_admin_orders(text)
      rename to get_admin_orders_mercado_pago_base;
  end if;
end $$;

create or replace function public.get_event_reports(p_event_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_base jsonb;
  v_source_metrics jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  v_base := public.get_event_reports_mercado_pago_base(p_event_id);

  select jsonb_build_object(
    'mercado_pago_orders_total', count(*) filter (where is_mp),
    'mercado_pago_orders_approved', count(*) filter (where is_mp and payment_status::text = 'approved'),
    'mercado_pago_revenue_cents', coalesce(sum(total_amount_cents) filter (where is_mp and payment_status::text = 'approved'), 0),
    'mercado_pago_tickets_sold', coalesce(sum(ticket_count) filter (where is_mp and payment_status::text = 'approved'), 0),
    'mercado_pago_participants', coalesce(sum(participant_count) filter (where is_mp), 0),
    'legacy_orders_total', count(*) filter (where not is_mp),
    'legacy_orders_approved', count(*) filter (where not is_mp and payment_status::text = 'approved'),
    'legacy_revenue_cents', coalesce(sum(total_amount_cents) filter (where not is_mp and payment_status::text = 'approved'), 0),
    'legacy_tickets_sold', coalesce(sum(ticket_count) filter (where not is_mp and payment_status::text = 'approved'), 0),
    'legacy_active_reservations', count(*) filter (
      where not is_mp
        and payment_status::text = 'approved'
        and reservation_status = 'active'
    ),
    'commerce_data_quality_alerts', count(*) filter (
      where (not is_mp and payment_status::text = 'approved' and reservation_status = 'active')
         or (is_mp and payment_status::text = 'approved' and participant_count = 0)
    )
  )
  into v_source_metrics
  from (
    select
      o.*,
      (
        o.payment_provider_preference_id is not null
        or o.payment_provider_order_id is not null
        or o.subtotal_amount_cents > 0
        or o.extras_amount_cents > 0
        or exists (select 1 from public.payment_preferences pp where pp.order_id = o.id)
        or exists (select 1 from public.payment_events pe where pe.order_id = o.id)
        or exists (select 1 from public.order_participants op where op.order_id = o.id)
      ) as is_mp,
      (select count(*) from public.tickets t where t.order_id = o.id)::integer as ticket_count,
      (select count(*) from public.order_participants op where op.order_id = o.id)::integer as participant_count
    from public.orders o
    where o.event_id = p_event_id
  ) classified;

  return coalesce(v_base, '{}'::jsonb) || coalesce(v_source_metrics, '{}'::jsonb);
end;
$$;

revoke all on function public.get_event_reports(uuid) from public, anon;
grant execute on function public.get_event_reports(uuid) to authenticated, service_role;

create or replace function public.get_admin_orders(p_status text default null)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_orders jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  v_orders := public.get_admin_orders_mercado_pago_base(p_status);

  return coalesce((
    select jsonb_agg(
      order_row || jsonb_build_object(
        'commerce_source', case
          when coalesce(order_row->>'payment_provider_preference_id', '') <> ''
            or coalesce(order_row->>'payment_provider_order_id', '') <> ''
            or coalesce((order_row->>'subtotal_amount_cents')::integer, 0) > 0
            or coalesce((order_row->>'extras_amount_cents')::integer, 0) > 0
            or coalesce((order_row->>'participant_count')::integer, 0) > 0
            or coalesce((order_row->>'webhook_events')::integer, 0) > 0
          then 'mercado_pago'
          else 'legacy'
        end,
        'data_quality_alert', case
          when coalesce(order_row->>'payment_status', '') = 'approved'
            and coalesce(order_row->>'reservation_status', '') = 'active'
            and coalesce((order_row->>'participant_count')::integer, 0) = 0
          then 'legacy_approved_with_active_reservation'
          else null
        end
      )
      order by order_row->>'created_at' desc
    )
    from jsonb_array_elements(coalesce(v_orders, '[]'::jsonb)) order_row
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.get_admin_orders(text) from public, anon;
grant execute on function public.get_admin_orders(text) to authenticated, service_role;

comment on function public.get_event_reports(uuid) is
  'Admin report with explicit legacy versus Mercado Pago commerce metrics.';

comment on function public.get_admin_orders(text) is
  'Admin orders enriched with commerce_source and data_quality_alert.';
