-- 4A.1: remove one duplicate superadmin ALL policy on the role directory.
-- admin_users_superadmin_write uses is_superadmin() for USING and WITH CHECK;
-- this is equivalent to has_admin_role('superadmin') for authenticated sessions.
drop policy if exists admin_users_superadmin_all on public.admin_users;
