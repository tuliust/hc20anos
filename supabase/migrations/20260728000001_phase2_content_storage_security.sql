-- ================================================================
-- Phase 2 — content, Storage, moderation and abuse protection
-- ================================================================

-- Private photo objects accept only raster formats validated by the upload
-- function. HEIC is intentionally not accepted until a server-side decoder is
-- introduced and tested.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id in ('avatars', 'cms-assets');

-- Direct browser writes are removed. Uploads use the photo-storage Edge
-- Function, which validates bytes and writes with service_role only.
drop policy if exists "photos_storage_upload" on storage.objects;
drop policy if exists "photos_storage_owner_delete" on storage.objects;
drop policy if exists "photos_storage_admin_read" on storage.objects;
drop policy if exists "photos_storage_controlled_read" on storage.objects;
create policy "photos_storage_controlled_read" on storage.objects
  for select
  using (
    bucket_id = 'photos'
    and exists (
      select 1
      from public.photos p
      where p.storage_path = storage.objects.name
        and (
          p.status = 'approved'
          or p.uploaded_by_user_id = auth.uid()
          or exists (
            select 1 from public.admin_users au
            where au.user_id = auth.uid()
              and au.role in ('moderator','admin','superadmin')
          )
        )
    )
  );

alter table public.photos
  add column if not exists original_file_name text,
  add column if not exists content_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists content_sha256 text,
  add column if not exists image_width integer,
  add column if not exists image_height integer,
  add column if not exists metadata_stripped boolean not null default false,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by_admin_id uuid references public.admin_users(id) on delete set null;

alter table public.photo_removal_requests
  add column if not exists storage_deleted_at timestamptz,
  add column if not exists removal_error text;

alter table public.photos drop constraint if exists photos_content_type_valid;
alter table public.photos add constraint photos_content_type_valid
  check (content_type is null or content_type in ('image/jpeg','image/png','image/webp'));
alter table public.photos drop constraint if exists photos_file_size_valid;
alter table public.photos add constraint photos_file_size_valid
  check (file_size_bytes is null or file_size_bytes between 32 and 10485760);
alter table public.photos drop constraint if exists photos_dimensions_valid;
alter table public.photos add constraint photos_dimensions_valid
  check (
    (image_width is null and image_height is null)
    or (image_width between 1 and 12000 and image_height between 1 and 12000 and image_width::bigint * image_height::bigint <= 40000000)
  );
alter table public.photos drop constraint if exists photos_storage_owner_path;
alter table public.photos add constraint photos_storage_owner_path
  check (
    storage_path is null
    or uploaded_by_user_id is null
    or storage_path like uploaded_by_user_id::text || '/%'
  );
alter table public.photos drop constraint if exists photos_authorization_required;
alter table public.photos add constraint photos_authorization_required check (authorization_given = true);
alter table public.photos drop constraint if exists photos_caption_length;
alter table public.photos add constraint photos_caption_length check (caption is null or char_length(caption) <= 240);
alter table public.photos drop constraint if exists photos_location_length;
alter table public.photos add constraint photos_location_length check (location_text is null or char_length(location_text) <= 160);

create unique index if not exists photos_active_content_hash_unique
  on public.photos(event_id, uploaded_by_user_id, content_sha256)
  where content_sha256 is not null and status <> 'removed';
create unique index if not exists photo_removal_one_open_request_per_user
  on public.photo_removal_requests(photo_id, requester_user_id)
  where status in ('pending','hidden_preventively');

create table if not exists public.content_moderation_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  entity_type text not null check (entity_type in ('photo','photo_tag','photo_comment','memory','photo_removal_request')),
  entity_id uuid not null,
  previous_status text,
  new_status text not null,
  action text not null,
  notes text,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists content_moderation_events_entity_idx
  on public.content_moderation_events(entity_type, entity_id, created_at desc);
create index if not exists content_moderation_events_event_idx
  on public.content_moderation_events(event_id, created_at desc);
