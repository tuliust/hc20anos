-- ================================================================
-- Header visibility controls
-- Turma 2006 — Colégio Henrique Castriciano
-- ================================================================

alter table public.home_page_content
  add column if not exists header_cta_visible boolean not null default true,
  add column if not exists header_auth_visible boolean not null default true,
  add column if not exists nav_home_visible boolean not null default true,
  add column if not exists nav_event_visible boolean not null default true,
  add column if not exists nav_who_going_visible boolean not null default true,
  add column if not exists nav_the_class_visible boolean not null default true,
  add column if not exists nav_photos_visible boolean not null default true,
  add column if not exists nav_memories_visible boolean not null default true,
  add column if not exists nav_polls_visible boolean not null default true,
  add column if not exists nav_where_now_visible boolean not null default true,
  add column if not exists nav_archive_visible boolean not null default true;

update public.home_page_content
set
  header_cta_visible = coalesce(header_cta_visible, true),
  header_auth_visible = coalesce(header_auth_visible, true),
  nav_home_visible = coalesce(nav_home_visible, true),
  nav_event_visible = coalesce(nav_event_visible, true),
  nav_who_going_visible = coalesce(nav_who_going_visible, true),
  nav_the_class_visible = coalesce(nav_the_class_visible, true),
  nav_photos_visible = coalesce(nav_photos_visible, true),
  nav_memories_visible = coalesce(nav_memories_visible, true),
  nav_polls_visible = coalesce(nav_polls_visible, true),
  nav_where_now_visible = coalesce(nav_where_now_visible, true),
  nav_archive_visible = coalesce(nav_archive_visible, true)
where event_id = '00000000-0000-0000-0000-000000000001';
