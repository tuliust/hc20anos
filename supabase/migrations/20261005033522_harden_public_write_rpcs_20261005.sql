-- Final hardening: public write RPC rate limits and explicit public contract.
-- Applied to production as migration 20261005033522.

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
set search_path to 'pg_catalog', 'public', 'auth', 'extensions'
as $function$
declare
  v_id uuid;
  v_uid uuid := auth.uid();
  v_path text := nullif(btrim(coalesce(p_path, '')), '');
  v_visitor text := nullif(btrim(coalesce(p_visitor_id, '')), '');
  v_session text := nullif(btrim(coalesce(p_session_id, '')), '');
  v_ip text;
  v_ip_subject text;
  v_visitor_subject text;
begin
  if p_event_id is null or not exists (select 1 from public.events e where e.id = p_event_id) then
    raise exception 'invalid_event_id' using errcode = '22023';
  end if;
  if v_visitor is null or length(v_visitor) > 160 then raise exception 'invalid_visitor_id' using errcode = '22023'; end if;
  if v_session is null or length(v_session) > 160 then raise exception 'invalid_session_id' using errcode = '22023'; end if;
  if v_path is null or left(v_path, 1) <> '/' or length(v_path) > 512 then raise exception 'invalid_page_path' using errcode = '22023'; end if;
  if p_query is not null and length(p_query) > 1024 then raise exception 'page_query_too_long' using errcode = '22023'; end if;
  if p_referrer is not null and length(p_referrer) > 1024 then raise exception 'page_referrer_too_long' using errcode = '22023'; end if;

  if v_uid is not null then
    v_visitor_subject := 'user:' || v_uid::text;
    perform public.enforce_rate_limit('site_page_view_user_hour', 300, 3600, v_visitor_subject);
  else
    begin
      v_ip := split_part(coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb ->> 'x-forwarded-for', ',', 1);
      v_ip := host(btrim(v_ip)::inet);
    exception when others then
      v_ip := 'unavailable';
    end;

    v_ip_subject := 'anonymous-ip:' || encode(extensions.digest(convert_to(coalesce(v_ip, 'unavailable'), 'UTF8'), 'sha256'), 'hex');
    v_visitor_subject := v_ip_subject || ':visitor:' || encode(extensions.digest(convert_to(v_visitor, 'UTF8'), 'sha256'), 'hex');
    perform public.enforce_rate_limit('site_page_view_visitor_hour', 120, 3600, v_visitor_subject);
    perform public.enforce_rate_limit('site_page_view_ip_hour', 1500, 3600, v_ip_subject);
  end if;

  insert into public.audit_logs(user_id, action, entity_type, entity_id, metadata_json)
  values (
    v_uid, 'site_page_view', 'site', null,
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
$function$;

revoke execute on function public.record_site_page_view(uuid,text,text,text,text,boolean,text) from public;
grant execute on function public.record_site_page_view(uuid,text,text,text,text,boolean,text) to anon, authenticated, service_role;
comment on function public.record_site_page_view(uuid,text,text,text,text,boolean,text)
is 'Public page-view telemetry endpoint. SECURITY DEFINER is intentional; input is constrained and callers are rate-limited before audit_logs writes.';

create or replace function public.save_contact_research(
  p_person_id uuid,
  p_phone text default null,
  p_instagram text default null,
  p_email text default null,
  p_notes text default null,
  p_source text default 'manual',
  p_mark_no_contact boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_manager boolean := coalesce(public.can_manage_contact_research(), false);
  v_ip text;
  v_rate_subject text;
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_instagram text := nullif(btrim(coalesce(p_instagram, '')), '');
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_source text;
  v_status text;
  v_updated_at timestamptz;
  v_inserted boolean := false;
  v_denied boolean := false;
  v_request_key text;
begin
  if v_actor is null then
    begin
      v_ip := split_part(coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb ->> 'x-forwarded-for', ',', 1);
      v_ip := host(btrim(v_ip)::inet);
    exception when others then
      raise exception 'client_address_required' using errcode = '42501';
    end;
    v_rate_subject := 'anonymous:' || encode(extensions.digest(convert_to(v_ip, 'UTF8'), 'sha256'), 'hex');
    v_request_key := v_rate_subject;
  else
    v_rate_subject := 'user:' || v_actor::text;
    v_request_key := v_actor::text;
  end if;

  begin
    if v_manager then
      perform public.enforce_rate_limit('contact_research_save_manager_hour', 120, 3600, v_rate_subject);
    else
      perform public.enforce_rate_limit('contact_research_save_public_hour', 12, 3600, v_rate_subject);
      perform public.enforce_rate_limit('contact_research_save_public_day', 40, 86400, v_rate_subject);
    end if;
  exception when sqlstate 'P0001' then
    v_denied := true;
  end;

  if v_denied then
    perform public.write_security_audit(
      'contact_research_rate_limited', 'contact_research', p_person_id::text, v_request_key,
      jsonb_build_object(
        'manager', v_manager,
        'hourly_limit', case when v_manager then 120 else 12 end,
        'daily_limit', case when v_manager then null else 40 end
      )
    );
    return jsonb_build_object('ok', false, 'code', 'rate_limited');
  end if;

  if p_person_id is null or not exists (select 1 from public.contact_research_roster r where r.person_id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'invalid_person');
  end if;
  if length(coalesce(v_phone, '')) > 40 or (v_phone is not null and length(regexp_replace(v_phone, '[^0-9]', '', 'g')) not between 7 and 15) then
    return jsonb_build_object('ok', false, 'code', 'invalid_phone');
  end if;
  if length(coalesce(v_instagram, '')) > 255 or v_instagram ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok', false, 'code', 'invalid_instagram');
  end if;
  if length(coalesce(v_email, '')) > 254 or (v_email is not null and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    return jsonb_build_object('ok', false, 'code', 'invalid_email');
  end if;
  if length(coalesce(v_notes, '')) > 500 or v_notes ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok', false, 'code', 'invalid_notes');
  end if;
  if not v_manager and (v_notes is not null or coalesce(p_mark_no_contact, false)) then
    return jsonb_build_object('ok', false, 'code', 'manager_required');
  end if;
  if not v_manager and v_phone is null and v_instagram is null and v_email is null then
    return jsonb_build_object('ok', false, 'code', 'contact_required');
  end if;

  v_source := case when v_manager and p_source in ('device_contact_picker', 'ios_shortcut') then p_source else 'manual' end;
  v_status := case
    when v_manager and coalesce(p_mark_no_contact, false) then 'no_contact'
    when v_phone is not null or v_instagram is not null or v_email is not null then 'located'
    else 'pending'
  end;

  if v_manager then
    insert into public.alumni_contact_research(person_id, phone, instagram, email, notes, status, source, updated_by, updated_at)
    values (p_person_id, v_phone, v_instagram, v_email, v_notes, v_status, v_source, v_actor, now())
    on conflict (person_id) do update set
      phone=excluded.phone, instagram=excluded.instagram, email=excluded.email, notes=excluded.notes,
      status=excluded.status, source=excluded.source, updated_by=excluded.updated_by, updated_at=now()
    returning updated_at into v_updated_at;
  else
    insert into public.alumni_contact_research(person_id, phone, instagram, email, notes, status, source, updated_by, updated_at)
    values (p_person_id, v_phone, v_instagram, v_email, null, v_status, 'manual', v_actor, now())
    on conflict (person_id) do nothing
    returning updated_at into v_updated_at;

    v_inserted := found;
    if not v_inserted then
      perform public.write_security_audit(
        'contact_research_overwrite_denied', 'contact_research', p_person_id::text, v_request_key,
        jsonb_build_object('reason', 'first_contribution_only')
      );
      return jsonb_build_object('ok', false, 'code', 'contact_already_recorded');
    end if;
  end if;

  perform public.write_security_audit(
    'contact_research_saved', 'contact_research', p_person_id::text, v_request_key,
    jsonb_build_object('status', v_status, 'source', v_source, 'manager_update', v_manager)
  );

  return jsonb_build_object('ok', true, 'person_id', p_person_id, 'status', v_status, 'updated_at', v_updated_at);
end;
$function$;

revoke execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) from public;
grant execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) to anon, authenticated, service_role;
comment on function public.save_contact_research(uuid,text,text,text,text,text,boolean)
is 'Intentional public contribution endpoint for the contact-research mutirao. Anonymous writes are validation-limited, first-write-only, audited, and constrained to 12/hour and 40/day per client address.';
