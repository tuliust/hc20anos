-- Automação de reservas e ciclo de lotes comerciais.
-- Executa no banco para não depender de acessos ao checkout.

create extension if not exists pg_cron;

create or replace function public.sync_ticket_lot_statuses(
  p_now timestamptz default now()
)
returns table(event_id uuid, active_lot_id uuid, active_lot_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_lot record;
  v_reserved integer;
  v_next record;
begin
  for v_event in
    select distinct l.event_id
    from public.ticket_lots l
    where l.status <> 'archived'
  loop
    -- Estado temporal básico.
    update public.ticket_lots
    set status = case
      when ends_at is not null and ends_at <= p_now then 'closed'
      when starts_at is not null and starts_at > p_now then 'scheduled'
      else status
    end,
    updated_at = p_now
    where ticket_lots.event_id = v_event.event_id
      and status <> 'archived';

    select l.* into v_lot
    from public.ticket_lots l
    where l.event_id = v_event.event_id
      and l.status <> 'archived'
      and (l.starts_at is null or l.starts_at <= p_now)
      and (l.ends_at is null or l.ends_at > p_now)
    order by l.sort_order desc
    limit 1;

    if v_lot.id is not null and v_lot.capacity is not null then
      select coalesce(sum(o.quantity), 0)::integer into v_reserved
      from public.orders o
      where o.lot_id = v_lot.id
        and (
          o.payment_status = 'approved'
          or (
            o.payment_status in ('pending', 'in_process')
            and o.reservation_status = 'active'
            and (o.expires_at is null or o.expires_at > p_now)
          )
        );

      if v_reserved >= v_lot.capacity then
        update public.ticket_lots
        set status = 'closed', updated_at = p_now
        where id = v_lot.id;

        select l.* into v_next
        from public.ticket_lots l
        where l.event_id = v_event.event_id
          and l.status <> 'archived'
          and l.sort_order > v_lot.sort_order
          and (l.ends_at is null or l.ends_at > p_now)
        order by l.sort_order
        limit 1;

        if v_next.id is not null then
          v_lot := v_next;
        else
          v_lot := null;
        end if;
      end if;
    end if;

    update public.ticket_lots
    set status = case when id = v_lot.id then 'open'
      when status = 'open' then
        case when starts_at is not null and starts_at > p_now then 'scheduled' else 'closed' end
      else status end,
      updated_at = p_now
    where ticket_lots.event_id = v_event.event_id
      and status <> 'archived';

    event_id := v_event.event_id;
    active_lot_id := v_lot.id;
    active_lot_code := v_lot.code;
    return next;
  end loop;
end;
$$;

create or replace function public.run_commerce_automation(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired integer := 0;
  v_lots jsonb;
begin
  select public.release_expired_ticket_reservations(p_now) into v_expired;

  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
  into v_lots
  from public.sync_ticket_lot_statuses(p_now) s;

  return jsonb_build_object(
    'ran_at', p_now,
    'expired_reservations', v_expired,
    'lots', v_lots
  );
end;
$$;

revoke all on function public.sync_ticket_lot_statuses(timestamptz) from public, anon, authenticated;
revoke all on function public.run_commerce_automation(timestamptz) from public, anon, authenticated;

-- Recria o agendamento de forma idempotente.
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'hc20-commerce-automation';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'hc20-commerce-automation',
    '* * * * *',
    $cron$select public.run_commerce_automation(now());$cron$
  );
end $$;

select public.run_commerce_automation(now());

notify pgrst, 'reload schema';
