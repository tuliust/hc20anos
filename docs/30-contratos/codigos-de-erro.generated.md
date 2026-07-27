---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 314b8a5ee2d293037232e0d37161d6690df73ff0
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
| `admin_required` | `supabase/functions/refund-processor/index.ts:30` |
| `already_used` | `supabase/functions/server/index.ts:475` |
| `authentication_required` | `api/checkout-create.ts:46`<br>`supabase/functions/checkout-create/index.ts:261`<br>`supabase/functions/refund-processor/index.ts:26` |
| `buyer_email_invalid` | `supabase/functions/checkout-create/index.ts:140` |
| `buyer_name_required` | `supabase/functions/checkout-create/index.ts:139` |
| `checkout_service_unavailable` | `api/checkout-create.ts:107` |
| `checkout_upstream_error` | `api/checkout-create.ts:76` |
| `child_birth_date_invalid` | `supabase/functions/checkout-create/index.ts:158` |
| `child_birth_date_required` | `supabase/functions/checkout-create/index.ts:156` |
| `email_configuration_missing` | `supabase/functions/notification-worker/index.ts:113` |
| `extra_participant_not_found` | `supabase/functions/checkout-create/index.ts:165` |
| `extras_must_be_array` | `supabase/functions/checkout-create/index.ts:143` |
| `forbidden_origin` | `api/generate-profile-bio.ts:191` |
| `functions_public_url_missing` | `supabase/functions/checkout-create/index.ts:127` |
| `idempotency_key_required` | `supabase/functions/checkout-create/index.ts:141` |
| `internal` | `supabase/functions/server/index.ts:366` |
| `internal_error` | `supabase/functions/checkout-create/index.ts:368` |
| `invalid_checkout_response` | `api/checkout-create.ts:96` |
| `invalid_extra` | `supabase/functions/checkout-create/index.ts:166`<br>`supabase/functions/checkout-create/index.ts:169` |
| `invalid_extra_quantity` | `supabase/functions/checkout-create/index.ts:167` |
| `invalid_openai_response` | `api/generate-profile-bio.ts:302` |
| `invalid_payload` | `supabase/functions/checkout-create/index.ts:138` |
| `invalid_request` | `api/generate-profile-bio.ts:200` |
| `invalid_signature` | `supabase/functions/payment-webhook/index.ts:129`<br>`supabase/functions/server/index.ts:250` |
| `invalid_transaction_amount` | `supabase/functions/payment-webhook/index.ts:192` |
| `mercado_pago_checkout_url_missing` | `supabase/functions/checkout-create/index.ts:338` |
| `mercado_pago_environment_invalid` | `supabase/functions/checkout-create/index.ts:119` |
| `mercado_pago_not_configured` | `supabase/functions/checkout-create/index.ts:265` |
| `mercado_pago_preference_failed` | `supabase/functions/checkout-create/index.ts:249` |
| `mercado_pago_refund_failed` | `supabase/functions/refund-processor/index.ts:60` |
| `method_not_allowed` | `api/checkout-create.ts:30`<br>`api/generate-profile-bio.ts:187`<br>`supabase/functions/checkout-create/index.ts:257`<br>`supabase/functions/notification-worker/index.ts:183`<br>`supabase/functions/payment-webhook/index.ts:122`<br>`supabase/functions/refund-processor/index.ts:15` |
| `missing_or_invalid_external_reference` | `supabase/functions/payment-webhook/index.ts:188` |
| `openai_not_configured` | `api/generate-profile-bio.ts:226` |
| `openai_request_failed` | `api/generate-profile-bio.ts:292` |
| `openai_service_unavailable` | `api/generate-profile-bio.ts:308` |
| `order_creation_failed` | `supabase/functions/checkout-create/index.ts:310` |
| `order_not_found_after_creation` | `supabase/functions/checkout-create/index.ts:317` |
| `participant_client_key_duplicate` | `supabase/functions/checkout-create/index.ts:151` |
| `participant_client_key_invalid` | `supabase/functions/checkout-create/index.ts:150` |
| `participant_limit_exceeded` | `supabase/functions/checkout-create/index.ts:144` |
| `participant_name_required` | `supabase/functions/checkout-create/index.ts:154` |
| `participant_type_invalid` | `supabase/functions/checkout-create/index.ts:153` |
| `participants_must_be_array` | `supabase/functions/checkout-create/index.ts:142` |
| `payment_id_mismatch` | `supabase/functions/payment-webhook/index.ts:184` |
| `payment_id_missing` | `supabase/functions/refund-processor/index.ts:42` |
| `rate_limit_exceeded` | `api/generate-profile-bio.ts:195` |
| `recipient_email_missing` | `supabase/functions/notification-worker/index.ts:115` |
| `recipient_phone_invalid` | `supabase/functions/notification-worker/index.ts:37` |
| `refund_not_approved` | `supabase/functions/refund-processor/index.ts:38` |
| `refund_request_not_found` | `supabase/functions/refund-processor/index.ts:37` |
| `request_id_required` | `supabase/functions/refund-processor/index.ts:34` |
| `server_configuration_missing` | `supabase/functions/notification-worker/index.ts:17`<br>`supabase/functions/refund-processor/index.ts:21` |
| `supabase_anon_key_missing` | `api/checkout-create.ts:49` |
| `temporary_processing_failure` | `supabase/functions/payment-webhook/index.ts:156`<br>`supabase/functions/payment-webhook/index.ts:171`<br>`supabase/functions/payment-webhook/index.ts:226` |
| `ticket_not_found` | `supabase/functions/notification-worker/index.ts:48` |
| `ticket_qr_payload_required` | `src/lib/ticket-experience.ts:30`<br>`src/lib/ticket-experience.ts:41` |
| `unauthorized` | `supabase/functions/notification-worker/index.ts:185` |
| `whatsapp_configuration_missing` | `supabase/functions/notification-worker/index.ts:149` |

Este contrato cobre apenas códigos literais detectáveis estaticamente. Mensagens dinâmicas, erros SQL e respostas de provedores exigem geradores específicos.

