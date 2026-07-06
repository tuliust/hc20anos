-- ================================================================
-- Turma 2006 - Migration 008: archive settings and profile avatars
-- ================================================================

create table if not exists event_archive_settings (
  event_id uuid primary key references events(id) on delete cascade,
  archive_enabled boolean not null default false,
  post_event_text text,
  official_video_url text,
  official_video_title text,
  official_photo_ids uuid[] not null default '{}',
  highlight_photo_ids uuid[] not null default '{}',
  highlights_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_event_archive_settings_updated_at on event_archive_settings;
create trigger trg_event_archive_settings_updated_at
  before update on event_archive_settings
  for each row execute function fn_set_updated_at();

alter table event_archive_settings enable row level security;

drop policy if exists "event_archive_settings_public_read" on event_archive_settings;
create policy "event_archive_settings_public_read" on event_archive_settings
  for select using (true);

drop policy if exists "event_archive_settings_admin_all" on event_archive_settings;
create policy "event_archive_settings_admin_all" on event_archive_settings
  for all using (has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('admin') or has_admin_role('superadmin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg','image/jpg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_upload" on storage.objects;
create policy "avatars_owner_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
