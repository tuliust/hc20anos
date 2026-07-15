-- Fluxo editorial do Admin: aprovação automática configurável.

alter table public.home_page_content
  add column if not exists event_info_view_more_label text not null default '';

alter table public.event_archive_settings
  add column if not exists page_eyebrow text not null default 'Pós-festa',
  add column if not exists page_title text not null default 'Memórias do reencontro',
  add column if not exists message_label text not null default 'Mensagem da organização',
  add column if not exists closed_title text not null default 'O acervo será aberto depois do reencontro.',
  add column if not exists closed_text text not null default 'Depois do evento, esta página reunirá os registros e lembranças aprovados pela organização.';

create table if not exists public.content_moderation_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  auto_approve_photos boolean not null default false,
  auto_approve_comments boolean not null default false,
  auto_approve_memories boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.content_moderation_settings enable row level security;

drop policy if exists content_moderation_settings_admin_read on public.content_moderation_settings;
create policy content_moderation_settings_admin_read on public.content_moderation_settings
  for select to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop policy if exists content_moderation_settings_admin_write on public.content_moderation_settings;
create policy content_moderation_settings_admin_write on public.content_moderation_settings
  for all to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid() and au.role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid() and au.role in ('admin', 'superadmin')));

grant select, insert, update on public.content_moderation_settings to authenticated;

insert into public.content_moderation_settings (event_id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (event_id) do nothing;

create or replace function public.apply_automatic_content_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  should_approve boolean := false;
  target_event_id uuid;
begin
  if tg_table_name = 'photo_comments' then
    select p.event_id into target_event_id from public.photos p where p.id = new.photo_id;
    select coalesce(s.auto_approve_comments, false) into should_approve from public.content_moderation_settings s where s.event_id = target_event_id;
  elsif tg_table_name = 'photos' then
    target_event_id := new.event_id;
    select coalesce(s.auto_approve_photos, false) into should_approve from public.content_moderation_settings s where s.event_id = target_event_id;
  elsif tg_table_name = 'memories' then
    target_event_id := new.event_id;
    select coalesce(s.auto_approve_memories, false) into should_approve from public.content_moderation_settings s where s.event_id = target_event_id;
  end if;

  if should_approve then
    if tg_table_name = 'photo_comments' then
      update public.photo_comments set status = 'approved', approved_at = now() where id = new.id;
    elsif tg_table_name = 'photos' then
      update public.photos set status = 'approved', approved_at = now() where id = new.id;
    elsif tg_table_name = 'memories' then
      update public.memories set status = 'approved', approved_at = now() where id = new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_approve_photos on public.photos;
create trigger trg_auto_approve_photos after insert on public.photos
for each row execute function public.apply_automatic_content_approval();

drop trigger if exists trg_auto_approve_photo_comments on public.photo_comments;
create trigger trg_auto_approve_photo_comments after insert on public.photo_comments
for each row execute function public.apply_automatic_content_approval();

drop trigger if exists trg_auto_approve_memories on public.memories;
create trigger trg_auto_approve_memories after insert on public.memories
for each row execute function public.apply_automatic_content_approval();

notify pgrst, 'reload schema';
