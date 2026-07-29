-- ================================================================
-- Phase 2 — reviewer foreign key and sanitizer corrections
-- ================================================================

create or replace function public.sanitize_plain_text(p_value text, p_max_length integer)
returns text
language plpgsql immutable set search_path = public as $$
declare v_value text;
begin
  if p_value is null then return null; end if;
  if p_max_length < 1 then raise exception 'invalid_sanitization_limit'; end if;
  v_value := regexp_replace(p_value, '<script[^>]*>.*?</script>', ' ', 'gis');
  v_value := regexp_replace(v_value, '<style[^>]*>.*?</style>', ' ', 'gis');
  v_value := regexp_replace(v_value, '<[^>]+>', ' ', 'g');
  v_value := regexp_replace(v_value, '[[:cntrl:]]', ' ', 'g');
  v_value := regexp_replace(v_value, '\s+', ' ', 'g');
  v_value := btrim(v_value);
  return left(v_value, p_max_length);
end;
$$;

create or replace function public.reject_photo_removal_request(p_request_id uuid, p_notes text default null)
returns public.photo_removal_requests
language plpgsql security definer set search_path = public as $$
declare
  v_role text:=public.current_security_role();
  v_row public.photo_removal_requests;
  v_event_id uuid;
  v_previous text;
begin
  if v_role not in ('admin','superadmin') then raise exception 'admin_required'; end if;
  select * into v_row
  from public.photo_removal_requests
  where id=p_request_id
  for update;
  if not found then raise exception 'removal_request_not_found'; end if;
  select p.event_id into v_event_id from public.photos p where p.id=v_row.photo_id;
  v_previous:=v_row.status::text;
  update public.photo_removal_requests
  set status='rejected',
      reviewed_by_admin_id=auth.uid(),
      reviewed_at=now(),
      admin_notes=p_notes,
      removal_error=null
  where id=p_request_id
  returning * into v_row;
  perform public.record_content_moderation(
    v_event_id,'photo_removal_request',p_request_id,v_previous,'rejected',
    'reject_removal',p_notes,jsonb_build_object('photo_id',v_row.photo_id)
  );
  return v_row;
end;
$$;

create or replace function public.prepare_photo_removal(p_request_id uuid, p_notes text default null)
returns table(request_id uuid, photo_id uuid, storage_path text)
language plpgsql security definer set search_path = public as $$
declare
  v_role text:=public.current_security_role();
  v_request public.photo_removal_requests;
  v_photo public.photos;
  v_admin_id uuid;
begin
  if v_role not in ('admin','superadmin') then raise exception 'admin_required'; end if;
  select id into v_admin_id from public.admin_users where user_id=auth.uid();
  if v_admin_id is null then raise exception 'admin_required'; end if;

  select * into v_request
  from public.photo_removal_requests
  where id=p_request_id
  for update;
  if not found then raise exception 'removal_request_not_found'; end if;

  if v_request.status='approved' then
    return query
      select v_request.id,v_request.photo_id,p.storage_path
      from public.photos p where p.id=v_request.photo_id;
    return;
  end if;

  select * into v_photo from public.photos where id=v_request.photo_id for update;
  if not found then raise exception 'photo_not_found'; end if;

  update public.photo_removal_requests
  set status='hidden_preventively',
      reviewed_by_admin_id=auth.uid(),
      reviewed_at=now(),
      admin_notes=p_notes,
      removal_error=null
  where id=p_request_id;

  update public.photos
  set status='removed',
      is_featured=false,
      featured_by_admin_id=null,
      featured_at=null,
      removed_at=now(),
      removed_by_admin_id=v_admin_id
  where id=v_photo.id;

  update public.photo_comments
  set status='hidden',approved_by_admin_id=null,approved_at=null
  where photo_id=v_photo.id and status<>'hidden';

  update public.photo_tags
  set status='removed',approved_by_admin_id=null,approved_at=null
  where photo_id=v_photo.id and status<>'removed';

  perform public.record_content_moderation(
    v_photo.event_id,'photo_removal_request',p_request_id,v_request.status::text,
    'hidden_preventively','prepare_removal',p_notes,
    jsonb_build_object('photo_id',v_photo.id,'storage_path',v_photo.storage_path)
  );
  perform public.record_content_moderation(
    v_photo.event_id,'photo',v_photo.id,v_photo.status::text,
    'removed','remove',p_notes,jsonb_build_object('request_id',p_request_id)
  );
  return query select v_request.id,v_photo.id,v_photo.storage_path;
end;
$$;

revoke execute on function public.reject_photo_removal_request(uuid,text) from public,anon;
revoke execute on function public.prepare_photo_removal(uuid,text) from public,anon;
grant execute on function public.reject_photo_removal_request(uuid,text) to authenticated;
grant execute on function public.prepare_photo_removal(uuid,text) to authenticated;

notify pgrst, 'reload schema';
