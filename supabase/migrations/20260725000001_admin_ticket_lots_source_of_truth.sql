-- ================================================================
-- Admin de lotes como fonte única de preços do catálogo público.
-- ================================================================

-- Um lote encerrado não pode voltar a ser selecionado pelo catálogo vigente.
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
    and l.status in ('scheduled', 'open')
    and (l.starts_at is null or l.starts_at <= p_at)
    and (l.ends_at is null or l.ends_at > p_at)
  order by
    case when l.status = 'open' then 0 else 1 end,
    l.sort_order desc
  limit 1;
$$;

-- Catálogo público expandido. Home, página de ingressos e checkout podem
-- consumir a mesma combinação de produto, lote e preço.
create or replace function public.get_public_ticket_catalog(
  p_event_id uuid,
  p_at timestamptz default now()
)
returns table (
  lot_id uuid,
  lot_code text,
  lot_name text,
  lot_starts_at timestamptz,
  lot_ends_at timestamptz,
  lot_capacity integer,
  ticket_type_id uuid,
  product_code text,
  product_name text,
  description text,
  participant_type text,
  package_kind text,
  included_people_count integer,
  metadata_json jsonb,
  price_cents integer,
  ticket_status text,
  available_quantity integer,
  sold_quantity integer
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
    l.capacity,
    tt.id,
    tt.product_code,
    tt.name,
    tt.description,
    tt.participant_type,
    tt.package_kind,
    tt.included_people_count,
    tt.metadata_json,
    lp.price_cents,
    tt.status::text,
    tt.available_quantity,
    coalesce(tt.sold_quantity, 0)
  from current_lot l
  join public.ticket_lot_prices lp
    on lp.lot_id = l.id
   and lp.is_active = true
  join public.ticket_types tt
    on tt.id = lp.ticket_type_id
   and tt.status in ('open', 'sold_out')
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
    end,
    tt.name;
$$;

create or replace function public.admin_get_ticket_lots(
  p_event_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_products jsonb;
  v_lots jsonb;
begin
  if not exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
      and a.role in ('superadmin', 'admin')
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(row_to_json(product_row)::jsonb order by product_row.sort_order, product_row.name), '[]'::jsonb)
    into v_products
  from (
    select
      tt.id,
      tt.product_code,
      tt.name,
      tt.description,
      tt.status::text as status,
      tt.available_quantity,
      coalesce(tt.sold_quantity, 0) as sold_quantity,
      case tt.product_code
        when 'simple' then 10
        when 'family_full' then 20
        when 'family_single_parent' then 30
        when 'additional_child' then 40
        when 'external_guest' then 50
        when 'extra_drinks' then 60
        when 'extra_barbecue' then 70
        else 100
      end as sort_order
    from public.ticket_types tt
    where tt.event_id = p_event_id
    order by sort_order, tt.name
  ) product_row;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'event_id', l.event_id,
      'code', l.code,
      'name', l.name,
      'sort_order', l.sort_order,
      'starts_at', l.starts_at,
      'ends_at', l.ends_at,
      'capacity', l.capacity,
      'status', l.status,
      'prices', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'ticket_type_id', lp.ticket_type_id,
            'price_cents', lp.price_cents,
            'is_active', lp.is_active
          )
          order by tt.name
        )
        from public.ticket_lot_prices lp
        join public.ticket_types tt on tt.id = lp.ticket_type_id
        where lp.lot_id = l.id
      ), '[]'::jsonb)
    )
    order by l.sort_order, l.starts_at nulls first
  ), '[]'::jsonb)
    into v_lots
  from public.ticket_lots l
  where l.event_id = p_event_id;

  return jsonb_build_object(
    'event_id', p_event_id,
    'products', v_products,
    'lots', v_lots
  );
end;
$$;

