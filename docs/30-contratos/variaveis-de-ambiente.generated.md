---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 0cda735d6a0e608c9da6f27670f1645871021150
generation_command: npm run docs:generate-contracts
source_files:
  - api/
  - supabase/functions/
  - src/
  - build/
  - scripts/
---

# Variáveis de ambiente

> Arquivo gerado automaticamente. Não editar manualmente.

| Variável | Exposição | Consumidores |
|---|---|---|
| `AI_GATEWAY_API_KEY` | server-side | `api/generate-profile-bio.ts` |
| `CHECKOUT_ALLOWED_ORIGINS` | server-side | `supabase/functions/checkout-create/index.ts` |
| `FUNCTIONS_PUBLIC_URL` | server-side | `supabase/functions/checkout-create/index.ts`<br>`supabase/functions/server/index.ts` |
| `MERCADO_PAGO_ACCESS_TOKEN` | server-side | `supabase/functions/checkout-create/index.ts`<br>`supabase/functions/payment-webhook/index.ts`<br>`supabase/functions/refund-processor/index.ts`<br>`supabase/functions/server/index.ts` |
| `MERCADO_PAGO_ENV` | server-side | `supabase/functions/checkout-create/index.ts` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | server-side | `supabase/functions/payment-webhook/index.ts`<br>`supabase/functions/server/index.ts` |
| `NOTIFICATION_WORKER_KEY` | server-side | `supabase/functions/notification-worker/index.ts` |
| `OPENAI_API_KEY` | server-side | `api/generate-profile-bio.ts` |
| `OPENAI_PROFILE_MODEL` | server-side | `api/generate-profile-bio.ts` |
| `RESEND_API_KEY` | server-side | `supabase/functions/notification-worker/index.ts`<br>`supabase/functions/server/index.ts` |
| `SITE_URL` | server-side | `supabase/functions/checkout-create/index.ts`<br>`supabase/functions/notification-worker/index.ts`<br>`supabase/functions/payment-webhook/index.ts`<br>`supabase/functions/refund-processor/index.ts`<br>`supabase/functions/server/index.ts` |
| `SUPABASE_ANON_KEY` | server-side | `api/checkout-create.ts`<br>`supabase/functions/checkout-create/index.ts`<br>`supabase/functions/refund-processor/index.ts` |
| `SUPABASE_DB_CONTAINER` | server-side | `scripts/generate-database-contracts.mjs` |
| `SUPABASE_FUNCTIONS_URL` | server-side | `supabase/functions/checkout-create/index.ts`<br>`supabase/functions/server/index.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side | `supabase/functions/checkout-create/index.ts`<br>`supabase/functions/notification-worker/index.ts`<br>`supabase/functions/payment-webhook/index.ts`<br>`supabase/functions/refund-processor/index.ts`<br>`supabase/functions/server/index.ts`<br>`supabase/functions/server/kv_store.tsx` |
| `SUPABASE_URL` | server-side | `api/checkout-create.ts`<br>`supabase/functions/checkout-create/index.ts`<br>`supabase/functions/notification-worker/index.ts`<br>`supabase/functions/payment-webhook/index.ts`<br>`supabase/functions/refund-processor/index.ts`<br>`supabase/functions/server/index.ts`<br>`supabase/functions/server/kv_store.tsx` |
| `TRANSACTIONAL_FROM_EMAIL` | server-side | `supabase/functions/notification-worker/index.ts`<br>`supabase/functions/server/index.ts` |
| `VERCEL_OIDC_TOKEN` | server-side | `api/generate-profile-bio.ts` |
| `VITE_DEV_MODE` | pública no bundle | `src/lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | pública no bundle | `api/checkout-create.ts`<br>`src/app/OperationsPage.tsx`<br>`src/lib/checkout.ts`<br>`src/lib/services.ts`<br>`src/lib/supabase.ts` |
| `VITE_SUPABASE_URL` | pública no bundle | `api/checkout-create.ts`<br>`src/app/OperationsPage.tsx`<br>`src/lib/services.ts`<br>`src/lib/supabase.ts` |
| `WHATSAPP_ACCESS_TOKEN` | server-side | `supabase/functions/notification-worker/index.ts` |
| `WHATSAPP_GRAPH_VERSION` | server-side | `supabase/functions/notification-worker/index.ts` |
| `WHATSAPP_PHONE_NUMBER_ID` | server-side | `supabase/functions/notification-worker/index.ts` |
| `WHATSAPP_PROVIDER_TOKEN` | server-side | `supabase/functions/server/index.ts` |
| `WHATSAPP_PROVIDER_URL` | server-side | `supabase/functions/server/index.ts` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | server-side | `supabase/functions/notification-worker/index.ts` |
| `WHATSAPP_TICKET_TEMPLATE` | server-side | `supabase/functions/server/index.ts` |

Valores e secrets são deliberadamente omitidos.

