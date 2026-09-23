---
status: generated
owner: tuliust
last_verified: 2026-09-22
last_verified_commit: bcf4af87038b09f4d8ef765f6bf569ade17c7863
generation_command: npm run docs:generate-contracts
source_files:
  - api/
  - supabase/functions/
  - src/
  - build/
  - scripts/
---

# Códigos de erro estáticos

> Arquivo gerado automaticamente. Não editar manualmente.

| Código | Ocorrências |
|---|---|
| `admin_required` | `supabase/functions/photo-storage/index.ts:167`<br>`supabase/functions/refund-processor/index.ts:30` |
| `already_used` | `supabase/functions/server/index.ts:449` |
| `authentication_required` | `api/checkout-create.ts:46`<br>`src/lib/checkout.ts:153`<br>`supabase/functions/checkout-create/index.ts:112`<br>`supabase/functions/checkout-create/index.ts:118`<br>`supabase/functions/payment-webhook/index.ts:339`<br>`supabase/functions/payment-webhook/index.ts:46`<br>`supabase/functions/payment-webhook/index.ts:49`<br>`supabase/functions/photo-storage/index.ts:51`<br>`supabase/functions/photo-storage/index.ts:57`<br>`supabase/functions/refund-processor/index.ts:26` |
| `buyer_email_invalid` | `supabase/functions/checkout-create/index.ts:74` |
| `buyer_name_required` | `supabase/functions/checkout-create/index.ts:73` |
| `checkout_environment_conflict` | `supabase/functions/checkout-create/index.ts:269` |
| `checkout_idempotency_expired` | `supabase/functions/checkout-create/index.ts:255` |
| `checkout_service_unavailable` | `api/checkout-create.ts:107` |
| `checkout_upstream_error` | `api/checkout-create.ts:76` |
| `child_birth_date_invalid` | `supabase/functions/checkout-create/index.ts:96` |
| `child_birth_date_required` | `supabase/functions/checkout-create/index.ts:94` |
| `email_configuration_missing` | `supabase/functions/notification-worker/index.ts:104` |
| `event_id_required` | `supabase/functions/photo-storage/index.ts:103` |
| `exactly_one_alumni_required` | `supabase/functions/checkout-create/index.ts:99` |
| `forbidden` | `supabase/functions/payment-webhook/index.ts:299` |
| `forbidden_origin` | `api/generate-profile-bio.ts:239` |
| `idempotency_key_required` | `supabase/functions/checkout-create/index.ts:76` |
| `image_required` | `supabase/functions/photo-storage/index.ts:159`<br>`supabase/functions/photo-storage/index.ts:82` |
| `internal` | `supabase/functions/server/index.ts:340` |
| `internal_error` | `supabase/functions/checkout-create/index.ts:348` |
| `invalid_action` | `supabase/functions/photo-storage/index.ts:259` |
| `invalid_asset_target` | `supabase/functions/photo-storage/index.ts:163` |
| `invalid_checkout_response` | `api/checkout-create.ts:96` |
| `invalid_openai_response` | `api/generate-profile-bio.ts:340` |
| `invalid_payload` | `supabase/functions/checkout-create/index.ts:72` |
| `invalid_photo_tags` | `supabase/functions/photo-storage/index.ts:39`<br>`supabase/functions/photo-storage/index.ts:41`<br>`supabase/functions/photo-storage/index.ts:99` |
| `invalid_public_storage_origin` | `supabase/functions/photo-storage/index.ts:200` |
| `invalid_request` | `api/generate-profile-bio.ts:248` |
| `invalid_signature` | `supabase/functions/payment-webhook/index.ts:348`<br>`supabase/functions/server/index.ts:225` |
| `invalid_transaction_amount` | `supabase/functions/payment-webhook/index.ts:248` |
| `mercado_pago_checkout_url_missing` | `supabase/functions/checkout-create/index.ts:292` |
| `mercado_pago_environment_invalid` | `supabase/functions/checkout-create/index.ts:58` |
| `mercado_pago_not_configured` | `supabase/functions/checkout-create/index.ts:223` |
| `mercado_pago_preference_failed` | `supabase/functions/checkout-create/index.ts:203` |
| `mercado_pago_refund_failed` | `supabase/functions/refund-processor/index.ts:60` |
| `merchant_order_ambiguous_for_payment` | `supabase/functions/payment-webhook/index.ts:241` |
| `merchant_order_external_reference_mismatch` | `supabase/functions/payment-webhook/index.ts:204` |
| `merchant_order_not_found_for_payment` | `supabase/functions/payment-webhook/index.ts:240` |
| `merchant_order_payment_mismatch` | `supabase/functions/payment-webhook/index.ts:207` |
| `merchant_order_preference_required` | `supabase/functions/payment-webhook/index.ts:211` |
| `method_not_allowed` | `api/checkout-create.ts:30`<br>`api/generate-profile-bio.ts:235`<br>`supabase/functions/checkout-create/index.ts:220`<br>`supabase/functions/notification-worker/index.ts:133`<br>`supabase/functions/payment-webhook/index.ts:273`<br>`supabase/functions/photo-storage/index.ts:252`<br>`supabase/functions/refund-processor/index.ts:15` |
| `missing_access_token` | `supabase/functions/payment-webhook/index.ts:165` |
| `missing_or_invalid_external_reference` | `supabase/functions/payment-webhook/index.ts:192` |
| `openai_not_configured` | `api/generate-profile-bio.ts:274` |
| `openai_request_failed` | `api/generate-profile-bio.ts:312`<br>`api/generate-profile-bio.ts:328` |
| `openai_service_unavailable` | `api/generate-profile-bio.ts:346` |
| `order_creation_failed` | `supabase/functions/checkout-create/index.ts:245` |
| `order_not_found` | `supabase/functions/payment-webhook/index.ts:291`<br>`supabase/functions/payment-webhook/index.ts:340` |
| `order_not_found_after_creation` | `supabase/functions/checkout-create/index.ts:252` |
| `participant_client_key_duplicate` | `supabase/functions/checkout-create/index.ts:87` |
| `participant_client_key_invalid` | `supabase/functions/checkout-create/index.ts:86` |
| `participant_limit_exceeded` | `supabase/functions/checkout-create/index.ts:79` |
| `participant_name_required` | `supabase/functions/checkout-create/index.ts:90` |
| `participant_type_invalid` | `supabase/functions/checkout-create/index.ts:89` |
| `participants_must_be_array` | `supabase/functions/checkout-create/index.ts:78` |
| `payment_id_invalid` | `src/lib/checkout.ts:149` |
| `payment_id_mismatch` | `supabase/functions/payment-webhook/index.ts:185` |
| `payment_id_missing` | `supabase/functions/refund-processor/index.ts:42` |
| `photo_authorization_required` | `supabase/functions/photo-storage/index.ts:84` |
| `public_token_mismatch` | `supabase/functions/payment-webhook/index.ts:304` |
| `rate_limit_exceeded` | `api/generate-profile-bio.ts:243` |
| `recipient_email_missing` | `supabase/functions/notification-worker/index.ts:106` |
| `reconciliation_failed` | `supabase/functions/payment-webhook/index.ts:341` |
| `refund_not_approved` | `supabase/functions/refund-processor/index.ts:38` |
| `refund_request_not_found` | `supabase/functions/refund-processor/index.ts:37` |
| `request_id_required` | `supabase/functions/photo-storage/index.ts:222`<br>`supabase/functions/refund-processor/index.ts:34` |
| `server_configuration_missing` | `supabase/functions/checkout-create/index.ts:56`<br>`supabase/functions/notification-worker/index.ts:17`<br>`supabase/functions/photo-storage/index.ts:24`<br>`supabase/functions/refund-processor/index.ts:21` |
| `signed_url_failed` | `supabase/functions/photo-storage/index.ts:139` |
| `spouse_limit_exceeded` | `supabase/functions/checkout-create/index.ts:100` |
| `storage_delete_failed` | `supabase/functions/photo-storage/index.ts:246` |
| `storage_upload_failed` | `supabase/functions/photo-storage/index.ts:112`<br>`supabase/functions/photo-storage/index.ts:187` |
| `supabase_anon_key_missing` | `api/checkout-create.ts:49` |
| `temporary_processing_failure` | `supabase/functions/payment-webhook/index.ts:374`<br>`supabase/functions/payment-webhook/index.ts:403` |
| `terms_acceptance_required` | `supabase/functions/checkout-create/index.ts:75` |
| `terms_acceptance_write_failed` | `supabase/functions/checkout-create/index.ts:145` |
| `ticket_not_found` | `supabase/functions/notification-worker/index.ts:40` |
| `ticket_qr_payload_required` | `src/lib/ticket-experience.ts:30`<br>`src/lib/ticket-experience.ts:41` |
| `unauthorized` | `supabase/functions/notification-worker/index.ts:135` |
| `unsupported_primary_product` | `supabase/functions/checkout-create/index.ts:77` |

Este contrato cobre apenas códigos literais detectáveis estaticamente. Mensagens dinâmicas, erros SQL e respostas de provedores exigem geradores específicos.

