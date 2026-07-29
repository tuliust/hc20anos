---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 44a90e0c5ed50a48921f81743d86e031a9c6a047
generation_command: GitHub Actions / Phase 1 environment and security
source_files:
  - supabase/migrations/
  - supabase/tests/
  - src/lib/rpc.types.ts
  - scripts/generate-consumed-rpc-contracts.mjs
  - scripts/migrate-rpc-any-casts.mjs
  - .github/workflows/phase1-environment-security.yml
---

# Fase 1 — ambiente e segurança

| Verificação | Resultado |
|---|---|
| Inventário e contratos das RPCs consumidas | `success` |
| Zero casts `(supabase as any).rpc` | `success` |
| Build TypeScript e aplicação | `success` |
| Inicialização do Supabase local | `success` |
| Replay integral das migrations | `success` |
| Usuários e roles determinísticos | `success` |
| RLS, grants, triggers, constraints e roles | `success` |
| Regeneração dos contratos do banco | `success` |
| Auditoria documental | `success` |

O ambiente usa somente Supabase local e dados sintéticos. Nenhum banco remoto ou dado de produção é consultado.

## Diagnóstico SQL

```text

           check_name           | result 
--------------------------------+--------
 admin_financial_report_allowed | PASS
(1 row)

        check_name         | result 
---------------------------+--------
 admin_cannot_change_roles | PASS
(1 row)

ROLLBACK
BEGIN
              set_config              
--------------------------------------
 11111111-1111-4111-8111-111111111111
(1 row)

  set_config   
---------------
 authenticated
(1 row)

                                                   set_config                                                   
----------------------------------------------------------------------------------------------------------------
 {"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"superadmin-tests@local.invalid"}
(1 row)

SET
        check_name        | result 
--------------------------+--------
 superadmin_role_resolves | PASS
(1 row)

         check_name          | result 
-----------------------------+--------
 superadmin_can_manage_roles | PASS
(1 row)

ROLLBACK
===== supabase/tests/phase2_content_storage.sql =====
                check_name                 | result 
-------------------------------------------+--------
 active_photo_hash_is_unique               | PASS
 anonymous_memory_table_read_removed       | PASS
 completion_rpc_is_service_only            | PASS
 content_submission_rpcs_are_authenticated | PASS
 controlled_photo_read_policy_exists       | PASS
 direct_photo_storage_writes_removed       | PASS
 direct_public_asset_uploads_removed       | PASS
 legacy_memory_defaults_removed            | PASS
 moderation_history_exists                 | PASS
 open_removal_request_is_unique            | PASS
 phase2_rpcs_exist                         | PASS
 photo_integrity_columns_exist             | PASS
 photos_bucket_private_and_limited         | PASS
 public_asset_buckets_are_raster_only      | PASS
 public_memory_rpc_is_available            | PASS
 sanitization_triggers_exist               | PASS
(16 rows)

        check_name        | result 
--------------------------+--------
 sanitizer_removes_markup | PASS
(1 row)

      check_name       | result 
-----------------------+--------
 sanitizer_limits_text | PASS
(1 row)

BEGIN
              set_config              
--------------------------------------
 22222222-2222-4222-8222-222222222222
(1 row)

  set_config   
---------------
 authenticated
(1 row)

                                                    set_config                                                     
-------------------------------------------------------------------------------------------------------------------
 {"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"authenticated-tests@local.invalid"}
(1 row)

SET
NOTICE:  PASS direct_memory_insert_blocked
DO
ROLLBACK
BEGIN
INSERT 0 1
            check_name             | result 
-----------------------------------+--------
 anonymous_memory_choice_preserved | PASS
(1 row)

SET
            check_name            | result 
----------------------------------+--------
 anonymous_memory_identity_masked | PASS
(1 row)

ROLLBACK
===== supabase/tests/profile_claim_identity_verification.sql =====
                     check_name                      | result 
-----------------------------------------------------+--------
 accents_and_case_are_normalized                     | PASS
 admin_disputes_identity_rpc_exists                  | PASS
 all_supported_particles_are_ignored                 | PASS
 anon_cannot_execute_registration_v3                 | PASS
 anon_cannot_read_identity_evidence                  | PASS
 authenticated_can_execute_registration_v3           | PASS
 authenticated_cannot_read_identity_evidence         | PASS
 identity_evidence_links_claimant_person_and_profile | PASS
 identity_verification_table_exists                  | PASS
 legacy_registration_rpcs_removed                    | PASS
 particles_are_ignored                               | PASS
 registration_v3_has_no_birth_year_dependency        | PASS
 registration_v3_rpc_exists                          | PASS
(13 rows)
===== supabase/tests/refund_fee_policy.sql =====
              check_name              | result 
--------------------------------------+--------
 anon_cannot_calculate_refund         | PASS
 authenticated_can_calculate_refund   | PASS
 default_policy_is_fee_free           | PASS
 refund_policy_admin_rpc_exists       | PASS
 refund_policy_snapshot_column_exists | PASS
 refund_policy_table_exists           | PASS
 refund_quote_rpc_exists              | PASS
 refund_request_rpc_exists            | PASS
(8 rows)
===== supabase/tests/reporting_audit_security.sql =====
            check_name            | result 
----------------------------------+--------
 anon_cannot_read_commerce_report | PASS
 anon_cannot_use_rate_limit       | PASS
 authenticated_cannot_write_audit | PASS
 commerce_report_rpc_exists       | PASS
 guest_audit_trigger_exists       | PASS
 rate_limit_rpc_exists            | PASS
 rate_limit_table_exists          | PASS
 refund_audit_trigger_exists      | PASS
 security_audit_rpc_exists        | PASS
 security_audit_table_exists      | PASS
 security_cleanup_cron_exists     | PASS
 security_cleanup_rpc_exists      | PASS
 transfer_audit_trigger_exists    | PASS
(13 rows)
===== supabase/tests/reset_all_commerce_data_and_capacity.sql =====
           check_name           | result 
--------------------------------+--------
 all_lots_capacity_valid        | PASS
 all_products_capacity_valid    | PASS
 capacity_guard_function_exists | PASS
 capacity_triggers_installed    | PASS
 commerce_tables_available      | PASS
(5 rows)

DO
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                admin_report_after_global_normalization                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 {"pix_orders": 0, "card_orders": 0, "orders_total": 0, "photos_total": 0, "tickets_sold": 0, "checkins_done": 0, "revenue_cents": 0, "claims_pending": 0, "orders_expired": 0, "orders_pending": 0, "people_claimed": 4, "photos_pending": 0, "subtotal_cents": 0, "transfers_open": 0, "drinks_packages": 0, "orders_approved": 0, "orders_refunded": 0, "orders_rejected": 0, "photos_approved": 0, "photos_rejected": 0, "checkins_pending": 0, "disputes_pending": 0, "orders_cancelled": 0, "people_confirmed": 10, "people_unclaimed": 5, "removals_pending": 0, "barbecue_packages": 0, "preferences_active": 0, "vouchers_delivered": 0, "average_order_cents": 0, "legacy_orders_total": 0, "legacy_tickets_sold": 0, "orders_charged_back": 0, "preferences_expired": 0, "refund_amount_cents": 0, "reservations_active": 0, "extras_revenue_cents": 0, "legacy_revenue_cents": 0, "payment_events_total": 0, "refund_requests_open": 0, "reservations_expired": 0, "participants_approved": 0, "payment_events_failed": 0, "legacy_orders_approved": 0, "reservations_converted": 0, "notification_jobs_failed": 0, "mercado_pago_orders_total": 0, "mercado_pago_participants": 0, "mercado_pago_tickets_sold": 0, "notification_jobs_pending": 0, "legacy_active_reservations": 0, "mercado_pago_revenue_cents": 0, "commerce_data_quality_alerts": 0, "mercado_pago_orders_approved": 0}
(1 row)
===== supabase/tests/reset_commerce_data_and_capacity.sql =====
           check_name           | result 
--------------------------------+--------
 capacity_guard_function_exists | PASS
 capacity_triggers_installed    | PASS
 event_exists                   | PASS
 event_lots_capacity_valid      | PASS
 event_products_capacity_valid  | PASS
(5 rows)

DO
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               admin_report_after_capacity_normalization                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 {"pix_orders": 0, "card_orders": 0, "orders_total": 0, "photos_total": 0, "tickets_sold": 0, "checkins_done": 0, "revenue_cents": 0, "claims_pending": 0, "orders_expired": 0, "orders_pending": 0, "people_claimed": 4, "photos_pending": 0, "subtotal_cents": 0, "transfers_open": 0, "drinks_packages": 0, "orders_approved": 0, "orders_refunded": 0, "orders_rejected": 0, "photos_approved": 0, "photos_rejected": 0, "checkins_pending": 0, "disputes_pending": 0, "orders_cancelled": 0, "people_confirmed": 10, "people_unclaimed": 5, "removals_pending": 0, "barbecue_packages": 0, "preferences_active": 0, "vouchers_delivered": 0, "average_order_cents": 0, "legacy_orders_total": 0, "legacy_tickets_sold": 0, "orders_charged_back": 0, "preferences_expired": 0, "refund_amount_cents": 0, "reservations_active": 0, "extras_revenue_cents": 0, "legacy_revenue_cents": 0, "payment_events_total": 0, "refund_requests_open": 0, "reservations_expired": 0, "participants_approved": 0, "payment_events_failed": 0, "legacy_orders_approved": 0, "reservations_converted": 0, "notification_jobs_failed": 0, "mercado_pago_orders_total": 0, "mercado_pago_participants": 0, "mercado_pago_tickets_sold": 0, "notification_jobs_pending": 0, "legacy_active_reservations": 0, "mercado_pago_revenue_cents": 0, "commerce_data_quality_alerts": 0, "mercado_pago_orders_approved": 0}
(1 row)
===== supabase/tests/ticket_product_model.sql =====
SET
DO
 three_ticket_product_model 
----------------------------
 PASS
(1 row)
===== supabase/tests/transfers_refunds_checkin.sql =====
             check_name             | result 
------------------------------------+--------
 accept_transfer_rpc_exists         | PASS
 anon_cannot_refund                 | PASS
 anon_cannot_transfer               | PASS
 authenticated_can_request_refund   | PASS
 authenticated_can_request_transfer | PASS
 cancel_transfer_rpc_exists         | PASS
 checkin_action_rpc_exists          | PASS
 checkin_events_table_exists        | PASS
 checkin_search_rpc_exists          | PASS
 refund_inventory_rpc_exists        | PASS
 request_refund_rpc_exists          | PASS
 request_transfer_rpc_exists        | PASS
 review_refund_rpc_exists           | PASS
 voucher_action_rpc_exists          | PASS
(14 rows)
===== supabase/tests/whatsapp_notification_delivery.sql =====
                 check_name                 | result 
--------------------------------------------+--------
 anon_cannot_complete_notification          | PASS
 authenticated_cannot_complete_notification | PASS
 complete_notification_rpc_exists           | PASS
 dead_letter_column_exists                  | PASS
 guest_defer_trigger_removed                | PASS
 guest_whatsapp_trigger_exists              | PASS
 notification_channel_column_exists         | PASS
 notification_channels_valid                | PASS
 provider_message_id_column_exists          | PASS
 provider_response_column_exists            | PASS
(10 rows)
```
