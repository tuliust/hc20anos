-- Roll back 20260927090000_admin_authorization_helpers_phase2.sql.
-- This intentionally restores the vulnerable prior helper behavior and should
-- only be used as an emergency rollback while access is otherwise contained.

create or replace function public.has_admin_role(required_role public.admin_role, uid uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public, auth, extensions, pg_temp
as $$
  select exists (
    select 1 from admin_users
    where user_id = uid and (role = required_role or role = 'superadmin')
  );
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public, auth, extensions, pg_temp
as $$
  select exists(select 1 from admin_users where user_id = uid);
$$;

create or replace function public.is_admin_panel_user(uid uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from admin_users
    where user_id = uid and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin(uid uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from admin_users where user_id = uid and role = 'superadmin'
  );
$$;

revoke execute on function public.has_admin_role(public.admin_role, uuid) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
revoke execute on function public.is_admin_panel_user(uuid) from public, anon;
revoke execute on function public.is_superadmin(uuid) from public, anon;
grant execute on function public.has_admin_role(public.admin_role, uuid) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.is_admin_panel_user(uuid) to authenticated, service_role;
grant execute on function public.is_superadmin(uuid) to authenticated, service_role;