alter table public.content_moderation_events enable row level security;
revoke all on public.content_moderation_events from public, anon, authenticated;
drop policy if exists content_moderation_events_admin_read on public.content_moderation_events;
create policy content_moderation_events_admin_read on public.content_moderation_events
  for select to authenticated
  using (exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.role in ('moderator','admin','superadmin')
  ));
grant select on public.content_moderation_events to authenticated;

create or replace function public.sanitize_plain_text(p_value text, p_max_length integer)
returns text
language plpgsql immutable set search_path = public as $$
declare v_value text;
begin
  if p_value is null then return null; end if;
  if p_max_length < 1 then raise exception 'invalid_sanitization_limit'; end if;
  v_value := regexp_replace(p_value, '<(script|style)[^>]*>.*?</\\1>', ' ', 'gis');
  v_value := regexp_replace(v_value, '<[^>]+>', ' ', 'g');
  v_value := regexp_replace(v_value, '[[:cntrl:]]', ' ', 'g');
  v_value := regexp_replace(v_value, '\\s+', ' ', 'g');
  v_value := btrim(v_value);
  return left(v_value, p_max_length);
end;
$$;

create or replace function public.sanitize_content_row()
returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'photos' then
    new.caption := nullif(public.sanitize_plain_text(new.caption, 240), '');
    new.location_text := nullif(public.sanitize_plain_text(new.location_text, 160), '');
    new.uploaded_by_name := nullif(public.sanitize_plain_text(new.uploaded_by_name, 120), '');
    new.original_file_name := nullif(public.sanitize_plain_text(new.original_file_name, 180), '');
  elsif tg_table_name = 'photo_comments' then
    new.author_name := nullif(public.sanitize_plain_text(new.author_name, 120), '');
    new.comment_text := public.sanitize_plain_text(new.comment_text, 500);
    if char_length(new.comment_text) < 1 then raise exception 'comment_text_required'; end if;
  elsif tg_table_name = 'memories' then
    new.author_name := nullif(public.sanitize_plain_text(new.author_name, 120), '');
    new.memory_text := public.sanitize_plain_text(new.memory_text, 420);
    if char_length(new.memory_text) < 10 then raise exception 'memory_text_too_short'; end if;
  elsif tg_table_name = 'photo_tags' then
    new.tagged_name_snapshot := public.sanitize_plain_text(new.tagged_name_snapshot, 120);
    if char_length(new.tagged_name_snapshot) < 1 then raise exception 'tagged_name_required'; end if;
  elsif tg_table_name = 'photo_removal_requests' then
    new.requester_name := public.sanitize_plain_text(new.requester_name, 120);
    new.requester_email := lower(public.sanitize_plain_text(new.requester_email, 254));
    new.reason := public.sanitize_plain_text(new.reason, 1000);
    new.admin_notes := nullif(public.sanitize_plain_text(new.admin_notes, 1000), '');
    new.removal_error := nullif(public.sanitize_plain_text(new.removal_error, 500), '');
    if char_length(new.reason) < 10 then raise exception 'removal_reason_too_short'; end if;
  end if;
  return new;
end;
$$;

foreach_table:
do $$
declare t text;
begin
  foreach t in array array['photos','photo_comments','memories','photo_tags','photo_removal_requests'] loop
    execute format('drop trigger if exists trg_%s_sanitize on public.%I', t, t);
    execute format('create trigger trg_%s_sanitize before insert or update on public.%I for each row execute function public.sanitize_content_row()', t, t);
  end loop;
end $$;

alter table public.photo_comments drop constraint if exists photo_comments_text_length;
alter table public.photo_comments add constraint photo_comments_text_length check (char_length(comment_text) between 1 and 500);
alter table public.memories drop constraint if exists memories_text_length;
alter table public.memories add constraint memories_text_length check (char_length(memory_text) between 10 and 420);
alter table public.photo_tags drop constraint if exists photo_tags_name_length;
alter table public.photo_tags add constraint photo_tags_name_length check (char_length(tagged_name_snapshot) between 1 and 120);
alter table public.photo_removal_requests drop constraint if exists photo_removal_reason_length;
alter table public.photo_removal_requests add constraint photo_removal_reason_length check (char_length(reason) between 10 and 1000);

