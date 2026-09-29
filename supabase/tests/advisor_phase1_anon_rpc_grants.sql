-- Security advisor phase 1: RPC execution grant contract.
-- Public SECURITY DEFINER endpoints must be intentional and explicit.
-- The legacy current-ticket catalog is server-only; canonical public contracts remain available.

with checks as (
  select 'anon_security_definer_surface_is_exact'::text as check_name,
    (
      select array_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' order by p.proname, pg_get_function_identity_arguments(p.oid))
      from pg_proc p
      join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public'
        and p.prosecdef
        and has_function_privilege('anon',p.oid,'EXECUTE')
    ) = array[
      'get_checkout_status_by_token(p_public_token uuid)',
      'get_contact_research_directory()',
      'get_public_memories(p_event_id uuid, p_featured_only boolean)',
      'get_public_ticket_catalog(p_event_id uuid, p_at timestamp with time zone)',
      'has_structured_faq_items(p_event_id uuid)',
      'record_site_page_view(p_event_id uuid, p_visitor_id text, p_session_id text, p_path text, p_query text, p_is_mobile boolean, p_referrer text)',
      'save_contact_research(p_person_id uuid, p_phone text, p_instagram text, p_email text, p_notes text, p_source text, p_mark_no_contact boolean)'
    ]::text[] as passed
  union all
  select 'anon_security_definer_surface_has_no_public_acl',
    not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid=p.pronamespace
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) acl
      where n.nspname='public'
        and p.prosecdef
        and has_function_privilege('anon',p.oid,'EXECUTE')
        and acl.grantee=0
        and acl.privilege_type='EXECUTE'
    )
  union all
  select 'anon_cannot_register_profile_v3',
    not has_function_privilege(
      'anon',
      'public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)',
      'EXECUTE'
    ) as passed
  union all
  select 'authenticated_can_register_profile_v3',
    has_function_privilege(
      'authenticated',
      'public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)',
      'EXECUTE'
    )
  union all
  select 'service_role_can_register_profile_v3',
    has_function_privilege(
      'service_role',
      'public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)',
      'EXECUTE'
    )
  union all
  select 'anon_cannot_register_external_user',
    not has_function_privilege(
      'anon', 'public.register_external_user_profile(text,text,text,text,text)', 'EXECUTE'
    )
  union all
  select 'authenticated_can_register_external_user',
    has_function_privilege(
      'authenticated', 'public.register_external_user_profile(text,text,text,text,text)', 'EXECUTE'
    )
  union all
  select 'service_role_can_register_external_user',
    has_function_privilege(
      'service_role', 'public.register_external_user_profile(text,text,text,text,text)', 'EXECUTE'
    )
  union all
  select 'anon_cannot_update_my_public_profile',
    not has_function_privilege(
      'anon',
      'public.update_my_public_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer)',
      'EXECUTE'
    )
  union all
  select 'authenticated_can_update_my_public_profile',
    has_function_privilege(
      'authenticated',
      'public.update_my_public_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer)',
      'EXECUTE'
    )
  union all
  select 'service_role_can_update_my_public_profile',
    has_function_privilege(
      'service_role',
      'public.update_my_public_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer)',
      'EXECUTE'
    )
  union all
  select 'public_checkout_status_remains_available',
    has_function_privilege('anon', 'public.get_checkout_status_by_token(uuid)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.get_checkout_status_by_token(uuid)', 'EXECUTE')
  union all
  select 'legacy_current_ticket_catalog_not_public',
    not has_function_privilege('anon', 'public.get_current_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.get_current_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
    and has_function_privilege('service_role', 'public.get_current_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
  union all
  select 'public_ticket_catalog_remains_available',
    has_function_privilege('anon', 'public.get_public_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.get_public_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
  union all
  select 'public_faq_rpc_remains_available',
    has_function_privilege('anon', 'public.has_structured_faq_items(uuid)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.has_structured_faq_items(uuid)', 'EXECUTE')
  union all
  select 'public_faq_rpc_has_no_public_grant',
    not exists (
      select 1
      from pg_proc p
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      where p.oid='public.has_structured_faq_items(uuid)'::regprocedure
        and acl.grantee=0
        and acl.privilege_type='EXECUTE'
    )
  union all
  select 'future_public_functions_require_explicit_execute_grants',
    not exists (
      select 1
      from pg_default_acl d
      cross join lateral aclexplode(d.defaclacl) acl
      where d.defaclrole='postgres'::regrole
        and d.defaclobjtype='f'
        and d.defaclnamespace='public'::regnamespace
        and acl.privilege_type='EXECUTE'
        and acl.grantee in (0, 'anon'::regrole::oid, 'authenticated'::regrole::oid)
    )
  union all
  select 'public_memories_remain_available',
    has_function_privilege('anon', 'public.get_public_memories(uuid,boolean)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.get_public_memories(uuid,boolean)', 'EXECUTE')
  union all
  select 'public_contact_directory_remains_available',
    has_function_privilege('anon', 'public.get_contact_research_directory()', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.get_contact_research_directory()', 'EXECUTE')
  union all
  select 'public_contact_research_write_remains_available',
    has_function_privilege('anon', 'public.save_contact_research(uuid,text,text,text,text,text,boolean)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.save_contact_research(uuid,text,text,text,text,text,boolean)', 'EXECUTE')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
