-- Advisor batch 4 regression checks.
with checks as (
  select 'rate_limit_helper_not_direct' as check_name,
    not has_function_privilege(
      'authenticated',
      'public.enforce_rate_limit(text,integer,integer,text)',
      'EXECUTE'
    ) as passed

  union all
  select 'people_helper_not_direct',
    not has_function_privilege(
      'authenticated',
      'public.admin_can_manage_people()',
      'EXECUTE'
    )

  union all
  select 'rate_limit_service_role_preserved',
    has_function_privilege(
      'service_role',
      'public.enforce_rate_limit(text,integer,integer,text)',
      'EXECUTE'
    )

  union all
  select 'people_helper_service_role_preserved',
    has_function_privilege(
      'service_role',
      'public.admin_can_manage_people()',
      'EXECUTE'
    )

  union all
  select 'buscar_read_remains_anonymous',
    has_function_privilege(
      'anon',
      'public.get_contact_research_directory()',
      'EXECUTE'
    )

  union all
  select 'buscar_write_remains_anonymous',
    has_function_privilege(
      'anon',
      'public.save_contact_research(uuid,text,text,text,text,text,boolean)',
      'EXECUTE'
    )

  union all
  select 'photo_upload_public_rpc_still_authenticated',
    has_function_privilege(
      'authenticated',
      'public.create_uploaded_photo(uuid,text,text,text,bigint,text,integer,integer,text,integer,text,jsonb,boolean)',
      'EXECUTE'
    )

  union all
  select 'admin_people_public_rpc_still_authenticated',
    has_function_privilege(
      'authenticated',
      'public.admin_get_person_details(uuid)',
      'EXECUTE'
    )
)
select check_name, case when passed then 'PASS' else 'FAIL' end result
from checks
order by check_name;
