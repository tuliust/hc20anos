-- Contract assertions for Fase 3. Run after the migration; every row should be PASS.
with checks as (
  select 'public_directory_returns_no_contact_fields' as check_name,
    (select p.proargnames = array['person_id','full_name','class_group','research_status','can_contribute']::text[]
       from pg_proc p where p.oid = 'public.get_contact_research_directory()'::regprocedure) as passed
  union all
  select 'anon_can_read_public_directory', has_function_privilege('anon','public.get_contact_research_directory()','EXECUTE')
  union all
  select 'anon_cannot_read_private_details', not has_function_privilege('anon','public.get_contact_research_private_details()','EXECUTE')
  union all
  select 'authenticated_can_call_private_details', has_function_privilege('authenticated','public.get_contact_research_private_details()','EXECUTE')
  union all
  select 'private_details_checks_authorization', position('can_manage_contact_research' in pg_get_functiondef('public.get_contact_research_private_details()'::regprocedure)) > 0
  union all
  select 'anon_cannot_select_contact_table', not has_table_privilege('anon','public.alumni_contact_research','SELECT')
  union all
  select 'anon_cannot_update_contact_table', not has_table_privilege('anon','public.alumni_contact_research','UPDATE')
  union all
  select 'anonymous_first_contribution_rpc_remains_available', has_function_privilege('anon','public.save_contact_research(uuid,text,text,text,text,text,boolean)','EXECUTE')
  union all
  select 'save_returns_minimal_json', (select p.prorettype = 'jsonb'::regtype from pg_proc p where p.oid='public.save_contact_research(uuid,text,text,text,text,text,boolean)'::regprocedure)
  union all
  select 'save_uses_existing_rate_limiter', position('enforce_rate_limit' in pg_get_functiondef('public.save_contact_research(uuid,text,text,text,text,text,boolean)'::regprocedure)) > 0
  union all
  select 'save_audits_success', position('write_security_audit' in pg_get_functiondef('public.save_contact_research(uuid,text,text,text,text,text,boolean)'::regprocedure)) > 0
  union all
  select 'save_is_rate_limited', position('contact_research_save' in pg_get_functiondef('public.save_contact_research(uuid,text,text,text,text,text,boolean)'::regprocedure)) > 0
    and position('60, 3600' in pg_get_functiondef('public.save_contact_research(uuid,text,text,text,text,text,boolean)'::regprocedure)) > 0
  union all
  select 'contact_research_rls_stays_enabled', (select relrowsecurity from pg_class where oid='public.alumni_contact_research'::regclass)
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
