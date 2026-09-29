-- Final P3 claim-policy contract after permissive-policy consolidation.
do $$
begin
  if exists (
    select 1 from pg_policy p
    where p.polrelid in (
      'public.profile_claims'::regclass,
      'public.profile_claim_answers'::regclass,
      'public.profile_claim_disputes'::regclass,
      'public.profile_school_questionnaire_answers'::regclass
    ) and (0=any(p.polroles) or 'anon'::regrole::oid=any(p.polroles))
  ) then
    raise exception 'FAIL anon_claim_policy_present';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claims'
      and policyname='p3_auth_insert' and with_check ilike '%requester_user_id%auth.uid%'
      and with_check ilike '%is_admin_panel_user%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claims'
      and policyname='p3_auth_select' and qual ilike '%requester_user_id%auth.uid%'
      and qual ilike '%is_admin_panel_user%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claims'
      and policyname='p3_auth_update' and qual ilike '%moderator%'
      and with_check ilike '%moderator%' and qual ilike '%is_admin_panel_user%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claims'
      and policyname='p3_auth_delete' and qual ilike '%is_admin_panel_user%'
  ) then
    raise exception 'FAIL profile_claims_consolidated_matrix_changed';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claim_answers'
      and policyname='p3_auth_insert' and with_check ilike '%profile_claims%requester_user_id%auth.uid%'
      and with_check ilike '%is_admin_panel_user%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claim_answers'
      and policyname='p3_auth_select' and qual ilike '%profile_claims%requester_user_id%auth.uid%'
      and qual ilike '%is_admin_panel_user%'
  ) then
    raise exception 'FAIL profile_claim_answers_consolidated_matrix_changed';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claim_disputes'
      and policyname='p3_auth_insert' and with_check ilike '%requester_user_id%auth.uid%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claim_disputes'
      and policyname='p3_auth_select' and qual ilike '%requester_user_id%auth.uid%'
  ) or not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profile_claim_disputes'
      and policyname='p3_auth_update' and qual ilike '%moderator%'
      and with_check ilike '%moderator%'
  ) then
    raise exception 'FAIL profile_claim_disputes_consolidated_matrix_changed';
  end if;

  if (select count(*) from pg_policies
      where schemaname='public' and tablename='profile_school_questionnaire_answers'
        and policyname in ('p3_auth_select','p3_auth_insert','p3_auth_update','p3_auth_delete')
        and roles=array['authenticated'::name]) <> 4
     or not exists (
       select 1 from pg_policies where schemaname='public'
         and tablename='profile_school_questionnaire_answers'
         and policyname='p3_auth_select'
         and qual ilike '%admin_users%' and qual ilike '%profiles%auth.uid%'
     )
  then
    raise exception 'FAIL questionnaire_consolidated_matrix_changed';
  end if;
end;
$$;
