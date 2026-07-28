-- ================================================================
-- Phase 2 — idempotent tags and removal requests under concurrency
-- ================================================================

create or replace function public.submit_photo_tag(p_photo_id uuid, p_person_id uuid, p_tagged_name text)
returns public.photo_tags
language plpgsql security definer set search_path = public as $$
declare v_row public.photo_tags;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.enforce_rate_limit('photo_tag', 20, 3600, auth.uid()::text);
  if not exists(select 1 from public.photos p where p.id=p_photo_id and p.status='approved') then
    raise exception 'photo_not_available';
  end if;

  select * into v_row
  from public.photo_tags
  where photo_id=p_photo_id and person_id=p_person_id
  for update;

  if found then
    if v_row.status='approved' then return v_row; end if;
    update public.photo_tags
    set tagged_name_snapshot=p_tagged_name,
        status='pending',
        created_by_user_id=auth.uid(),
        approved_by_admin_id=null,
        approved_at=null,
        updated_at=now()
    where id=v_row.id
    returning * into v_row;
    return v_row;
  end if;

  begin
    insert into public.photo_tags(photo_id,person_id,tagged_name_snapshot,status,created_by_user_id)
    values(p_photo_id,p_person_id,p_tagged_name,'pending',auth.uid())
    returning * into v_row;
  exception when unique_violation then
    select * into v_row
    from public.photo_tags
    where photo_id=p_photo_id and person_id=p_person_id;
  end;
  return v_row;
end;
$$;

create or replace function public.submit_photo_removal_request(
  p_photo_id uuid,
  p_requester_name text,
  p_requester_email text,
  p_reason text
) returns public.photo_removal_requests
language plpgsql security definer set search_path = public as $$
declare v_row public.photo_removal_requests;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.enforce_rate_limit('photo_removal_request', 5, 86400, auth.uid()::text);
  if not exists(select 1 from public.photos p where p.id=p_photo_id and p.status in ('approved','pending')) then
    raise exception 'photo_not_available';
  end if;

  select * into v_row
  from public.photo_removal_requests r
  where r.photo_id=p_photo_id
    and r.requester_user_id=auth.uid()
    and r.status in ('pending','hidden_preventively')
  order by r.created_at desc
  limit 1;
  if found then return v_row; end if;

  insert into public.photo_removal_requests(
    photo_id,requester_user_id,requester_name,requester_email,reason,status
  ) values (
    p_photo_id,auth.uid(),p_requester_name,p_requester_email,p_reason,'pending'
  )
  on conflict do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row
    from public.photo_removal_requests r
    where r.photo_id=p_photo_id
      and r.requester_user_id=auth.uid()
      and r.status in ('pending','hidden_preventively')
    order by r.created_at desc
    limit 1;
  end if;

  if v_row.id is null then raise exception 'removal_request_conflict'; end if;
  return v_row;
end;
$$;

revoke execute on function public.submit_photo_tag(uuid,uuid,text) from public,anon;
revoke execute on function public.submit_photo_removal_request(uuid,text,text,text) from public,anon;
grant execute on function public.submit_photo_tag(uuid,uuid,text) to authenticated;
grant execute on function public.submit_photo_removal_request(uuid,text,text,text) to authenticated;

notify pgrst, 'reload schema';
