-- ================================================================
-- Local SQL test context
-- ================================================================
-- Creates deterministic authenticated users for the ordinary user and every
-- administrative role. This fixture is executed only after a complete local
-- database reset. It is not a migration and is never applied to production.
-- ================================================================

with users_to_seed(id, email, display_name) as (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'superadmin-tests@local.invalid', 'Superadmin local'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'authenticated-tests@local.invalid', 'Usuário autenticado local'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'viewer-tests@local.invalid', 'Viewer local'),
    ('44444444-4444-4444-8444-444444444444'::uuid, 'checkin-tests@local.invalid', 'Check-in local'),
    ('55555555-5555-4555-8555-555555555555'::uuid, 'moderator-tests@local.invalid', 'Moderador local'),
    ('66666666-6666-4666-8666-666666666666'::uuid, 'admin-tests@local.invalid', 'Administrador local')
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  crypt('phase1-local-test-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', display_name),
  now(),
  now()
from users_to_seed
on conflict (id) do update
set email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

with identities_to_seed(user_id, email, display_name) as (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'superadmin-tests@local.invalid', 'Superadmin local'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'authenticated-tests@local.invalid', 'Usuário autenticado local'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'viewer-tests@local.invalid', 'Viewer local'),
    ('44444444-4444-4444-8444-444444444444'::uuid, 'checkin-tests@local.invalid', 'Check-in local'),
    ('55555555-5555-4555-8555-555555555555'::uuid, 'moderator-tests@local.invalid', 'Moderador local'),
    ('66666666-6666-4666-8666-666666666666'::uuid, 'admin-tests@local.invalid', 'Administrador local')
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  user_id,
  user_id,
  email,
  jsonb_build_object('sub', user_id::text, 'email', email, 'email_verified', true, 'display_name', display_name),
  'email',
  now(),
  now(),
  now()
from identities_to_seed
on conflict (provider_id, provider) do update
set user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();

with roles_to_seed(user_id, role, display_name, email) as (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'superadmin'::public.admin_role, 'Superadmin local', 'superadmin-tests@local.invalid'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'viewer'::public.admin_role, 'Viewer local', 'viewer-tests@local.invalid'),
    ('44444444-4444-4444-8444-444444444444'::uuid, 'checkin_staff'::public.admin_role, 'Check-in local', 'checkin-tests@local.invalid'),
    ('55555555-5555-4555-8555-555555555555'::uuid, 'moderator'::public.admin_role, 'Moderador local', 'moderator-tests@local.invalid'),
    ('66666666-6666-4666-8666-666666666666'::uuid, 'admin'::public.admin_role, 'Administrador local', 'admin-tests@local.invalid')
)
insert into public.admin_users (user_id, role, display_name, email)
select user_id, role, display_name, email
from roles_to_seed
on conflict (user_id) do update
set role = excluded.role,
    display_name = excluded.display_name,
    email = excluded.email,
    updated_at = now();
