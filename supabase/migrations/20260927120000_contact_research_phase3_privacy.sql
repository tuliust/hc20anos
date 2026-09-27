-- /buscar phase 3: public roster only, controlled first contributions, private contact details.

drop function if exists public.get_contact_research_directory();
create function public.get_contact_research_directory()
returns table (person_id uuid, full_name text, class_group text, research_status text, can_contribute boolean)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.full_name, p.class_group, coalesce(r.status, 'pending'), r.person_id is null
    from public.contact_research_roster roster
    join public.people p on p.id = roster.person_id
    left join public.alumni_contact_research r on r.person_id = p.id
   order by p.class_group, p.full_name;
$$;
revoke all on function public.get_contact_research_directory() from public;
grant execute on function public.get_contact_research_directory() to anon, authenticated, service_role;

create function public.get_contact_research_private_details()
returns table (person_id uuid, phone text, instagram text, email text, notes text, source text, updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.can_manage_contact_research() then
    raise exception 'contact_research_not_authorized' using errcode = '42501';
  end if;
  return query select r.person_id, r.phone, r.instagram, r.email, r.notes, r.source, r.updated_at
    from public.alumni_contact_research r;
end;
$$;
revoke all on function public.get_contact_research_private_details() from public, anon;
grant execute on function public.get_contact_research_private_details() to authenticated, service_role;

revoke all on table public.alumni_contact_research from anon;

drop function if exists public.save_contact_research(uuid,text,text,text,text,text,boolean);
create function public.save_contact_research(
  p_person_id uuid, p_phone text default null, p_instagram text default null,
  p_email text default null, p_notes text default null, p_source text default 'manual',
  p_mark_no_contact boolean default false
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
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
    perform public.enforce_rate_limit('contact_research_save', 60, 3600, v_rate_subject);
  exception when sqlstate 'P0001' then
    v_denied := true;
  end;
  if v_denied then
    perform public.write_security_audit('contact_research_rate_limited', 'contact_research', p_person_id::text, v_request_key,
      jsonb_build_object('limit', 60, 'window_seconds', 3600));
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
  v_status := case when v_manager and coalesce(p_mark_no_contact, false) then 'no_contact'
    when v_phone is not null or v_instagram is not null or v_email is not null then 'located' else 'pending' end;

  if v_manager then
    insert into public.alumni_contact_research(person_id, phone, instagram, email, notes, status, source, updated_by, updated_at)
    values (p_person_id, v_phone, v_instagram, v_email, v_notes, v_status, v_source, v_actor, now())
    on conflict (person_id) do update set phone=excluded.phone, instagram=excluded.instagram, email=excluded.email,
      notes=excluded.notes, status=excluded.status, source=excluded.source, updated_by=excluded.updated_by, updated_at=now()
    returning updated_at into v_updated_at;
  else
    insert into public.alumni_contact_research(person_id, phone, instagram, email, notes, status, source, updated_by, updated_at)
    values (p_person_id, v_phone, v_instagram, v_email, null, v_status, 'manual', v_actor, now())
    on conflict (person_id) do nothing returning updated_at into v_updated_at;
    v_inserted := found;
    if not v_inserted then
      perform public.write_security_audit('contact_research_overwrite_denied', 'contact_research', p_person_id::text, v_request_key,
        jsonb_build_object('reason', 'first_contribution_only'));
      return jsonb_build_object('ok', false, 'code', 'contact_already_recorded');
    end if;
  end if;

  perform public.write_security_audit('contact_research_saved', 'contact_research', p_person_id::text, v_request_key,
    jsonb_build_object('status', v_status, 'source', v_source, 'manager_update', v_manager));
  return jsonb_build_object('ok', true, 'person_id', p_person_id, 'status', v_status, 'updated_at', v_updated_at);
end;
$$;
revoke all on function public.save_contact_research(uuid,text,text,text,text,text,boolean) from public;
grant execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
