-- Run after the local test context and the 4B migration.
-- Checks that only duplicated admin SELECT paths were removed and that each
-- remaining owner/requester/moderator/admin command path retains its predicate.
do $$
declare
  policy_count integer;
begin
  -- No permissive policy grants anon access to these identity/claim tables.
  if exists (
    select 1 from pg_policy p
    where p.polrelid in (
      'public.profile_claims'::regclass,
      'public.profile_claim_answers'::regclass,
      'public.profile_claim_disputes'::regclass,
      'public.profile_school_questionnaire_answers'::regclass
    ) and (0 = any(p.polroles) or 'anon'::regrole::oid = any(p.polroles))
  ) then
    raise exception 'FAIL anon_claim_policy_present';
  end if;

  -- Each claim parent retains authenticated requester INSERT and owner SELECT,
  -- plus the moderator/admin UPDATE path and admin ALL path.
  if not exists (select 1 from pg_policy where polrelid='public.profile_claims'::regclass and polname='claims_auth_insert' and polcmd='a'
      and pg_get_expr(polwithcheck, polrelid) ilike '%requester_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claims'::regclass and polname='claims_owner_read' and polcmd='r'
      and pg_get_expr(polqual, polrelid) ilike '%requester_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claims'::regclass and polname='claims_moderator_write' and polcmd='w'
      and pg_get_expr(polqual, polrelid) ilike '%moderator%' and pg_get_expr(polwithcheck, polrelid) ilike '%moderator%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claims'::regclass and polname='admin_panel_write' and polcmd='*'
      and pg_get_expr(polqual, polrelid) ilike '%is_admin_panel_user%' and pg_get_expr(polwithcheck, polrelid) ilike '%is_admin_panel_user%') then
    raise exception 'FAIL profile_claims_policy_matrix_changed';
  end if;
  if exists (select 1 from pg_policy where polrelid='public.profile_claims'::regclass and polname in ('admin_panel_select','claims_admin_read')) then
    raise exception 'FAIL duplicate_profile_claims_admin_read_remains';
  end if;

  -- Claim answers retain admin ALL, requester INSERT and requester SELECT.
  if not exists (select 1 from pg_policy where polrelid='public.profile_claim_answers'::regclass and polname='admin_panel_write' and polcmd='*'
      and pg_get_expr(polqual, polrelid) ilike '%is_admin_panel_user%' and pg_get_expr(polwithcheck, polrelid) ilike '%is_admin_panel_user%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claim_answers'::regclass and polname='claim_answers_auth_insert' and polcmd='a'
      and pg_get_expr(polwithcheck, polrelid) ilike '%profile_claims%requester_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claim_answers'::regclass and polname='claim_answers_owner_read' and polcmd='r'
      and pg_get_expr(polqual, polrelid) ilike '%profile_claims%requester_user_id%auth.uid%') then
    raise exception 'FAIL profile_claim_answers_policy_matrix_changed';
  end if;
  if exists (select 1 from pg_policy where polrelid='public.profile_claim_answers'::regclass and polname in ('admin_panel_select','claim_answers_admin_all')) then
    raise exception 'FAIL duplicate_profile_claim_answers_admin_policy_remains';
  end if;

  -- Disputes keep authenticated requester INSERT, owner SELECT, moderator/admin
  -- UPDATE and admin ALL. The two admin-only read policies are redundant.
  if not exists (select 1 from pg_policy where polrelid='public.profile_claim_disputes'::regclass and polname='disputes_auth_insert' and polcmd='a'
      and pg_get_expr(polwithcheck, polrelid) ilike '%requester_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claim_disputes'::regclass and polname='disputes_owner_read' and polcmd='r'
      and pg_get_expr(polqual, polrelid) ilike '%requester_user_id%auth.uid%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claim_disputes'::regclass and polname='disputes_moderator_write' and polcmd='w'
      and pg_get_expr(polqual, polrelid) ilike '%moderator%' and pg_get_expr(polwithcheck, polrelid) ilike '%moderator%')
     or not exists (select 1 from pg_policy where polrelid='public.profile_claim_disputes'::regclass and polname='admin_panel_write' and polcmd='*'
      and pg_get_expr(polqual, polrelid) ilike '%is_admin_panel_user%' and pg_get_expr(polwithcheck, polrelid) ilike '%is_admin_panel_user%') then
    raise exception 'FAIL profile_claim_disputes_policy_matrix_changed';
  end if;
  if exists (select 1 from pg_policy where polrelid='public.profile_claim_disputes'::regclass and polname in ('admin_panel_select','disputes_admin_read')) then
    raise exception 'FAIL duplicate_profile_claim_disputes_admin_read_remains';
  end if;

  -- Questionnaire owner paths and the independent admin manage path are kept.
  select count(*) into policy_count from pg_policy
  where polrelid='public.profile_school_questionnaire_answers'::regclass
    and polname in ('profile_school_questionnaire_answers_admin_manage',
                    'profile_school_questionnaire_answers_insert_own',
                    'profile_school_questionnaire_answers_select_own',
                    'profile_school_questionnaire_answers_update_own');
  if policy_count <> 4 then raise exception 'FAIL questionnaire_policy_paths_changed'; end if;
end;
$$;
