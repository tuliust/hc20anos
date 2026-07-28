-- ================================================================
-- Phase 2 — content and Storage structural validation
-- ================================================================

with checks as (
  select 'photos_bucket_private_and_limited' as check_name,
    exists(select 1 from storage.buckets where id='photos' and public=false and file_size_limit=10485760 and allowed_mime_types @> array['image/jpeg','image/png','image/webp']::text[] and not allowed_mime_types && array['image/heic','image/svg+xml']::text[]) as passed
  union all
  select 'public_asset_buckets_are_raster_only', not exists(
    select 1 from storage.buckets where id in ('avatars','cms-assets') and allowed_mime_types && array['image/svg+xml','image/gif','image/heic']::text[]
  )
  union all
  select 'direct_photo_storage_writes_removed', not exists(
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('photos_storage_upload','photos_storage_owner_delete')
  )
  union all
  select 'direct_public_asset_uploads_removed', not exists(
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('avatars_owner_upload','avatars_owner_update','cms_assets_storage_admin_write')
  )
  union all
  select 'controlled_photo_read_policy_exists', exists(
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='photos_storage_controlled_read'
  )
  union all
  select 'photo_integrity_columns_exist', (
    select count(*) from information_schema.columns where table_schema='public' and table_name='photos' and column_name in ('content_type','file_size_bytes','content_sha256','image_width','image_height','metadata_stripped','removed_at','removed_by_admin_id')
  )=8
  union all
  select 'active_photo_hash_is_unique', to_regclass('public.photos_active_content_hash_unique') is not null
  union all
  select 'open_removal_request_is_unique', to_regclass('public.photo_removal_one_open_request_per_user') is not null
  union all
  select 'moderation_history_exists', to_regclass('public.content_moderation_events') is not null
  union all
  select 'sanitization_triggers_exist', (
    select count(*) from pg_trigger where not tgisinternal and tgname in ('trg_photos_sanitize','trg_photo_comments_sanitize','trg_memories_sanitize','trg_photo_tags_sanitize','trg_photo_removal_requests_sanitize')
  )=5
  union all
  select 'phase2_rpcs_exist', (
    select count(distinct proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and proname in ('get_public_memories','create_uploaded_photo','submit_photo_comment','submit_memory','submit_photo_tag','submit_photo_removal_request','moderate_content_item','set_content_featured','reject_photo_removal_request','prepare_photo_removal','complete_photo_removal')
  )=11
  union all
  select 'anonymous_memory_table_read_removed', not exists(
    select 1 from pg_policies where schemaname='public' and tablename='memories' and policyname='memories_public_read'
  )
  union all
  select 'public_memory_rpc_is_available', has_function_privilege('anon','public.get_public_memories(uuid,boolean)','EXECUTE')
  union all
  select 'content_submission_rpcs_are_authenticated',
    not has_function_privilege('anon','public.submit_memory(uuid,uuid,text,boolean)','EXECUTE')
    and has_function_privilege('authenticated','public.submit_memory(uuid,uuid,text,boolean)','EXECUTE')
    and not has_function_privilege('anon','public.create_uploaded_photo(uuid,text,text,text,bigint,text,integer,integer,text,integer,text,jsonb,boolean)','EXECUTE')
  union all
  select 'completion_rpc_is_service_only',
    not has_function_privilege('authenticated','public.complete_photo_removal(uuid,boolean,text)','EXECUTE')
    and has_function_privilege('service_role','public.complete_photo_removal(uuid,boolean,text)','EXECUTE')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result from checks order by check_name;

select 'sanitizer_removes_markup' as check_name,
  case when public.sanitize_plain_text('<script>alert(1)</script> Memória <b>segura</b>',420)='Memória segura' then 'PASS' else 'FAIL' end as result;

select 'sanitizer_limits_text' as check_name,
  case when char_length(public.sanitize_plain_text(repeat('a',600),420))=420 then 'PASS' else 'FAIL' end as result;

-- Ordinary users cannot write directly after the RPC migration.
begin;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"authenticated-tests@local.invalid"}',true);
set local role authenticated;
with inserted as (
  insert into public.memories(event_id,user_id,author_name,memory_text,is_anonymous,status)
  values('00000000-0000-0000-0000-000000000001','22222222-2222-4222-8222-222222222222','Teste','Memória direta não autorizada',false,'pending')
  on conflict do nothing returning 1
)
select 'direct_memory_insert_blocked' as check_name, case when (select count(*) from inserted)=0 then 'PASS' else 'FAIL' end as result;
rollback;

-- The public RPC masks authorship and identifiers for anonymous memories.
begin;
insert into public.memories(id,event_id,user_id,person_id,author_name,memory_text,is_anonymous,status,is_featured)
values('99999999-9999-4999-8999-999999999901','00000000-0000-0000-0000-000000000001','22222222-2222-4222-8222-222222222222',null,'Nome privado','Uma lembrança anônima segura',true,'approved',false)
on conflict(id) do update set status='approved',is_anonymous=true,author_name='Nome privado';
set local role anon;
select 'anonymous_memory_identity_masked' as check_name,
  case when exists(select 1 from public.get_public_memories('00000000-0000-0000-0000-000000000001',false) m where m.id='99999999-9999-4999-8999-999999999901' and m.author_name is null and m.user_id is null and m.person_id is null) then 'PASS' else 'FAIL' end as result;
rollback;
