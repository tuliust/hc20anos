---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: a6fd273c8d7ca863ee672e428d728941559acc4a
source_files:
  - package.json
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/notification-worker/index.ts
  - supabase/functions/refund-processor/index.ts
  - supabase/config.toml
---

# Deploy de Supabase Edge Functions

## Objetivo

Publicar e validar as quatro Edge Functions do fluxo comercial sem expor secrets nem misturar ambientes.

## Projeto de destino

```text
project ref: tjnqqsbwgjcdzcxykyif
```

Os scripts npm fixam explicitamente esse project ref. Não selecione outro projeto de forma interativa durante a publicação.

## Functions vigentes

| Function | Responsabilidade |
|---|---|
| `checkout-create` | autenticar comprador, criar pedido via RPC e preferência no Mercado Pago; |
| `payment-webhook` | validar assinatura, consultar pagamento e aplicar transição financeira; |
| `notification-worker` | consumir fila e enviar e-mail ou WhatsApp configurado; |
| `refund-processor` | processar reembolso aprovado, invalidar ingressos e restaurar inventário. |

## Pré-condições

- Supabase CLI autenticada;
- projeto de destino confirmado;
- migrations compatíveis já aplicadas;
- secrets configurados no ambiente correto;
- build e auditoria de migrations aprovados;
- função alterada revisada contra os RPCs e tabelas que utiliza.

## Secrets e variáveis

### Comuns ou estruturais

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SITE_URL
```

### Mercado Pago

```text
MERCADO_PAGO_ENV
MERCADO_PAGO_ACCESS_TOKEN
MERCADO_PAGO_WEBHOOK_SECRET
SUPABASE_FUNCTIONS_URL
```

`MERCADO_PAGO_ENV` deve ser `test` ou `production`.

### Notificações

```text
NOTIFICATION_WORKER_KEY
RESEND_API_KEY
TRANSACTIONAL_FROM_EMAIL
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_GRAPH_VERSION
WHATSAPP_TEMPLATE_LANGUAGE
WHATSAPP_TEMPLATE_PAYMENT
WHATSAPP_TEMPLATE_TICKET
WHATSAPP_TEMPLATE_TRANSFER
WHATSAPP_TEMPLATE_REFUND
WHATSAPP_TEMPLATE_GUEST_REQUEST
WHATSAPP_TEMPLATE_GUEST_DECISION
WHATSAPP_TEMPLATE_DEFAULT
```

Somente configure providers e templates realmente usados. A ausência de configuração deve produzir falha controlada no job, não exposição de segredo.

## Verificar secrets sem exibir valores

```bash
npx supabase secrets list --project-ref tjnqqsbwgjcdzcxykyif
```

Registre apenas os nomes presentes ou ausentes. Nunca copie os valores.

## Publicação conjunta

```bash
npm run supabase:deploy:commerce
```

O comando publica, em ordem:

1. `checkout-create`;
2. `payment-webhook`;
3. `notification-worker`;
4. `refund-processor`.

## Publicação individual

```bash
npm run supabase:deploy:checkout
npm run supabase:deploy:webhook
npm run supabase:deploy:notifications
npm run supabase:deploy:refunds
```

Os scripts usam `--no-verify-jwt`. Isso desativa a verificação automática no gateway, mas não elimina as verificações implementadas dentro das funções:

- `checkout-create` exige sessão Supabase válida;
- `refund-processor` exige sessão e role administrativa;
- `notification-worker` exige `x-worker-key`;
- `payment-webhook` exige assinatura válida do Mercado Pago.

Não remova essas verificações internas.

## Ordem recomendada para mudanças incompatíveis

1. aplicar migrations compatíveis e aditivas;
2. publicar a function que entende o formato novo e o anterior;
3. publicar frontend ou consumidores;
4. remover compatibilidade apenas em entrega posterior validada.

## Validação pós-deploy

### Checkout

- requisição sem autenticação retorna `401`;
- payload inválido retorna erro de cliente, sem stack trace;
- ambiente de teste retorna `sandbox_init_point` normalizado como `checkout_url`;
- idempotência reutiliza preferência ativa para a mesma chave.

### Webhook

- assinatura ausente ou inválida retorna `401`;
- evento duplicado não é aplicado duas vezes;
- falha temporária retorna status que permita retentativa;
- `payment_events` registra recebimento e processamento.

### Notificações

- chave incorreta retorna `401`;
- worker reivindica no máximo o limite configurado;
- sucesso e erro atualizam o job;
- logs não contêm corpo completo com dados pessoais.

### Reembolso

- usuário não autenticado retorna `401`;
- usuário sem role retorna `403`;
- solicitação não aprovada não é processada;
- chave de idempotência do provedor usa o ID da solicitação;
- ingressos e participantes são invalidados após sucesso.

## Critérios de interrupção

- project ref divergente;
- secret obrigatório ausente;
- migration esperada não aplicada;
- função publicada em ambiente financeiro incorreto;
- autenticação ou assinatura deixou de ser exigida;
- resposta pública contém token, service role ou stack trace sensível.

## Rollback

Edge Functions não possuem rollback automático de schema. Para código:

1. identifique o último commit estável;
2. restaure o arquivo da function para essa versão;
3. publique novamente apenas a function afetada;
4. preserve tabelas de auditoria, pedidos, eventos e jobs;
5. valide novamente autenticação e fluxo mínimo.

Quando o problema envolver contrato de banco, use migration corretiva aditiva; nunca edite migration já aplicada.

## Estado de validação

O conteúdo foi conferido contra os scripts e as quatro functions atuais, mas a sequência ainda não foi executada integralmente nesta revisão. Permanece `draft`.