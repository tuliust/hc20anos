-- P3 performance: add covering indexes for all foreign keys flagged by Supabase Advisor.

create index if not exists alumni_contact_research_updated_by_idx
  on public.alumni_contact_research(updated_by);

create index if not exists cms_assets_updated_by_admin_id_idx
  on public.cms_assets(updated_by_admin_id);

create index if not exists contact_collectors_created_by_idx
  on public.contact_collectors(created_by);

create index if not exists event_page_content_updated_by_admin_id_idx
  on public.event_page_content(updated_by_admin_id);

create index if not exists faq_categories_created_by_admin_id_idx
  on public.faq_categories(created_by_admin_id);

create index if not exists faq_categories_deleted_by_admin_id_idx
  on public.faq_categories(deleted_by_admin_id);

create index if not exists faq_categories_updated_by_admin_id_idx
  on public.faq_categories(updated_by_admin_id);

create index if not exists faq_items_created_by_admin_id_idx
  on public.faq_items(created_by_admin_id);

create index if not exists faq_items_deleted_by_admin_id_idx
  on public.faq_items(deleted_by_admin_id);

create index if not exists faq_items_updated_by_admin_id_idx
  on public.faq_items(updated_by_admin_id);

create index if not exists guest_approval_requests_decided_by_user_id_idx
  on public.guest_approval_requests(decided_by_user_id);

create index if not exists memories_approved_by_admin_id_idx
  on public.memories(approved_by_admin_id);

create index if not exists participant_extras_physical_vouchers_delivered_by_idx
  on public.participant_extras(physical_vouchers_delivered_by);

create index if not exists payment_preferences_replaced_by_preference_id_idx
  on public.payment_preferences(replaced_by_preference_id);

create index if not exists photo_comments_approved_by_admin_id_idx
  on public.photo_comments(approved_by_admin_id);

create index if not exists photo_removal_requests_reviewed_by_admin_id_idx
  on public.photo_removal_requests(reviewed_by_admin_id);

create index if not exists photo_tags_approved_by_admin_id_idx
  on public.photo_tags(approved_by_admin_id);

create index if not exists photos_approved_by_admin_id_idx
  on public.photos(approved_by_admin_id);

create index if not exists photos_featured_by_admin_id_idx
  on public.photos(featured_by_admin_id);

create index if not exists photos_removed_by_admin_id_idx
  on public.photos(removed_by_admin_id);

create index if not exists polls_created_by_admin_id_idx
  on public.polls(created_by_admin_id);

create index if not exists profile_claim_disputes_current_claimant_user_id_idx
  on public.profile_claim_disputes(current_claimant_user_id);

create index if not exists profile_claim_disputes_reviewed_by_admin_id_idx
  on public.profile_claim_disputes(reviewed_by_admin_id);

create index if not exists profile_claims_reviewed_by_admin_id_idx
  on public.profile_claims(reviewed_by_admin_id);

create index if not exists public_page_content_updated_by_admin_id_idx
  on public.public_page_content(updated_by_admin_id);

create index if not exists rate_limit_buckets_actor_user_id_idx
  on public.rate_limit_buckets(actor_user_id);

create index if not exists refund_policy_updated_by_user_id_idx
  on public.refund_policy(updated_by_user_id);

create index if not exists refund_requests_reviewed_by_admin_id_idx
  on public.refund_requests(reviewed_by_admin_id);

create index if not exists ticket_transfers_accepted_by_user_id_idx
  on public.ticket_transfers(accepted_by_user_id);

create index if not exists ticket_transfers_replacement_ticket_id_idx
  on public.ticket_transfers(replacement_ticket_id);
