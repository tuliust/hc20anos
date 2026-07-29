-- ================================================================
-- Phase 2 — qualify removal columns against output parameters
-- ================================================================
-- prepare_photo_removal returns a column named photo_id. In PL/pgSQL that
-- output parameter is also a variable, so unqualified photo_id references in
-- UPDATE predicates are ambiguous. Qualify every table column explicitly.

create or replace function public.prepare_photo_removal(
  p_request_id uuid,
  p_notes text default null
) returns table(request_id uuid, photo_id uuid, storage_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_security_role();
  v_request public.photo_removal_requests;
  v_photo public.photos;
  v_admin_id uuid;
begin
  if v_role not in ('admin','superadmin') then raise exception 'admin_required'; end if;

  select au.id into v_admin_id
  from public.admin_users au
  where au.user_id = auth.uid();
  if v_admin_id is null then raise exception 'admin_required'; end if;

  select r.* into v_request
  from public.photo_removal_requests r
  where r.id = p_request_id
  for update;
  if not found then raise exception 'removal_request_not_found'; end if;

  if v_request.status = 'approved' then
    return query
      select v_request.id, v_request.photo_id, p.storage_path
      from public.photos p
      where p.id = v_request.photo_id;
    return;
  end if;

  select p.* into v_photo
  from public.photos p
  where p.id = v_request.photo_id
  for update;
  if not found then raise exception 'photo_not_found'; end if;

  update public.photo_removal_requests r
  set status = 'hidden_preventively',
      reviewed_by_admin_id = v_admin_id,
      reviewed_at = now(),
      admin_notes = p_notes,
      removal_error = null
  where r.id = p_request_id;

  update public.photos p
  set status = 'removed',
      is_featured = false,
      featured_by_admin_id = null,
      featured_at = null,
      removed_at = now(),
      removed_by_admin_id = v_admin_id
  where p.id = v_photo.id;

  update public.photo_comments c
  set status = 'hidden',
      approved_by_admin_id = null,
      approved_at = null
  where c.photo_id = v_photo.id
    and c.status <> 'hidden';

  update public.photo_tags t
  set status = 'removed',
      approved_by_admin_id = null,
      approved_at = null
  where t.photo_id = v_photo.id
    and t.status <> 'removed';

  perform public.record_content_moderation(
    v_photo.event_id,
    'photo_removal_request',
    p_request_id,
    v_request.status::text,
    'hidden_preventively',
    'prepare_removal',
    p_notes,
    jsonb_build_object('photo_id', v_photo.id, 'storage_path', v_photo.storage_path)
  );

  perform public.record_content_moderation(
    v_photo.event_id,
    'photo',
    v_photo.id,
    v_photo.status::text,
    'removed',
    'remove',
    p_notes,
    jsonb_build_object('request_id', p_request_id)
  );

  return query select v_request.id, v_photo.id, v_photo.storage_path;
end;
$$;

revoke execute on function public.prepare_photo_removal(uuid,text) from public, anon;
grant execute on function public.prepare_photo_removal(uuid,text) to authenticated;

notify pgrst, 'reload schema';
