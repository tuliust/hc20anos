-- ================================================================
-- Phase 2 — deterministic moderation transitions under concurrency
-- ================================================================

create or replace function public.assert_content_moderation_transition(
  p_entity_type text,
  p_previous_status text,
  p_new_status text
) returns boolean
language plpgsql immutable set search_path = public as $$
begin
  if p_previous_status = p_new_status then return false; end if;
  if p_previous_status = 'pending' then return true; end if;
  if p_entity_type in ('photo_comment','memory') and p_previous_status='approved' and p_new_status='hidden' then return true; end if;
  if p_entity_type in ('photo_comment','memory') and p_previous_status='hidden' and p_new_status='approved' then return true; end if;
  if p_entity_type='photo_tag' and p_previous_status='approved' and p_new_status='removed' then return true; end if;
  if p_entity_type='photo_tag' and p_previous_status='removed' and p_new_status='approved' then return true; end if;
  raise exception 'content_already_moderated' using errcode='P0001';
end;
$$;

create or replace function public.moderate_content_item(
  p_entity_type text,
  p_entity_id uuid,
  p_status text,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_role text:=public.current_security_role();
  v_previous text;
  v_event_id uuid;
  v_now timestamptz:=now();
  v_changed boolean;
begin
  if v_role not in ('moderator','admin','superadmin') then raise exception 'moderator_required'; end if;

  if p_entity_type='photo' then
    if p_status not in ('approved','rejected') then raise exception 'invalid_photo_moderation_status'; end if;
    select status::text,event_id into v_previous,v_event_id from public.photos where id=p_entity_id for update;
    if not found then raise exception 'content_not_found'; end if;
    v_changed:=public.assert_content_moderation_transition(p_entity_type,v_previous,p_status);
    if v_changed then
      update public.photos set status=p_status::photo_status,
        approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
        approved_at=case when p_status='approved' then v_now else null end
      where id=p_entity_id;
    end if;
  elsif p_entity_type='photo_tag' then
    if p_status not in ('approved','rejected','removed') then raise exception 'invalid_tag_moderation_status'; end if;
    select t.status::text,p.event_id into v_previous,v_event_id from public.photo_tags t join public.photos p on p.id=t.photo_id where t.id=p_entity_id for update of t;
    if not found then raise exception 'content_not_found'; end if;
    v_changed:=public.assert_content_moderation_transition(p_entity_type,v_previous,p_status);
    if v_changed then
      update public.photo_tags set status=p_status::tag_status,
        approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
        approved_at=case when p_status='approved' then v_now else null end
      where id=p_entity_id;
    end if;
  elsif p_entity_type='photo_comment' then
    if p_status not in ('approved','rejected','hidden') then raise exception 'invalid_comment_moderation_status'; end if;
    select c.status,p.event_id into v_previous,v_event_id from public.photo_comments c join public.photos p on p.id=c.photo_id where c.id=p_entity_id for update of c;
    if not found then raise exception 'content_not_found'; end if;
    v_changed:=public.assert_content_moderation_transition(p_entity_type,v_previous,p_status);
    if v_changed then
      update public.photo_comments set status=p_status,
        approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
        approved_at=case when p_status='approved' then v_now else null end
      where id=p_entity_id;
    end if;
  elsif p_entity_type='memory' then
    if p_status not in ('approved','rejected','hidden') then raise exception 'invalid_memory_moderation_status'; end if;
    select status,event_id into v_previous,v_event_id from public.memories where id=p_entity_id for update;
    if not found then raise exception 'content_not_found'; end if;
    v_changed:=public.assert_content_moderation_transition(p_entity_type,v_previous,p_status);
    if v_changed then
      update public.memories set status=p_status,
        approved_by_admin_id=case when p_status='approved' then auth.uid() else null end,
        approved_at=case when p_status='approved' then v_now else null end
      where id=p_entity_id;
    end if;
  else
    raise exception 'invalid_content_entity_type';
  end if;

  if v_changed then
    perform public.record_content_moderation(v_event_id,p_entity_type,p_entity_id,v_previous,p_status,'moderate',p_notes);
  end if;
  return jsonb_build_object('entity_type',p_entity_type,'entity_id',p_entity_id,'previous_status',v_previous,'status',p_status,'changed',v_changed);
end;
$$;

revoke execute on function public.assert_content_moderation_transition(text,text,text) from public,anon,authenticated;
revoke execute on function public.moderate_content_item(text,uuid,text,text) from public,anon;
grant execute on function public.moderate_content_item(text,uuid,text,text) to authenticated;

notify pgrst, 'reload schema';
