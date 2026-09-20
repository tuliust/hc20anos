-- Advisor batch 3 regression checks.
with checks as (
  select 'buscar_read_remains_anonymous' as check_name,
    has_function_privilege('anon','public.get_contact_research_directory()','EXECUTE') as passed
  union all
  select 'buscar_write_remains_anonymous',
    has_function_privilege('anon','public.save_contact_research(uuid,text,text,text,text,text,boolean)','EXECUTE')
  union all
  select 'event_page_public_read_preserved',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='event_page_content'
        and policyname='event_page_content_select_public'
        and cmd='SELECT'
        and qual='true'
    )
  union all
  select 'public_page_public_read_preserved',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='public_page_content'
        and policyname='public_page_content_select_public'
        and cmd='SELECT'
        and qual='true'
    )
  union all
  select 'event_page_legacy_all_removed',
    not exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='event_page_content'
        and policyname='event_page_content_manage_admins'
    )
  union all
  select 'public_page_legacy_all_removed',
    not exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='public_page_content'
        and policyname='public_page_content_manage_admins'
    )
  union all
  select 'moderation_write_all_removed',
    not exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='content_moderation_settings'
        and policyname='content_moderation_settings_admin_write'
    )
  union all
  select 'moderation_write_split_complete',
    (
      select count(*) = 3
      from pg_policies
      where schemaname='public'
        and tablename='content_moderation_settings'
        and policyname in (
          'content_moderation_settings_admin_insert',
          'content_moderation_settings_admin_update',
          'content_moderation_settings_admin_delete'
        )
    )
  union all
  select 'event_page_write_split_complete',
    (
      select count(*) = 3
      from pg_policies
      where schemaname='public'
        and tablename='event_page_content'
        and policyname in (
          'event_page_content_admin_insert',
          'event_page_content_admin_update',
          'event_page_content_admin_delete'
        )
    )
  union all
  select 'public_page_write_split_complete',
    (
      select count(*) = 3
      from pg_policies
      where schemaname='public'
        and tablename='public_page_content'
        and policyname in (
          'public_page_content_admin_insert',
          'public_page_content_admin_update',
          'public_page_content_admin_delete'
        )
    )
  union all
  select 'photo_removal_owner_authenticated_only',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='photo_removal_requests'
        and policyname='removal_requests_owner_read'
        and roles=array['authenticated'::name]
    )
  union all
  select 'faq_manage_policy_replayable',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='faq_items'
        and policyname='faq_items_manage_admins'
        and roles=array['authenticated'::name]
    )
  union all
  select 'faq_category_fk_index',
    to_regclass('public.faq_items_category_id_idx') is not null
  union all
  select 'photo_tag_creator_fk_index',
    to_regclass('public.photo_tags_created_by_user_id_idx') is not null
  union all
  select 'photo_removal_requester_fk_index',
    to_regclass('public.photo_removal_requests_requester_user_id_idx') is not null
  union all
  select 'guest_request_sponsor_fk_index',
    to_regclass('public.guest_approval_requests_sponsor_user_id_idx') is not null
  union all
  select 'refund_ticket_fk_index',
    to_regclass('public.refund_requests_ticket_id_idx') is not null
  union all
  select 'transfer_to_user_fk_index',
    to_regclass('public.ticket_transfers_to_user_id_idx') is not null
  union all
  select 'voucher_delivery_fk_index',
    to_regclass('public.tickets_physical_vouchers_delivered_by_idx') is not null
  union all
  select 'moderation_actor_fk_index',
    to_regclass('public.content_moderation_events_actor_user_id_idx') is not null
)
select check_name, case when passed then 'PASS' else 'FAIL' end result
from checks
order by check_name;
