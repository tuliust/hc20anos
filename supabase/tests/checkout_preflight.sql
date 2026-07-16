-- ================================================================
-- Checkout preflight
-- Run in Supabase SQL Editor using "Run without RLS" before the E2E test.
-- Returns one row per prerequisite and raises if anything is missing.
-- ================================================================

create temporary table if not exists _checkout_preflight_results (
  check_name text primary key,
  expected text,
  actual text,
  result text
) on commit preserve rows;
truncate table _checkout_preflight_results;

do $$
declare
  v_definition text;
  v_enum_values text;
  v_missing_columns text[] := array[]::text[];
  v_required_column record;
begin
  insert into _checkout_preflight_results values
    ('orders_table', 'present', case when to_regclass('public.orders') is not null then 'present' else 'missing' end,
      case when to_regclass('public.orders') is not null then 'PASS' else 'FAIL' end),
    ('participants_table', 'present', case when to_regclass('public.order_participants') is not null then 'present' else 'missing' end,
      case when to_regclass('public.order_participants') is not null then 'PASS' else 'FAIL' end),
    ('tickets_table', 'present', case when to_regclass('public.tickets') is not null then 'present' else 'missing' end,
      case when to_regclass('public.tickets') is not null then 'PASS' else 'FAIL' end),
    ('notification_jobs_table', 'present', case when to_regclass('public.notification_jobs') is not null then 'present' else 'missing' end,
      case when to_regclass('public.notification_jobs') is not null then 'PASS' else 'FAIL' end),
    ('payment_events_table', 'present', case when to_regclass('public.payment_events') is not null then 'present' else 'missing' end,
      case when to_regclass('public.payment_events') is not null then 'PASS' else 'FAIL' end);

  for v_required_column in
    select * from (values
      ('orders','payment_provider_order_id'),
      ('orders','payment_provider_preference_id'),
      ('orders','total_amount_cents'),
      ('orders','currency_id'),
      ('orders','reservation_status'),
      ('orders','reservation_released_at'),
      ('order_participants','client_key'),
      ('order_participants','unit_price_cents'),
      ('tickets','order_participant_id'),
      ('tickets','qr_token'),
      ('tickets','qr_token_hash'),
      ('tickets','status'),
      ('notification_jobs','idempotency_key')
    ) as required(table_name,column_name)
  loop
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema='public'
        and c.table_name=v_required_column.table_name
        and c.column_name=v_required_column.column_name
    ) then
      v_missing_columns := array_append(v_missing_columns, v_required_column.table_name || '.' || v_required_column.column_name);
    end if;
  end loop;

  insert into _checkout_preflight_results values (
    'required_columns', 'all present',
    case when cardinality(v_missing_columns)=0 then 'all present' else array_to_string(v_missing_columns, ', ') end,
    case when cardinality(v_missing_columns)=0 then 'PASS' else 'FAIL' end
  );

  insert into _checkout_preflight_results values
    ('create_checkout_order_rpc', 'present',
      case when to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is not null then 'present' else 'missing' end,
      case when to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is not null then 'PASS' else 'FAIL' end),
    ('payment_rpc', 'present',
      case when to_regprocedure('public.apply_mercado_pago_payment(uuid,text,text,text,text,text,integer,integer,text,text,timestamptz)') is not null then 'present' else 'missing' end,
      case when to_regprocedure('public.apply_mercado_pago_payment(uuid,text,text,text,text,text,integer,integer,text,text,timestamptz)') is not null then 'PASS' else 'FAIL' end),
    ('expiration_rpc', 'present',
      case when to_regprocedure('public.release_expired_ticket_reservations(timestamptz)') is not null then 'present' else 'missing' end,
      case when to_regprocedure('public.release_expired_ticket_reservations(timestamptz)') is not null then 'PASS' else 'FAIL' end);

  if to_regprocedure('public.apply_mercado_pago_payment(uuid,text,text,text,text,text,integer,integer,text,text,timestamptz)') is not null then
    select pg_get_functiondef(
      'public.apply_mercado_pago_payment(uuid,text,text,text,text,text,integer,integer,text,text,timestamptz)'::regprocedure
    ) into v_definition;

    insert into _checkout_preflight_results values
      ('no_gen_random_bytes_dependency', 'absent',
        case when position('gen_random_bytes' in v_definition)=0 then 'absent' else 'present' end,
        case when position('gen_random_bytes' in v_definition)=0 then 'PASS' else 'FAIL' end),
      ('no_digest_dependency', 'absent',
        case when position('digest(' in v_definition)=0 then 'absent' else 'present' end,
        case when position('digest(' in v_definition)=0 then 'PASS' else 'FAIL' end),
      ('portable_qr_generation', 'installed',
        case when position('replace(gen_random_uuid()::text' in v_definition)>0 and position('md5(v_qr_token)' in v_definition)>0 then 'installed' else 'missing' end,
        case when position('replace(gen_random_uuid()::text' in v_definition)>0 and position('md5(v_qr_token)' in v_definition)>0 then 'PASS' else 'FAIL' end);
  end if;

  select string_agg(e.enumlabel, ',' order by e.enumsortorder)
    into v_enum_values
  from pg_type t
  join pg_enum e on e.enumtypid=t.oid
  join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname='payment_status';

  insert into _checkout_preflight_results values (
    'payment_status_values',
    'approved,rejected,pending,in_process,cancelled,refunded,charged_back,expired',
    coalesce(v_enum_values,'enum missing'),
    case when (
      select count(*)=8
      from unnest(array['approved','rejected','pending','in_process','cancelled','refunded','charged_back','expired']) required(value)
      where required.value = any(string_to_array(coalesce(v_enum_values,''),','))
    ) then 'PASS' else 'FAIL' end
  );

  insert into _checkout_preflight_results values
    ('ticket_per_participant_unique_index', 'present',
      case when to_regclass('public.tickets_order_participant_unique') is not null then 'present' else 'missing' end,
      case when to_regclass('public.tickets_order_participant_unique') is not null then 'PASS' else 'FAIL' end),
    ('payment_id_unique_index', 'present',
      case when to_regclass('public.orders_payment_provider_order_unique') is not null then 'present' else 'missing' end,
      case when to_regclass('public.orders_payment_provider_order_unique') is not null then 'PASS' else 'FAIL' end);

  if exists (select 1 from _checkout_preflight_results where result <> 'PASS') then
    raise exception 'Checkout preflight failed: %',
      (select jsonb_agg(to_jsonb(r)) from _checkout_preflight_results r where result <> 'PASS');
  end if;
end;
$$;

select check_name, expected, actual, result
from _checkout_preflight_results
order by check_name;

drop table if exists _checkout_preflight_results;
