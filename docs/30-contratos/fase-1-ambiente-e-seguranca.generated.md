---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: 5d98fbed05d0ea93b3e6250cfc4113aa76b5c085
generation_command: GitHub Actions / Phase 1 environment and security
source_files:
  - supabase/migrations/
  - supabase/tests/
  - src/lib/rpc.types.ts
  - scripts/generate-consumed-rpc-contracts.mjs
  - .github/workflows/phase1-environment-security.yml
---

# Fase 1 — ambiente e segurança

| Verificação | Resultado |
|---|---|
| Inventário e contratos das RPCs consumidas | `success` |
| Build TypeScript e aplicação | `success` |
| Inicialização do Supabase local | `success` |
| Replay integral das migrations | `success` |
| Usuários e roles determinísticos | `success` |
| RLS, grants, triggers, constraints e roles | `failure` |
| Regeneração dos contratos do banco | `skipped` |
| Auditoria documental | `skipped` |

O ambiente usa somente Supabase local e dados sintéticos. Nenhum banco remoto ou dado de produção é consultado.

## Diagnóstico SQL

```text
 guest_cancel_rpc_exists                | PASS
 guest_decision_rpc_exists              | PASS
 guest_expiration_cron_exists           | PASS
 guest_expiration_rpc_exists            | PASS
 guest_list_rpc_exists                  | PASS
 guest_request_rpc_exists               | PASS
 guest_sponsor_search_rpc_exists        | PASS
 guest_whatsapp_trigger_exists          | PASS
 legacy_guest_defer_trigger_removed     | PASS
(11 rows)
===== supabase/tests/faq_category_consolidation_validation.sql =====
 total_faq_items | active_faq_items | deleted_faq_items 
-----------------+------------------+-------------------
               6 |                6 |                 0
(1 row)

        key        |             label             |   icon_key    | sort_order | is_visible |          deleted_at           | total_items | active_items | visible_items | featured_items 
-------------------+-------------------------------+---------------+------------+------------+-------------------------------+-------------+--------------+---------------+----------------
 account-access    | Cadastro e Login              | user-key      |         10 | t          |                               |           0 |            0 |             0 |              0
 site-sections     | Seções do Site                | layout-grid   |         20 | t          |                               |           0 |            0 |             0 |              0
 data-privacy      | Dados e Privacidade           | shield-lock   |         30 | t          |                               |           0 |            0 |             0 |              0
 event-information | Informações do Evento         | calendar-days |         40 | t          |                               |           6 |            6 |             6 |              6
 tickets-pricing   | Categorias e Valores          | ticket        |         50 | t          |                               |           0 |            0 |             0 |              0
 checkout-payment  | Checkout e Pagamento          | credit-card   |         60 | t          |                               |           0 |            0 |             0 |              0
 refund-transfer   | Reembolso e Transferência     | refresh-cw    |         70 | t          |                               |           0 |            0 |             0 |              0
 general           | Informações gerais            |               |         10 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 pricing           | Lotes e preços                |               |         20 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 tickets           | Categorias de ingresso        |               |         30 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 participants      | Dados dos participantes       |               |         40 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 guests            | Compra por convidado externo  |               |         50 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 extras            | Extras de bebidas e churrasco |               |         60 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 payments          | Checkout e pagamento          |               |         70 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 transfers         | Transferência                 |               |         80 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 refunds           | Reembolso                     |               |         90 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
 checkin           | Check-in                      |               |        100 | f          | 2026-07-28 18:27:02.006788+00 |           0 |            0 |             0 |              0
(17 rows)

          slug           |            question            |   category_key    |    category_label     | relational_category_key | relational_category_label 
-------------------------+--------------------------------+-------------------+-----------------------+-------------------------+---------------------------
 legacy-909720fbcbaaf0ab | Quem pode participar?          | event-information | Informações do Evento | event-information       | Informações do Evento
 legacy-10e7019319176f8b | Posso levar acompanhante?      | event-information | Informações do Evento | event-information       | Informações do Evento
 legacy-c9b1a76461315592 | Como funciona a reivindicação? | event-information | Informações do Evento | event-information       | Informações do Evento
 legacy-23f94f0a68dcc84d | O ingresso é transferível?     | event-information | Informações do Evento | event-information       | Informações do Evento
 legacy-ec50f08828b0388b | Qual é a forma de pagamento?   | event-information | Informações do Evento | event-information       | Informações do Evento
 legacy-f99e00f805a28032 | Como farei o check-in no dia?  | event-information | Informações do Evento | event-information       | Informações do Evento
(6 rows)

 inconsistent_items 
--------------------
                  0
(1 row)

 active_obsolete_categories 
----------------------------
                          0
(1 row)
===== supabase/tests/faq_category_mapping_fix_validation.sql =====
        key        |           label           |   icon_key    | total_perguntas 
-------------------+---------------------------+---------------+-----------------
 account-access    | Cadastro e Login          | user-key      |               0
 site-sections     | Seções do Site            | layout-grid   |               0
 data-privacy      | Dados e Privacidade       | shield-lock   |               0
 event-information | Informações do Evento     | calendar-days |               6
 tickets-pricing   | Categorias e Valores      | ticket        |               0
 checkout-payment  | Checkout e Pagamento      | credit-card   |               0
 refund-transfer   | Reembolso e Transferência | refresh-cw    |               0
(7 rows)

 inconsistent_items 
--------------------
                  0
(1 row)

 total_items | event_information | tickets_pricing | checkout_payment | refund_transfer | account_access | site_sections | data_privacy 
-------------+-------------------+-----------------+------------------+-----------------+----------------+---------------+--------------
           6 |                 6 |               0 |                0 |               0 |              0 |             0 |            0
(1 row)
===== supabase/tests/faq_schema_integrity.sql =====
             check_name              | result 
-------------------------------------+--------
 faq_backup_covers_current_items     | PASS
 faq_backup_table_exists             | PASS
 faq_categories_table_exists         | PASS
 faq_icon_column_exists              | PASS
 faq_items_have_valid_categories     | PASS
 faq_items_table_exists              | PASS
 faq_move_rpc_exists                 | PASS
 faq_redundant_labels_are_consistent | PASS
 seven_active_categories_exist       | PASS
(9 rows)
===== supabase/tests/migration_reconciliation.sql =====
                 check_name                 | result 
--------------------------------------------+--------
 all_expected_versions_are_registered       | PASS
 commerce_foundation_objects_exist          | PASS
 faq_objects_exist                          | PASS
 no_duplicate_registered_versions           | PASS
 operational_objects_exist                  | PASS
 profile_identity_latest_version_registered | PASS
(6 rows)
===== supabase/tests/phase1_environment_security.sql =====
ERROR:  operator does not exist: name[] = text[]
LINE 9:     ) = array['superadmin','moderator','checkin_staff','admi...
              ^
HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.
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
 {"pix_orders": 0, "card_orders": 0, "orders_total": 0, "photos_total": 0, "tickets_sold": 0, "checkins_done": 0, "revenue_cents": 0, "claims_pending": 0, "orders_expired": 0, "orders_pending": 0, "people_claimed": 4, "photos_pending": 0, "subtotal_cents": 0, "transfers_open": 0, "drinks_packages": 0, "orders_approved": 0, "orders_refunded": 0, "orders_rejected": 0, "photos_approved": 0, "photos_rejected": 0, "checkins_pending": 0, "disputes_pending": 0, "orders_cancelled": 0, "people_confirmed": 10, "people_unclaimed": 4, "removals_pending": 0, "barbecue_packages": 0, "preferences_active": 0, "vouchers_delivered": 0, "average_order_cents": 0, "legacy_orders_total": 0, "legacy_tickets_sold": 0, "orders_charged_back": 0, "preferences_expired": 0, "refund_amount_cents": 0, "reservations_active": 0, "extras_revenue_cents": 0, "legacy_revenue_cents": 0, "payment_events_total": 0, "refund_requests_open": 0, "reservations_expired": 0, "participants_approved": 0, "payment_events_failed": 0, "legacy_orders_approved": 0, "reservations_converted": 0, "notification_jobs_failed": 0, "mercado_pago_orders_total": 0, "mercado_pago_participants": 0, "mercado_pago_tickets_sold": 0, "notification_jobs_pending": 0, "legacy_active_reservations": 0, "mercado_pago_revenue_cents": 0, "commerce_data_quality_alerts": 0, "mercado_pago_orders_approved": 0}
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
 {"pix_orders": 0, "card_orders": 0, "orders_total": 0, "photos_total": 0, "tickets_sold": 0, "checkins_done": 0, "revenue_cents": 0, "claims_pending": 0, "orders_expired": 0, "orders_pending": 0, "people_claimed": 4, "photos_pending": 0, "subtotal_cents": 0, "transfers_open": 0, "drinks_packages": 0, "orders_approved": 0, "orders_refunded": 0, "orders_rejected": 0, "photos_approved": 0, "photos_rejected": 0, "checkins_pending": 0, "disputes_pending": 0, "orders_cancelled": 0, "people_confirmed": 10, "people_unclaimed": 4, "removals_pending": 0, "barbecue_packages": 0, "preferences_active": 0, "vouchers_delivered": 0, "average_order_cents": 0, "legacy_orders_total": 0, "legacy_tickets_sold": 0, "orders_charged_back": 0, "preferences_expired": 0, "refund_amount_cents": 0, "reservations_active": 0, "extras_revenue_cents": 0, "legacy_revenue_cents": 0, "payment_events_total": 0, "refund_requests_open": 0, "reservations_expired": 0, "participants_approved": 0, "payment_events_failed": 0, "legacy_orders_approved": 0, "reservations_converted": 0, "notification_jobs_failed": 0, "mercado_pago_orders_total": 0, "mercado_pago_participants": 0, "mercado_pago_tickets_sold": 0, "notification_jobs_pending": 0, "legacy_active_reservations": 0, "mercado_pago_revenue_cents": 0, "commerce_data_quality_alerts": 0, "mercado_pago_orders_approved": 0}
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
