-- ================================================================
-- Ticketing commerce foundation
-- HC 20 Anos — Mercado Pago Checkout Pro
--
-- Migration aditiva e idempotente. Preserva o modelo existente e cria
-- as estruturas necessárias para lotes, participantes, convidados,
-- extras, preferências, reembolsos, transferências e notificações.
-- ================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------
-- Existing commerce tables: additive compatibility columns
-- ----------------------------------------------------------------

alter table if exists public.events
  add column if not exists event_timezone text not null default 'America/Sao_Paulo';

alter table if exists public.ticket_types
  add column if not exists product_code text,
  add column if not exists participant_type text,
  add column if not exists package_kind text,
  add column if not exists included_people_count integer not null default 1,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

create unique index if not exists ticket_types_event_product_code_unique
  on public.ticket_types (event_id, product_code)
  where product_code is not null;

alter table if exists public.orders
  add column if not exists buyer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists public_token uuid not null default gen_random_uuid(),
  add column if not exists lot_id uuid,
  add column if not exists subtotal_amount_cents integer not null default 0,
  add column if not exists extras_amount_cents integer not null default 0,
  add column if not exists currency_id text not null default 'BRL',
  add column if not exists payment_status_detail text,
  add column if not exists payment_environment text,
  add column if not exists payment_provider_merchant_order_id text,
  add column if not exists payment_type text,
  add column if not exists installments integer,
  add column if not exists reservation_status text not null default 'active',
  add column if not exists reservation_released_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists approved_inventory_applied_at timestamptz;

create unique index if not exists orders_public_token_unique
  on public.orders (public_token);

create index if not exists orders_buyer_user_created_idx
  on public.orders (buyer_user_id, created_at desc);

create index if not exists orders_payment_status_expires_idx
  on public.orders (payment_status, expires_at);

alter table if exists public.tickets
  add column if not exists order_participant_id uuid,
  add column if not exists status text not null default 'active',
  add column if not exists qr_token text,
  add column if not exists transferred_from_ticket_id uuid references public.tickets(id) on delete set null,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists physical_vouchers_delivered_at timestamptz,
  add column if not exists physical_vouchers_delivered_by uuid references auth.users(id) on delete set null;

create unique index if not exists tickets_qr_token_unique
  on public.tickets (qr_token)
  where qr_token is not null;

-- payment_events exists in the current backend. Add processing metadata
-- only when the table is already present.
alter table if exists public.payment_events
  add column if not exists payment_id text,
  add column if not exists signature_valid boolean,
  add column if not exists received_at timestamptz not null default now(),
  add column if not exists processing_status text not null default 'received',
  add column if not exists processing_error text,
  add column if not exists attempt_count integer not null default 0;

create unique index if not exists payment_events_provider_event_unique
  on public.payment_events (provider, provider_event_id)
  where provider_event_id is not null and provider_event_id <> '';

-- ----------------------------------------------------------------
-- Lots and configurable prices
-- ----------------------------------------------------------------

create table if not exists public.ticket_lots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order integer not null,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'open', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, code),
  unique (event_id, sort_order),
  check (capacity is null or capacity >= 0),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists ticket_lots_event_dates_idx
  on public.ticket_lots (event_id, starts_at, ends_at);

create table if not exists public.ticket_lot_prices (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.ticket_lots(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lot_id, ticket_type_id)
);

create index if not exists ticket_lot_prices_type_idx
  on public.ticket_lot_prices (ticket_type_id, lot_id);

-- Add the FK only after ticket_lots exists.
do $$
begin
  if to_regclass('public.orders') is not null
     and not exists (
       select 1 from pg_constraint
       where conname = 'orders_lot_id_fkey'
         and conrelid = 'public.orders'::regclass
     ) then
    alter table public.orders
      add constraint orders_lot_id_fkey
      foreign key (lot_id) references public.ticket_lots(id) on delete set null;
  end if;
end $$;

-- ----------------------------------------------------------------
-- Guest sponsorship approval
-- ----------------------------------------------------------------

create table if not exists public.guest_approval_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_user_id uuid not null references auth.users(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  relationship_to_alumni text not null,
  sponsor_person_id uuid not null references public.people(id) on delete restrict,
  sponsor_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled', 'archived')),
  decided_at timestamptz,
  decided_by_user_id uuid references auth.users(id) on delete set null,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists guest_approval_open_request_unique
  on public.guest_approval_requests (event_id, guest_user_id, sponsor_person_id)
  where status = 'pending';

create index if not exists guest_approval_sponsor_status_idx
  on public.guest_approval_requests (sponsor_person_id, status, created_at desc);

-- ----------------------------------------------------------------
-- Order participants: one row per person and one future ticket per row
-- ----------------------------------------------------------------

create table if not exists public.order_participants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  person_id uuid references public.people(id) on delete set null,
  participant_type text not null
    check (participant_type in ('alumni', 'spouse', 'child', 'external_guest')),
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  relationship_to_alumni text,
  sponsor_person_id uuid references public.people(id) on delete set null,
  sponsor_user_id uuid references auth.users(id) on delete set null,
  guest_approval_request_id uuid references public.guest_approval_requests(id) on delete set null,
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'active', 'expired', 'cancelled', 'refunded', 'transferred')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_type <> 'child' or birth_date is not null),
  check (participant_type <> 'external_guest' or (email is not null and phone is not null and sponsor_person_id is not null))
);

