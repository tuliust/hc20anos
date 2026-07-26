---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: a6fd273c8d7ca863ee672e428d728941559acc4a
source_files:
  - src/lib/checkout.ts
  - api/checkout-create.ts
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/notification-worker/index.ts
  - supabase/functions/refund-processor/index.ts
  - supabase/tests/
  - tests/e2e/ticket-catalog-source-of-truth.spec.ts
  - docs/PRODUCTION_QA.md
---

# Validação de checkout e pagamentos

## Objetivo

Validar o fluxo comercial sem confiar no retorno visual do navegador e sem gerar efeitos financeiros involuntários.

## Regra de segurança

A confirmação financeira vem da consulta do pagamento pelo webhook e da aplicação transacional no banco. Parâmetros de retorno do navegador servem apenas para orientar a interface.

Nunca considere um pedido pago apenas porque o navegador retornou `checkout=approved`.

## Ambiente

Execute inicialmente com:

```text
MERCADO_PAGO_ENV=test
```

Use contas e credenciais de teste do Mercado Pago. Reembolso real, cartão real ou ambiente `production` exigem autorização explícita e identificação inequívoca do pedido.

## Pré-condições

- migrations reproduzidas e testes SQL aprovados;
- `checkout-create` e `payment-webhook` publicados;
- `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` configurados;
- `SITE_URL` e URL pública das functions corretos;
- catálogo com lote ativo;
- usuário de teste autenticado;
- produto testado disponível no catálogo vigente;
- acesso controlado às tabelas de auditoria e reporting.

## Fluxo vigente

```text
Frontend autenticado
  -> POST /api/checkout-create
  -> Edge Function checkout-create
  -> RPC create_checkout_order
  -> Mercado Pago Checkout Pro
  -> payment-webhook
  -> RPC apply_mercado_pago_payment
  -> tickets e notification_jobs
```

A consulta de acompanhamento usa `public_token`, não o UUID interno do pedido exposto como autoridade pública.

## Produtos atuais

| Código | Composição esperada |
|---|---|
| `simple` | exatamente um ex-aluno pré-cadastrado e vinculado; |
| `family_full` | ex-aluno, cônjuge e pelo menos um filho; |
| `external_guest` | exatamente um convidado adulto. |

O backend e o banco são a autoridade de preço e composição. O frontend não deve definir o valor final.

## Matriz mínima

| Cenário | Ação | Resultado esperado |
|---|---|---|
| Sem sessão | chamar `/api/checkout-create` sem bearer token | `401 authentication_required`; |
| Método inválido | usar método diferente de `POST` | `405 method_not_allowed`; |
| Produto inválido | enviar código fora do catálogo | erro de validação, sem pedido aprovado; |
| Composição individual inválida | adicionar acompanhante em `simple` | `simple_package_invalid_composition`; |
| Família incompleta | omitir cônjuge ou filho | `family_full_invalid_composition`; |
| Convidado menor | data de nascimento incompatível | erro etário; |
| Sem lote ativo | fechar ou remover lote no ambiente controlado | `no_active_lot`; |
| Idempotência | repetir a mesma chave com preferência ativa | mesma preferência reutilizada; |
| Preferência de teste | checkout válido | `checkout_url` proveniente de `sandbox_init_point`; |
| Pagamento pendente | concluir cenário pendente | pedido pendente, sem check-in liberado; |
| Pagamento aprovado | aprovação em teste | pedido aprovado, `paid_at` preenchido e ingressos válidos; |
| Pagamento recusado | recusa em teste | pedido recusado, sem ingresso válido; |
| Webhook duplicado | reenviar mesmo evento | sem duplicação de tickets ou transição; |
| Assinatura inválida | webhook sem assinatura válida | `401 invalid_signature`; |
| Falha temporária | indisponibilidade controlada de dependência | status de erro que permita retentativa; |
| E-mail configurado | processar job de aprovação | provider registra envio; |
| E-mail sem configuração | executar worker em ambiente controlado | job falha de forma rastreável, sem quebrar pagamento; |

## Verificações do pedido

Confirme no banco ou reporting administrativo:

- `buyer_user_id` corresponde ao usuário autenticado;
- `public_token` está presente;
- lote e produto são os vigentes;
- total foi calculado no backend;
- reserva e expiração estão registradas;
- preferência está em `payment_preferences`;
- ambiente da preferência corresponde ao ambiente esperado;
- chave de idempotência não gerou duplicata.

Não copie para evidências públicas nome completo, e-mail, telefone, token público integral ou payload financeiro completo.

## Verificações do webhook

Em `payment_events`, confirme:

- assinatura marcada como válida;
- `provider_event_id` único;
- evento duplicado tratado sem reaplicação;
- `processing_status` final coerente;
- `order_id` associado após processamento;
- erro temporário registrado sem segredo ou token;
- valor, moeda, preferência e external reference rejeitados quando divergentes pelo contrato transacional.

## Verificações dos ingressos

Após pagamento aprovado:

- um ingresso por participante elegível;
- QR Code ou token individual;
- status válido para apresentação;
- nenhum ingresso duplicado após webhook repetido;
- check-in ainda não realizado;
- reembolso ou chargeback invalida o ingresso conforme regra vigente.

## Notificações

A aprovação deve enfileirar comunicação fora do processamento crítico do webhook.

Valide:

- `notification_jobs` criado com chave idempotente;
- worker protegido por `NOTIFICATION_WORKER_KEY`;
- sucesso registra provider e identificador da mensagem;
- falha incrementa tentativas e mantém diagnóstico;
- ausência de provider não altera o estado financeiro do pedido.

## Retorno e confirmação no frontend

O frontend deve:

- usar `public_token` para consultar o estado;
- exibir processamento quando o webhook ainda não foi aplicado;
- não liberar check-in por parâmetro de URL;
- direcionar o comprador para a área de pedidos e ingressos;
- tolerar retorno do provedor antes do processamento assíncrono.

## Responsividade e navegadores

Valide pelo menos:

- Chrome Android;
- navegador desktop baseado em Chromium;
- 375 px, 390 px, 768 px e 1440 px;
- resumo de pedido sem overflow;
- mensagens de erro legíveis;
- retorno do provedor e área do comprador após refresh.

## Critérios de interrupção

- ambiente financeiro não confirmado;
- token real usado em teste não autorizado;
- valor calculado pelo frontend prevalece sobre o backend;
- webhook aceita assinatura inválida;
- evento duplicado cria ingresso duplicado;
- retorno do navegador libera ingresso sem estado aprovado no banco;
- logs expõem credencial ou dado pessoal completo;
- reembolso real seria acionado sem autorização explícita.

## Evidências recomendadas

- commit e ambiente;
- product code e lote, sem dados pessoais;
- chave de cenário, não chave secreta;
- estados do pedido antes e depois;
- IDs truncados de pedido, evento e preferência;
- resultados de testes SQL/E2E;
- captura de tela com dados pessoais mascarados.

## Estado de validação

A matriz foi reconciliada com o código atual e substitui o modelo antigo baseado em `ticket_type_id` e retorno por `order`. Ainda precisa ser executada integralmente em ambiente de teste; permanece `draft`.