-- Public memory access is only available through a masking RPC. This prevents
-- direct exposure of author/user/person fields for anonymous memories.
drop policy if exists "memories_public_read" on public.memories;

create or replace function public.get_public_memories(
  p_event_id uuid,
  p_featured_only boolean default false
) returns setof public.memories
language sql stable security definer set search_path = public as $$
  select
    m.id,
    m.event_id,
    null::uuid as user_id,
    null::uuid as person_id,
    case when m.is_anonymous then null else m.author_name end as author_name,
    m.memory_text,
    m.is_anonymous,
    m.status,
    m.is_featured,
    null::uuid as approved_by_admin_id,
    m.approved_at,
    m.created_at,
    m.updated_at
  from public.memories m
  where m.event_id = p_event_id
    and m.status = 'approved'
    and (not p_featured_only or m.is_featured)
  order by m.is_featured desc, m.created_at desc;
$$;

create or replace function public.content_actor_name()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif(btrim((select p.display_name from public.profiles p where p.user_id = auth.uid() limit 1)), ''),
    nullif(split_part(coalesce(auth.jwt()->>'email',''), '@', 1), ''),
    'Ex-aluno'
  );
$$;

create or replace function public.create_uploaded_photo(
  p_event_id uuid,
  p_storage_path text,
  p_original_file_name text,
  p_content_type text,
  p_file_size_bytes bigint,
  p_content_sha256 text,
  p_image_width integer,
  p_image_height integer,
  p_caption text default null,
  p_year_approx integer default null,
  p_location_text text default null,
  p_tags jsonb default '[]'::jsonb,
  p_authorization_given boolean default false
) returns public.photos
language plpgsql security definer set search_path = public, storage as $$
declare v_photo public.photos; v_tag jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.enforce_rate_limit('photo_upload', 10, 3600, auth.uid()::text);
  if not p_authorization_given then raise exception 'photo_authorization_required'; end if;
  if p_content_type not in ('image/jpeg','image/png','image/webp') then raise exception 'image_type_not_allowed'; end if;
  if p_file_size_bytes not between 32 and 10485760 then raise exception 'image_size_invalid'; end if;
  if p_image_width not between 1 and 12000 or p_image_height not between 1 and 12000 or p_image_width::bigint * p_image_height::bigint > 40000000 then
    raise exception 'image_dimensions_invalid';
  end if;
  if p_storage_path not like auth.uid()::text || '/%' then raise exception 'storage_path_owner_mismatch'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='photos' and o.name=p_storage_path) then
    raise exception 'storage_object_not_found';
  end if;
  if not exists(select 1 from public.events e where e.id=p_event_id) then raise exception 'event_not_found'; end if;

  insert into public.photos(
    event_id,image_url,storage_path,caption,year_approx,location_text,
    uploaded_by_user_id,uploaded_by_name,authorization_given,status,
    original_file_name,content_type,file_size_bytes,content_sha256,
    image_width,image_height,metadata_stripped
  ) values (
    p_event_id,'',p_storage_path,p_caption,p_year_approx,p_location_text,
    auth.uid(),public.content_actor_name(),true,'pending',
    p_original_file_name,p_content_type,p_file_size_bytes,lower(p_content_sha256),
    p_image_width,p_image_height,true
  ) returning * into v_photo;

  if jsonb_typeof(coalesce(p_tags,'[]'::jsonb)) <> 'array' then raise exception 'invalid_photo_tags'; end if;
  for v_tag in select value from jsonb_array_elements(coalesce(p_tags,'[]'::jsonb)) loop
    insert into public.photo_tags(photo_id,person_id,tagged_name_snapshot,status,created_by_user_id)
    values(v_photo.id,(v_tag->>'person_id')::uuid,coalesce(v_tag->>'name',''),'pending',auth.uid())
    on conflict(photo_id,person_id) do nothing;
  end loop;

  perform public.write_security_audit('create_photo','photo',v_photo.id::text,null,
    jsonb_build_object('storage_path',p_storage_path,'content_type',p_content_type,'size',p_file_size_bytes,'width',p_image_width,'height',p_image_height));
  return v_photo;
