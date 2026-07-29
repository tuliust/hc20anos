---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 249361f9a6e88a1a1d9d7c526cc308826d03b4f9
generation_command: npm run docs:generate-db-contracts
source_files:
  - supabase/config.toml
  - supabase/migrations/
  - scripts/generate-database-contracts.mjs
---

# RPCs e funções do schema público

> Arquivo gerado a partir de um banco Supabase local reconstruído por todas as migrations. Não editar manualmente.

| Função | Argumentos | Retorno | Security definer | Volatilidade | ACL |
|---|---|---|---|---|---|
| `public.accept_ticket_transfer` | `p_transfer_id uuid` | `uuid` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_archive_ticket_lot` | `p_lot_id uuid, p_event_id uuid` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_can_manage_people` | `—` | `boolean` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_clear_person_profile` | `p_person_id uuid` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_delete_person_profile` | `p_person_id uuid` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_get_person_details` | `p_person_id uuid` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_get_profile_claim_disputes_with_identity` | `p_status text` | `TABLE(id uuid, person_id uuid, current_claimant_user_id uuid, requester_user_id uuid, requester_name text, requester_email text, requester_phone text, reason text, evidence_text text, status text, reviewed_by_admin_id uuid, reviewed_at timestamp with time zone, admin_notes text, created_at timestamp with time zone, updated_at timestamp with time zone, people jsonb, identity_verification jsonb)` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_get_ticket_lots` | `p_event_id uuid` | `jsonb` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_import_people` | `p_people jsonb` | `SETOF people` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_update_person_and_profile` | `p_person_id uuid, p_person jsonb, p_profile jsonb` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_update_refund_policy` | `p_enabled boolean, p_percentage_basis_points integer, p_fixed_fee_cents integer, p_maximum_fee_cents integer, p_policy_label text, p_policy_notice text` | `refund_policy` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.admin_upsert_ticket_lot` | `p_lot_id uuid, p_event_id uuid, p_code text, p_name text, p_sort_order integer, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_capacity integer, p_status text, p_prices jsonb` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.age_on_date` | `p_birth_date date, p_reference_date date` | `integer` | não | `immutable` | `=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.age_on_event_date` | `p_birth_date date, p_event_id uuid` | `integer` | sim | `stable` | `postgres=X/postgres,service_role=X/postgres` |
| `public.apply_automatic_content_approval` | `—` | `trigger` | sim | `volatile` | `—` |
| `public.apply_mercado_pago_payment` | `p_order_id uuid, p_payment_id text, p_payment_status text, p_status_detail text, p_payment_method text, p_payment_type text, p_installments integer, p_transaction_amount_cents integer, p_currency_id text, p_preference_id text, p_paid_at timestamp with time zone` | `TABLE(order_id uuid, resulting_status text, tickets_created integer)` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.assert_content_moderation_transition` | `p_entity_type text, p_previous_status text, p_new_status text` | `boolean` | não | `immutable` | `postgres=X/postgres` |
| `public.audit_sensitive_row_change` | `—` | `trigger` | sim | `volatile` | `—` |
| `public.calculate_refund_quote` | `p_order_id uuid` | `TABLE(order_id uuid, gross_amount_cents integer, non_recoverable_fee_cents integer, refund_amount_cents integer, policy_label text, policy_notice text, refund_deadline timestamp with time zone, eligible boolean, ineligibility_reason text)` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.cancel_guest_approval_request` | `p_request_id uuid` | `void` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.cancel_ticket_transfer` | `p_transfer_id uuid` | `void` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.claim_notification_jobs` | `p_limit integer, p_worker_id text` | `SETOF notification_jobs` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.cleanup_security_operational_data` | `p_now timestamp with time zone` | `jsonb` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.complete_notification_job` | `p_job_id uuid, p_success boolean, p_error text` | `notification_jobs` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.complete_photo_removal` | `p_request_id uuid, p_success boolean, p_error text` | `photo_removal_requests` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.complete_profile_registration_v3` | `p_person_id uuid, p_penultimate_surname text, p_class_group_confirmation text, p_declared_birth_date date, p_full_name text, p_display_name text, p_class_group text, p_current_photo_url text, p_current_city text, p_current_state text, p_current_country text, p_profession text, p_bio text, p_nickname_at_school text, p_instagram_url text, p_linkedin_url text, p_contact_email text, p_contact_whatsapp text, p_relationship_status text, p_has_children boolean, p_children_count integer, p_intends_to_attend boolean, p_show_current_photo boolean, p_show_city boolean, p_show_profession boolean, p_show_social_links boolean, p_allow_photo_tags boolean, p_show_confirmed_status boolean` | `profiles` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.content_actor_name` | `—` | `text` | sim | `stable` | `postgres=X/postgres` |
| `public.count_approved_external_guests` | `p_event_id uuid, p_sponsor_person_id uuid` | `integer` | sim | `stable` | `=X/postgres,postgres=X/postgres,authenticated=X/postgres` |
| `public.create_checkout_order` | `p_buyer_user_id uuid, p_buyer_name text, p_buyer_email text, p_buyer_phone text, p_product_code text, p_participants jsonb, p_extras jsonb, p_idempotency_key text` | `TABLE(order_id uuid, public_token uuid, total_amount_cents integer, expires_at timestamp with time zone, lot_id uuid, lot_code text, lot_name text)` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.create_guest_approval_request` | `p_sponsor_person_id uuid, p_guest_name text, p_guest_email text, p_guest_phone text, p_relationship_to_alumni text` | `uuid` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.create_uploaded_photo` | `p_event_id uuid, p_storage_path text, p_original_file_name text, p_content_type text, p_file_size_bytes bigint, p_content_sha256 text, p_image_width integer, p_image_height integer, p_caption text, p_year_approx integer, p_location_text text, p_tags jsonb, p_authorization_given boolean` | `photos` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.current_security_role` | `—` | `text` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.decide_guest_approval_request` | `p_request_id uuid, p_decision text, p_decided_by_user_id uuid, p_notes text` | `guest_approval_requests` | sim | `volatile` | `=X/postgres,postgres=X/postgres,authenticated=X/postgres` |
| `public.enforce_hc20_commerce_capacity` | `—` | `trigger` | não | `volatile` | `—` |
| `public.enforce_rate_limit` | `p_action text, p_limit integer, p_window_seconds integer, p_subject text` | `integer` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.enqueue_guest_approval_whatsapp_job` | `—` | `trigger` | sim | `volatile` | `postgres=X/postgres` |
| `public.enqueue_order_status_notifications` | `—` | `trigger` | sim | `volatile` | `—` |
| `public.enqueue_ticket_whatsapp_notification` | `—` | `trigger` | sim | `volatile` | `—` |
| `public.expire_checkout_reservations` | `p_now timestamp with time zone` | `integer` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.expire_guest_approval_requests` | `p_now timestamp with time zone` | `integer` | sim | `volatile` | `postgres=X/postgres` |
| `public.expire_ticket_transfers` | `p_now timestamp with time zone` | `integer` | sim | `volatile` | `postgres=X/postgres` |
| `public.export_checkin_report` | `—` | `TABLE(attendee_name text, attendee_email text, qr_code text, ticket_status text, checked_in boolean, checked_in_at timestamp with time zone, checked_in_by_email text, vouchers_delivered boolean, order_id uuid)` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.fn_generate_qr_code` | `—` | `trigger` | não | `volatile` | `—` |
| `public.fn_increment_sold` | `p_ticket_type_id uuid, delta integer` | `void` | sim | `volatile` | `—` |
| `public.fn_set_updated_at` | `—` | `trigger` | não | `volatile` | `—` |
| `public.fn_touch_home_page_content` | `—` | `trigger` | não | `volatile` | `—` |
| `public.fn_validate_poll_vote` | `—` | `trigger` | sim | `volatile` | `—` |
| `public.get_admin_commerce_report` | `—` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_admin_orders` | `p_status text` | `jsonb` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres` |
| `public.get_admin_orders_mercado_pago_base` | `p_status text` | `jsonb` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres` |
| `public.get_admin_refund_requests` | `—` | `SETOF refund_requests` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_admin_security_audit` | `p_limit integer, p_entity_type text` | `SETOF security_audit_log` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_checkin_activity` | `p_limit integer` | `TABLE(event_id uuid, ticket_id uuid, attendee_name text, action text, operator_user_id uuid, operator_email text, notes text, created_at timestamp with time zone)` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_checkin_dashboard` | `p_search text` | `TABLE(ticket_id uuid, attendee_name text, attendee_email text, qr_code text, ticket_status text, checked_in boolean, checked_in_at timestamp with time zone, order_id uuid, extras jsonb)` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_checkin_operation_metrics` | `—` | `TABLE(total_tickets bigint, active_tickets bigint, checked_in_tickets bigint, pending_tickets bigint, invalid_tickets bigint, checkin_rate numeric, vouchers_required bigint, vouchers_delivered bigint, last_checkin_at timestamp with time zone)` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_checkout_status_by_token` | `p_public_token uuid` | `TABLE(order_id uuid, payment_status text, payment_status_detail text, reservation_status text, expires_at timestamp with time zone, paid_at timestamp with time zone, total_amount_cents integer, currency_id text, ticket_count bigint)` | sim | `stable` | `=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.get_current_ticket_catalog` | `p_event_id uuid, p_at timestamp with time zone` | `TABLE(lot_id uuid, lot_code text, lot_name text, lot_starts_at timestamp with time zone, lot_ends_at timestamp with time zone, ticket_type_id uuid, product_code text, product_name text, description text, participant_type text, package_kind text, included_people_count integer, metadata_json jsonb, price_cents integer)` | sim | `stable` | `=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.get_current_ticket_lot` | `p_event_id uuid, p_at timestamp with time zone` | `ticket_lots` | sim | `stable` | `=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.get_event_reports` | `p_event_id uuid` | `jsonb` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres` |
| `public.get_event_reports_mercado_pago_base` | `p_event_id uuid` | `jsonb` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres` |
| `public.get_my_commerce_orders` | `—` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_my_guest_approval_requests` | `—` | `TABLE(id uuid, perspective text, guest_name text, guest_email text, guest_phone text, relationship_to_alumni text, sponsor_person_id uuid, sponsor_name text, status text, created_at timestamp with time zone, expires_at timestamp with time zone, decided_at timestamp with time zone, decision_notes text)` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_my_ticket_transfers` | `—` | `TABLE(id uuid, perspective text, ticket_id uuid, replacement_ticket_id uuid, attendee_name text, to_name text, to_email text, to_phone text, status text, requested_at timestamp with time zone, expires_at timestamp with time zone, accepted_at timestamp with time zone, completed_at timestamp with time zone, cancelled_at timestamp with time zone, old_qr_invalidated_at timestamp with time zone)` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.get_public_memories` | `p_event_id uuid, p_featured_only boolean` | `TABLE(id uuid, event_id uuid, user_id uuid, person_id uuid, author_name text, memory_text text, is_anonymous boolean, status text, is_featured boolean, approved_by_admin_id uuid, approved_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)` | sim | `stable` | `postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.get_public_ticket_catalog` | `p_event_id uuid, p_at timestamp with time zone` | `TABLE(lot_id uuid, lot_code text, lot_name text, lot_starts_at timestamp with time zone, lot_ends_at timestamp with time zone, lot_capacity integer, ticket_type_id uuid, product_code text, product_name text, description text, participant_type text, package_kind text, included_people_count integer, metadata_json jsonb, price_cents integer, ticket_status text, available_quantity integer, sold_quantity integer)` | sim | `stable` | `postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.gin_extract_query_trgm` | `text, internal, smallint, internal, internal, internal, internal` | `internal` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gin_extract_value_trgm` | `text, internal` | `internal` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gin_trgm_consistent` | `internal, smallint, text, integer, internal, internal, internal, internal` | `boolean` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gin_trgm_triconsistent` | `internal, smallint, text, integer, internal, internal, internal` | `"char"` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_compress` | `internal` | `internal` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_consistent` | `internal, text, smallint, oid, internal` | `boolean` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_decompress` | `internal` | `internal` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_distance` | `internal, text, smallint, oid, internal` | `double precision` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_in` | `cstring` | `gtrgm` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_options` | `internal` | `void` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_out` | `gtrgm` | `cstring` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_penalty` | `internal, internal, internal` | `internal` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_picksplit` | `internal, internal` | `internal` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_same` | `gtrgm, gtrgm, internal` | `internal` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.gtrgm_union` | `internal, internal` | `gtrgm` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.has_admin_role` | `required_role admin_role, uid uuid` | `boolean` | sim | `stable` | `—` |
| `public.has_structured_faq_items` | `p_event_id uuid` | `boolean` | sim | `stable` | `=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.is_admin` | `uid uuid` | `boolean` | sim | `stable` | `—` |
| `public.is_admin_panel_user` | `uid uuid` | `boolean` | sim | `stable` | `=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.is_superadmin` | `uid uuid` | `boolean` | sim | `stable` | `=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres` |
| `public.moderate_content_item` | `p_entity_type text, p_entity_id uuid, p_status text, p_notes text` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.move_faq_category_items` | `p_source_category_id uuid, p_target_category_id uuid, p_admin_id uuid` | `integer` | não | `volatile` | `=X/postgres,postgres=X/postgres,authenticated=X/postgres` |
| `public.normalize_profile_answer` | `value text` | `text` | não | `immutable` | `—` |
| `public.normalize_profile_identity_text` | `value text` | `text` | não | `stable` | `—` |
| `public.normalize_ticket_lot_capacity` | `—` | `trigger` | não | `volatile` | `—` |
| `public.perform_ticket_checkin` | `p_ticket_id uuid, p_undo boolean, p_notes text` | `tickets` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.prepare_photo_removal` | `p_request_id uuid, p_notes text` | `TABLE(request_id uuid, photo_id uuid, storage_path text)` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.prevent_faq_category_delete_with_active_items` | `—` | `trigger` | não | `volatile` | `—` |
| `public.profile_claim_penultimate_surname` | `value text` | `text` | não | `stable` | `—` |
| `public.record_content_moderation` | `p_event_id uuid, p_entity_type text, p_entity_id uuid, p_previous_status text, p_new_status text, p_action text, p_notes text, p_metadata jsonb` | `uuid` | sim | `volatile` | `postgres=X/postgres` |
| `public.refresh_ticket_type_sold_quantity` | `p_event_id uuid` | `integer` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |
| `public.reject_photo_removal_request` | `p_request_id uuid, p_notes text` | `photo_removal_requests` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.reject_ticket_transfer` | `p_transfer_id uuid` | `void` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.release_expired_ticket_reservations` | `p_now timestamp with time zone` | `integer` | sim | `volatile` | `postgres=X/postgres` |
| `public.reorder_faq_categories` | `p_event_id uuid, p_categories jsonb, p_admin_id uuid` | `void` | não | `volatile` | `=X/postgres,postgres=X/postgres,authenticated=X/postgres` |
| `public.reorder_faq_items` | `p_event_id uuid, p_category_id uuid, p_items jsonb, p_admin_id uuid` | `void` | não | `volatile` | `=X/postgres,postgres=X/postgres,authenticated=X/postgres` |
| `public.request_order_refund` | `p_order_id uuid, p_reason text` | `uuid` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.request_ticket_resend` | `p_ticket_id uuid` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.request_ticket_transfer` | `p_ticket_id uuid, p_to_name text, p_to_email text, p_to_phone text` | `uuid` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.respond_guest_approval_request` | `p_request_id uuid, p_decision text, p_notes text` | `guest_approval_requests` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.restore_refunded_order_inventory` | `p_order_id uuid` | `void` | sim | `volatile` | `postgres=X/postgres` |
| `public.retry_order_payment` | `p_order_id uuid` | `text` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.review_refund_request` | `p_request_id uuid, p_approve boolean, p_notes text` | `void` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.run_commerce_automation` | `p_now timestamp with time zone` | `jsonb` | sim | `volatile` | `postgres=X/postgres` |
| `public.sanitize_content_row` | `—` | `trigger` | não | `volatile` | `—` |
| `public.sanitize_plain_text` | `p_value text, p_max_length integer` | `text` | não | `immutable` | `—` |
| `public.search_external_guest_sponsors` | `p_search text` | `TABLE(person_id uuid, full_name text, class_group text, avatar_url text, approved_guests integer, available_slots integer)` | sim | `stable` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.set_cms_assets_updated_at` | `—` | `trigger` | não | `volatile` | `—` |
| `public.set_content_featured` | `p_entity_type text, p_entity_id uuid, p_featured boolean, p_notes text` | `jsonb` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.set_event_page_content_updated_at` | `—` | `trigger` | não | `volatile` | `—` |
| `public.set_limit` | `real` | `real` | não | `volatile` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.set_participant_vouchers_delivered` | `p_ticket_id uuid, p_delivered boolean, p_notes text` | `void` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.set_public_page_content_updated_at` | `—` | `trigger` | não | `volatile` | `—` |
| `public.show_limit` | `—` | `real` | não | `stable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.show_trgm` | `text` | `text[]` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.similarity` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.similarity_dist` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.similarity_op` | `text, text` | `boolean` | não | `stable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.strict_word_similarity` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.strict_word_similarity_commutator_op` | `text, text` | `boolean` | não | `stable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.strict_word_similarity_dist_commutator_op` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.strict_word_similarity_dist_op` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.strict_word_similarity_op` | `text, text` | `boolean` | não | `stable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.submit_memory` | `p_event_id uuid, p_person_id uuid, p_memory_text text, p_is_anonymous boolean` | `memories` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.submit_photo_comment` | `p_photo_id uuid, p_comment_text text` | `photo_comments` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.submit_photo_removal_request` | `p_photo_id uuid, p_requester_name text, p_reason text` | `photo_removal_requests` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.submit_photo_removal_request` | `p_photo_id uuid, p_requester_name text, p_requester_email text, p_reason text` | `photo_removal_requests` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.submit_photo_tag` | `p_photo_id uuid, p_person_id uuid, p_tagged_name text` | `photo_tags` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.sync_order_payment_sales_trigger` | `—` | `trigger` | sim | `volatile` | `—` |
| `public.sync_ticket_lot_statuses` | `p_now timestamp with time zone` | `TABLE(event_id uuid, active_lot_id uuid, active_lot_code text)` | sim | `volatile` | `postgres=X/postgres` |
| `public.sync_ticket_type_sold_quantity_trigger` | `—` | `trigger` | sim | `volatile` | `—` |
| `public.update_my_public_profile` | `p_display_name text, p_current_photo_url text, p_current_city text, p_current_state text, p_current_country text, p_profession text, p_bio text, p_memory_text text, p_instagram_url text, p_linkedin_url text, p_nickname_at_school text, p_avatar_url text, p_contact_email text, p_contact_whatsapp text, p_relationship_status text, p_has_children boolean, p_children_count integer` | `profiles` | sim | `volatile` | `postgres=X/postgres,authenticated=X/postgres` |
| `public.word_similarity` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.word_similarity_commutator_op` | `text, text` | `boolean` | não | `stable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.word_similarity_dist_commutator_op` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.word_similarity_dist_op` | `text, text` | `real` | não | `immutable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.word_similarity_op` | `text, text` | `boolean` | não | `stable` | `=X/supabase_admin,supabase_admin=X/supabase_admin,postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin` |
| `public.write_security_audit` | `p_action text, p_entity_type text, p_entity_id text, p_request_key text, p_metadata jsonb` | `uuid` | sim | `volatile` | `postgres=X/postgres,service_role=X/postgres` |

A presença nesta lista não implica exposição pública. A autorização efetiva depende de grants, RLS e validações internas da função.

