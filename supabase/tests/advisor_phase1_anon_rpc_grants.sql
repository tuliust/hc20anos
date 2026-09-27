-- Security advisor phase 1: RPC execution grant contract.
-- The three authenticated profile flows lose anon access only. Existing public
-- checkout, catalog, FAQ, memory, and /buscar RPCs remain public.

with checks as (
  select 'anon_cannot_register_profile_v3'::text as check_name,
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
  select 'public_current_ticket_catalog_remains_available',
    has_function_privilege('anon', 'public.get_current_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.get_current_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
  union all
  select 'public_ticket_catalog_remains_available',
    has_function_privilege('anon', 'public.get_public_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.get_public_ticket_catalog(uuid,timestamptz)', 'EXECUTE')
  union all
  select 'public_faq_rpc_remains_available',
    has_function_privilege('anon', 'public.has_structured_faq_items(uuid)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.has_structured_faq_items(uuid)', 'EXECUTE')
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
