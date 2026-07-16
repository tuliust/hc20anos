-- ================================================================
-- Ticketing commerce functions
-- Funções server-side para lote, preços, convidados e reservas.
-- ================================================================

-- Lote vigente para um evento em um instante específico.
create or replace function public.get_current_ticket_lot(
  p_event_id uuid,
  p_at timestamptz default now()
)
returns public.ticket_lots
language sql
stable
security definer
set search_path = public
as $$
  select l
  from public.ticket_lots l
  where l.event_id = p_event_id
    and l.status <> 'archived'
    and (l.starts_at is null or l.starts_at <= p_at)
    and (l.ends_at is null or l.ends_at > p_at)
  order by l.sort_order desc
  limit 1;
$$;

-- Catálogo comercial vigente. Valores sempre são obtidos do banco.
create or replace function public.get_current_ticket_catalog(
  p_event_id uuid,
  p_at timestamptz default now()
)
returns table (
  lot_id uuid,
  lot_code text,
  lot_name text,
  lot_starts_at timestamptz,
  lot_ends_at timestamptz,
  ticket_type_id uuid,
  product_code text,
  product_name text,
  description text,
  participant_type text,
  package_kind text,
  included_people_count integer,
  metadata_json jsonb,
  price_cents integer
)
language sql
stable
security definer
set search_path = public
as $$
  with current_lot as (
    select * from public.get_current_ticket_lot(p_event_id, p_at)
  )
  select
    l.id,
    l.code,
    l.name,
    l.starts_at,
    l.ends_at,
    tt.id,
    tt.product_code,
    tt.name,
    tt.description,
    tt.participant_type,
    tt.package_kind,
    tt.included_people_count,
    tt.metadata_json,
    lp.price_cents
  from current_lot l
  join public.ticket_lot_prices lp
    on lp.lot_id = l.id
   and lp.is_active = true
  join public.ticket_types tt
    on tt.id = lp.ticket_type_id
   and tt.status = 'open'
  order by
    case tt.product_code
      when 'simple' then 10
      when 'family_full' then 20
      when 'family_single_parent' then 30
      when 'additional_child' then 40
      when 'external_guest' then 50
      when 'extra_drinks' then 60
      when 'extra_barbecue' then 70
      else 100
    end;
$$;

-- Idade completa em uma data de referência. Usada para filhos de até 12 anos.
create or replace function public.age_on_date(
  p_birth_date date,
  p_reference_date date
)
returns integer
language sql
immutable
strict
as $$
  select extract(year from age(p_reference_date, p_birth_date))::integer;
$$;

-- Quantidade de convidados externos aprovados vinculados ao ex-aluno.
create or replace function public.count_approved_external_guests(
  p_event_id uuid,
  p_sponsor_person_id uuid
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.guest_approval_requests r
  where r.event_id = p_event_id
    and r.sponsor_person_id = p_sponsor_person_id
    and r.status = 'approved';
$$;

-- Aprovação transacional de convidado. O limite é aplicado no backend/banco,
-- evitando duas aprovações concorrentes acima do máximo de seis.
create or replace function public.decide_guest_approval_request(
  p_request_id uuid,
  p_decision text,
  p_decided_by_user_id uuid,
  p_notes text default null
)
returns public.guest_approval_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.guest_approval_requests;
  v_sponsor_user_id uuid;
  v_approved_count integer;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid_guest_decision' using errcode = '22023';
  end if;

  select r.*
    into v_request
  from public.guest_approval_requests r
  where r.id = p_request_id
  for update;

  if not found then
    raise exception 'guest_request_not_found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'guest_request_already_decided' using errcode = '23505';
  end if;

  select p.claimed_by_user_id
    into v_sponsor_user_id
  from public.people p
  where p.id = v_request.sponsor_person_id;

  if v_sponsor_user_id is distinct from p_decided_by_user_id then
    raise exception 'guest_request_forbidden' using errcode = '42501';
  end if;

  if p_decision = 'approved' then
    -- Serializa aprovações do mesmo patrocinador.
    perform pg_advisory_xact_lock(hashtextextended(v_request.event_id::text || ':' || v_request.sponsor_person_id::text, 0));

    select public.count_approved_external_guests(v_request.event_id, v_request.sponsor_person_id)
      into v_approved_count;

    if v_approved_count >= 6 then
      raise exception 'sponsor_guest_limit_reached' using errcode = '23514';
    end if;
  end if;

  update public.guest_approval_requests
  set status = p_decision,
      decided_at = now(),
      decided_by_user_id = p_decided_by_user_id,
      decision_notes = nullif(btrim(p_notes), ''),
      updated_at = now()
  where id = p_request_id
  returning * into v_request;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata_json)
  values (
    p_decided_by_user_id,
    'guest_request_' || p_decision,
    'guest_approval_requests',
    p_request_id,
    jsonb_build_object(
      'guest_user_id', v_request.guest_user_id,
      'sponsor_person_id', v_request.sponsor_person_id
    )
  );

  return v_request;
end;
$$;

-- Libera reservas vencidas. Não altera pedidos já aprovados.
create or replace function public.release_expired_ticket_reservations(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  with expired as (
    update public.orders
    set payment_status = case
          when payment_status in ('pending', 'in_process') then 'expired'
          else payment_status
        end,
        reservation_status = 'expired',
        reservation_released_at = coalesce(reservation_released_at, p_now),
        updated_at = p_now
    where expires_at is not null
      and expires_at <= p_now
      and reservation_status = 'active'
      and payment_status in ('pending', 'in_process')
    returning id
  )
  select count(*)::integer into v_count from expired;

  update public.order_participants op
  set status = 'expired',
      updated_at = p_now
  where op.status = 'reserved'
    and exists (
      select 1
      from public.orders o
      where o.id = op.order_id
        and o.reservation_status = 'expired'
    );

  update public.payment_preferences pp
  set status = 'expired',
      updated_at = p_now
  where pp.status = 'active'
    and (
      (pp.expires_at is not null and pp.expires_at <= p_now)
      or exists (
        select 1
        from public.orders o
        where o.id = pp.order_id
          and o.reservation_status = 'expired'
      )
    );

  return v_count;
end;
$$;

-- Consulta segura do status de checkout por token público.
create or replace function public.get_checkout_status_by_token(
  p_public_token uuid
)
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
as $$
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
$$;

-- Minimal public grants. Mutating functions remain authenticated and validate
-- ownership internally. Administrative/service-role callers bypass RLS.
grant execute on function public.get_current_ticket_lot(uuid, timestamptz) to anon, authenticated;
grant execute on function public.get_current_ticket_catalog(uuid, timestamptz) to anon, authenticated;
grant execute on function public.age_on_date(date, date) to anon, authenticated;
grant execute on function public.count_approved_external_guests(uuid, uuid) to authenticated;
grant execute on function public.decide_guest_approval_request(uuid, text, uuid, text) to authenticated;
grant execute on function public.get_checkout_status_by_token(uuid) to anon, authenticated;
revoke execute on function public.release_expired_ticket_reservations(timestamptz) from public, anon, authenticated;

notify pgrst, 'reload schema';
