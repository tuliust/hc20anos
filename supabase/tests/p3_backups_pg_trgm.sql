-- P3 security regression: backups stay outside the exposed public schema,
-- and pg_trgm stays in the dedicated extensions schema.

with checks as (
  select 'no_backup_tables_in_public'::text as check_name,
    not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
        and c.relkind='r'
        and (c.relname like 'backup_%' or c.relname like '%_backup_%')
    ) as passed
  union all
  select 'faq_backup_archived',
    to_regclass('archive.faq_items_backup_20260716') is not null
  union all
  select 'archive_not_exposed_to_anon',
    not has_schema_privilege('anon','archive','USAGE')
    and not has_schema_privilege('authenticated','archive','USAGE')
  union all
  select 'archive_backups_have_explicit_deny_policies',
    not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='archive'
        and c.relkind='r'
        and (c.relname like 'backup_%' or c.relname like '%_backup_%')
        and not exists (
          select 1
          from pg_policies p
          where p.schemaname='archive'
            and p.tablename=c.relname
            and p.policyname='archive_client_deny_all'
            and p.permissive='RESTRICTIVE'
            and p.cmd='ALL'
            and p.roles @> array['anon'::name,'authenticated'::name]
            and p.qual='false'
            and p.with_check='false'
        )
    )
  union all
  select 'pg_trgm_in_extensions',
    exists (
      select 1
      from pg_extension e
      join pg_namespace n on n.oid=e.extnamespace
      where e.extname='pg_trgm'
        and n.nspname='extensions'
    )
  union all
  select 'pg_trgm_indexes_valid',
    (
      select count(*)=2
      from pg_index i
      join pg_class c on c.oid=i.indexrelid
      where c.relname in ('idx_people_full_name_trgm','idx_tickets_attendee_name')
        and i.indisvalid
        and i.indisready
    )
)
select check_name, case when passed then 'PASS' else 'FAIL' end result
from checks
order by check_name;
