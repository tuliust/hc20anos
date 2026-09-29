-- P3 performance regression: every FK previously flagged by Supabase Advisor
-- must keep a dedicated covering index in the replayed schema.

with expected(index_name) as (values
  ('alumni_contact_research_updated_by_idx'),
  ('cms_assets_updated_by_admin_id_idx'),
  ('contact_collectors_created_by_idx'),
  ('event_page_content_updated_by_admin_id_idx'),
  ('faq_categories_created_by_admin_id_idx'),
  ('faq_categories_deleted_by_admin_id_idx'),
  ('faq_categories_updated_by_admin_id_idx'),
  ('faq_items_created_by_admin_id_idx'),
  ('faq_items_deleted_by_admin_id_idx'),
  ('faq_items_updated_by_admin_id_idx'),
  ('guest_approval_requests_decided_by_user_id_idx'),
  ('memories_approved_by_admin_id_idx'),
  ('participant_extras_physical_vouchers_delivered_by_idx'),
  ('payment_preferences_replaced_by_preference_id_idx'),
  ('photo_comments_approved_by_admin_id_idx'),
  ('photo_removal_requests_reviewed_by_admin_id_idx'),
  ('photo_tags_approved_by_admin_id_idx'),
  ('photos_approved_by_admin_id_idx'),
  ('photos_featured_by_admin_id_idx'),
  ('photos_removed_by_admin_id_idx'),
  ('polls_created_by_admin_id_idx'),
  ('profile_claim_disputes_current_claimant_user_id_idx'),
  ('profile_claim_disputes_reviewed_by_admin_id_idx'),
  ('profile_claims_reviewed_by_admin_id_idx'),
  ('public_page_content_updated_by_admin_id_idx'),
  ('rate_limit_buckets_actor_user_id_idx'),
  ('refund_policy_updated_by_user_id_idx'),
  ('refund_requests_reviewed_by_admin_id_idx'),
  ('ticket_transfers_accepted_by_user_id_idx'),
  ('ticket_transfers_replacement_ticket_id_idx')
),
checks as (
  select index_name,
         to_regclass('public.' || quote_ident(index_name)) is not null as passed
  from expected
)
select
  'p3_fk_indexes_present' as check_name,
  case when bool_and(passed) and count(*)=30 then 'PASS' else 'FAIL' end as result
from checks;
