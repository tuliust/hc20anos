-- P3 security: keep archived backups behind RLS defense-in-depth while
-- making the intentional deny-all contract explicit to database advisors.

create policy archive_client_deny_all
on archive.backup_admin_users_before_cleanup_20260709
as restrictive for all to anon, authenticated
using (false) with check (false);

create policy archive_client_deny_all
on archive.backup_auth_users_before_cleanup_20260709
as restrictive for all to anon, authenticated
using (false) with check (false);

create policy archive_client_deny_all
on archive.backup_people_before_cleanup_20260709
as restrictive for all to anon, authenticated
using (false) with check (false);

create policy archive_client_deny_all
on archive.backup_profiles_before_cleanup_20260709
as restrictive for all to anon, authenticated
using (false) with check (false);

create policy archive_client_deny_all
on archive.faq_items_backup_20260716
as restrictive for all to anon, authenticated
using (false) with check (false);
