---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - package.json
  - vercel.json
  - supabase/config.toml
  - supabase/functions/
  - supabase/migrations/
  - .github/workflows/
---

# Runbooks operacionais

## Estado

Esta seção ainda está em elaboração. Os procedimentos existentes em `docs/DEPLOYMENT.md`, `docs/PRODUCTION_QA.md` e `docs/mercado-pago/` devem ser tratados como material de entrada, não como runbooks integralmente validados.

## Objetivo

Transformar conhecimento operacional em sequências reproduzíveis, com pré-condições, validações, rollback e evidências esperadas.

## Runbooks planejados

| Arquivo | Escopo |
|---|---|
| `desenvolvimento-local.md` | Dependências, variáveis públicas, Supabase local, execução e diagnóstico inicial. |
| `deploy-vercel.md` | Build, variáveis, preview, produção, validação e rollback do frontend e de `api/`. |
| `deploy-edge-functions.md` | Projeto Supabase, secrets, publicação individual e em conjunto, verificação e rollback. |
| `migrations.md` | Criação, replay local, testes, aplicação remota, reparo e proibição de edição retroativa. |
| `validacao-de-pagamentos.md` | Checkout de teste, webhook, idempotência, reporting e evidências. |
| `investigacao-de-webhook.md` | Assinatura, `payment_events`, consulta ao provedor, falhas temporárias e reprocessamento. |
| `notificacoes.md` | Fila, worker, tentativas, providers e diagnóstico. |
| `reembolsos.md` | Elegibilidade, aprovação, processamento, inventário e ingressos. |
| `operacao-no-dia-do-evento.md` | Check-in, QR Code, vouchers, contingência e permissões. |
| `resposta-a-incidentes.md` | Severidade, contenção, comunicação, recuperação e pós-incidente. |
| `rollback.md` | Aplicação, Edge Functions, Vercel, banco e preservação de auditoria. |

## Estrutura obrigatória de cada runbook

1. Objetivo.
2. Quando executar.
3. Responsável e permissões mínimas.
4. Pré-condições.
5. Ambientes afetados.
6. Comandos exatos.
7. Resultado esperado após cada etapa crítica.
8. Evidências que podem ser registradas.
9. Dados e secrets que não podem ser copiados.
10. Critérios de interrupção.
11. Rollback.
12. Validação final.
13. Escalonamento.

## Regras de segurança

- Nunca executar migration isolada para simular o estado atual do banco.
- Nunca editar ou excluir migration já aplicada para “corrigir” produção.
- Nunca registrar valores de secrets em issues, PRs ou documentos.
- Nunca confirmar pagamento com base apenas no retorno do navegador.
- Nunca testar reembolso real sem identificar explicitamente o ambiente e o pedido de teste.
- Nunca usar service role em ferramentas client-side.
- Preservar eventos financeiros e logs de auditoria durante incidentes.

## Critério para status `canonical`

Um runbook só pode mudar de `draft` para `canonical` quando:

- foi executado integralmente em ambiente controlado;
- os comandos correspondem aos scripts atuais;
- os nomes de functions, rotas e variáveis foram verificados;
- o rollback foi revisado;
- não contém credenciais ou dados pessoais;
- possui responsável e data de validação;
- está ligado a testes ou checks automatizados quando possível.

## Primeira prioridade

A primeira entrega deve separar o atual `docs/DEPLOYMENT.md` em:

1. `deploy-vercel.md`;
2. `deploy-edge-functions.md`;
3. `migrations.md`;
4. `rollback.md`.

Em seguida, `docs/PRODUCTION_QA.md` deve alimentar `validacao-de-pagamentos.md` e uma matriz de testes por fluxo.
