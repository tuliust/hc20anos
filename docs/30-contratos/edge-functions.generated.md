---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: dd6944248d06c582f64519f241ce20bc7c7df259
generation_command: npm run docs:generate-contracts
source_files:
  - supabase/functions/
---

# Supabase Edge Functions

> Arquivo gerado automaticamente. Não editar manualmente.

## `checkout-create`

- **Arquivo:** `supabase/functions/checkout-create/index.ts`
- **Métodos detectados:** `OPTIONS`, `POST`
- **Sinais de autenticação:** Bearer Supabase, service role, anon key
- **Variáveis:** `CHECKOUT_ALLOWED_ORIGINS`, `FUNCTIONS_PUBLIC_URL`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_ENV`, `SITE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_FUNCTIONS_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `create_checkout_order`

## `notification-worker`

- **Arquivo:** `supabase/functions/notification-worker/index.ts`
- **Métodos detectados:** `OPTIONS`, `POST`
- **Sinais de autenticação:** service role, worker key
- **Variáveis:** `NOTIFICATION_WORKER_KEY`, `RESEND_API_KEY`, `SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TRANSACTIONAL_FROM_EMAIL`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_GRAPH_VERSION`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_LANGUAGE`
- **RPCs chamadas:** `claim_notification_jobs`, `complete_notification_job`

## `payment-webhook`

- **Arquivo:** `supabase/functions/payment-webhook/index.ts`
- **Métodos detectados:** `OPTIONS`, `POST`
- **Sinais de autenticação:** service role, assinatura Mercado Pago
- **Variáveis:** `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `apply_mercado_pago_payment`

## `refund-processor`

- **Arquivo:** `supabase/functions/refund-processor/index.ts`
- **Métodos detectados:** `OPTIONS`, `POST`
- **Sinais de autenticação:** Bearer Supabase, service role, anon key, admin_users
- **Variáveis:** `MERCADO_PAGO_ACCESS_TOKEN`, `SITE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `restore_refunded_order_inventory`

## `server`

- **Arquivo:** `supabase/functions/server/index.ts`
- **Métodos detectados:** não inferidos estaticamente
- **Sinais de autenticação:** service role, assinatura Mercado Pago
- **Variáveis:** `FUNCTIONS_PUBLIC_URL`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SITE_URL`, `SUPABASE_FUNCTIONS_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TRANSACTIONAL_FROM_EMAIL`, `WHATSAPP_PROVIDER_TOKEN`, `WHATSAPP_PROVIDER_URL`, `WHATSAPP_TICKET_TEMPLATE`
- **RPCs chamadas:** `fn_increment_sold`

