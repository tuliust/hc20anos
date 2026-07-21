-- ================================================================
-- Local SQL test context
-- ================================================================
-- Creates one deterministic authenticated user and one superadmin record.
-- This fixture is executed only by the local/CI test workflow after a complete
-- database reset. It is not a migration and is never applied to production.
-- ================================================================

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
values (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'authenticated',
  'authenticated',
  'migration-tests@local.invalid',
  crypt('migration-test-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

insert into public.admin_users (user_id, role)
values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'superadmin'::public.admin_role
)
on conflict (user_id) do update
set role = excluded.role;