exception when unique_violation then
  raise exception 'duplicate_photo_content' using errcode='23505';
end;
$$;

create or replace function public.submit_photo_comment(p_photo_id uuid, p_comment_text text)
returns public.photo_comments
language plpgsql security definer set search_path = public as $$
declare v_row public.photo_comments;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.enforce_rate_limit('photo_comment', 10, 60, auth.uid()::text);
  if not exists(select 1 from public.photos p where p.id=p_photo_id and p.status='approved') then raise exception 'photo_not_available'; end if;
  insert into public.photo_comments(photo_id,user_id,author_name,comment_text,status)
  values(p_photo_id,auth.uid(),public.content_actor_name(),p_comment_text,'pending') returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.submit_memory(
  p_event_id uuid,
  p_person_id uuid,
  p_memory_text text,
  p_is_anonymous boolean default false
) returns public.memories
language plpgsql security definer set search_path = public as $$
declare v_row public.memories;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.enforce_rate_limit('memory_submit', 5, 3600, auth.uid()::text);
  if not exists(select 1 from public.events e where e.id=p_event_id) then raise exception 'event_not_found'; end if;
  insert into public.memories(event_id,user_id,person_id,author_name,memory_text,is_anonymous,status,is_featured)
  values(p_event_id,auth.uid(),p_person_id,public.content_actor_name(),p_memory_text,coalesce(p_is_anonymous,false),'pending',false)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.submit_photo_tag(p_photo_id uuid, p_person_id uuid, p_tagged_name text)
