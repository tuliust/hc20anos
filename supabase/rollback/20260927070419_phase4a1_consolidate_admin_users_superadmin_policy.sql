-- Rollback for 20260927070419_phase4a1_consolidate_admin_users_superadmin_policy.sql.
create policy admin_users_superadmin_all
on public.admin_users
as permissive
for all
to authenticated
using (public.has_admin_role('superadmin'::public.admin_role));
