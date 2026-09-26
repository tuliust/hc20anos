---
status: generated
owner: tuliust
last_verified: 2026-09-26
last_verified_commit: 2ccc0ee20fa15a1d93ee1f82c017d3ffe0284750
generation_command: npm run docs:generate-contracts
source_files:
  - supabase/functions/
---

# Supabase Edge Functions

> Arquivo gerado automaticamente. Não editar manualmente.

## `checkout-consent`

- **Arquivo:** `supabase/functions/checkout-consent/index.ts`
- **Métodos detectados:** `GET`, `POST`
- **Sinais de autenticação:** service role
- **Variáveis:** `SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma

## `checkout-create`

- **Arquivo:** `supabase/functions/checkout-create/index.ts`
- **Métodos detectados:** `GET`, `OPTIONS`, `POST`
- **Sinais de autenticação:** Bearer Supabase, service role, anon key
- **Variáveis:** `FUNCTIONS_PUBLIC_URL`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_ENV`, `SITE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_FUNCTIONS_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `create_checkout_order`

## `notification-worker`

- **Arquivo:** `supabase/functions/notification-worker/index.ts`
- **Métodos detectados:** `OPTIONS`, `POST`
- **Sinais de autenticação:** service role, worker key
- **Variáveis:** `NOTIFICATION_WORKER_KEY`, `RESEND_API_KEY`, `SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TRANSACTIONAL_FROM_EMAIL`
- **RPCs chamadas:** `claim_notification_jobs`, `complete_notification_job`

## `payment-webhook`

- **Arquivo:** `supabase/functions/payment-webhook/index.ts`
- **Métodos detectados:** `OPTIONS`, `POST`
- **Sinais de autenticação:** Bearer Supabase, service role, anon key, assinatura Mercado Pago, admin_users
- **Variáveis:** `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `SITE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `apply_mercado_pago_payment`

## `photo-storage`

- **Arquivo:** `supabase/functions/photo-storage/index.ts`
- **Métodos detectados:** `OPTIONS`, `POST`
- **Sinais de autenticação:** Bearer Supabase, service role, anon key, admin_users
- **Variáveis:** `PHOTO_STORAGE_PUBLIC_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `complete_photo_removal`, `create_uploaded_photo`, `prepare_photo_removal`

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
- **Variáveis:** `FUNCTIONS_PUBLIC_URL`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SITE_URL`, `SUPABASE_FUNCTIONS_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TRANSACTIONAL_FROM_EMAIL`
- **RPCs chamadas:** `fn_increment_sold`

