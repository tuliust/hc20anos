-- Phase 2 security: scope public authorization helpers to the current user.
-- Rollback instructions are in supabase/rollback/20260927090000_admin_authorization_helpers_phase2.sql.

create or replace function public.has_admin_role(
  required_role public.admin_role,
  uid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.role() = 'service_role' then exists (
      select 1 from public.admin_users au
      where au.user_id = uid
        and (au.role = required_role or au.role = 'superadmin'::public.admin_role)
    )
    when uid is distinct from auth.uid() then false
    else exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
        and (au.role = required_role or au.role = 'superadmin'::public.admin_role)
    )
  end;
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.role() = 'service_role' then exists (
      select 1 from public.admin_users au
      where au.user_id = uid
        and au.role in ('admin'::public.admin_role, 'superadmin'::public.admin_role)
    )
    when uid is distinct from auth.uid() then false
    else exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('admin'::public.admin_role, 'superadmin'::public.admin_role)
    )
  end;
$$;

create or replace function public.is_admin_panel_user(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.role() = 'service_role' then exists (
      select 1 from public.admin_users au
      where au.user_id = uid
        and au.role in ('admin'::public.admin_role, 'superadmin'::public.admin_role)
    )
    when uid is distinct from auth.uid() then false
    else exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('admin'::public.admin_role, 'superadmin'::public.admin_role)
    )
  end;
$$;

create or replace function public.is_superadmin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.role() = 'service_role' then exists (
      select 1 from public.admin_users au
      where au.user_id = uid and au.role = 'superadmin'::public.admin_role
    )
    when uid is distinct from auth.uid() then false
    else exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role = 'superadmin'::public.admin_role
    )
  end;
$$;

revoke execute on function public.has_admin_role(public.admin_role, uuid) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
revoke execute on function public.is_admin_panel_user(uuid) from public, anon;
revoke execute on function public.is_superadmin(uuid) from public, anon;
grant execute on function public.has_admin_role(public.admin_role, uuid) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.is_admin_panel_user(uuid) to authenticated, service_role;
grant execute on function public.is_superadmin(uuid) to authenticated, service_role;
