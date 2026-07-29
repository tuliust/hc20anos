---
status: draft
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: b8b6f242ef8ab1622ec185f9a74ee2dfb7378a94
source_files:
  - package.json
  - vercel.json
  - supabase/config.toml
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/
  - scripts/phase3-financial-preflight.mjs
  - .github/workflows/
  - docs/40-runbooks/
---

# Runbooks operacionais

## Estado

Os procedimentos necessários foram criados e reconciliados com o código atual. Permanecem `draft` porque ainda não foram executados integralmente em ambiente controlado com evidências e ensaio de rollback.

`draft` não significa que um documento histórico ou depreciado possa substituí-los.

A Fase 3 financeira possui agora um runbook agregador e um preflight sem chamadas remotas. Isso representa preparação operacional, não execução dos fluxos financeiros.

## Runbooks disponíveis

| Runbook | Estado | Escopo |
|---|---|---|
| [`desenvolvimento-local.md`](./desenvolvimento-local.md) | `draft` | dependências, variáveis públicas, build, testes e Supabase local |
| [`deploy-vercel.md`](./deploy-vercel.md) | `draft` | frontend, Vercel Functions, variáveis, smoke test e rollback |
| [`deploy-edge-functions.md`](./deploy-edge-functions.md) | `draft` | checkout, webhook, notificações e reembolsos |
| [`migrations.md`](./migrations.md) | `draft` | auditoria, replay, testes SQL, aplicação remota e correção |
| [`validacao-de-pagamentos.md`](./validacao-de-pagamentos.md) | `draft` | checkout, Mercado Pago, webhook, tickets e notificações |
| [`fase-3-financeiro.md`](./fase-3-financeiro.md) | `draft` | sequência integrada das etapas 15 a 22, preflight, evidências e interrupção |
| [`investigacao-de-webhook.md`](./investigacao-de-webhook.md) | `draft` | assinatura, `payment_events`, provedor e reprocessamento |
| [`notificacoes.md`](./notificacoes.md) | `draft` | fila, worker, e-mail, WhatsApp e tentativas |
| [`reembolsos.md`](./reembolsos.md) | `draft` | elegibilidade, decisão, provedor, inventário e ingressos |
| [`operacao-no-dia-do-evento.md`](./operacao-no-dia-do-evento.md) | `draft` | check-in, QR, vouchers, conectividade e contingência |
| [`resposta-a-incidentes.md`](./resposta-a-incidentes.md) | `draft` | severidade, contenção, recuperação e pós-incidente |
| [`rollback.md`](./rollback.md) | `draft` | contenção e recuperação por componente |

## Documentos substituídos

- [`../DEPLOYMENT.md`](../DEPLOYMENT.md) está `deprecated`.
- [`../PRODUCTION_QA.md`](../PRODUCTION_QA.md) está `deprecated`.
- [`../CHECKIN_FLOW.md`](../CHECKIN_FLOW.md) está `deprecated`.
- [`../mercado-pago/README.md`](../mercado-pago/README.md) organiza registros históricos financeiros.

## Estrutura obrigatória

Cada runbook deve conter:

1. objetivo;
2. quando executar;
3. responsável e permissões;
4. pré-condições;
5. ambientes afetados;
6. comandos ou limitações explícitas;
7. resultados esperados;
8. evidências permitidas;
9. dados e secrets proibidos;
10. critérios de interrupção;
11. rollback;
12. validação final;
13. estado de execução.

## Regras de segurança

- Nunca executar migration isolada para representar o banco atual.
- Nunca editar ou excluir migration aplicada.
- Nunca registrar secrets em issues, commits ou documentos.
- Nunca confirmar pagamento apenas pelo retorno do navegador.
- Nunca testar reembolso real sem autorização e pedido identificado.
- Nunca usar service role no frontend.
- Preservar eventos financeiros, pedidos, jobs e logs durante incidentes.
- Tratar commit direto em `main` como potencial deployment de produção.
- Não reprocessar webhook, mensagem ou reembolso sem conferir idempotência e efeitos anteriores.

## Critério para `canonical`

Um runbook só pode ser promovido quando:

- foi executado integralmente em ambiente controlado;
- comandos correspondem aos scripts atuais;
- Functions, rotas e variáveis foram verificadas;
- critérios de interrupção foram observados;
- rollback foi revisado ou ensaiado;
- não contém credenciais ou dados pessoais;
- possui responsável, data e evidências;
- está ligado a testes ou checks quando possível.

## Plano de validação

### Prioridade 1 — antes de vendas reais

- deploy Vercel;
- deploy de Edge Functions;
- migrations;
- preflight da Fase 3;
- validação integrada de pagamentos;
- investigação de webhook;
- reembolsos.

### Prioridade 2 — antes do evento

- operação no dia do evento;
- notificações;
- resposta a incidentes;
- rollback;
- desenvolvimento local para suporte técnico.

### Evidências esperadas

- data e ambiente;
- executor e revisor;
- comandos utilizados;
- resultado por etapa;
- logs sem secrets;
- screenshots sem dados pessoais;
- incidentes encontrados;
- ajustes incorporados.

## Pendência restante

A documentação dos runbooks está completa. A Fase 3 financeira está preparada, mas as etapas 15 a 22 ainda precisam ser executadas em ambiente de teste, revisadas e promovidas individualmente com evidências.