create index if not exists order_participants_order_idx
  on public.order_participants (order_id, created_at);

create index if not exists order_participants_user_idx
  on public.order_participants (user_id, created_at desc);

create index if not exists order_participants_sponsor_idx
  on public.order_participants (sponsor_person_id, participant_type, status);

-- One ticket per participant. Existing ticket records may remain without a
-- participant during the compatibility period.
do $$
begin
  if to_regclass('public.tickets') is not null
     and not exists (
       select 1 from pg_constraint
       where conname = 'tickets_order_participant_id_fkey'
         and conrelid = 'public.tickets'::regclass
     ) then
    alter table public.tickets
      add constraint tickets_order_participant_id_fkey
      foreign key (order_participant_id) references public.order_participants(id) on delete set null;
  end if;
end $$;

create unique index if not exists tickets_order_participant_unique
  on public.tickets (order_participant_id)
  where order_participant_id is not null;

-- ----------------------------------------------------------------
-- Extras allocated to individual participants
-- ----------------------------------------------------------------

create table if not exists public.participant_extras (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_participant_id uuid not null references public.order_participants(id) on delete cascade,
  extra_type text not null check (extra_type in ('drinks', 'barbecue')),
  quantity integer not null check (quantity > 0),
  units_per_package integer not null default 10 check (units_per_package > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_price_cents integer generated always as (quantity * unit_price_cents) stored,
  physical_vouchers_delivered_at timestamptz,
  physical_vouchers_delivered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_participant_id, extra_type)
);

create index if not exists participant_extras_order_idx
  on public.participant_extras (order_id, extra_type);

-- ----------------------------------------------------------------
-- Mercado Pago preference history
-- ----------------------------------------------------------------

create table if not exists public.payment_preferences (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_preference_id text not null,
  environment text not null check (environment in ('test', 'production')),
  checkout_url text not null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'cancelled', 'replaced')),
  expires_at timestamptz,
  replaced_by_preference_id uuid references public.payment_preferences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_preference_id)
);

create unique index if not exists payment_preferences_one_active_per_order
  on public.payment_preferences (order_id)
  where status = 'active';

-- ----------------------------------------------------------------
-- Refunds
-- ----------------------------------------------------------------

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete set null,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  reason text not null,
  status text not null default 'requested'
    check (status in ('requested', 'under_review', 'approved', 'rejected', 'processing', 'refunded', 'failed', 'suspended')),
  gross_amount_cents integer not null check (gross_amount_cents >= 0),
  non_recoverable_fee_cents integer not null default 0 check (non_recoverable_fee_cents >= 0),
  refund_amount_cents integer not null check (refund_amount_cents >= 0),
  mercado_pago_refund_id text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_admin_id uuid references public.admin_users(id) on delete set null,
  processed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (refund_amount_cents + non_recoverable_fee_cents <= gross_amount_cents)
);

create index if not exists refund_requests_order_status_idx
  on public.refund_requests (order_id, status, requested_at desc);

-- ----------------------------------------------------------------
-- Ticket transfers
-- ----------------------------------------------------------------

create table if not exists public.ticket_transfers (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  from_user_id uuid references auth.users(id) on delete set null,
  to_user_id uuid references auth.users(id) on delete set null,
  to_email text not null,
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'completed', 'cancelled', 'expired', 'rejected')),
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  old_qr_invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ticket_transfers_open_unique
  on public.ticket_transfers (ticket_id)
  where status in ('requested', 'accepted');

