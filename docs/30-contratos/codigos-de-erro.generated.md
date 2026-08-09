---
status: generated
owner: tuliust
last_verified: 2026-08-09
last_verified_commit: 2b1ba03e46ffda8f0e684c93d72ab75cb134ed99
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
| `admin_required` | `supabase/functions/photo-storage/index.ts:219`<br>`supabase/functions/refund-processor/index.ts:30` |
| `already_used` | `supabase/functions/server/index.ts:475` |
| `authentication_required` | `api/checkout-create.ts:46`<br>`supabase/functions/checkout-create/index.ts:293`<br>`supabase/functions/photo-storage/index.ts:103`<br>`supabase/functions/photo-storage/index.ts:109`<br>`supabase/functions/refund-processor/index.ts:26` |
| `buyer_email_invalid` | `supabase/functions/checkout-create/index.ts:157` |
| `buyer_name_required` | `supabase/functions/checkout-create/index.ts:156` |
| `checkout_environment_conflict` | `supabase/functions/checkout-create/index.ts:327`<br>`supabase/functions/checkout-create/index.ts:389` |
| `checkout_idempotency_expired` | `supabase/functions/checkout-create/index.ts:375` |
| `checkout_service_unavailable` | `api/checkout-create.ts:107` |
| `checkout_upstream_error` | `api/checkout-create.ts:76` |
| `child_birth_date_invalid` | `supabase/functions/checkout-create/index.ts:175` |
| `child_birth_date_required` | `supabase/functions/checkout-create/index.ts:173` |
| `email_configuration_missing` | `supabase/functions/notification-worker/index.ts:113` |
| `event_id_required` | `supabase/functions/photo-storage/index.ts:155` |
| `extra_participant_not_found` | `supabase/functions/checkout-create/index.ts:182` |
| `extras_must_be_array` | `supabase/functions/checkout-create/index.ts:160` |
| `forbidden_origin` | `api/generate-profile-bio.ts:191` |
| `functions_public_url_missing` | `supabase/functions/checkout-create/index.ts:144` |
| `idempotency_key_required` | `supabase/functions/checkout-create/index.ts:158` |
| `image_required` | `supabase/functions/photo-storage/index.ts:134`<br>`supabase/functions/photo-storage/index.ts:211` |
| `internal` | `supabase/functions/server/index.ts:366` |
| `internal_error` | `supabase/functions/checkout-create/index.ts:460` |
| `invalid_action` | `supabase/functions/photo-storage/index.ts:288` |
| `invalid_asset_target` | `supabase/functions/photo-storage/index.ts:215` |
| `invalid_checkout_response` | `api/checkout-create.ts:96` |
| `invalid_extra` | `supabase/functions/checkout-create/index.ts:183`<br>`supabase/functions/checkout-create/index.ts:186` |
| `invalid_extra_quantity` | `supabase/functions/checkout-create/index.ts:184` |
| `invalid_openai_response` | `api/generate-profile-bio.ts:302` |
| `invalid_payload` | `supabase/functions/checkout-create/index.ts:155` |
| `invalid_photo_tags` | `supabase/functions/photo-storage/index.ts:151`<br>`supabase/functions/photo-storage/index.ts:91`<br>`supabase/functions/photo-storage/index.ts:93` |
| `invalid_request` | `api/generate-profile-bio.ts:200` |
| `invalid_signature` | `supabase/functions/payment-webhook/index.ts:129`<br>`supabase/functions/server/index.ts:250` |
| `invalid_transaction_amount` | `supabase/functions/payment-webhook/index.ts:192` |
| `mercado_pago_checkout_url_missing` | `supabase/functions/checkout-create/index.ts:416` |
| `mercado_pago_environment_invalid` | `supabase/functions/checkout-create/index.ts:136` |
| `mercado_pago_not_configured` | `supabase/functions/checkout-create/index.ts:306` |
| `mercado_pago_preference_failed` | `supabase/functions/checkout-create/index.ts:282` |
| `mercado_pago_refund_failed` | `supabase/functions/refund-processor/index.ts:60` |
| `method_not_allowed` | `api/checkout-create.ts:30`<br>`api/generate-profile-bio.ts:187`<br>`supabase/functions/checkout-create/index.ts:303`<br>`supabase/functions/notification-worker/index.ts:183`<br>`supabase/functions/payment-webhook/index.ts:122`<br>`supabase/functions/photo-storage/index.ts:281`<br>`supabase/functions/refund-processor/index.ts:15` |
| `missing_or_invalid_external_reference` | `supabase/functions/payment-webhook/index.ts:188` |
| `openai_not_configured` | `api/generate-profile-bio.ts:226` |
| `openai_request_failed` | `api/generate-profile-bio.ts:292` |
| `openai_service_unavailable` | `api/generate-profile-bio.ts:308` |
| `order_creation_failed` | `supabase/functions/checkout-create/index.ts:353` |
| `order_not_found_after_creation` | `supabase/functions/checkout-create/index.ts:360` |
| `participant_client_key_duplicate` | `supabase/functions/checkout-create/index.ts:168` |
| `participant_client_key_invalid` | `supabase/functions/checkout-create/index.ts:167` |
| `participant_limit_exceeded` | `supabase/functions/checkout-create/index.ts:161` |
| `participant_name_required` | `supabase/functions/checkout-create/index.ts:171` |
| `participant_type_invalid` | `supabase/functions/checkout-create/index.ts:170` |
| `participants_must_be_array` | `supabase/functions/checkout-create/index.ts:159` |
| `payment_id_mismatch` | `supabase/functions/payment-webhook/index.ts:184` |
| `payment_id_missing` | `supabase/functions/refund-processor/index.ts:42` |
| `photo_authorization_required` | `supabase/functions/photo-storage/index.ts:136` |
| `rate_limit_exceeded` | `api/generate-profile-bio.ts:195` |
| `recipient_email_missing` | `supabase/functions/notification-worker/index.ts:115` |
| `recipient_phone_invalid` | `supabase/functions/notification-worker/index.ts:37` |
| `refund_not_approved` | `supabase/functions/refund-processor/index.ts:38` |
| `refund_request_not_found` | `supabase/functions/refund-processor/index.ts:37` |
| `request_id_required` | `supabase/functions/photo-storage/index.ts:251`<br>`supabase/functions/refund-processor/index.ts:34` |
| `server_configuration_missing` | `supabase/functions/notification-worker/index.ts:17`<br>`supabase/functions/photo-storage/index.ts:22`<br>`supabase/functions/refund-processor/index.ts:21` |
| `signed_url_failed` | `supabase/functions/photo-storage/index.ts:191` |
| `storage_delete_failed` | `supabase/functions/photo-storage/index.ts:275` |
| `storage_upload_failed` | `supabase/functions/photo-storage/index.ts:164`<br>`supabase/functions/photo-storage/index.ts:239` |
| `supabase_anon_key_missing` | `api/checkout-create.ts:49` |
| `temporary_processing_failure` | `supabase/functions/payment-webhook/index.ts:156`<br>`supabase/functions/payment-webhook/index.ts:171`<br>`supabase/functions/payment-webhook/index.ts:226` |
| `ticket_not_found` | `supabase/functions/notification-worker/index.ts:48` |
| `ticket_qr_payload_required` | `src/lib/ticket-experience.ts:30`<br>`src/lib/ticket-experience.ts:41` |
| `unauthorized` | `supabase/functions/notification-worker/index.ts:185` |
| `whatsapp_configuration_missing` | `supabase/functions/notification-worker/index.ts:149` |

Este contrato cobre apenas códigos literais detectáveis estaticamente. Mensagens dinâmicas, erros SQL e respostas de provedores exigem geradores específicos.