returns public.photo_tags
language plpgsql security definer set search_path = public as $$
declare v_row public.photo_tags;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.enforce_rate_limit('photo_tag', 20, 3600, auth.uid()::text);
  if not exists(select 1 from public.photos p where p.id=p_photo_id and p.status='approved') then raise exception 'photo_not_available'; end if;
  insert into public.photo_tags(photo_id,person_id,tagged_name_snapshot,status,created_by_user_id)
  values(p_photo_id,p_person_id,p_tagged_name,'pending',auth.uid())
  on conflict(photo_id,person_id) do update set tagged_name_snapshot=excluded.tagged_name_snapshot
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.submit_photo_removal_request(
  p_photo_id uuid,
  p_requester_name text,
  p_requester_email text,
  p_reason text
) returns public.photo_removal_requests
language plpgsql security definer set search_path = public as $$
declare v_row public.photo_removal_requests;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.enforce_rate_limit('photo_removal_request', 5, 86400, auth.uid()::text);
  if not exists(select 1 from public.photos p where p.id=p_photo_id and p.status in ('approved','pending')) then raise exception 'photo_not_available'; end if;
  select * into v_row from public.photo_removal_requests r
  where r.photo_id=p_photo_id and r.requester_user_id=auth.uid() and r.status in ('pending','hidden_preventively')
  order by r.created_at desc limit 1;
  if found then return v_row; end if;
  insert into public.photo_removal_requests(photo_id,requester_user_id,requester_name,requester_email,reason,status)
  values(p_photo_id,auth.uid(),p_requester_name,p_requester_email,p_reason,'pending') returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.record_content_moderation(
  p_event_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_previous_status text,
  p_new_status text,
  p_action text,
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.content_moderation_events(event_id,entity_type,entity_id,previous_status,new_status,action,notes,actor_user_id,actor_role,metadata_json)
  values(p_event_id,p_entity_type,p_entity_id,p_previous_status,p_new_status,p_action,public.sanitize_plain_text(p_notes,1000),auth.uid(),public.current_security_role(),coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.moderate_content_item(
  p_entity_type text,
  p_entity_id uuid,
  p_status text,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_role text:=public.current_security_role(); v_previous text; v_event_id uuid; v_now timestamptz:=now();
begin
  if v_role not in ('moderator','admin','superadmin') then raise exception 'moderator_required'; end if;
  if p_entity_type='photo' then
    if p_status not in ('approved','rejected') then raise exception 'invalid_photo_moderation_status'; end if;
    select status::text,event_id into v_previous,v_event_id from public.photos where id=p_entity_id for update;
    if not found then raise exception 'content_not_found'; end if;
    update public.photos set status=p_status::photo_status,
      approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
      approved_at=case when p_status='approved' then v_now else null end
    where id=p_entity_id;
  elsif p_entity_type='photo_tag' then
    if p_status not in ('approved','rejected','removed') then raise exception 'invalid_tag_moderation_status'; end if;
    select t.status::text,p.event_id into v_previous,v_event_id from public.photo_tags t join public.photos p on p.id=t.photo_id where t.id=p_entity_id for update of t;
    if not found then raise exception 'content_not_found'; end if;
    update public.photo_tags set status=p_status::tag_status,
      approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
      approved_at=case when p_status='approved' then v_now else null end
    where id=p_entity_id;
  elsif p_entity_type='photo_comment' then
    if p_status not in ('approved','rejected','hidden') then raise exception 'invalid_comment_moderation_status'; end if;
    select c.status,p.event_id into v_previous,v_event_id from public.photo_comments c join public.photos p on p.id=c.photo_id where c.id=p_entity_id for update of c;
    if not found then raise exception 'content_not_found'; end if;
    update public.photo_comments set status=p_status,
      approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
      approved_at=case when p_status='approved' then v_now else null end
    where id=p_entity_id;
  elsif p_entity_type='memory' then
    if p_status not in ('approved','rejected','hidden') then raise exception 'invalid_memory_moderation_status'; end if;
    select status,event_id into v_previous,v_event_id from public.memories where id=p_entity_id for update;
    if not found then raise exception 'content_not_found'; end if;
    update public.memories set status=p_status,
      approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
      approved_at=case when p_status='approved' then v_now else null end
    where id=p_entity_id;
  else raise exception 'invalid_content_entity_type'; end if;

  perform public.record_content_moderation(v_event_id,p_entity_type,p_entity_id,v_previous,p_status,'moderate',p_notes);
  return jsonb_build_object('entity_type',p_entity_type,'entity_id',p_entity_id,'previous_status',v_previous,'status',p_status);
end;
$$;

create or replace function public.set_content_featured(
  p_entity_type text,
  p_entity_id uuid,
  p_featured boolean,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_role text:=public.current_security_role(); v_event_id uuid; v_status text;
begin
  if v_role not in ('moderator','admin','superadmin') then raise exception 'moderator_required'; end if;
  if p_entity_type='photo' then
    select event_id,status::text into v_event_id,v_status from public.photos where id=p_entity_id for update;
    if not found then raise exception 'content_not_found'; end if;
    if p_featured and v_status<>'approved' then raise exception 'content_must_be_approved'; end if;
    update public.photos set is_featured=p_featured,
      featured_by_admin_id=case when p_featured then auth.uid() else null end,
      featured_at=case when p_featured then now() else null end where id=p_entity_id;
  elsif p_entity_type='memory' then
    select event_id,status into v_event_id,v_status from public.memories where id=p_entity_id for update;
    if not found then raise exception 'content_not_found'; end if;
    if p_featured and v_status<>'approved' then raise exception 'content_must_be_approved'; end if;
    update public.memories set is_featured=p_featured where id=p_entity_id;
  else raise exception 'invalid_feature_entity_type'; end if;
  perform public.record_content_moderation(v_event_id,p_entity_type,p_entity_id,v_status,v_status,case when p_featured then 'feature' else 'unfeature' end,p_notes);
  return jsonb_build_object('entity_type',p_entity_type,'entity_id',p_entity_id,'featured',p_featured);
end;
$$;

create or replace function public.reject_photo_removal_request(p_request_id uuid, p_notes text default null)
returns public.photo_removal_requests
language plpgsql security definer set search_path = public as $$
declare v_role text:=public.current_security_role(); v_row public.photo_removal_requests; v_event_id uuid; v_previous text;
begin
  if v_role not in ('admin','superadmin') then raise exception 'admin_required'; end if;
  select r.*,p.event_id into v_row,v_event_id from public.photo_removal_requests r join public.photos p on p.id=r.photo_id where r.id=p_request_id for update of r;
  if not found then raise exception 'removal_request_not_found'; end if;
  v_previous:=v_row.status::text;
  update public.photo_removal_requests set status='rejected',reviewed_by_admin_id=(select id from public.admin_users where user_id=auth.uid()),reviewed_at=now(),admin_notes=p_notes,removal_error=null where id=p_request_id returning * into v_row;
  perform public.record_content_moderation(v_event_id,'photo_removal_request',p_request_id,v_previous,'rejected','reject_removal',p_notes,jsonb_build_object('photo_id',v_row.photo_id));
  return v_row;
end;
$$;

create or replace function public.prepare_photo_removal(p_request_id uuid, p_notes text default null)
returns table(request_id uuid, photo_id uuid, storage_path text)
language plpgsql security definer set search_path = public as $$
declare v_role text:=public.current_security_role(); v_request public.photo_removal_requests; v_photo public.photos; v_admin_id uuid;
begin
  if v_role not in ('admin','superadmin') then raise exception 'admin_required'; end if;
  select id into v_admin_id from public.admin_users where user_id=auth.uid();
  select * into v_request from public.photo_removal_requests where id=p_request_id for update;
  if not found then raise exception 'removal_request_not_found'; end if;
  if v_request.status='approved' then
    return query select v_request.id,v_request.photo_id,(select p.storage_path from public.photos p where p.id=v_request.photo_id);
    return;
  end if;
  select * into v_photo from public.photos where id=v_request.photo_id for update;
  if not found then raise exception 'photo_not_found'; end if;
  update public.photo_removal_requests set status='hidden_preventively',reviewed_by_admin_id=v_admin_id,reviewed_at=now(),admin_notes=p_notes,removal_error=null where id=p_request_id;
  update public.photos set status='removed',is_featured=false,featured_by_admin_id=null,featured_at=null,removed_at=now(),removed_by_admin_id=v_admin_id where id=v_photo.id;
  update public.photo_comments set status='hidden',approved_by_admin_id=null,approved_at=null where photo_id=v_photo.id and status<>'hidden';
  update public.photo_tags set status='removed',approved_by_admin_id=null,approved_at=null where photo_id=v_photo.id and status<>'removed';
  perform public.record_content_moderation(v_photo.event_id,'photo_removal_request',p_request_id,v_request.status::text,'hidden_preventively','prepare_removal',p_notes,jsonb_build_object('photo_id',v_photo.id,'storage_path',v_photo.storage_path));
  perform public.record_content_moderation(v_photo.event_id,'photo',v_photo.id,v_photo.status::text,'removed','remove',p_notes,jsonb_build_object('request_id',p_request_id));
  return query select v_request.id,v_photo.id,v_photo.storage_path;
end;
$$;

create or replace function public.complete_photo_removal(
  p_request_id uuid,
  p_success boolean,
  p_error text default null
) returns public.photo_removal_requests
language plpgsql security definer set search_path = public as $$
declare v_row public.photo_removal_requests; v_event_id uuid; v_previous text;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'service_role_required'; end if;
  select r.*,p.event_id into v_row,v_event_id from public.photo_removal_requests r join public.photos p on p.id=r.photo_id where r.id=p_request_id for update of r;
  if not found then raise exception 'removal_request_not_found'; end if;
  v_previous:=v_row.status::text;
  update public.photo_removal_requests set
    status=case when p_success then 'approved'::removal_request_status else 'hidden_preventively'::removal_request_status end,
    storage_deleted_at=case when p_success then now() else storage_deleted_at end,
    removal_error=case when p_success then null else coalesce(p_error,'storage_delete_failed') end,
    updated_at=now()
  where id=p_request_id returning * into v_row;
  insert into public.content_moderation_events(event_id,entity_type,entity_id,previous_status,new_status,action,notes,actor_role,metadata_json)
  values(v_event_id,'photo_removal_request',p_request_id,v_previous,v_row.status::text,case when p_success then 'complete_removal' else 'removal_failed' end,public.sanitize_plain_text(p_error,500),'service_role',jsonb_build_object('photo_id',v_row.photo_id));
  return v_row;
end;
$$;

-- Content writes now go through rate-limited, sanitizing RPCs.
drop policy if exists "photos_auth_insert" on public.photos;
drop policy if exists "photo_tags_auth_insert" on public.photo_tags;
drop policy if exists "photo_comments_auth_insert" on public.photo_comments;
drop policy if exists "memories_auth_insert" on public.memories;
drop policy if exists "removal_requests_auth_insert" on public.photo_removal_requests;

-- Moderators can inspect queues; mutations are centralized in RPCs.
drop policy if exists photos_moderator_read on public.photos;
create policy photos_moderator_read on public.photos for select to authenticated
  using (exists(select 1 from public.admin_users au where au.user_id=auth.uid() and au.role in ('moderator','admin','superadmin')));
drop policy if exists photo_tags_moderator_read on public.photo_tags;
create policy photo_tags_moderator_read on public.photo_tags for select to authenticated
  using (exists(select 1 from public.admin_users au where au.user_id=auth.uid() and au.role in ('moderator','admin','superadmin')));
drop policy if exists removal_requests_moderator_read on public.photo_removal_requests;
create policy removal_requests_moderator_read on public.photo_removal_requests for select to authenticated
  using (exists(select 1 from public.admin_users au where au.user_id=auth.uid() and au.role in ('moderator','admin','superadmin')));

revoke execute on function public.get_public_memories(uuid,boolean) from public;
revoke execute on function public.content_actor_name() from public,anon,authenticated;
revoke execute on function public.create_uploaded_photo(uuid,text,text,text,bigint,text,integer,integer,text,integer,text,jsonb,boolean) from public,anon;
revoke execute on function public.submit_photo_comment(uuid,text) from public,anon;
revoke execute on function public.submit_memory(uuid,uuid,text,boolean) from public,anon;
revoke execute on function public.submit_photo_tag(uuid,uuid,text) from public,anon;
revoke execute on function public.submit_photo_removal_request(uuid,text,text,text) from public,anon;
revoke execute on function public.record_content_moderation(uuid,text,uuid,text,text,text,text,jsonb) from public,anon,authenticated;
revoke execute on function public.moderate_content_item(text,uuid,text,text) from public,anon;
revoke execute on function public.set_content_featured(text,uuid,boolean,text) from public,anon;
revoke execute on function public.reject_photo_removal_request(uuid,text) from public,anon;
revoke execute on function public.prepare_photo_removal(uuid,text) from public,anon;
revoke execute on function public.complete_photo_removal(uuid,boolean,text) from public,anon,authenticated;

grant execute on function public.get_public_memories(uuid,boolean) to anon,authenticated;
grant execute on function public.create_uploaded_photo(uuid,text,text,text,bigint,text,integer,integer,text,integer,text,jsonb,boolean) to authenticated;
grant execute on function public.submit_photo_comment(uuid,text) to authenticated;
grant execute on function public.submit_memory(uuid,uuid,text,boolean) to authenticated;
grant execute on function public.submit_photo_tag(uuid,uuid,text) to authenticated;
grant execute on function public.submit_photo_removal_request(uuid,text,text,text) to authenticated;
grant execute on function public.moderate_content_item(text,uuid,text,text) to authenticated;
grant execute on function public.set_content_featured(text,uuid,boolean,text) to authenticated;
grant execute on function public.reject_photo_removal_request(uuid,text) to authenticated;
grant execute on function public.prepare_photo_removal(uuid,text) to authenticated;
grant execute on function public.complete_photo_removal(uuid,boolean,text) to service_role;

notify pgrst, 'reload schema';
