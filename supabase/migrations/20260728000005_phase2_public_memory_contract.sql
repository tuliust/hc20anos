-- ================================================================
-- Phase 2 — explicit public contract for memories
-- ================================================================

-- Avoid returning the table composite type. The public contract is explicit,
-- stable and always masks internal ownership fields.
drop function if exists public.get_public_memories(uuid, boolean);

create function public.get_public_memories(
  p_event_id uuid,
  p_featured_only boolean default false
) returns table (
  id uuid,
  event_id uuid,
  user_id uuid,
  person_id uuid,
  author_name text,
  memory_text text,
  is_anonymous boolean,
  status text,
  is_featured boolean,
  approved_by_admin_id uuid,
  approved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
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

revoke execute on function public.get_public_memories(uuid,boolean) from public;
grant execute on function public.get_public_memories(uuid,boolean) to anon,authenticated;

notify pgrst, 'reload schema';
