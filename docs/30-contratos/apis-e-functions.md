---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - api/checkout-create.ts
  - api/generate-profile-bio.ts
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/notification-worker/index.ts
  - supabase/functions/refund-processor/index.ts
  - supabase/functions/server/
---

# Inventário de APIs e Functions

> Inventário manual. Deve ser substituído por contratos gerados do código.

## Vercel Functions

### `POST /api/checkout-create`

**Finalidade:** proxy same-origin entre frontend e Edge Function de checkout.

**Autenticação:** bearer token da sessão Supabase.

**Cabeçalhos:**

- `Content-Type: application/json`;
- `Authorization: Bearer <access_token>`;
- `apikey` com anon key;
- `idempotency-key` quando disponível.

**Entrada resumida:**

```json
{
  "buyer_name": "...",
  "buyer_email": "...",
  "buyer_phone": "...",
  "product_code": "simple|family_full|external_guest",
  "participants": [],
  "extras": [],
  "idempotency_key": "..."
}
```

**Saída normalizada:**

```json
{
  "checkout_url": "https://...",
  "public_token": "...",
  "expires_at": "...",
  "reused_preference": false
}
```

**Upstream:** `POST <SUPABASE_URL>/functions/v1/checkout-create`.

**Erros principais:** `authentication_required`, `supabase_anon_key_missing`, `invalid_checkout_response`, `checkout_service_unavailable` e erros repassados pela Edge Function.

### `POST /api/generate-profile-bio`

**Finalidade:** gerar sugestão de mini bio sem expor credencial do provedor.

**Controles:** método, origem, sanitização, schema, rate limit em memória e validação da saída.

**Provedores:** OpenAI direta ou Vercel AI Gateway.

**Saída:** JSON estruturado com mini bio limitada e validada.

**Observação:** a Function não salva o perfil. O usuário revisa e o fluxo normal de edição persiste o texto.

## Supabase Edge Functions vigentes

### `checkout-create`

**Métodos:** `POST`, `OPTIONS`.

**Autenticação:** sessão Supabase por bearer token.

**Privilégio interno:** service role depois da autenticação.

**Responsabilidades:**

- validar origem e payload;
- exigir idempotência;
- localizar preferência reutilizável;
- chamar `create_checkout_order`;
- criar preferência no Mercado Pago;
- persistir `payment_preferences`;
- atualizar pedido;
- retornar URL, token público e expiração.

**CORS:** site configurado, origens adicionais e localhost permitido pelo código.

### `payment-webhook`

**Métodos:** `POST`, `OPTIONS`.

**Autenticação:** assinatura do Mercado Pago, não sessão de usuário.

**Privilégio interno:** service role.

**Responsabilidades:**

- validar `x-signature`, `x-request-id` e timestamp;
- inserir `payment_events`;
- ignorar notificações não aplicáveis;
- consultar o pagamento no Mercado Pago;
- validar ID, referência, valor e moeda pela RPC;
- chamar `apply_mercado_pago_payment`;
- marcar evento como processado ou falho;
- responder 503 em falha temporária.

### `notification-worker`

**Métodos:** `POST`, `OPTIONS`.

**Autenticação:** `x-worker-key` igual a `NOTIFICATION_WORKER_KEY`.

**Privilégio interno:** service role.

**Responsabilidades:**

- assumir até 20 jobs por chamada;
- hidratar dados de pedido/ingresso;
- enviar e-mail ou WhatsApp;
- registrar resposta e ID do provedor;
- concluir job com sucesso ou erro.

### `refund-processor`

**Métodos:** `POST`, `OPTIONS`.

**Autenticação:** bearer token Supabase.

**Autorização:** usuário em `admin_users` com `admin` ou `superadmin`.

**Entrada:**

```json
{
  "request_id": "<uuid>"
}
```

**Responsabilidades:**

- validar solicitação aprovada;
- chamar reembolso do Mercado Pago;
- atualizar pedido, ingressos e participantes;
- restaurar inventário uma vez;
- registrar resposta;
- criar notificação idempotente.

## Function agregada legada

`supabase/functions/server/` contém uma implementação agregada anterior, associada às rotas `make-server-62fab262`.

Ela não deve ser tratada como arquitetura vigente quando houver Function dedicada equivalente. Antes de removê-la, confirmar que:

- nenhum frontend chama suas rotas;
- nenhum webhook aponta para ela;
- scripts de deploy não a publicam;
- dados ou tarefas exclusivas foram migrados.

## RPCs diretamente relacionadas

Inventário parcial:

- `create_checkout_order`;
- `get_checkout_status_by_token`;
- `apply_mercado_pago_payment`;
- `claim_notification_jobs`;
- `complete_notification_job`;
- `restore_refunded_order_inventory`;
- `get_checkin_dashboard`;
- `perform_ticket_checkin`;
- `get_admin_refund_requests`;
- `review_refund_request`;
- RPCs de catálogo, relatórios, CMS, perfil e moderação.

O inventário definitivo será gerado do banco.

## Regras transversais

- Não expor service role no frontend.
- Não confiar no payload do webhook sem consultar o provedor.
- Não executar efeito financeiro por retorno do navegador.
- Usar idempotência em checkout, eventos, notificações e reembolsos.
- Respostas de erro devem usar códigos estáveis, não detalhes internos.
- CORS não substitui autenticação.
- Logs não devem conter secrets, tokens ou dados financeiros completos.

## Testes necessários

- método inválido retorna 405;
- autenticação ausente retorna 401;
- role insuficiente retorna 403;
- payload inválido retorna 400;
- falha upstream controlada retorna 5xx apropriado;
- CORS permite somente origens previstas;
- idempotência funciona;
- erros internos não expõem credenciais;
- Function legada não é chamada pelos fluxos atuais.

## Geração futura

O gerador deve extrair:

- arquivos em `api/`;
- diretórios em `supabase/functions/`;
- métodos aceitos;
- cabeçalhos de autenticação;
- variáveis lidas;
- códigos de erro;
- RPCs chamadas;
- providers externos;
- exemplos de entrada e saída quando houver tipos estáticos.
