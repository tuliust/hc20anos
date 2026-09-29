create or replace function public.record_site_page_view(
  p_event_id uuid,
  p_visitor_id text,
  p_session_id text,
  p_path text,
  p_query text default null,
  p_is_mobile boolean default false,
  p_referrer text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_id uuid;
  v_path text := nullif(btrim(coalesce(p_path, '')), '');
  v_visitor text := nullif(btrim(coalesce(p_visitor_id, '')), '');
  v_session text := nullif(btrim(coalesce(p_session_id, '')), '');
begin
  if p_event_id is null or not exists (select 1 from public.events e where e.id = p_event_id) then
    raise exception 'invalid_event_id' using errcode = '22023';
  end if;

  if v_visitor is null or length(v_visitor) > 160 then
    raise exception 'invalid_visitor_id' using errcode = '22023';
  end if;

  if v_session is null or length(v_session) > 160 then
    raise exception 'invalid_session_id' using errcode = '22023';
  end if;

  if v_path is null or left(v_path, 1) <> '/' or length(v_path) > 512 then
    raise exception 'invalid_page_path' using errcode = '22023';
  end if;

  if p_query is not null and length(p_query) > 1024 then
    raise exception 'page_query_too_long' using errcode = '22023';
  end if;

  if p_referrer is not null and length(p_referrer) > 1024 then
    raise exception 'page_referrer_too_long' using errcode = '22023';
  end if;

  insert into public.audit_logs(
    user_id,
    action,
    entity_type,
    entity_id,
    metadata_json
  )
  values(
    auth.uid(),
    'site_page_view',
    'site',
    null,
    jsonb_build_object(
      'event_id', p_event_id,
      'visitor_id', v_visitor,
      'session_id', v_session,
      'path', v_path,
      'query', nullif(p_query, ''),
      'is_mobile', coalesce(p_is_mobile, false),
      'referrer', nullif(p_referrer, ''),
      'audit_source', 'public_page_view_rpc'
    )
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_site_page_view(uuid,text,text,text,text,boolean,text)
from public, anon, authenticated;

grant execute on function public.record_site_page_view(uuid,text,text,text,text,boolean,text)
to anon, authenticated;

create or replace function public.record_client_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_action text := nullif(btrim(coalesce(p_action, '')), '');
  v_entity_type text := nullif(btrim(coalesce(p_entity_type, '')), '');
  v_role text;
  v_metadata jsonb;
  v_id uuid;
  v_is_admin_event boolean := false;
  v_is_moderation_event boolean := false;
  v_is_checkin_event boolean := false;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if v_action is null or length(v_action) > 96
     or v_entity_type is null or length(v_entity_type) > 96 then
    raise exception 'invalid_audit_event' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid_audit_metadata' using errcode = '22023';
  end if;

  if pg_column_size(coalesce(p_metadata, '{}'::jsonb)) > 16384 then
    raise exception 'audit_metadata_too_large' using errcode = '22023';
  end if;

  select au.role::text
    into v_role
  from public.admin_users au
  where au.user_id = v_uid;

  v_is_checkin_event :=
    v_action = 'ticket_checkin'
    and v_entity_type = 'tickets';

  v_is_moderation_event :=
    v_action in (
      'photo_approved','photo_rejected',
      'tag_approved','tag_rejected',
      'photo_comment_pending','photo_comment_approved','photo_comment_rejected','photo_comment_hidden',
      'feature_photo','unfeature_photo',
      'memory_pending','memory_approved','memory_rejected','memory_hidden',
      'feature_memory','unfeature_memory',
      'claim_approved','claim_rejected',
      'removal_request_approved','removal_request_rejected','removal_request_hidden_preventively',
      'dispute_approved','dispute_rejected'
    );

  v_is_admin_event :=
    v_is_checkin_event
    or v_is_moderation_event
    or (v_action, v_entity_type) in (
      ('update_home_page_content','home_page_content'),
      ('update_event_page_content','event_page_content'),
      ('upload_cms_content_image','cms_asset'),
      ('update_event','events'),
      ('admin_import_people','people'),
      ('admin_update_person','people'),
      ('upload_header_logo','home_page_content'),
      ('upload_favicon','home_page_content'),
      ('update_ticket_type','ticket_types'),
      ('create_ticket_type','ticket_types'),
      ('update_lot_status','ticket_types'),
      ('update_lot','ticket_types'),
      ('update_event_settings','events'),
      ('create_poll','polls'),
      ('update_poll','polls'),
      ('add_admin','admin_users'),
      ('update_admin_role','admin_users'),
      ('remove_admin','admin_users'),
      ('create_faq_category','faq_categories'),
      ('update_faq_category','faq_categories'),
      ('show_faq_category','faq_categories'),
      ('hide_faq_category','faq_categories'),
      ('soft_delete_faq_category','faq_categories'),
      ('restore_faq_category','faq_categories'),
      ('permanently_delete_faq_category','faq_categories'),
      ('create_faq_item','faq_items'),
      ('update_faq_item','faq_items'),
      ('show_faq_item','faq_items'),
      ('hide_faq_item','faq_items'),
      ('feature_faq_item','faq_items'),
      ('unfeature_faq_item','faq_items'),
      ('move_faq_item','faq_items'),
      ('soft_delete_faq_item','faq_items'),
      ('restore_faq_item','faq_items'),
      ('permanently_delete_faq_item','faq_items'),
      ('reorder_faq_items','faq_categories'),
      ('reorder_faq_categories','events'),
      ('move_faq_category_items','faq_categories')
    );

  if not v_is_admin_event
     and (v_action, v_entity_type) not in (
       ('complete_profile_registration','profiles'),
       ('update_profile','profiles'),
       ('update_public_profile','profiles'),
       ('upload_photo','photos'),
       ('create_photo_comment','photo_comments'),
       ('create_memory','memories'),
       ('vote_poll','poll_votes'),
       ('create_photo_removal_request','photo_removal_requests'),
       ('create_profile_claim_dispute','profile_claim_disputes'),
       ('create_profile_claim','profile_claims')
     )
  then
    raise exception 'audit_event_not_allowed' using errcode = '42501';
  end if;

  if v_is_checkin_event then
    if coalesce(v_role, '') not in ('superadmin','admin','checkin_staff') then
      raise exception 'checkin_role_required' using errcode = '42501';
    end if;
  elsif v_is_moderation_event then
    if coalesce(v_role, '') not in ('superadmin','admin','moderator') then
      raise exception 'moderator_role_required' using errcode = '42501';
    end if;
  elsif v_is_admin_event then
    if coalesce(v_role, '') not in ('superadmin','admin') then
      raise exception 'admin_required' using errcode = '42501';
    end if;
  end if;

  v_metadata :=
    coalesce(p_metadata, '{}'::jsonb)
    - 'admin_id'
    - 'added_by'
    - 'updated_by'
    - 'removed_by'
    - 'user_id'
    - 'actor_user_id'
    || jsonb_build_object('audit_source', 'client_rpc');

  if v_is_admin_event then
    insert into public.security_audit_log(
      actor_user_id,
      actor_role,
      action,
      entity_type,
      entity_id,
      request_key,
      metadata_json
    )
    values(
      v_uid,
      coalesce(v_role, 'authenticated'),
      v_action,
      v_entity_type,
      p_entity_id::text,
      null,
      v_metadata
    )
    returning id into v_id;
  else
    insert into public.audit_logs(
      user_id,
      action,
      entity_type,
      entity_id,
      metadata_json
    )
    values(
      v_uid,
      v_action,
      v_entity_type,
      p_entity_id,
      v_metadata
    )
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.record_client_audit_event(text,text,uuid,jsonb)
from public, anon, authenticated;

grant execute on function public.record_client_audit_event(text,text,uuid,jsonb)
to authenticated;
