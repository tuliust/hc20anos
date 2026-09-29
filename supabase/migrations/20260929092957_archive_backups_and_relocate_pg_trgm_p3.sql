-- P3 security cleanup: remove historical backup tables from the exposed
-- public schema without deleting their data, and relocate pg_trgm.

create schema if not exists archive authorization postgres;
revoke all on schema archive from public, anon, authenticated;

alter table if exists public.backup_admin_users_before_cleanup_20260709 set schema archive;
alter table if exists public.backup_auth_users_before_cleanup_20260709 set schema archive;
alter table if exists public.backup_people_before_cleanup_20260709 set schema archive;
alter table if exists public.backup_profiles_before_cleanup_20260709 set schema archive;
alter table if exists public.faq_items_backup_20260716 set schema archive;

revoke all on all tables in schema archive from public, anon, authenticated;
alter default privileges for role postgres in schema archive
  revoke all on tables from public, anon, authenticated;

alter extension pg_trgm set schema extensions;
