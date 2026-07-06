# Pagamentos - Mercado Pago

## Estado atual

O checkout visual foi conectado a um backend seguro em Supabase Edge Functions (`supabase/functions/server/index.tsx`). O front-end Vite usa somente variaveis publicas e nunca recebe tokens privados.

## Fluxo implementado

1. Usuario escolhe um tipo de ingresso.
2. Checkout coleta nome, e-mail, WhatsApp e aceite dos termos.
3. Front-end chama `POST /functions/v1/make-server-62fab262/orders`.
4. A Function cria `orders` com `payment_status='pending'` usando service role.
5. Front-end chama `POST /functions/v1/make-server-62fab262/mp/preference`.
6. A Function cria a preferencia no Mercado Pago e retorna `init_point`.
7. Browser redireciona para o checkout hospedado do Mercado Pago.
8. Mercado Pago retorna para `/?checkout=<status>&order=<order_id>`.
9. Front-end consulta `GET /functions/v1/make-server-62fab262/orders/:id` para exibir o status real.
10. Mercado Pago chama `POST /functions/v1/make-server-62fab262/mp/webhook`.
11. Webhook valida `x-signature`/`x-request-id`, consulta o pagamento na API do Mercado Pago e atualiza `orders.payment_status`.
12. Quando aprovado, o webhook cria tickets com QR Code unico, incrementa `ticket_types.sold_quantity` e dispara comunicacoes configuradas.

## Status exibidos

- `pending`
- `in_process`
- `approved`
- `rejected`
- `expired`
- `cancelled`
- `refunded`
- `charged_back`

## Variaveis publicas do front-end

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEV_MODE` opcional

## Segredos de backend

Nunca expor no Vite:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `RESEND_API_KEY`
- `WHATSAPP_PROVIDER_TOKEN`

## Variaveis da Supabase Function

Obrigatorias para producao:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`

Opcionais:

- `SUPABASE_FUNCTIONS_URL` ou `FUNCTIONS_PUBLIC_URL` para sobrescrever a URL publica usada em `notification_url`.
- `RESEND_API_KEY` e `TRANSACTIONAL_FROM_EMAIL` para envio de e-mail de ingresso.
- `WHATSAPP_PROVIDER_URL`, `WHATSAPP_PROVIDER_TOKEN` e `WHATSAPP_TICKET_TEMPLATE` para disparo de template WhatsApp.

## Webhook

O endpoint rejeita webhooks sem assinatura valida. A assinatura usa o manifesto do Mercado Pago com `id`, `request-id` e `ts`, assinado com HMAC SHA-256 via `MERCADO_PAGO_WEBHOOK_SECRET`.

Mesmo apos validar a assinatura, o webhook consulta `GET /v1/payments/:id` no Mercado Pago antes de confiar no status. O `external_reference` do pagamento deve ser o `orders.id`.

## Comunicacoes

E-mail transacional:

- Enviado via Resend quando `RESEND_API_KEY` e `TRANSACTIONAL_FROM_EMAIL` existem.
- Se nao estiver configurado, a Function apenas registra que o e-mail foi preparado.

WhatsApp:

- A funcao de template esta preparada.
- Nenhum WhatsApp e disparado se `WHATSAPP_PROVIDER_URL`, `WHATSAPP_PROVIDER_TOKEN` e `WHATSAPP_TICKET_TEMPLATE` nao estiverem configurados.

## Observacoes operacionais

- O front-end nao cria pedidos diretamente na tabela `orders`.
- O front-end nao grava `tickets`.
- Tickets sao criados somente pelo webhook apos pagamento `approved`.
- Em ambiente sem `MERCADO_PAGO_ACCESS_TOKEN`, a preferencia retorna uma URL local de modo dev apenas para nao bloquear desenvolvimento.
