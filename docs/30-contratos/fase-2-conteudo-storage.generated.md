---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: 09eebf45d928061d25fa6d6aad2af046eba7f95d
generation_command: GitHub Actions / Phase 2 content and Storage
source_files:
  - src/lib/imageUploadSecurity.ts
  - src/lib/secureImageStorage.ts
  - supabase/functions/_shared/image-security.ts
  - supabase/functions/photo-storage/index.ts
  - supabase/migrations/20260728000001_phase2_content_storage_security.sql
  - supabase/migrations/20260728000002_phase2_moderation_concurrency.sql
  - supabase/tests/phase2_content_storage.sql
  - scripts/test-phase2-content-storage.mjs
  - tests/unit/image-upload-security.test.mts
  - tests/e2e/phase2-content-security.spec.ts
  - .github/workflows/phase2-content-storage.yml
---

# Fase 2 — conteúdo e Storage

| Verificação | Resultado |
|---|---|
| Dependências | `success` |
| Integração do runtime e refatoração do anonimato | `success` |
| Testes unitários de assinatura, MIME, EXIF e arquivos disfarçados | `success` |
| Supabase local | `failure` |
| Replay integral das migrations | `skipped` |
| Usuários e roles reais no Auth local | `skipped` |
| RLS, policies, sanitização, rate limit e contratos SQL | `skipped` |
| Tipos e contratos do banco | `skipped` |
| Contratos das RPCs consumidas | `skipped` |
| Build tipado | `skipped` |
| Edge Function local | `skipped` |
| Upload, concorrência, moderação e remoção integrados | `skipped` |
| Chromium | `skipped` |
| Regressões E2E | `skipped` |

A execução usa Supabase Auth, Postgres, Storage e Edge Runtime locais. Nenhum banco, bucket ou usuário de produção é acessado.

## phase2-image-unit.log

```text

> @figma/my-make-file@0.0.1 test:image-security
> node --experimental-strip-types --test tests/unit/image-upload-security.test.mts

TAP version 13
# Subtest: aceita PNG real e identifica dimensões
ok 1 - aceita PNG real e identifica dimensões
  ---
  duration_ms: 1.438273
  type: 'test'
  ...
# Subtest: rejeita MIME divergente da assinatura
ok 2 - rejeita MIME divergente da assinatura
  ---
  duration_ms: 0.547846
  type: 'test'
  ...
# Subtest: rejeita EXIF e metadados textuais
ok 3 - rejeita EXIF e metadados textuais
  ---
  duration_ms: 0.486762
  type: 'test'
  ...
# Subtest: rejeita arquivo com dados anexados depois da imagem
ok 4 - rejeita arquivo com dados anexados depois da imagem
  ---
  duration_ms: 0.230652
  type: 'test'
  ...
# Subtest: rejeita SVG ou HTML disfarçado de imagem
ok 5 - rejeita SVG ou HTML disfarçado de imagem
  ---
  duration_ms: 0.276237
  type: 'test'
  ...
# Subtest: rejeita dimensões e quantidade de pixels abusivas
ok 6 - rejeita dimensões e quantidade de pixels abusivas
  ---
  duration_ms: 0.220994
  type: 'test'
  ...
# Subtest: rejeita arquivo acima do limite
ok 7 - rejeita arquivo acima do limite
  ---
  duration_ms: 0.228918
  type: 'test'
  ...
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 125.580288
```

## phase2-supabase-start.log

