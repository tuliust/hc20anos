-- Structural and mapping checks for the relational FAQ.

with checks as (
  select 'faq_categories_table_exists'::text as check_name,
    to_regclass('public.faq_categories') is not null as passed
  union all
  select 'faq_items_table_exists',
    to_regclass('public.faq_items') is not null
  union all
  select 'faq_backup_table_exists',
    to_regclass('public.faq_items_backup_20260716') is not null
  union all
  select 'faq_icon_column_exists',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'faq_categories'
        and column_name = 'icon_key'
    )
  union all
  select 'faq_move_rpc_exists',
    to_regprocedure('public.move_faq_category_items(uuid,uuid,uuid)') is not null
  union all
  select 'seven_active_categories_exist',
    (
      select count(*) = 7
      from public.faq_categories
      where event_id = '00000000-0000-0000-0000-000000000001'::uuid
        and deleted_at is null
        and is_visible = true
        and key in (
          'account-access',
          'site-sections',
          'data-privacy',
          'event-information',
          'tickets-pricing',
          'checkout-payment',
          'refund-transfer'
        )
    )
  union all
  select 'faq_items_have_valid_categories',
    not exists(
      select 1
      from public.faq_items fi
      left join public.faq_categories fc on fc.id = fi.category_id
      where fi.event_id = '00000000-0000-0000-0000-000000000001'::uuid
        and (
          fi.category_id is null
          or fc.id is null
          or fc.deleted_at is not null
          or fc.key not in (
            'account-access',
            'site-sections',
            'data-privacy',
            'event-information',
            'tickets-pricing',
            'checkout-payment',
            'refund-transfer'
          )
        )
    )
  union all
  select 'faq_redundant_labels_are_consistent',
    not exists(
      select 1
      from public.faq_items fi
      join public.faq_categories fc on fc.id = fi.category_id
      where fi.category_key is distinct from fc.key
         or fi.category_label is distinct from fc.label
    )
  union all
  select 'faq_backup_covers_current_items',
    not exists(
      select 1
      from public.faq_items fi
      left join public.faq_items_backup_20260716 backup on backup.id = fi.id
      where backup.id is null
    )
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
