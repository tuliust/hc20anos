---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/lib/supabase.ts
  - api/checkout-create.ts
  - api/generate-profile-bio.ts
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/notification-worker/index.ts
  - supabase/functions/refund-processor/index.ts
  - package.json
---

# Inventário de variáveis de ambiente

> Inventário manual. Valores nunca devem ser documentados. A versão definitiva deve ser gerada pela análise estática do código.

## Classificação

| Classe | Regra |
|---|---|
| pública | pode ser incluída no bundle Vite; usa prefixo `VITE_` |
| server-side | disponível somente em Vercel Functions ou Edge Functions |
| secret | credencial privada; nunca usar prefixo `VITE_` |
| operacional | usada por CLI, CI ou manutenção; não necessariamente pelo runtime |

## Frontend Vite

| Variável | Obrigatória | Sensibilidade | Uso |
|---|---:|---|---|
| `VITE_SUPABASE_URL` | sim | pública | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | sim | pública | anon key protegida por RLS |
| `VITE_DEV_MODE` | recomendada | pública | habilita comportamento de desenvolvimento; produção deve usar `false` |

A anon key não é service role. Mesmo sendo publicável, depende de RLS e grants corretos.

## Vercel Function — checkout proxy

| Variável | Obrigatória | Sensibilidade | Uso |
|---|---:|---|---|
| `SUPABASE_URL` | preferida | server-side | URL upstream do Supabase |
| `VITE_SUPABASE_URL` | fallback | pública | fallback usado pelo proxy |
| `SUPABASE_ANON_KEY` | preferida | server-side | apikey encaminhada ao upstream |
| `VITE_SUPABASE_ANON_KEY` | fallback | pública | fallback usado pelo proxy |

O código possui URL de fallback fixa. Produção deve configurar explicitamente o projeto correto para evitar dependência silenciosa.

## Vercel Function — mini bio por IA

| Variável | Obrigatória | Sensibilidade | Uso |
|---|---:|---|---|
| `OPENAI_API_KEY` | alternativa | secret | chamada direta à OpenAI |
| `AI_GATEWAY_API_KEY` | alternativa | secret | autenticação no Vercel AI Gateway |
| `VERCEL_OIDC_TOKEN` | alternativa | secret/efêmera | autenticação OIDC no Gateway |
| `OPENAI_PROFILE_MODEL` | não | server-side | modelo; padrão atual `gpt-5-mini` |

Pelo menos uma forma de autenticação do provedor precisa estar disponível para geração.

## Edge Function — `checkout-create`

| Variável | Obrigatória | Sensibilidade | Uso |
|---|---:|---|---|
| `SITE_URL` | sim em produção | server-side | origem permitida e URLs de retorno |
| `CHECKOUT_ALLOWED_ORIGINS` | não | server-side | origens adicionais separadas por vírgula |
| `SUPABASE_URL` | sim | server-side | cliente Supabase e base das Functions |
| `SUPABASE_ANON_KEY` | sim | server-side | validação da sessão do usuário |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | secret | operação transacional privilegiada |
| `MERCADO_PAGO_ENV` | sim | server-side | `test` ou `production` |
| `MERCADO_PAGO_ACCESS_TOKEN` | sim | secret | criação de preferência |
| `SUPABASE_FUNCTIONS_URL` | alternativa | server-side | base explícita para webhook |
| `FUNCTIONS_PUBLIC_URL` | alternativa | server-side | alias para base pública das Functions |

Quando as duas URLs de Functions estiverem ausentes, o código deriva de `SUPABASE_URL`.

## Edge Function — `payment-webhook`

| Variável | Obrigatória | Sensibilidade | Uso |
|---|---:|---|---|
| `SITE_URL` | recomendada | server-side | CORS e origem padrão |
| `SUPABASE_URL` | sim | server-side | acesso ao banco |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | secret | gravação e RPC financeira |
| `MERCADO_PAGO_WEBHOOK_SECRET` | sim | secret | validação HMAC da assinatura |
| `MERCADO_PAGO_ACCESS_TOKEN` | sim | secret | consulta do pagamento no provedor |

## Edge Function — `notification-worker`

### Núcleo

