-- Checkout commerce smoke tests for the current single-ticket model.
-- Execute against a disposable/local Supabase database after migrations.

begin;

-- Reabre vendas apenas dentro desta transação para validar a mecânica histórica do checkout.
update public.events
set event_status = 'published', sales_status = 'open'
where id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Canonical event date and timezone.
do $$
declare
  v_date date;
  v_time time;
  v_timezone text;
begin
  select event_date, event_time, event_timezone into v_date, v_time, v_timezone
  from public.events
  where id = '00000000-0000-0000-0000-000000000001'::uuid;

  if v_date <> '2026-09-26'::date then
    raise exception 'Unexpected event date: %', v_date;
  end if;
  if v_time <> '14:00:00'::time then
    raise exception 'Unexpected event time: %', v_time;
  end if;
  if v_timezone <> 'America/Sao_Paulo' then
    raise exception 'Unexpected event timezone: %', v_timezone;
  end if;
end $$;

-- Only the consolidated lot is sellable and it exposes one active simple price.
do $$
declare
  v_lot record;
  v_active_prices integer;
  v_price integer;
begin
  select * into v_lot
  from public.get_current_ticket_lot(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2026-09-16 12:00:00-03'::timestamptz
  );

  if v_lot.id is null or v_lot.code <> 'single' or v_lot.name <> 'Lote único' then
    raise exception 'Expected consolidated single lot, found %', row_to_json(v_lot);
  end if;

  select count(*), max(lp.price_cents)
    into v_active_prices, v_price
  from public.ticket_lot_prices lp
  join public.ticket_types tt on tt.id = lp.ticket_type_id
  where lp.lot_id = v_lot.id
    and lp.is_active
    and tt.status = 'open';

  if v_active_prices <> 1 then
    raise exception 'Expected one active price in current lot, found %', v_active_prices;
  end if;
  if v_price <> 12000 then
    raise exception 'Expected R$ 120.00 base price, found % cents', v_price;
  end if;

  if not exists (
    select 1
    from public.ticket_lot_prices lp
    join public.ticket_types tt on tt.id = lp.ticket_type_id
    where lp.lot_id = v_lot.id
      and lp.is_active
      and tt.status = 'open'
      and tt.product_code = 'simple'
      and lp.price_cents = 12000
  ) then
    raise exception 'Active simple ticket price is missing';
  end if;
end $$;

-- Sales close at the event start.
do $$
declare
  v_code text;
begin
  select code into v_code
  from public.get_current_ticket_lot(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2026-09-26 13:59:59-03'::timestamptz
  );
  if v_code <> 'single' then raise exception 'Expected single lot immediately before event, found %', v_code; end if;

  select code into v_code
  from public.get_current_ticket_lot(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2026-09-26 14:00:00-03'::timestamptz
  );
  if v_code is not null then raise exception 'Sales must be closed at event start, found %', v_code; end if;
end $$;

-- Child age is calculated on the canonical event date.
do $$
begin
  if public.age_on_event_date('2018-09-26'::date, '00000000-0000-0000-0000-000000000001'::uuid) <> 8 then
    raise exception 'Age helper returned unexpected result for age 8';
  end if;
  if public.age_on_event_date('2016-09-26'::date, '00000000-0000-0000-0000-000000000001'::uuid) <> 10 then
    raise exception 'Age helper returned unexpected result for age 10';
  end if;
  if public.age_on_event_date('2013-09-26'::date, '00000000-0000-0000-0000-000000000001'::uuid) <> 13 then
    raise exception 'Age helper returned unexpected result for age 13';
  end if;
end $$;

-- Required operational structures remain available even when legacy flows are disabled.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'ticket_lots', 'ticket_lot_prices', 'guest_approval_requests',
    'order_participants', 'participant_extras', 'payment_preferences',
    'refund_requests', 'ticket_transfers', 'notification_jobs'
  ] loop
    if to_regclass('public.' || v_table) is null then
      raise exception 'Missing table: %', v_table;
    end if;
  end loop;
end $$;

rollback;
