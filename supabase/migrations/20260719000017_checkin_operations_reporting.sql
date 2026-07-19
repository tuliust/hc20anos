-- Indicadores, trilha operacional e exportação do check-in.

create or replace function public.get_checkin_operation_metrics()
returns table (
  total_tickets bigint,
  active_tickets bigint,
  checked_in_tickets bigint,
  pending_tickets bigint,
  invalid_tickets bigint,
  checkin_rate numeric,
  vouchers_required bigint,
  vouchers_delivered bigint,
  last_checkin_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint,
    count(*) filter (where t.status in ('active','used'))::bigint,
    count(*) filter (where t.checked_in)::bigint,
    count(*) filter (where t.status = 'active' and not t.checked_in)::bigint,
    count(*) filter (where t.status not in ('active','used'))::bigint,
    case when count(*) filter (where t.status in ('active','used')) = 0 then 0
      else round(100.0 * count(*) filter (where t.checked_in) / count(*) filter (where t.status in ('active','used')), 2)
    end,
    count(distinct t.id) filter (where exists (select 1 from public.participant_extras pe where pe.order_participant_id=t.order_participant_id))::bigint,
    count(distinct t.id) filter (where exists (select 1 from public.participant_extras pe where pe.order_participant_id=t.order_participant_id and pe.physical_vouchers_delivered_at is not null))::bigint,
    max(t.checked_in_at)
  from public.tickets t
  where exists (
    select 1 from public.admin_users a
    where a.user_id=auth.uid() and a.role in ('superadmin','admin','checkin_staff')
  );
$$;

create or replace function public.get_checkin_activity(p_limit integer default 30)
returns table (
  event_id uuid,
  ticket_id uuid,
  attendee_name text,
  action text,
  operator_user_id uuid,
  operator_email text,
  notes text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select ce.id, ce.ticket_id, t.attendee_name, ce.action, ce.operator_user_id,
    u.email::text, ce.notes, ce.created_at
  from public.checkin_events ce
  join public.tickets t on t.id=ce.ticket_id
  left join auth.users u on u.id=ce.operator_user_id
  where exists (
    select 1 from public.admin_users a
    where a.user_id=auth.uid() and a.role in ('superadmin','admin','checkin_staff')
  )
  order by ce.created_at desc
  limit least(greatest(coalesce(p_limit,30),1),200);
$$;

create or replace function public.export_checkin_report()
returns table (
  attendee_name text,
  attendee_email text,
  qr_code text,
  ticket_status text,
  checked_in boolean,
  checked_in_at timestamptz,
  checked_in_by_email text,
  vouchers_delivered boolean,
  order_id uuid
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select t.attendee_name, t.attendee_email, t.qr_code, t.status::text, t.checked_in,
    t.checked_in_at, u.email::text,
    exists(select 1 from public.participant_extras pe where pe.order_participant_id=t.order_participant_id and pe.physical_vouchers_delivered_at is not null),
    t.order_id
  from public.tickets t
  left join public.admin_users au on au.id=t.checked_in_by_admin_id
  left join auth.users u on u.id=au.user_id
  where exists (
    select 1 from public.admin_users a
    where a.user_id=auth.uid() and a.role in ('superadmin','admin')
  )
  order by t.attendee_name;
$$;

revoke all on function public.get_checkin_operation_metrics() from public, anon;
revoke all on function public.get_checkin_activity(integer) from public, anon;
revoke all on function public.export_checkin_report() from public, anon;
grant execute on function public.get_checkin_operation_metrics() to authenticated;
grant execute on function public.get_checkin_activity(integer) to authenticated;
grant execute on function public.export_checkin_report() to authenticated;

notify pgrst, 'reload schema';