-- ----------------------------------------------------------------
-- Transactional notification queue
-- ----------------------------------------------------------------

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  order_id uuid references public.orders(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete cascade,
  recipient_email text not null,
  idempotency_key text not null,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists notification_jobs_pending_idx
  on public.notification_jobs (status, next_attempt_at)
  where status in ('pending', 'failed');

-- ----------------------------------------------------------------
-- Seed the four commercial phases and configurable prices
-- ----------------------------------------------------------------

update public.events
set event_date = '2026-10-24',
    event_timezone = 'America/Sao_Paulo',
    updated_at = now()
where id = '00000000-0000-0000-0000-000000000001'::uuid;

insert into public.ticket_types (
  event_id, name, description, price_cents, available_quantity,
  sold_quantity, allows_guest, status, product_code, participant_type,
  package_kind, included_people_count, metadata_json
)
values
  ('00000000-0000-0000-0000-000000000001', 'Ingresso simples', '1 ex-aluno', 10000, 2147483647, 0, false, 'open', 'simple', 'alumni', 'simple', 1, '{"composition":{"alumni":1}}'),
  ('00000000-0000-0000-0000-000000000001', 'Família completa', '1 ex-aluno, 1 cônjuge e 1 filho de até 12 anos', 18000, 2147483647, 0, true, 'open', 'family_full', 'alumni', 'family_full', 3, '{"composition":{"alumni":1,"spouse":1,"child":1},"child_max_age":12}'),
  ('00000000-0000-0000-0000-000000000001', 'Família sem cônjuge', '1 ex-aluno e 1 filho de até 12 anos', 12000, 2147483647, 0, true, 'open', 'family_single_parent', 'alumni', 'family_single_parent', 2, '{"composition":{"alumni":1,"child":1},"child_max_age":12}'),
  ('00000000-0000-0000-0000-000000000001', 'Filho adicional', 'Filho adicional de até 12 anos', 5000, 2147483647, 0, true, 'open', 'additional_child', 'child', 'addon_person', 1, '{"child_max_age":12}'),
  ('00000000-0000-0000-0000-000000000001', 'Convidado externo', 'Convidado não familiar aprovado por ex-aluno', 13000, 2147483647, 0, true, 'open', 'external_guest', 'external_guest', 'guest', 1, '{}'),
  ('00000000-0000-0000-0000-000000000001', 'Extra de bebidas', 'Pacote com 10 latas de cerveja', 6000, 2147483647, 0, true, 'open', 'extra_drinks', null, 'extra', 0, '{"extra_type":"drinks","units_per_package":10,"adult_only":true}'),
  ('00000000-0000-0000-0000-000000000001', 'Extra de churrasco', 'Pacote com 10 churrasquinhos', 8000, 2147483647, 0, true, 'open', 'extra_barbecue', null, 'extra', 0, '{"extra_type":"barbecue","units_per_package":10}')
on conflict (event_id, product_code) where product_code is not null do update
set name = excluded.name,
    description = excluded.description,
    participant_type = excluded.participant_type,
    package_kind = excluded.package_kind,
    included_people_count = excluded.included_people_count,
    metadata_json = excluded.metadata_json,
    updated_at = now();

insert into public.ticket_lots (event_id, code, name, sort_order, starts_at, ends_at, capacity, status)
values
  ('00000000-0000-0000-0000-000000000001', 'initial', 'Lote inicial', 0, null, '2026-08-01 00:00:00-03', null, 'scheduled'),
  ('00000000-0000-0000-0000-000000000001', 'lot_1', '1º lote', 1, '2026-08-01 00:00:00-03', '2026-08-15 00:00:00-03', null, 'scheduled'),
  ('00000000-0000-0000-0000-000000000001', 'lot_2', '2º lote', 2, '2026-08-15 00:00:00-03', '2026-09-01 00:00:00-03', null, 'scheduled'),
  ('00000000-0000-0000-0000-000000000001', 'lot_3', '3º lote', 3, '2026-09-01 00:00:00-03', null, null, 'scheduled')
on conflict (event_id, code) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    capacity = excluded.capacity,
    updated_at = now();

with prices(product_code, p0, p1, p2, p3) as (
  values
    ('simple', 10000, 12000, 14000, 16000),
    ('family_full', 18000, 20000, 22000, 24000),
    ('family_single_parent', 12000, 14000, 16000, 18000),
    ('additional_child', 5000, 7000, 9000, 11000),
    ('external_guest', 13000, 15000, 17000, 19000),
    ('extra_drinks', 6000, 8000, 10000, 12000),
    ('extra_barbecue', 8000, 10000, 12000, 14000)
), expanded as (
  select product_code, 'initial'::text as lot_code, p0 as price_cents from prices
  union all select product_code, 'lot_1', p1 from prices
  union all select product_code, 'lot_2', p2 from prices
  union all select product_code, 'lot_3', p3 from prices
)
insert into public.ticket_lot_prices (lot_id, ticket_type_id, price_cents)
select l.id, tt.id, e.price_cents
from expanded e
join public.ticket_lots l
  on l.event_id = '00000000-0000-0000-0000-000000000001'::uuid
 and l.code = e.lot_code
join public.ticket_types tt
  on tt.event_id = l.event_id
 and tt.product_code = e.product_code
on conflict (lot_id, ticket_type_id) do update
set price_cents = excluded.price_cents,
    is_active = true,
    updated_at = now();

-- Keep the legacy price column aligned with the initial phase for backwards
-- compatibility until the frontend is migrated to lot prices.
update public.ticket_types tt
set price_cents = lp.price_cents,
    updated_at = now()
from public.ticket_lot_prices lp
join public.ticket_lots l on l.id = lp.lot_id and l.code = 'initial'
where tt.id = lp.ticket_type_id
  and tt.event_id = '00000000-0000-0000-0000-000000000001'::uuid;

notify pgrst, 'reload schema';
