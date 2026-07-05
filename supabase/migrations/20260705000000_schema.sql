-- ================================================================
-- Turma 2006 — Colégio Henrique Castriciano
-- Migration 001: Schema completo
-- ================================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "pgcrypto";

-- ================================================================
-- ENUMS
-- ================================================================

do $$ begin
  create type event_status   as enum ('draft', 'published', 'cancelled', 'completed');
  create type sales_status   as enum ('open', 'paused', 'closed');
  create type profile_status as enum ('unclaimed', 'claimed', 'confirmed');
  create type ticket_status  as enum ('draft', 'open', 'paused', 'sold_out', 'closed');
  create type payment_status as enum ('pending', 'in_process', 'approved', 'rejected', 'cancelled', 'refunded', 'expired', 'charged_back');
  create type photo_status   as enum ('pending', 'approved', 'rejected', 'removed');
  create type tag_status     as enum ('pending', 'approved', 'rejected', 'removed');
  create type claim_status   as enum ('pending', 'approved', 'rejected', 'disputed', 'expired');
  create type admin_role     as enum ('superadmin', 'moderator', 'checkin_staff');
exception when duplicate_object then null; end $$;

-- ================================================================
-- EVENTS
-- ================================================================

create table if not exists events (
  id                  uuid primary key default uuid_generate_v4(),
  title               text not null,
  slug                text not null unique,
  description         text,
  event_date          date not null,
  event_time          time not null default '19:00:00',
  location_name       text not null,
  location_address    text,
  event_status        event_status not null default 'draft',
  sales_status        sales_status not null default 'closed',
  contact_email       text,
  contact_whatsapp    text,
  general_rules       text,
  companion_policy    text,
  refund_policy       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ================================================================
-- PEOPLE (ex-alunos pré-carregados)
-- ================================================================

create table if not exists people (
  id                    uuid primary key default uuid_generate_v4(),
  full_name             text not null,
  class_year            integer not null default 2006,
  class_group           text,           -- Sala A, B, C...
  nickname_at_school    text,
  profile_status        profile_status not null default 'unclaimed',
  claimed_by_user_id    uuid references auth.users(id) on delete set null,
  claimed_at            timestamptz,
  is_visible            boolean not null default true,
  private_notes         text,           -- notas internas, nunca expostas ao público
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_people_full_name_trgm on people using gin(full_name gin_trgm_ops);
create index if not exists idx_people_profile_status  on people(profile_status);
create index if not exists idx_people_class_group     on people(class_group);
create index if not exists idx_people_claimed_user    on people(claimed_by_user_id);

-- ================================================================
-- PROFILES (dados editáveis pelo ex-aluno)
-- ================================================================

create table if not exists profiles (
  id                    uuid primary key default uuid_generate_v4(),
  person_id             uuid not null unique references people(id) on delete cascade,
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  display_name          text,
  current_photo_url     text,
  current_city          text,
  current_state         text,
  current_country       text default 'Brasil',
  profession            text,
  bio                   text,
  memory_text           text,
  instagram_url         text,
  linkedin_url          text,
  -- privacidade
  show_current_photo    boolean not null default true,
  show_city             boolean not null default true,
  show_profession       boolean not null default true,
  show_social_links     boolean not null default false,
  allow_photo_tags      boolean not null default true,
  show_confirmed_status boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_profiles_user_id   on profiles(user_id);
create index if not exists idx_profiles_person_id on profiles(person_id);

-- ================================================================
-- TICKET TYPES (lotes de ingresso)
-- ================================================================

create table if not exists ticket_types (
  id                  uuid primary key default uuid_generate_v4(),
  event_id            uuid not null references events(id) on delete cascade,
  name                text not null,
  description         text,
  price_cents         integer not null check (price_cents >= 0),
  available_quantity  integer not null check (available_quantity >= 0),
  sold_quantity       integer not null default 0 check (sold_quantity >= 0),
  sales_start_at      timestamptz,
  sales_end_at        timestamptz,
  allows_guest        boolean not null default false,
  status              ticket_status not null default 'draft',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_ticket_types_event_id on ticket_types(event_id);
create index if not exists idx_ticket_types_status   on ticket_types(status);

-- ================================================================
-- ORDERS (pedidos de compra)
-- ================================================================

create table if not exists orders (
  id                              uuid primary key default uuid_generate_v4(),
  event_id                        uuid not null references events(id),
  buyer_name                      text not null,
  buyer_email                     text not null,
  buyer_phone                     text,
  person_id                       uuid references people(id) on delete set null,
  ticket_type_id                  uuid not null references ticket_types(id),
  quantity                        integer not null default 1 check (quantity > 0),
  total_amount_cents              integer not null check (total_amount_cents >= 0),
  payment_provider                text not null default 'mercadopago',
  payment_provider_order_id       text,
  payment_provider_preference_id  text,
  payment_status                  payment_status not null default 'pending',
  payment_method                  text,
  paid_at                         timestamptz,
  expires_at                      timestamptz default (now() + interval '30 minutes'),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_orders_buyer_email      on orders(buyer_email);
create index if not exists idx_orders_payment_status   on orders(payment_status);
create index if not exists idx_orders_person_id        on orders(person_id);
create index if not exists idx_orders_mp_order_id      on orders(payment_provider_order_id);
create index if not exists idx_orders_mp_pref_id       on orders(payment_provider_preference_id);

-- ================================================================
-- TICKETS (ingresso individual gerado após pagamento)
-- ================================================================

create table if not exists tickets (
  id                        uuid primary key default uuid_generate_v4(),
  order_id                  uuid not null references orders(id) on delete cascade,
  ticket_type_id            uuid not null references ticket_types(id),
  person_id                 uuid references people(id) on delete set null,
  attendee_name             text not null,
  attendee_email            text not null,
  attendee_phone            text,
  guest_name                text,
  qr_code                   text not null unique,
  qr_token_hash             text not null unique,
  checked_in                boolean not null default false,
  checked_in_at             timestamptz,
  checked_in_by_admin_id    uuid references auth.users(id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_tickets_qr_code        on tickets(qr_code);
create index if not exists idx_tickets_attendee_email on tickets(attendee_email);
create index if not exists idx_tickets_attendee_name  on tickets using gin(attendee_name gin_trgm_ops);
create index if not exists idx_tickets_person_id      on tickets(person_id);
create index if not exists idx_tickets_checked_in     on tickets(checked_in);
create index if not exists idx_tickets_order_id       on tickets(order_id);

-- ================================================================
-- PAYMENT EVENTS (log de webhooks do Mercado Pago)
-- ================================================================

create table if not exists payment_events (
  id                  uuid primary key default uuid_generate_v4(),
  provider            text not null default 'mercadopago',
  event_type          text not null,
  provider_event_id   text,
  order_id            uuid references orders(id) on delete set null,
  payload_json        jsonb not null default '{}',
  processed_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_payment_events_order_id        on payment_events(order_id);
create index if not exists idx_payment_events_provider_event  on payment_events(provider_event_id);

-- ================================================================
-- PHOTOS (mural de fotos antigas)
-- ================================================================

create table if not exists photos (
  id                    uuid primary key default uuid_generate_v4(),
  event_id              uuid references events(id) on delete cascade,
  image_url             text not null,
  thumbnail_url         text,
  storage_path          text,               -- caminho no Supabase Storage
  caption               text,
  year_approx           integer,
  location_text         text,
  uploaded_by_user_id   uuid references auth.users(id) on delete set null,
  uploaded_by_name      text,
  authorization_given   boolean not null default false,  -- checkbox obrigatório
  status                photo_status not null default 'pending',
  approved_by_admin_id  uuid references auth.users(id) on delete set null,
  approved_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_photos_status       on photos(status);
create index if not exists idx_photos_event_id     on photos(event_id);
create index if not exists idx_photos_uploaded_by  on photos(uploaded_by_user_id);

-- ================================================================
-- PHOTO TAGS (marcações em fotos)
-- ================================================================

create table if not exists photo_tags (
  id                    uuid primary key default uuid_generate_v4(),
  photo_id              uuid not null references photos(id) on delete cascade,
  person_id             uuid not null references people(id) on delete cascade,
  tagged_name_snapshot  text not null,
  status                tag_status not null default 'pending',
  created_by_user_id    uuid references auth.users(id) on delete set null,
  approved_by_admin_id  uuid references auth.users(id) on delete set null,
  approved_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(photo_id, person_id)
);

create index if not exists idx_photo_tags_photo_id  on photo_tags(photo_id);
create index if not exists idx_photo_tags_person_id on photo_tags(person_id);
create index if not exists idx_photo_tags_status    on photo_tags(status);

-- ================================================================
-- PROFILE CLAIMS (reivindicação de perfil)
-- ================================================================

create table if not exists profile_claims (
  id                    uuid primary key default uuid_generate_v4(),
  person_id             uuid not null references people(id) on delete cascade,
  requester_user_id     uuid references auth.users(id) on delete set null,
  requester_name        text not null,
  requester_email       text not null,
  requester_phone       text,
  verification_score    integer default 0,
  status                claim_status not null default 'pending',
  reviewed_by_admin_id  uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  rejection_reason      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_profile_claims_person_id          on profile_claims(person_id);
create index if not exists idx_profile_claims_requester_user_id  on profile_claims(requester_user_id);
create index if not exists idx_profile_claims_status             on profile_claims(status);

-- ================================================================
-- PROFILE CLAIM ANSWERS (respostas às perguntas de confirmação)
-- ================================================================

create table if not exists profile_claim_answers (
  id            uuid primary key default uuid_generate_v4(),
  claim_id      uuid not null references profile_claims(id) on delete cascade,
  question_key  text not null,
  answer_text   text not null,
  score_value   integer not null default 0,
  is_match      boolean,
  created_at    timestamptz not null default now()
);

create index if not exists idx_claim_answers_claim_id on profile_claim_answers(claim_id);

-- ================================================================
-- ADMIN USERS
-- ================================================================

create table if not exists admin_users (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  role        admin_role not null default 'moderator',
  created_at  timestamptz not null default now()
);

-- ================================================================
-- AUDIT LOGS
-- ================================================================

create table if not exists audit_logs (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete set null,
  action         text not null,
  entity_type    text not null,
  entity_id      uuid,
  metadata_json  jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_id    on audit_logs(user_id);
create index if not exists idx_audit_logs_entity     on audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);

-- ================================================================
-- FUNÇÕES E TRIGGERS
-- ================================================================

-- Auto-update updated_at em qualquer tabela com essa coluna
create or replace function fn_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ declare
  t text;
begin
  foreach t in array array[
    'events','people','profiles','ticket_types','orders','tickets',
    'photos','photo_tags','profile_claims'
  ] loop
    execute format(
      'drop trigger if exists trg_%s_updated_at on %s;
       create trigger trg_%s_updated_at
         before update on %s
         for each row execute function fn_set_updated_at();',
      t, t, t, t
    );
  end loop;
end $$;

-- Gera QR code único ao criar ticket
create or replace function fn_generate_qr_code()
returns trigger language plpgsql as $$
begin
  if new.qr_code is null or new.qr_code = '' then
    new.qr_code       := 'HC2006-' || upper(encode(gen_random_bytes(4), 'hex'));
    new.qr_token_hash := encode(digest(new.qr_code || new.id::text || now()::text, 'sha256'), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tickets_qr on tickets;
create trigger trg_tickets_qr
  before insert on tickets
  for each row execute function fn_generate_qr_code();

-- Incrementa sold_quantity ao confirmar pagamento
create or replace function fn_increment_sold(p_ticket_type_id uuid, delta integer default 1)
returns void language plpgsql security definer as $$
begin
  update ticket_types
  set sold_quantity = sold_quantity + delta,
      status = case
        when (available_quantity - (sold_quantity + delta)) <= 0 then 'sold_out'::ticket_status
        else status
      end
  where id = p_ticket_type_id;
end;
$$;

-- ================================================================
-- STORAGE BUCKETS
-- ================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,                          -- não público; URLs assinadas
  10485760,                       -- 10 MB
  array['image/jpeg','image/jpg','image/png','image/webp','image/heic']
)
on conflict (id) do nothing;
