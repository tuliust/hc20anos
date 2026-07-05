-- ================================================================
-- Turma 2006 — Migration 004: Incremental
-- Novas tabelas, colunas e enum values.
-- NÃO altera estruturas existentes.
-- ================================================================

-- ── Novos valores no enum admin_role ────────────────────────────
-- Usa transação separada: ADD VALUE não pode ser revertido, mas é idempotente.
do $$ begin
  alter type admin_role add value if not exists 'admin';
  alter type admin_role add value if not exists 'viewer';
exception when others then null; end $$;

-- ── Colunas adicionais em admin_users ───────────────────────────
alter table admin_users
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_admin_users_updated_at on admin_users;
create trigger trg_admin_users_updated_at
  before update on admin_users
  for each row execute function fn_set_updated_at();

-- ── photo_removal_requests ───────────────────────────────────────
do $$ begin
  create type removal_request_status as enum
    ('pending', 'approved', 'rejected', 'hidden_preventively');
exception when duplicate_object then null; end $$;

create table if not exists photo_removal_requests (
  id                    uuid primary key default uuid_generate_v4(),
  photo_id              uuid not null references photos(id) on delete cascade,
  requester_user_id     uuid references auth.users(id) on delete set null,
  requester_name        text not null,
  requester_email       text not null,
  reason                text not null,
  status                removal_request_status not null default 'pending',
  reviewed_by_admin_id  uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  admin_notes           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_removal_requests_photo_id on photo_removal_requests(photo_id);
create index if not exists idx_removal_requests_status   on photo_removal_requests(status);

drop trigger if exists trg_removal_requests_updated_at on photo_removal_requests;
create trigger trg_removal_requests_updated_at
  before update on photo_removal_requests
  for each row execute function fn_set_updated_at();

-- ── profile_claim_disputes ───────────────────────────────────────
do $$ begin
  create type dispute_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists profile_claim_disputes (
  id                        uuid primary key default uuid_generate_v4(),
  person_id                 uuid not null references people(id) on delete cascade,
  current_claimant_user_id  uuid references auth.users(id) on delete set null,
  requester_user_id         uuid references auth.users(id) on delete set null,
  requester_name            text not null,
  requester_email           text not null,
  requester_phone           text,
  reason                    text not null,
  evidence_text             text,
  status                    dispute_status not null default 'pending',
  reviewed_by_admin_id      uuid references auth.users(id) on delete set null,
  reviewed_at               timestamptz,
  admin_notes               text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_disputes_person_id    on profile_claim_disputes(person_id);
create index if not exists idx_disputes_requester    on profile_claim_disputes(requester_user_id);
create index if not exists idx_disputes_status       on profile_claim_disputes(status);

drop trigger if exists trg_disputes_updated_at on profile_claim_disputes;
create trigger trg_disputes_updated_at
  before update on profile_claim_disputes
  for each row execute function fn_set_updated_at();

-- ================================================================
-- RLS — Novas tabelas
-- ================================================================

alter table photo_removal_requests  enable row level security;
alter table profile_claim_disputes  enable row level security;

-- photo_removal_requests
create policy "removal_requests_owner_read" on photo_removal_requests
  for select using (requester_user_id = auth.uid());

create policy "removal_requests_auth_insert" on photo_removal_requests
  for insert with check (auth.uid() is not null and requester_user_id = auth.uid());

create policy "removal_requests_admin_all" on photo_removal_requests
  for all using (is_admin());

-- profile_claim_disputes
create policy "disputes_owner_read" on profile_claim_disputes
  for select using (requester_user_id = auth.uid());

create policy "disputes_auth_insert" on profile_claim_disputes
  for insert with check (auth.uid() is not null and requester_user_id = auth.uid());

create policy "disputes_admin_all" on profile_claim_disputes
  for all using (is_admin());

-- ================================================================
-- Função auxiliar: agrega relatórios do evento
-- Callable pelo client com anon key (security definer usa service role internamente)
-- ================================================================

create or replace function get_event_reports(p_event_id uuid)
returns jsonb language plpgsql security definer stable as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'tickets_sold',      coalesce((select sum(sold_quantity) from ticket_types where event_id = p_event_id), 0),
    'revenue_cents',     coalesce((select sum(total_amount_cents) from orders where event_id = p_event_id and payment_status = 'approved'), 0),
    'orders_pending',    coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'pending'), 0),
    'orders_approved',   coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'approved'), 0),
    'orders_rejected',   coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'rejected'), 0),
    'orders_cancelled',  coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'cancelled'), 0),
    'orders_expired',    coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'expired'), 0),
    'orders_refunded',   coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'refunded'), 0),
    'checkins_done',     coalesce((select count(*) from tickets t join orders o on o.id = t.order_id where o.event_id = p_event_id and t.checked_in = true), 0),
    'checkins_pending',  coalesce((select count(*) from tickets t join orders o on o.id = t.order_id where o.event_id = p_event_id and t.checked_in = false), 0),
    'people_confirmed',  coalesce((select count(*) from people where profile_status = 'confirmed'), 0),
    'people_claimed',    coalesce((select count(*) from people where profile_status = 'claimed'), 0),
    'people_unclaimed',  coalesce((select count(*) from people where profile_status = 'unclaimed'), 0),
    'photos_total',      coalesce((select count(*) from photos where event_id = p_event_id), 0),
    'photos_approved',   coalesce((select count(*) from photos where event_id = p_event_id and status = 'approved'), 0),
    'photos_pending',    coalesce((select count(*) from photos where event_id = p_event_id and status = 'pending'), 0),
    'photos_rejected',   coalesce((select count(*) from photos where event_id = p_event_id and status = 'rejected'), 0),
    'claims_pending',    coalesce((select count(*) from profile_claims where status = 'pending'), 0),
    'disputes_pending',  coalesce((select count(*) from profile_claim_disputes where status = 'pending'), 0),
    'removals_pending',  coalesce((select count(*) from photo_removal_requests where status = 'pending'), 0)
  ) into result;
  return result;
end;
$$;