| Variável | Obrigatória | Sensibilidade | Uso |
|---|---:|---|---|
| `SITE_URL` | recomendada | server-side | origem e links nas mensagens |
| `SUPABASE_URL` | sim | server-side | acesso à fila e aos pedidos |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | secret | claim e conclusão dos jobs |
| `NOTIFICATION_WORKER_KEY` | sim | secret | autenticação por `x-worker-key` |

### E-mail

| Variável | Obrigatória para canal | Sensibilidade | Uso |
|---|---:|---|---|
| `RESEND_API_KEY` | sim | secret | envio via Resend |
| `TRANSACTIONAL_FROM_EMAIL` | sim | server-side | remetente validado |

### WhatsApp Cloud

| Variável | Obrigatória para canal | Sensibilidade | Uso |
|---|---:|---|---|
| `WHATSAPP_ACCESS_TOKEN` | sim | secret | Graph API |
| `WHATSAPP_PHONE_NUMBER_ID` | sim | secret/configuração | número remetente |
| `WHATSAPP_GRAPH_VERSION` | sim | server-side | versão da Graph API |
| `WHATSAPP_TEMPLATE_LANGUAGE` | não | server-side | padrão `pt_BR` |
| `WHATSAPP_TEMPLATE_PAYMENT` | conforme evento | server-side | template financeiro |
| `WHATSAPP_TEMPLATE_TICKET` | conforme evento | server-side | template de ingresso |
| `WHATSAPP_TEMPLATE_TRANSFER` | conforme evento | server-side | template de transferência |
| `WHATSAPP_TEMPLATE_REFUND` | conforme evento | server-side | template de reembolso |
| `WHATSAPP_TEMPLATE_GUEST_REQUEST` | legado | server-side | solicitação de convidado |
| `WHATSAPP_TEMPLATE_GUEST_DECISION` | legado | server-side | decisão de convidado |
| `WHATSAPP_TEMPLATE_DEFAULT` | fallback | server-side | template genérico |

## Edge Function — `refund-processor`

| Variável | Obrigatória | Sensibilidade | Uso |
|---|---:|---|---|
| `SITE_URL` | recomendada | server-side | CORS |
| `SUPABASE_URL` | sim | server-side | acesso ao Supabase |
| `SUPABASE_ANON_KEY` | sim | server-side | validar sessão do administrador |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | secret | atualizar pedido e inventário |
| `MERCADO_PAGO_ACCESS_TOKEN` | sim | secret | chamar API de reembolso |

## Operação e CLI

| Variável | Uso |
|---|---|
| `SUPABASE_DB_PASSWORD` | conexão e manutenção remota quando exigida pela CLI |
| credenciais da Vercel/CLI | autenticação de deployment, não versionar |
| project ref | scripts atuais fixam `tjnqqsbwgjcdzcxykyif`; tratar como configuração, não secret |

## Regras

- Nunca colocar secret em variável `VITE_`.
- Nunca versionar `.env`, `.env.local` ou valores de secrets.
- Configurar ambientes de preview e produção separadamente.
- Não reutilizar credenciais de teste em produção.
- Rotacionar imediatamente credencial exposta.
- Após rotação, republicar Functions que dependem do secret.
- Não copiar lista de secrets com valores para issues ou PRs.
- Verificar presença, não conteúdo, em checklists de deploy.

## Validação por ambiente

### Local

- `.env.local` contém apenas variáveis públicas do frontend;
- secrets de Functions são gerenciados pelo mecanismo local do Supabase;
- modo de desenvolvimento não é confundido com pagamento real.

### Vercel preview

- Supabase aponta para ambiente controlado;
- IA possui provedor configurado somente se necessária;
- secrets não aparecem no bundle;
- checkout não usa produção por engano.

### Produção

- `VITE_DEV_MODE=false`;
- URLs e anon key do projeto correto;
- `MERCADO_PAGO_ENV=production` somente com credenciais e testes aprovados;
- webhook secret e access token do mesmo ambiente;
- worker key definida;
- remetentes e templates aprovados.

## Geração futura

O gerador deve buscar acessos a:

- `import.meta.env.*`;
- `process.env.*`;
- `Deno.env.get(...)`;
- scripts npm e workflows.

Deve classificar por arquivo, runtime, obrigatoriedade inferida, sensibilidade e valor padrão, falhando no CI quando uma variável usada não estiver inventariada.
