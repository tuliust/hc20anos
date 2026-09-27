with checks as (
  select 'redundant_superadmin_all_removed'::text as check_name,
    not exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users' and policyname='admin_users_superadmin_all') as passed
  union all
  select 'superadmin_write_preserved',
    exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users'
      and policyname='admin_users_superadmin_write' and cmd='ALL'
      and qual='is_superadmin()' and with_check='is_superadmin()')
  union all
  select 'admin_panel_select_preserved',
    exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users'
      and policyname='admin_users_admin_panel_select' and cmd='SELECT' and qual='is_admin_panel_user()')
  union all
  select 'self_read_preserved',
    exists(select 1 from pg_policies where schemaname='public' and tablename='admin_users'
      and policyname='admin_users_self_read' and cmd='SELECT' and qual like '%auth.uid%')
  union all
  select 'role_helpers_remain_equivalent',
    pg_get_functiondef('public.is_superadmin(uuid)'::regprocedure) like '%au.role = ''superadmin''%'
    and pg_get_functiondef('public.has_admin_role(public.admin_role,uuid)'::regprocedure) like '%au.role = required_role or au.role = ''superadmin''%'
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks order by check_name;
