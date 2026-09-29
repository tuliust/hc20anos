-- Phase 4D: policy equivalence and role regression checks.
-- Local-only behavioral checks use deterministic identities from
-- supabase/tests/fixtures/local_test_context.sql. Transactions are rolled back.

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='faq_items'
      and policyname in (
        'faq_items_admin_insert','faq_items_admin_read',
        'faq_items_admin_update','faq_items_superadmin_delete'
      )
  ) then raise exception 'FAIL faq_items_redundant_admin_policies_removed'; end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='home_page_content'
      and policyname in ('admin_panel_select','home_page_content_admin_write')
  ) then raise exception 'FAIL home_page_content_redundant_policies_removed'; end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='event_archive_settings'
      and policyname in ('admin_panel_select','event_archive_settings_admin_all')
  ) then raise exception 'FAIL event_archive_settings_redundant_policies_removed'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='faq_items' and policyname='faq_items_manage_admins'
      and cmd='ALL' and roles=array['authenticated'::name]
  ) then raise exception 'FAIL faq_items_canonical_admin_policy'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='faq_items' and policyname='faq_items_public_read'
      and cmd='SELECT' and 'anon'::name = any(roles)
  ) then raise exception 'FAIL faq_items_public_read_preserved'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='home_page_content' and policyname='home_page_content_public_read'
      and cmd='SELECT' and qual='true'
  ) then raise exception 'FAIL home_page_content_public_read_preserved'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='event_archive_settings' and policyname='event_archive_settings_public_read'
      and cmd='SELECT' and qual='true'
  ) then raise exception 'FAIL event_archive_public_read_preserved'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='cms_assets' and policyname='cms_assets_select_active'
      and qual='(is_active = true)'
  ) then raise exception 'FAIL cms_assets_public_scope_unchanged'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='contact_collectors' and policyname='contact_collectors_authorized_read'
      and qual='can_manage_contact_research()'
  ) then raise exception 'FAIL contact_collectors_authorized_read_unchanged'; end if;
end;
$$;

-- Invoker helper so each role below exercises real RLS for all CRUD commands.
create or replace function pg_temp.assert_no_editorial_mutation(p_label text)
returns void
language plpgsql
as $$
declare
  event_uuid uuid;
  category record;
  affected integer;
begin
  select event_id into event_uuid from public.home_page_content limit 1;
  select id,event_id,key,label into category from public.faq_categories
    where event_id=event_uuid order by id limit 1;
  if event_uuid is null or category.id is null then
    raise exception 'FAIL %_editorial_fixture_missing', p_label;
  end if;

  begin
    insert into public.faq_items(event_id,slug,category_key,category_label,question,answer,category_id)
    values(event_uuid,'phase4d-denied-'||gen_random_uuid()::text,category.key,category.label,
      'phase4d denied','phase4d denied',category.id);
    raise exception 'FAIL %_faq_insert_allowed', p_label;
  exception when insufficient_privilege then null; end;

  update public.faq_items set question=question
    where id=(select id from public.faq_items order by id limit 1);
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL %_faq_update_allowed', p_label; end if;
  delete from public.faq_items
    where id=(select id from public.faq_items order by id limit 1);
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL %_faq_delete_allowed', p_label; end if;

  begin
    insert into public.home_page_content(event_id) values(event_uuid)
      on conflict (event_id) do nothing;
    raise exception 'FAIL %_home_insert_allowed', p_label;
  exception when insufficient_privilege then null; end;
  update public.home_page_content set updated_at=updated_at where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL %_home_update_allowed', p_label; end if;
  delete from public.home_page_content where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL %_home_delete_allowed', p_label; end if;

  begin
    insert into public.event_archive_settings(event_id) values(event_uuid)
      on conflict (event_id) do nothing;
    raise exception 'FAIL %_archive_insert_allowed', p_label;
  exception when insufficient_privilege then null; end;
  update public.event_archive_settings set updated_at=updated_at where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL %_archive_update_allowed', p_label; end if;
  delete from public.event_archive_settings where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL %_archive_delete_allowed', p_label; end if;
end;
$$;

