-- Checkout commerce smoke tests.
-- Execute against a disposable/local Supabase database after migrations.

begin;

-- Event date and timezone.
do $$
declare
  v_date date;
  v_timezone text;
begin
  select event_date, event_timezone into v_date, v_timezone
  from public.events
  where id = '00000000-0000-0000-0000-000000000001'::uuid;

  if v_date <> '2026-10-24'::date then
    raise exception 'Unexpected event date: %', v_date;
  end if;
  if v_timezone <> 'America/Sao_Paulo' then
    raise exception 'Unexpected event timezone: %', v_timezone;
  end if;
end $$;

-- Four lots and seven prices per lot.
do $$
declare
  v_lots integer;
  v_prices integer;
begin
  select count(*) into v_lots
  from public.ticket_lots
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

  select count(*) into v_prices
  from public.ticket_lot_prices lp
  join public.ticket_lots l on l.id = lp.lot_id
  where l.event_id = '00000000-0000-0000-0000-000000000001'::uuid;

  if v_lots <> 4 then raise exception 'Expected 4 lots, found %', v_lots; end if;
  if v_prices <> 28 then raise exception 'Expected 28 lot prices, found %', v_prices; end if;
end $$;

-- Date-bound lot selection.
do $$
declare
  v_code text;
begin
  select code into v_code from public.get_current_ticket_lot(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2026-07-31 12:00:00-03'::timestamptz
  );
  if v_code <> 'initial' then raise exception 'Expected initial, found %', v_code; end if;

  select code into v_code from public.get_current_ticket_lot(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2026-08-01 00:00:00-03'::timestamptz
  );
  if v_code <> 'lot_1' then raise exception 'Expected lot_1, found %', v_code; end if;

  select code into v_code from public.get_current_ticket_lot(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2026-08-15 00:00:00-03'::timestamptz
  );
  if v_code <> 'lot_2' then raise exception 'Expected lot_2, found %', v_code; end if;

  select code into v_code from public.get_current_ticket_lot(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2026-09-01 00:00:00-03'::timestamptz
  );
  if v_code <> 'lot_3' then raise exception 'Expected lot_3, found %', v_code; end if;
end $$;

-- Child age is calculated on the event date.
do $$
begin
  if public.age_on_event_date('2013-10-24'::date, '00000000-0000-0000-0000-000000000001'::uuid) <> 13 then
    raise exception 'Age helper returned unexpected result';
  end if;
  if public.age_on_event_date('2014-10-25'::date, '00000000-0000-0000-0000-000000000001'::uuid) <> 11 then
    raise exception 'Age helper returned unexpected result';
  end if;
end $$;

-- Required structures.
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
