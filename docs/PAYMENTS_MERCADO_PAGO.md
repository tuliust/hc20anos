# Pagamentos — Mercado Pago

## Estado atual

O projeto possui fluxo visual de checkout, pedidos (`orders`) e ingressos (`tickets`). A integração real com Mercado Pago ainda não deve ser considerada concluída.

## Fluxo planejado

1. Usuário escolhe ingresso.
2. Sistema cria `order` com status `pending`.
3. Backend seguro cria preferência no Mercado Pago.
4. Usuário é redirecionado para pagamento.
5. Mercado Pago chama webhook.
6. Webhook valida assinatura e atualiza `orders.payment_status`.
7. Quando aprovado, sistema cria/libera `tickets`.
8. Usuário acessa “Meu Ingresso”.

## Status de pagamento

- `pending`
- `in_process`
- `approved`
- `rejected`
- `cancelled`
- `refunded`
- `expired`
- `charged_back`

## Variáveis necessárias

Variáveis públicas do front-end:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Segredos que nunca devem ir para o front-end:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`

## Pendências

- Criar endpoint/backend para preferência Mercado Pago.
- Criar webhook seguro.
- Validar assinatura/origem do webhook.
- Criar tickets automaticamente após pagamento aprovado.
- Implementar e-mails transacionais.
