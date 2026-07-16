# Execução manual no Supabase — Checkout Pro

Execute os arquivos abaixo no **SQL Editor** do Supabase, um por vez, exatamente nesta ordem:

1. `20260716000001_ticketing_commerce_foundation.sql`
2. `20260716000002_ticketing_commerce_functions.sql`
3. `20260716000003_ticketing_commerce_rls.sql`
4. `20260716000003a_checkout_rpc_support.sql`
5. `20260716000003b_event_age_helper.sql`
6. `20260716000004_create_checkout_order_rpc.sql`
7. `20260716000005_payment_processing_rpc.sql`

Depois execute, apenas como validação:

8. `99_checkout_commerce_smoke.sql`

## Antes de executar

- Faça backup do banco.
- Confirme que o evento principal usa o ID `00000000-0000-0000-0000-000000000001`.
- Execute inicialmente em projeto de teste ou branch de banco.
- Não execute os arquivos fora de ordem.
- Não inclua Access Token ou segredo do webhook no SQL Editor.

## Resultado esperado

Cada migration deve concluir sem erro. O smoke test deve terminar sem lançar exceção. Consultas `select` do teste podem exibir linhas informativas.

## Edge Functions após o SQL

Publique separadamente:

```bash
supabase functions deploy checkout-create --no-verify-jwt
supabase functions deploy payment-webhook --no-verify-jwt
```

As próprias funções validam autenticação e assinatura conforme o endpoint.

## Secrets

```bash
supabase secrets set SITE_URL="https://hc20anos.com.br"
supabase secrets set MERCADO_PAGO_ENV="test"
supabase secrets set MERCADO_PAGO_ACCESS_TOKEN="SEU_TOKEN_DE_TESTE"
supabase secrets set MERCADO_PAGO_WEBHOOK_SECRET="SEU_SEGREDO"
```

Nunca salve os valores reais no GitHub.