```text
NOTICE (42701): column "home_poll_id" of relation "home_page_content" already exists, skipping
NOTICE (42701): column "home_poll_fallback_json" of relation "home_page_content" already exists, skipping
Applying migration 20260713000030_public_pages_cms_content.sql...
NOTICE (00000): trigger "trg_public_page_content_updated_at" for relation "public.public_page_content" does not exist, skipping
NOTICE (00000): policy "public_page_content_select_public" for relation "public.public_page_content" does not exist, skipping
NOTICE (00000): policy "public_page_content_manage_admins" for relation "public.public_page_content" does not exist, skipping
Applying migration 20260713000031_cms_assets.sql...
NOTICE (42701): column "program_image_url" of relation "event_page_content" already exists, skipping
NOTICE (42701): column "program_image_alt" of relation "event_page_content" already exists, skipping
NOTICE (42701): column "header_logo_url" of relation "home_page_content" already exists, skipping
NOTICE (42701): column "favicon_url" of relation "home_page_content" already exists, skipping
NOTICE (00000): trigger "trg_cms_assets_updated_at" for relation "public.cms_assets" does not exist, skipping
NOTICE (00000): policy "cms_assets_select_active" for relation "public.cms_assets" does not exist, skipping
NOTICE (00000): policy "cms_assets_manage_admins" for relation "public.cms_assets" does not exist, skipping
NOTICE (00000): policy "cms_assets_storage_public_read" for relation "storage.objects" does not exist, skipping
NOTICE (00000): policy "cms_assets_storage_admin_write" for relation "storage.objects" does not exist, skipping
Applying migration 20260713000032_remove_editorial_db_defaults.sql...
Applying migration 20260714000033_home_restored_layout_copy.sql...
Applying migration 20260715000034_home_about_data_cards.sql...
NOTICE (42701): column "home_about_overview_json" of relation "home_page_content" already exists, skipping
NOTICE (42701): column "home_profile_stats_json" of relation "home_page_content" already exists, skipping
NOTICE (42701): column "home_map_stats_json" of relation "home_page_content" already exists, skipping
NOTICE (42701): column "home_poll_id" of relation "home_page_content" already exists, skipping
NOTICE (42701): column "home_poll_fallback_json" of relation "home_page_content" already exists, skipping
Applying migration 20260715000035_sync_home_about_timeline.sql...
NOTICE (42701): column "home_nostalgia_timeline_json" of relation "home_page_content" already exists, skipping
NOTICE (42701): column "timeline_items_json" of relation "home_page_content" already exists, skipping
Applying migration 20260715000036_repair_home_event_info_label.sql...
NOTICE (42701): column "event_info_view_more_label" of relation "home_page_content" already exists, skipping
Applying migration 20260715000037_admin_content_workflow.sql...
NOTICE (42701): column "event_info_view_more_label" of relation "home_page_content" already exists, skipping
NOTICE (00000): policy "content_moderation_settings_admin_read" for relation "public.content_moderation_settings" does not exist, skipping
NOTICE (00000): policy "content_moderation_settings_admin_write" for relation "public.content_moderation_settings" does not exist, skipping
NOTICE (00000): trigger "trg_auto_approve_photos" for relation "public.photos" does not exist, skipping
NOTICE (00000): trigger "trg_auto_approve_photo_comments" for relation "public.photo_comments" does not exist, skipping
NOTICE (00000): trigger "trg_auto_approve_memories" for relation "public.memories" does not exist, skipping
Applying migration 20260715000038_seed_real_home_memories.sql...
Applying migration 20260715000039_home_about_total_label.sql...
Applying migration 20260716000001_ticketing_commerce_foundation.sql...
NOTICE (42710): extension "pgcrypto" already exists, skipping
Applying migration 20260716000002_ticketing_commerce_functions.sql...
Applying migration 20260716000003_ticketing_commerce_rls.sql...
NOTICE (00000): policy "ticket_lots_public_read" for relation "public.ticket_lots" does not exist, skipping
NOTICE (00000): policy "ticket_lot_prices_public_read" for relation "public.ticket_lot_prices" does not exist, skipping
NOTICE (00000): policy "guest_requests_guest_insert" for relation "public.guest_approval_requests" does not exist, skipping
NOTICE (00000): policy "guest_requests_parties_read" for relation "public.guest_approval_requests" does not exist, skipping
NOTICE (00000): policy "order_participants_owner_read" for relation "public.order_participants" does not exist, skipping
NOTICE (00000): policy "participant_extras_owner_read" for relation "public.participant_extras" does not exist, skipping
NOTICE (00000): policy "payment_preferences_owner_read" for relation "public.payment_preferences" does not exist, skipping
NOTICE (00000): policy "refund_requests_owner_read" for relation "public.refund_requests" does not exist, skipping
NOTICE (00000): policy "refund_requests_owner_insert" for relation "public.refund_requests" does not exist, skipping
NOTICE (00000): policy "ticket_transfers_parties_read" for relation "public.ticket_transfers" does not exist, skipping
Applying migration 20260716000004_create_checkout_order_rpc.sql...
Applying migration 20260716000005_payment_processing_rpc.sql...
Applying migration 20260716000006_notification_jobs_rpc.sql...
Applying migration 20260716000007_notification_worker_scheduler.sql...
NOTICE (42710): extension "pg_net" already exists, skipping
NOTICE (42710): extension "supabase_vault" already exists, skipping
NOTICE (00000): Notification worker scheduling is external; no database cron job was created.
Applying migration 20260716000008_notification_worker_scheduler_fix.sql...
NOTICE (42710): extension "pg_cron" already exists, skipping
NOTICE (42710): extension "pg_net" already exists, skipping
NOTICE (42710): extension "supabase_vault" already exists, skipping
NOTICE (00000): Legacy notification worker database cron is disabled; GitHub Actions owns scheduling.
Applying migration 20260716000009_additional_child_age_pricing_fix.sql...
Applying migration 20260716000010_checkout_idempotency_record_fix.sql...
Applying migration 20260716000011_checkout_idempotency_definitive_fix.sql...
NOTICE (00000): Dynamic checkout function rewriting skipped; migration 20260716000012 applies the explicit replacement.
Applying migration 20260716000012_replace_checkout_order_rpc.sql...
Applying migration 20260716000013_checkout_expiration_compatibility.sql...
Applying migration 20260716000014_checkout_returning_ambiguity_fix.sql...
Applying migration 20260716000015_checkout_rpc_hardening.sql...
Applying migration 20260716000016_payment_processing_hardening.sql...
Applying migration 20260716000017_payment_processing_portability_fix.sql...
NOTICE (42P07): relation "orders_payment_provider_order_unique" already exists, skipping
Applying migration 20260716000100_structured_faq.sql...
NOTICE (42701): column "description" of relation "faq_categories" already exists, skipping
NOTICE (42701): column "is_visible" of relation "faq_categories" already exists, skipping
NOTICE (42701): column "created_at" of relation "faq_categories" already exists, skipping
NOTICE (42701): column "updated_at" of relation "faq_categories" already exists, skipping
NOTICE (42701): column "created_by_admin_id" of relation "faq_categories" already exists, skipping
NOTICE (42701): column "updated_by_admin_id" of relation "faq_categories" already exists, skipping
NOTICE (42701): column "deleted_at" of relation "faq_categories" already exists, skipping
NOTICE (42701): column "deleted_by_admin_id" of relation "faq_categories" already exists, skipping
NOTICE (00000): trigger "trg_faq_categories_updated_at" for relation "public.faq_categories" does not exist, skipping
NOTICE (00000): trigger "trg_faq_items_updated_at" for relation "public.faq_items" does not exist, skipping
NOTICE (00000): trigger "trg_prevent_faq_category_delete" for relation "public.faq_categories" does not exist, skipping
NOTICE (00000): policy "faq_categories_public_read" for relation "public.faq_categories" does not exist, skipping
NOTICE (00000): policy "faq_categories_admin_read" for relation "public.faq_categories" does not exist, skipping
NOTICE (00000): policy "faq_categories_admin_insert" for relation "public.faq_categories" does not exist, skipping
NOTICE (00000): policy "faq_categories_admin_update" for relation "public.faq_categories" does not exist, skipping
NOTICE (00000): policy "faq_categories_superadmin_delete" for relation "public.faq_categories" does not exist, skipping
NOTICE (00000): policy "faq_items_public_read" for relation "public.faq_items" does not exist, skipping
NOTICE (00000): policy "faq_items_admin_read" for relation "public.faq_items" does not exist, skipping
NOTICE (00000): policy "faq_items_admin_insert" for relation "public.faq_items" does not exist, skipping
NOTICE (00000): policy "faq_items_admin_update" for relation "public.faq_items" does not exist, skipping
NOTICE (00000): policy "faq_items_superadmin_delete" for relation "public.faq_items" does not exist, skipping
Applying migration 20260716000101_consolidate_faq_categories.sql...
Applying migration 20260716000102_fix_faq_category_mapping.sql...
NOTICE (42P07): relation "faq_items_backup_20260716" already exists, skipping
NOTICE (42P07): relation "faq_items_backup_20260716_id_unique" already exists, skipping
Applying migration 20260716000103_faq_category_move_rpc.sql...
Applying migration 20260719000001_admin_mercado_pago_reporting.sql...
NOTICE (00000): function public.get_admin_orders(text) does not exist, skipping
NOTICE (00000): trigger "tickets_sync_ticket_type_sales" for relation "public.tickets" does not exist, skipping
NOTICE (00000): trigger "orders_sync_ticket_type_sales" for relation "public.orders" does not exist, skipping
Applying migration 20260719000002_admin_orders_mercado_pago_payload.sql...
Applying migration 20260719000003_admin_commerce_source_classification.sql...
Applying migration 20260719000004_admin_commerce_source_classification_fix.sql...
Applying migration 20260719000005_reset_commerce_data_and_cap_capacity.sql...
NOTICE (00000): trigger "ticket_types_enforce_hc20_capacity" for relation "public.ticket_types" does not exist, skipping
NOTICE (00000): trigger "ticket_lots_enforce_hc20_capacity" for relation "public.ticket_lots" does not exist, skipping
Applying migration 20260719000006_reset_all_commerce_data_and_global_capacity.sql...
Applying migration 20260719000007_buyer_orders_and_ticket_resend.sql...
Applying migration 20260719000008_commerce_notification_automation.sql...
NOTICE (00000): trigger "orders_enqueue_status_notifications" for relation "public.orders" does not exist, skipping
NOTICE (00000): trigger "tickets_enqueue_whatsapp_notification" for relation "public.tickets" does not exist, skipping
Applying migration 20260719000009_transfers_refunds_checkin_operations.sql...
Applying migration 20260719000010_refund_inventory_restore.sql...
Applying migration 20260719000011_commerce_automation_scheduler.sql...
NOTICE (42710): extension "pg_cron" already exists, skipping
Applying migration 20260719000012_external_guest_approval_flow.sql...
Applying migration 20260719000013_guest_notifications_safety.sql...
NOTICE (00000): trigger "defer_guest_approval_notification_job" for relation "public.notification_jobs" does not exist, skipping
Applying migration 20260719000014_whatsapp_notification_delivery.sql...
NOTICE (00000): constraint "notification_jobs_channel_check" of relation "notification_jobs" does not exist, skipping
NOTICE (00000): trigger "enqueue_guest_approval_whatsapp_job" for relation "public.notification_jobs" does not exist, skipping
Applying migration 20260719000015_buyer_transfer_experience.sql...
Applying migration 20260719000016_refund_fee_policy.sql...
Applying migration 20260719000017_checkin_operations_reporting.sql...
Applying migration 20260719000018_reporting_audit_security.sql...
NOTICE (00000): trigger "audit_ticket_transfers_change" for relation "public.ticket_transfers" does not exist, skipping
NOTICE (00000): trigger "audit_refund_requests_change" for relation "public.refund_requests" does not exist, skipping
NOTICE (00000): trigger "audit_guest_approval_requests_change" for relation "public.guest_approval_requests" does not exist, skipping
Applying migration 20260721000031_profile_claim_identity_verification.sql...
NOTICE (42710): extension "unaccent" already exists, skipping
Applying migration 20260721000032_revoke_anon_profile_registration.sql...
Applying migration 20260721000033_retire_legacy_profile_registration_rpcs.sql...
Applying migration 20260725000001_admin_ticket_lots_source_of_truth.sql...
Applying migration 20260725000002_ticket_lot_capacity_default.sql...
NOTICE (00000): trigger "a_ticket_lots_normalize_capacity" for relation "public.ticket_lots" does not exist, skipping
Applying migration 20260725000003_admin_rpc_compatibility_cleanup.sql...
Applying migration 20260725000004_admin_participant_maintenance.sql...
Applying migration 20260725220000_checkout_companions_guests.sql...
Applying migration 20260725221000_checkout_guest_buyer_authorization.sql...
NOTICE (00000): trigger "order_participants_guest_buyer_authorization" for relation "public.order_participants" does not exist, skipping
Applying migration 20260726040000_three_ticket_product_model.sql...
NOTICE (00000): constraint "order_participants_external_guest_contact_check" of relation "order_participants" does not exist, skipping
Applying migration 20260726060000_buyer_orders_payment_attempt_visibility.sql...
Applying migration 20260728000001_phase2_content_storage_security.sql...
NOTICE (00000): policy "photos_storage_controlled_read" for relation "storage.objects" does not exist, skipping
NOTICE (00000): constraint "photos_content_type_valid" of relation "photos" does not exist, skipping
NOTICE (00000): constraint "photos_file_size_valid" of relation "photos" does not exist, skipping
NOTICE (00000): constraint "photos_dimensions_valid" of relation "photos" does not exist, skipping
NOTICE (00000): constraint "photos_storage_owner_path" of relation "photos" does not exist, skipping
NOTICE (00000): constraint "photos_authorization_required" of relation "photos" does not exist, skipping
NOTICE (00000): constraint "photos_caption_length" of relation "photos" does not exist, skipping
NOTICE (00000): constraint "photos_location_length" of relation "photos" does not exist, skipping
NOTICE (00000): policy "content_moderation_events_admin_read" for relation "public.content_moderation_events" does not exist, skipping
NOTICE (00000): trigger "trg_photos_sanitize" for relation "public.photos" does not exist, skipping
NOTICE (00000): trigger "trg_photo_comments_sanitize" for relation "public.photo_comments" does not exist, skipping
NOTICE (00000): trigger "trg_memories_sanitize" for relation "public.memories" does not exist, skipping
NOTICE (00000): trigger "trg_photo_tags_sanitize" for relation "public.photo_tags" does not exist, skipping
NOTICE (00000): trigger "trg_photo_removal_requests_sanitize" for relation "public.photo_removal_requests" does not exist, skipping
NOTICE (00000): constraint "photo_comments_text_length" of relation "photo_comments" does not exist, skipping
NOTICE (00000): constraint "memories_text_length" of relation "memories" does not exist, skipping
NOTICE (00000): constraint "photo_tags_name_length" of relation "photo_tags" does not exist, skipping
NOTICE (00000): constraint "photo_removal_reason_length" of relation "photo_removal_requests" does not exist, skipping
Stopping containers...
ERROR: record variable cannot be part of multiple-item INTO list (SQLSTATE 42601)                                                                                
At statement: 58                                                                                                                                                 
create or replace function public.reject_photo_removal_request(p_request_id uuid, p_notes text default null)                                                     
returns public.photo_removal_requests                                                                                                                            
language plpgsql security definer set search_path = public as $$                                                                                                 
declare v_role text:=public.current_security_role(); v_row public.photo_removal_requests; v_event_id uuid; v_previous text;                                      
begin                                                                                                                                                            
  if v_role not in ('admin','superadmin') then raise exception 'admin_required'; end if;                                                                         
  select r,p.event_id into v_row,v_event_id from public.photo_removal_requests r join public.photos p on p.id=r.photo_id where r.id=p_request_id for update of r;
                                ^                                                                                                                                
Try rerunning the command with --debug to troubleshoot the error.
```