-- Anonymous and ordinary authenticated users keep public reads but cannot
-- create, update, or delete editorial records.
-- Keep one transaction open so the pg_temp helper survives between role cases;
-- each case is isolated with a savepoint and rolled back before the next role.
begin;
savepoint phase4d_anon;
select set_config('request.jwt.claim.role','anon',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$
declare event_uuid uuid;
begin
  if (select count(*) from public.home_page_content) = 0
     or (select count(*) from public.event_archive_settings) = 0 then
    raise exception 'FAIL anonymous_editorial_public_select';
  end if;
  perform pg_temp.assert_no_editorial_mutation('anon');
  select event_id into event_uuid from public.home_page_content order by event_id limit 1;
  begin
    insert into public.faq_items(event_id,slug,category_key,category_label,question,answer,category_id)
    select fc.event_id,'phase4d-anon-'||gen_random_uuid()::text,fc.key,fc.label,
      'phase4d anon','phase4d anon',fc.id
    from public.faq_categories fc where fc.event_id=event_uuid limit 1;
    raise exception 'FAIL anon_faq_insert_allowed';
  exception when insufficient_privilege then null;
  end;
  if event_uuid is not null then
    begin
      insert into public.home_page_content(event_id) values(event_uuid)
      on conflict (event_id) do nothing;
      raise exception 'FAIL anon_home_insert_allowed';
    exception when insufficient_privilege then null; end;
    begin
      insert into public.event_archive_settings(event_id) values(event_uuid)
      on conflict (event_id) do nothing;
      raise exception 'FAIL anon_archive_insert_allowed';
    exception when insufficient_privilege then null; end;
  end if;
end;
$$;
rollback to savepoint phase4d_anon;

-- Ordinary user, viewer, and moderator: no admin/editorial write policies.
savepoint phase4d_ordinary;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$
begin
  if public.is_admin_panel_user() then raise exception 'FAIL ordinary_editorial_admin_gate'; end if;
  if (select count(*) from public.home_page_content) = 0
     or (select count(*) from public.event_archive_settings) = 0 then
    raise exception 'FAIL ordinary_public_editorial_select';
  end if;
  if (select count(*) from public.faq_items where is_visible and deleted_at is null) = 0 then
    raise exception 'FAIL ordinary_public_faq_select';
  end if;
  if (select count(*) from public.faq_items where not is_visible or deleted_at is not null) <> 0 then
    raise exception 'FAIL ordinary_private_faq_select';
  end if;
  perform pg_temp.assert_no_editorial_mutation('ordinary');
end;
$$;
rollback to savepoint phase4d_ordinary;

savepoint phase4d_viewer;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
  if public.is_admin_panel_user() or public.has_admin_role('admin'::public.admin_role)
     or public.has_admin_role('superadmin'::public.admin_role) then
    raise exception 'FAIL viewer_editorial_write_gate';
  end if;
  perform pg_temp.assert_no_editorial_mutation('viewer');
end $$;
rollback to savepoint phase4d_viewer;

savepoint phase4d_moderator;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
  if public.is_admin_panel_user() or public.has_admin_role('admin'::public.admin_role)
     or public.has_admin_role('superadmin'::public.admin_role) then
    raise exception 'FAIL moderator_editorial_write_gate';
  end if;
  perform pg_temp.assert_no_editorial_mutation('moderator');
end $$;
rollback to savepoint phase4d_moderator;

-- Admin and superadmin retain SELECT/INSERT/UPDATE/DELETE through the canonical
-- ALL policy. Synthetic FAQ writes and content updates are rolled back.
savepoint phase4d_admin;
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',true);
set local role authenticated;
do $$
declare event_uuid uuid; category record; faq_uuid uuid; affected integer;
begin
  if not public.is_admin_panel_user() then raise exception 'FAIL admin_editorial_access'; end if;
  select id into event_uuid from public.events order by id limit 1;
  select id,event_id,key,label into category from public.faq_categories
    where event_id=event_uuid order by id limit 1;
  if event_uuid is null or category.id is null then raise exception 'FAIL faq_fixture_missing'; end if;

  insert into public.faq_items(event_id,slug,category_key,category_label,question,answer,category_id)
  values(event_uuid,'phase4d-admin-'||gen_random_uuid()::text,category.key,category.label,
    'phase4d admin','phase4d admin',category.id)
  returning id into faq_uuid;
  if not exists(select 1 from public.faq_items where id=faq_uuid) then
    raise exception 'FAIL admin_faq_select_after_insert';
  end if;
  update public.faq_items set question='phase4d admin updated' where id=faq_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL admin_faq_update'; end if;
  delete from public.faq_items where id=faq_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL admin_faq_delete'; end if;

  update public.home_page_content set updated_at=updated_at where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL admin_home_update'; end if;
  update public.event_archive_settings set updated_at=updated_at where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL admin_archive_update'; end if;

  insert into public.home_page_content(event_id) values(event_uuid)
    on conflict (event_id) do nothing;
  insert into public.event_archive_settings(event_id) values(event_uuid)
    on conflict (event_id) do nothing;

  delete from public.home_page_content where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL admin_home_delete'; end if;
  delete from public.event_archive_settings where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL admin_archive_delete'; end if;
end;
$$;
rollback to savepoint phase4d_admin;

savepoint phase4d_superadmin;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$
declare event_uuid uuid; affected integer;
begin
  if not public.is_admin_panel_user() or not public.is_superadmin()
     or not public.has_admin_role('admin'::public.admin_role)
     or not public.has_admin_role('superadmin'::public.admin_role) then
    raise exception 'FAIL superadmin_editorial_access';
  end if;
  select id into event_uuid from public.events order by id limit 1;
  update public.home_page_content set updated_at=updated_at where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL superadmin_home_update'; end if;
  update public.event_archive_settings set updated_at=updated_at where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL superadmin_archive_update'; end if;
  delete from public.home_page_content where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL superadmin_home_delete'; end if;
  delete from public.event_archive_settings where event_id=event_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL superadmin_archive_delete'; end if;
end;
$$;
rollback to savepoint phase4d_superadmin;
rollback;