create or replace function public.admin_upsert_ticket_lot(
  p_lot_id uuid,
  p_event_id uuid,
  p_code text,
  p_name text,
  p_sort_order integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_capacity integer,
  p_status text,
  p_prices jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot_id uuid;
  v_price jsonb;
  v_ticket_type_id uuid;
  v_price_cents integer;
  v_is_active boolean;
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
      and a.role in ('superadmin', 'admin')
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if nullif(btrim(p_name), '') is null then
    raise exception 'lot_name_required' using errcode = '22023';
  end if;

  if nullif(btrim(p_code), '') is null or btrim(p_code) !~ '^[a-z0-9][a-z0-9_-]*$' then
    raise exception 'invalid_lot_code' using errcode = '22023';
  end if;

  if p_sort_order is null or p_sort_order < 0 then
    raise exception 'invalid_lot_sort_order' using errcode = '22023';
  end if;

  if p_capacity is not null and p_capacity < 0 then
    raise exception 'invalid_lot_capacity' using errcode = '22023';
  end if;

  if p_status not in ('scheduled', 'open', 'closed', 'archived') then
    raise exception 'invalid_lot_status' using errcode = '22023';
  end if;

  if p_ends_at is not null and p_starts_at is not null and p_ends_at <= p_starts_at then
    raise exception 'lot_end_must_be_after_start' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_prices, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_lot_prices' using errcode = '22023';
  end if;

  if p_status = 'open' and exists (
    select 1
    from public.ticket_lots l
    where l.event_id = p_event_id
      and l.status = 'open'
      and (p_lot_id is null or l.id <> p_lot_id)
  ) then
    raise exception 'another_open_lot_exists' using errcode = '23514';
  end if;

  if p_lot_id is null then
    insert into public.ticket_lots (
      event_id, code, name, sort_order, starts_at, ends_at, capacity, status
    ) values (
      p_event_id,
      btrim(p_code),
      btrim(p_name),
      p_sort_order,
      p_starts_at,
      p_ends_at,
      p_capacity,
      p_status
    )
    returning id into v_lot_id;
  else
    update public.ticket_lots
    set code = btrim(p_code),
        name = btrim(p_name),
        sort_order = p_sort_order,
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        capacity = p_capacity,
        status = p_status,
        updated_at = now()
    where id = p_lot_id
      and event_id = p_event_id
    returning id into v_lot_id;

    if v_lot_id is null then
      raise exception 'ticket_lot_not_found' using errcode = 'P0002';
    end if;
  end if;

  update public.ticket_lot_prices
  set is_active = false,
      updated_at = now()
  where lot_id = v_lot_id;

  for v_price in
    select value
    from jsonb_array_elements(coalesce(p_prices, '[]'::jsonb)) as price_rows(value)
  loop
    v_ticket_type_id := nullif(v_price ->> 'ticket_type_id', '')::uuid;
    v_price_cents := coalesce((v_price ->> 'price_cents')::integer, 0);
    v_is_active := coalesce((v_price ->> 'is_active')::boolean, false);

    if v_ticket_type_id is null or not exists (
      select 1
      from public.ticket_types tt
      where tt.id = v_ticket_type_id
        and tt.event_id = p_event_id
    ) then
      raise exception 'invalid_ticket_type_for_lot' using errcode = '23503';
    end if;

    if v_price_cents < 0 then
      raise exception 'invalid_ticket_lot_price' using errcode = '22023';
    end if;

    insert into public.ticket_lot_prices (
      lot_id, ticket_type_id, price_cents, is_active
    ) values (
      v_lot_id, v_ticket_type_id, v_price_cents, v_is_active
    )
    on conflict (lot_id, ticket_type_id)
    do update set
      price_cents = excluded.price_cents,
      is_active = excluded.is_active,
      updated_at = now();
  end loop;

  if p_status = 'open' and not exists (
    select 1
    from public.ticket_lot_prices lp
    where lp.lot_id = v_lot_id
      and lp.is_active = true
  ) then
    raise exception 'open_lot_requires_active_price' using errcode = '23514';
  end if;

  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, metadata_json
  ) values (
    auth.uid(),
    case when p_lot_id is null then 'create_ticket_lot' else 'update_ticket_lot' end,
    'ticket_lots',
    v_lot_id,
    jsonb_build_object(
      'event_id', p_event_id,
      'code', btrim(p_code),
      'status', p_status,
      'prices_count', jsonb_array_length(coalesce(p_prices, '[]'::jsonb))
    )
  );

  v_result := public.admin_get_ticket_lots(p_event_id);
  return v_result || jsonb_build_object('saved_lot_id', v_lot_id);
end;
$$;

create or replace function public.admin_archive_ticket_lot(
  p_lot_id uuid,
  p_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
      and a.role in ('superadmin', 'admin')
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  update public.ticket_lots
  set status = 'archived',
      updated_at = now()
  where id = p_lot_id
    and event_id = p_event_id;

  if not found then
    raise exception 'ticket_lot_not_found' using errcode = 'P0002';
  end if;

  update public.ticket_lot_prices
  set is_active = false,
      updated_at = now()
  where lot_id = p_lot_id;

  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, metadata_json
  ) values (
    auth.uid(),
    'archive_ticket_lot',
    'ticket_lots',
    p_lot_id,
    jsonb_build_object('event_id', p_event_id)
  );

  v_result := public.admin_get_ticket_lots(p_event_id);
  return v_result || jsonb_build_object('archived_lot_id', p_lot_id);
end;
$$;

revoke all on function public.get_public_ticket_catalog(uuid, timestamptz) from public;
revoke all on function public.admin_get_ticket_lots(uuid) from public, anon;
revoke all on function public.admin_upsert_ticket_lot(uuid, uuid, text, text, integer, timestamptz, timestamptz, integer, text, jsonb) from public, anon;
revoke all on function public.admin_archive_ticket_lot(uuid, uuid) from public, anon;

grant execute on function public.get_public_ticket_catalog(uuid, timestamptz) to anon, authenticated;
grant execute on function public.admin_get_ticket_lots(uuid) to authenticated;
grant execute on function public.admin_upsert_ticket_lot(uuid, uuid, text, text, integer, timestamptz, timestamptz, integer, text, jsonb) to authenticated;
grant execute on function public.admin_archive_ticket_lot(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
