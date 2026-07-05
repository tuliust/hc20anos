-- ================================================================
-- Turma 2006 — Migration 002: Row Level Security
-- ================================================================

-- Função auxiliar: verifica se o usuário é admin
create or replace function is_admin(uid uuid default auth.uid())
returns boolean language sql security definer stable as $$
  select exists (select 1 from admin_users where user_id = uid);
$$;

-- Função auxiliar: verifica se o usuário tem role específico
create or replace function has_admin_role(required_role admin_role, uid uuid default auth.uid())
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from admin_users
    where user_id = uid
      and (role = required_role or role = 'superadmin')
  );
$$;

-- ================================================================
-- EVENTS
-- ================================================================
alter table events enable row level security;

create policy "events_public_read" on events
  for select using (event_status = 'published');

create policy "events_admin_all" on events
  for all using (is_admin());

-- ================================================================
-- PEOPLE
-- ================================================================
alter table people enable row level security;

-- Visitante vê apenas perfis visíveis e não reivindicados, ou confirmados
create policy "people_public_read" on people
  for select using (is_visible = true);

-- Usuário autenticado pode ver o próprio perfil (mesmo se is_visible=false)
create policy "people_owner_read" on people
  for select using (claimed_by_user_id = auth.uid());

-- Admin pode tudo
create policy "people_admin_all" on people
  for all using (is_admin());

-- ================================================================
-- PROFILES
-- ================================================================
alter table profiles enable row level security;

-- Perfil público visível (respeitando configurações de privacidade, filtrado na query)
create policy "profiles_public_read" on profiles
  for select using (
    exists (
      select 1 from people p
      where p.id = profiles.person_id
        and p.is_visible = true
        and profiles.show_confirmed_status = true
    )
  );

-- Dono do perfil pode ver e editar
create policy "profiles_owner_select" on profiles
  for select using (user_id = auth.uid());

create policy "profiles_owner_update" on profiles
  for update using (user_id = auth.uid());

create policy "profiles_owner_insert" on profiles
  for insert with check (user_id = auth.uid());

-- Admin pode tudo
create policy "profiles_admin_all" on profiles
  for all using (is_admin());

-- ================================================================
-- TICKET TYPES
-- ================================================================
alter table ticket_types enable row level security;

create policy "ticket_types_public_read" on ticket_types
  for select using (status in ('open', 'sold_out'));

create policy "ticket_types_admin_all" on ticket_types
  for all using (is_admin());

-- ================================================================
-- ORDERS
-- ================================================================
alter table orders enable row level security;

-- Usuário vê apenas o próprio pedido (por e-mail ou person_id)
create policy "orders_owner_read" on orders
  for select using (
    buyer_email = (select email from auth.users where id = auth.uid())
    or person_id in (select id from people where claimed_by_user_id = auth.uid())
  );

-- Server-side cria pedidos via service role (sem RLS)
-- Admin pode tudo
create policy "orders_admin_all" on orders
  for all using (is_admin());

-- ================================================================
-- TICKETS
-- ================================================================
alter table tickets enable row level security;

create policy "tickets_owner_read" on tickets
  for select using (
    attendee_email = (select email from auth.users where id = auth.uid())
    or person_id in (select id from people where claimed_by_user_id = auth.uid())
  );

create policy "tickets_admin_all" on tickets
  for all using (is_admin());

-- Check-in staff pode ler e atualizar checked_in
create policy "tickets_checkin_read" on tickets
  for select using (has_admin_role('checkin_staff'));

create policy "tickets_checkin_update" on tickets
  for update using (has_admin_role('checkin_staff'))
  with check (has_admin_role('checkin_staff'));

-- ================================================================
-- PAYMENT EVENTS
-- ================================================================
alter table payment_events enable row level security;

-- Apenas service role (webhook) e admin leem/escrevem
create policy "payment_events_admin_all" on payment_events
  for all using (is_admin());

-- ================================================================
-- PHOTOS
-- ================================================================
alter table photos enable row level security;

-- Visitante vê apenas fotos aprovadas
create policy "photos_public_read" on photos
  for select using (status = 'approved');

-- Usuário autenticado vê as próprias fotos (qualquer status)
create policy "photos_owner_read" on photos
  for select using (uploaded_by_user_id = auth.uid());

-- Usuário autenticado pode enviar fotos
create policy "photos_auth_insert" on photos
  for insert with check (auth.uid() is not null and uploaded_by_user_id = auth.uid());

-- Admin pode tudo
create policy "photos_admin_all" on photos
  for all using (is_admin());

-- ================================================================
-- PHOTO TAGS
-- ================================================================
alter table photo_tags enable row level security;

-- Visitante vê apenas tags aprovadas de fotos aprovadas
create policy "photo_tags_public_read" on photo_tags
  for select using (
    status = 'approved'
    and exists (select 1 from photos where id = photo_tags.photo_id and status = 'approved')
  );

-- Usuário autenticado pode criar tag
create policy "photo_tags_auth_insert" on photo_tags
  for insert with check (auth.uid() is not null);

-- Usuário pode ver as próprias tags (qualquer status)
create policy "photo_tags_owner_read" on photo_tags
  for select using (created_by_user_id = auth.uid());

-- Admin pode tudo
create policy "photo_tags_admin_all" on photo_tags
  for all using (is_admin());

-- ================================================================
-- PROFILE CLAIMS
-- ================================================================
alter table profile_claims enable row level security;

-- Solicitante vê apenas a própria solicitação
create policy "claims_owner_read" on profile_claims
  for select using (requester_user_id = auth.uid());

-- Usuário autenticado pode criar solicitação
create policy "claims_auth_insert" on profile_claims
  for insert with check (auth.uid() is not null and requester_user_id = auth.uid());

-- Admin pode tudo
create policy "claims_admin_all" on profile_claims
  for all using (is_admin());

-- ================================================================
-- PROFILE CLAIM ANSWERS
-- ================================================================
alter table profile_claim_answers enable row level security;

-- Solicitante vê as próprias respostas
create policy "claim_answers_owner_read" on profile_claim_answers
  for select using (
    exists (
      select 1 from profile_claims
      where id = profile_claim_answers.claim_id
        and requester_user_id = auth.uid()
    )
  );

create policy "claim_answers_auth_insert" on profile_claim_answers
  for insert with check (
    exists (
      select 1 from profile_claims
      where id = profile_claim_answers.claim_id
        and requester_user_id = auth.uid()
    )
  );

create policy "claim_answers_admin_all" on profile_claim_answers
  for all using (is_admin());

-- ================================================================
-- ADMIN USERS
-- ================================================================
alter table admin_users enable row level security;

create policy "admin_users_self_read" on admin_users
  for select using (user_id = auth.uid());

create policy "admin_users_superadmin_all" on admin_users
  for all using (has_admin_role('superadmin'));

-- ================================================================
-- AUDIT LOGS
-- ================================================================
alter table audit_logs enable row level security;

create policy "audit_logs_admin_read" on audit_logs
  for select using (is_admin());

create policy "audit_logs_service_insert" on audit_logs
  for insert with check (true);  -- service role insere via webhook/server

-- ================================================================
-- STORAGE RLS
-- ================================================================

-- Política para upload de fotos (apenas autenticados)
create policy "photos_storage_upload" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and auth.uid() is not null
  );

-- Apenas service role (server) ou admin pode ler as fotos
-- Fotos são servidas via signed URLs geradas pelo servidor
create policy "photos_storage_admin_read" on storage.objects
  for select using (
    bucket_id = 'photos'
    and is_admin()
  );

-- Dono pode deletar a própria foto
create policy "photos_storage_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
