with checks as (
  select 'legacy_admin_user_policies_removed'::text as check_name,
    not exists(
      select 1 from pg_policies where schemaname='public' and tablename='admin_users'
        and policyname in ('admin_users_superadmin_all','admin_users_superadmin_write','admin_users_admin_panel_select','admin_users_self_read')
    ) as passed
  union all
  select 'superadmin_write_preserved',
    exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users'
      and policyname='p3_auth_insert' and with_check ilike '%is_superadmin%')
    and exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users'
      and policyname='p3_auth_update' and qual ilike '%is_superadmin%' and with_check ilike '%is_superadmin%')
    and exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users'
      and policyname='p3_auth_delete' and qual ilike '%is_superadmin%')
  union all
  select 'admin_and_self_read_preserved',
    exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users'
      and policyname='p3_auth_select' and roles=array['authenticated'::name]
      and qual ilike '%is_admin_panel_user%' and qual ilike '%user_id%auth.uid%' and qual ilike '%is_superadmin%')
  union all
  select 'role_helpers_remain_equivalent',
    pg_get_functiondef('public.is_superadmin(uuid)'::regprocedure) like '%au.role = ''superadmin''%'
    and pg_get_functiondef('public.has_admin_role(public.admin_role,uuid)'::regprocedure) like '%au.role = required_role or au.role = ''superadmin''%'
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks order by check_name;
