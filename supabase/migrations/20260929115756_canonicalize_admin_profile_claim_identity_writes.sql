create or replace function public.admin_moderate_profile_claim(
  p_claim_id uuid,
  p_action text,
  p_reason text default null
)
returns public.profile_claims
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_claim public.profile_claims%rowtype;
  v_person public.people%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.admin_users au
    where au.user_id = v_uid
      and au.role in ('superadmin', 'admin', 'moderator')
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if p_action not in ('approved', 'rejected') then
    raise exception 'invalid_claim_action' using errcode = '22023';
  end if;

  select *
  into v_claim
  from public.profile_claims
  where id = p_claim_id
  for update;

  if not found then
    raise exception 'profile_claim_not_found' using errcode = 'P0002';
  end if;

  if v_claim.status::text <> 'pending' then
    if v_claim.status::text = p_action then
      return v_claim;
    end if;
    raise exception 'profile_claim_already_reviewed' using errcode = 'P0001';
  end if;

  if p_action = 'approved' then
    if v_claim.requester_user_id is null then
      raise exception 'profile_claim_user_required' using errcode = '22023';
    end if;

    select *
    into v_person
    from public.people
    where id = v_claim.person_id
    for update;

    if not found then
      raise exception 'profile_person_not_found' using errcode = 'P0002';
    end if;

    if v_person.claimed_by_user_id is not null
       and v_person.claimed_by_user_id <> v_claim.requester_user_id then
      raise exception 'profile_person_already_claimed' using errcode = '23505';
    end if;

    if exists (
      select 1
      from public.profiles pr
      where pr.user_id = v_claim.requester_user_id
        and pr.person_id <> v_claim.person_id
    ) then
      raise exception 'profile_user_already_linked' using errcode = '23505';
    end if;

    if exists (
      select 1
      from public.profiles pr
      where pr.person_id = v_claim.person_id
        and pr.user_id <> v_claim.requester_user_id
    ) then
      raise exception 'profile_person_linked_to_other_user' using errcode = '23505';
    end if;

    if exists (
      select 1 from public.profiles pr where pr.person_id = v_claim.person_id
    ) then
      update public.profiles
      set user_id = v_claim.requester_user_id,
          display_name = coalesce(display_name, nullif(btrim(v_claim.requester_name), '')),
          updated_at = now()
      where person_id = v_claim.person_id;
    else
      insert into public.profiles (person_id, user_id, display_name)
      values (
        v_claim.person_id,
        v_claim.requester_user_id,
        nullif(btrim(v_claim.requester_name), '')
      );
    end if;

    update public.people
    set claimed_by_user_id = v_claim.requester_user_id,
        claimed_at = coalesce(claimed_at, now()),
        profile_status = case
          when profile_status = 'unclaimed'::public.profile_status then 'claimed'::public.profile_status
          else profile_status
        end,
        updated_at = now()
    where id = v_claim.person_id;
  end if;

  update public.profile_claims
  set status = p_action::public.claim_status,
      reviewed_by_admin_id = v_uid,
      reviewed_at = now(),
      rejection_reason = case when p_action = 'rejected' then nullif(btrim(p_reason), '') else null end,
      updated_at = now()
  where id = p_claim_id
  returning * into v_claim;

  return v_claim;
end;
$$;

revoke all on function public.admin_moderate_profile_claim(uuid, text, text) from public, anon;
grant execute on function public.admin_moderate_profile_claim(uuid, text, text) to authenticated;

create or replace function public.admin_review_profile_claim_dispute(
  p_dispute_id uuid,
  p_action text,
  p_notes text default null
)
returns public.profile_claim_disputes
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_dispute public.profile_claim_disputes%rowtype;
  v_person public.people%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.admin_users au
    where au.user_id = v_uid
      and au.role in ('superadmin', 'admin', 'moderator')
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if p_action not in ('approved', 'rejected') then
    raise exception 'invalid_dispute_action' using errcode = '22023';
  end if;

  select *
  into v_dispute
  from public.profile_claim_disputes
  where id = p_dispute_id
  for update;

  if not found then
    raise exception 'profile_claim_dispute_not_found' using errcode = 'P0002';
  end if;

  if v_dispute.status::text <> 'pending' then
    if v_dispute.status::text = p_action then
      return v_dispute;
    end if;
    raise exception 'profile_claim_dispute_already_reviewed' using errcode = 'P0001';
  end if;

  if p_action = 'approved' then
    if v_dispute.requester_user_id is null then
      raise exception 'profile_dispute_user_required' using errcode = '22023';
    end if;

    select *
    into v_person
    from public.people
    where id = v_dispute.person_id
    for update;

    if not found then
      raise exception 'profile_person_not_found' using errcode = 'P0002';
    end if;

    if exists (
      select 1
      from public.profiles pr
      where pr.user_id = v_dispute.requester_user_id
        and pr.person_id <> v_dispute.person_id
    ) then
      raise exception 'profile_user_already_linked' using errcode = '23505';
    end if;

    if exists (
      select 1 from public.profiles pr where pr.person_id = v_dispute.person_id
    ) then
      update public.profiles
      set user_id = v_dispute.requester_user_id,
          display_name = coalesce(display_name, nullif(btrim(v_dispute.requester_name), '')),
          updated_at = now()
      where person_id = v_dispute.person_id;
    else
      insert into public.profiles (person_id, user_id, display_name)
      values (
        v_dispute.person_id,
        v_dispute.requester_user_id,
        nullif(btrim(v_dispute.requester_name), '')
      );
    end if;

    update public.people
    set claimed_by_user_id = v_dispute.requester_user_id,
        claimed_at = now(),
        profile_status = case
          when profile_status = 'unclaimed'::public.profile_status then 'claimed'::public.profile_status
          else profile_status
        end,
        updated_at = now()
    where id = v_dispute.person_id;
  end if;

  update public.profile_claim_disputes
  set status = p_action::public.dispute_status,
      reviewed_by_admin_id = v_uid,
      reviewed_at = now(),
      admin_notes = nullif(btrim(p_notes), ''),
      updated_at = now()
  where id = p_dispute_id
  returning * into v_dispute;

  return v_dispute;
end;
$$;

revoke all on function public.admin_review_profile_claim_dispute(uuid, text, text) from public, anon;
grant execute on function public.admin_review_profile_claim_dispute(uuid, text, text) to authenticated;
