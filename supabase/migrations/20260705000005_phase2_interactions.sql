-- ================================================================
-- Turma 2006 — Migration 006: Phase 2 interactions
-- Likes, comments and memories for the photo wall and alumni content.
-- ================================================================

-- Photo highlights used by the mural, archive and admin curation.
alter table photos add column if not exists is_featured boolean not null default false;
alter table photos add column if not exists featured_by_admin_id uuid references auth.users(id) on delete set null;
alter table photos add column if not exists featured_at timestamptz;

-- Photo likes. One like per authenticated user per photo.
create table if not exists photo_likes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(photo_id, user_id)
);

create index if not exists idx_photo_likes_photo_id on photo_likes(photo_id);
create index if not exists idx_photo_likes_user_id on photo_likes(user_id);

-- Photo comments. New comments are moderated before public display.
create table if not exists photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text,
  comment_text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  approved_by_admin_id uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_photo_comments_photo_id on photo_comments(photo_id);
create index if not exists idx_photo_comments_user_id on photo_comments(user_id);
create index if not exists idx_photo_comments_status on photo_comments(status);
create index if not exists idx_photo_comments_created_at on photo_comments(created_at desc);

drop trigger if exists trg_photo_comments_updated_at on photo_comments;
create trigger trg_photo_comments_updated_at
  before update on photo_comments
  for each row execute function fn_set_updated_at();

-- Memories. Authenticated alumni may submit short memories for moderation.
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  person_id uuid references people(id) on delete set null,
  author_name text,
  memory_text text not null,
  is_anonymous boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  is_featured boolean not null default false,
  approved_by_admin_id uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_memories_event_id on memories(event_id);
create index if not exists idx_memories_user_id on memories(user_id);
create index if not exists idx_memories_person_id on memories(person_id);
create index if not exists idx_memories_status on memories(status);
create index if not exists idx_memories_featured on memories(is_featured) where is_featured = true;
create index if not exists idx_memories_created_at on memories(created_at desc);

drop trigger if exists trg_memories_updated_at on memories;
create trigger trg_memories_updated_at
  before update on memories
  for each row execute function fn_set_updated_at();

-- ================================================================
-- RLS
-- ================================================================

alter table photo_likes enable row level security;
alter table photo_comments enable row level security;
alter table memories enable row level security;

-- photo_likes policies

drop policy if exists "photo_likes_public_read" on photo_likes;
create policy "photo_likes_public_read" on photo_likes
  for select using (true);

drop policy if exists "photo_likes_auth_insert" on photo_likes;
create policy "photo_likes_auth_insert" on photo_likes
  for insert with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "photo_likes_owner_delete" on photo_likes;
create policy "photo_likes_owner_delete" on photo_likes
  for delete using (user_id = auth.uid());

drop policy if exists "photo_likes_admin_all" on photo_likes;
create policy "photo_likes_admin_all" on photo_likes
  for all using (is_admin()) with check (is_admin());

-- photo_comments policies

drop policy if exists "photo_comments_public_read" on photo_comments;
create policy "photo_comments_public_read" on photo_comments
  for select using (status = 'approved');

drop policy if exists "photo_comments_owner_read" on photo_comments;
create policy "photo_comments_owner_read" on photo_comments
  for select using (user_id = auth.uid());

drop policy if exists "photo_comments_auth_insert" on photo_comments;
create policy "photo_comments_auth_insert" on photo_comments
  for insert with check (auth.uid() is not null and user_id = auth.uid() and status = 'pending');

drop policy if exists "photo_comments_moderator_read" on photo_comments;
create policy "photo_comments_moderator_read" on photo_comments
  for select using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "photo_comments_moderator_update" on photo_comments;
create policy "photo_comments_moderator_update" on photo_comments
  for update using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "photo_comments_admin_delete" on photo_comments;
create policy "photo_comments_admin_delete" on photo_comments
  for delete using (has_admin_role('admin') or has_admin_role('superadmin'));

-- memories policies

drop policy if exists "memories_public_read" on memories;
create policy "memories_public_read" on memories
  for select using (status = 'approved');

drop policy if exists "memories_owner_read" on memories;
create policy "memories_owner_read" on memories
  for select using (user_id = auth.uid());

drop policy if exists "memories_auth_insert" on memories;
create policy "memories_auth_insert" on memories
  for insert with check (auth.uid() is not null and user_id = auth.uid() and status = 'pending');

drop policy if exists "memories_moderator_read" on memories;
create policy "memories_moderator_read" on memories
  for select using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "memories_moderator_update" on memories;
create policy "memories_moderator_update" on memories
  for update using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "memories_admin_delete" on memories;
create policy "memories_admin_delete" on memories
  for delete using (has_admin_role('admin') or has_admin_role('superadmin'));
