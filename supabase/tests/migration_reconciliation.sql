-- Final gate for migration-history reconciliation.
-- Run only after the remote history has been repaired deliberately.

with expected_versions(version) as (
  values
    ('20260716000001'),
    ('20260716000002'),
    ('20260716000003'),
    ('20260716000004'),
    ('20260716000005'),
    ('20260716000006'),
    ('20260716000007'),
    ('20260716000008'),
    ('20260716000009'),
    ('20260716000010'),
    ('20260716000011'),
    ('20260716000012'),
    ('20260716000013'),
    ('20260716000014'),
    ('20260716000015'),
    ('20260716000016'),
    ('20260716000017'),
    ('20260716000100'),
    ('20260716000101'),
    ('20260716000102'),
    ('20260716000103'),
    ('20260719000001'),
    ('20260719000002'),
    ('20260719000003'),
    ('20260719000004'),
    ('20260719000005'),
    ('20260719000006'),
    ('20260719000007'),
    ('20260719000008'),
    ('20260719000009'),
    ('20260719000010'),
    ('20260719000011'),
    ('20260719000012'),
    ('20260719000013'),
    ('20260719000014'),
    ('20260719000015'),
    ('20260719000016'),
    ('20260719000017'),
    ('20260719000018'),
    ('20260721000031'),
    ('20260721000032')
),
checks as (
  select 'all_expected_versions_are_registered'::text as check_name,
    not exists (
      select 1
      from expected_versions expected
      left join supabase_migrations.schema_migrations applied
        on applied.version = expected.version
      where applied.version is null
    ) as passed
  union all
  select 'no_duplicate_registered_versions',
    not exists (
      select version
      from supabase_migrations.schema_migrations
      group by version
      having count(*) > 1
    )
  union all
  select 'profile_identity_latest_version_registered',
    exists (
      select 1 from supabase_migrations.schema_migrations
      where version = '20260721000032'
    )
  union all
  select 'commerce_foundation_objects_exist',
    to_regclass('public.ticket_lots') is not null
    and to_regclass('public.order_participants') is not null
    and to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is not null
  union all
  select 'faq_objects_exist',
    to_regclass('public.faq_categories') is not null
    and to_regclass('public.faq_items_backup_20260716') is not null
    and to_regprocedure('public.move_faq_category_items(uuid,uuid,uuid)') is not null
  union all
  select 'operational_objects_exist',
    to_regclass('public.security_audit_log') is not null
    and to_regclass('public.refund_policy') is not null
    and to_regclass('public.checkin_events') is not null
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
