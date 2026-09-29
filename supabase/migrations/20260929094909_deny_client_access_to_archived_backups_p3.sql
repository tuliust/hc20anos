-- P3 security: keep archived backups behind RLS defense-in-depth while
-- making the intentional deny-all contract explicit to database advisors.
-- Four July cleanup backups exist only in the historical remote database, so
-- policy creation must be conditional for clean migration replay.

do $do$
declare
  v_table text;
begin
  foreach v_table in array array[
    'backup_admin_users_before_cleanup_20260709',
    'backup_auth_users_before_cleanup_20260709',
    'backup_people_before_cleanup_20260709',
    'backup_profiles_before_cleanup_20260709',
    'faq_items_backup_20260716'
  ]
  loop
    if to_regclass('archive.' || v_table) is not null then
      execute format(
        'create policy archive_client_deny_all on archive.%I as restrictive for all to anon, authenticated using (false) with check (false)',
        v_table
      );
    end if;
  end loop;
end
$do$;
