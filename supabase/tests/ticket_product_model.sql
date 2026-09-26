-- ================================================================
-- Contract checks for the current single-ticket product model.
-- ================================================================

begin;

set role postgres;

do $$
declare
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_codes text[];
  v_names text[];
  v_current_lot_id uuid;
  v_active_price_count integer;
  v_active_price integer;
  v_checkout_definition text;
  v_reference_at timestamptz := '2026-09-16 12:00:00-03'::timestamptz;
begin
  -- Em produção o evento está cancelado e o catálogo público deve estar vazio.
  select array_agg(c.product_code order by c.product_code),
         array_agg(c.product_name order by c.product_code)
    into v_codes, v_names
  from public.get_public_ticket_catalog(v_event_id, v_reference_at) c;

  if v_codes is not null or v_names is not null then
    raise exception 'Cancelled event must expose no public catalog: codes %, names %', v_codes, v_names;
  end if;

  if not exists (
    select 1 from public.events e
    where e.id = v_event_id
      and e.event_status = 'cancelled'
      and e.sales_status = 'closed'
  ) then
    raise exception 'Canonical event must remain cancelled with sales closed';
  end if;

  -- Reabre apenas dentro desta transação para continuar validando o modelo histórico.
  update public.events
  set event_status = 'published', sales_status = 'open'
  where id = v_event_id;

  -- A migration de produÃ§Ã£o usa now() no inÃ­cio do lote. Normalize a janela
  -- da fixture para que o replay continue vÃ¡lido depois do encerramento real.
  update public.ticket_lots
  set starts_at = v_reference_at - interval '1 day',
      ends_at = v_reference_at + interval '1 day'
  where event_id = v_event_id
    and status = 'open';

  select array_agg(c.product_code order by c.product_code),
         array_agg(c.product_name order by c.product_code)
    into v_codes, v_names
  from public.get_public_ticket_catalog(v_event_id, v_reference_at) c;

  if v_codes is distinct from array['simple']::text[] then
    raise exception 'Historical catalog must contain only the simple product when sales are explicitly reopened: %', v_codes;
  end if;

  if v_names is distinct from array['Ingresso']::text[] then
    raise exception 'Historical ticket name does not match the approved copy: %', v_names;
  end if;

  if exists (
    select 1
    from public.ticket_types tt
    where tt.event_id = v_event_id
      and coalesce(tt.product_code, '') <> 'simple'
      and tt.status <> 'closed'
  ) then
    raise exception 'Deprecated products remain open';
  end if;

  select l.id into v_current_lot_id
  from public.get_current_ticket_lot(v_event_id, v_reference_at) l
  limit 1;

  if v_current_lot_id is null then
    raise exception 'Current single lot is missing';
  end if;

  select count(*), max(lp.price_cents)
    into v_active_price_count, v_active_price
  from public.ticket_lot_prices lp
  join public.ticket_types tt on tt.id = lp.ticket_type_id
  where lp.lot_id = v_current_lot_id
    and lp.is_active
    and tt.status = 'open';

  if v_active_price_count <> 1 or v_active_price <> 12000 then
    raise exception 'Current lot must expose one active R$ 120 simple price: count %, price %', v_active_price_count, v_active_price;
  end if;

  if exists (
    select 1
    from public.ticket_lot_prices lp
    join public.ticket_types tt on tt.id = lp.ticket_type_id
    where lp.lot_id = v_current_lot_id
      and lp.is_active
      and tt.product_code <> 'simple'
  ) then
    raise exception 'Deprecated product price remains active in the current lot';
  end if;

  select lower(pg_get_functiondef(
    'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure
  )) into v_checkout_definition;

  if position('p_product_code <> ''simple''' in v_checkout_definition) = 0 then
    raise exception 'Checkout does not restrict the primary product to simple';
  end if;
  if position('if v_age<=8 then v_unit_price:=0' in v_checkout_definition) = 0
     or position('elsif v_age<=12 then v_unit_price:=v_base_price/2' in v_checkout_definition) = 0 then
    raise exception 'Checkout does not enforce current child age bands';
  end if;
  if position('extras_not_supported' in v_checkout_definition) = 0 then
    raise exception 'Checkout does not reject legacy extras';
  end if;

  if has_function_privilege('authenticated','public.create_guest_approval_request(uuid,text,text,text,text)','EXECUTE') then
    raise exception 'Legacy external guest approval flow is still executable by authenticated users';
  end if;

  if exists (
    select 1
    from pg_trigger t
    where t.tgrelid = 'public.order_participants'::regclass
      and t.tgname = 'order_participants_guest_buyer_authorization'
      and not t.tgisinternal
  ) then
    raise exception 'Legacy guest buyer authorization trigger is still installed';
  end if;
end;
$$;

select 'PASS' as single_ticket_product_model;

rollback;
