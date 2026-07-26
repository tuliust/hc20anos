---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 1c7e86b4a3b1bcf19353b2364276aa2f6ef97ea3
source_files:
  - package.json
  - vercel.json
  - supabase/config.toml
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/
  - .github/workflows/
---

# Runbooks operacionais

## Estado

A primeira camada de procedimentos foi criada e reconciliada com o código atual. Os arquivos permanecem `draft` porque ainda não foram executados integralmente em ambiente controlado.

Não trate o status `draft` como ausência de valor operacional: os comandos, componentes e limites foram conferidos contra o repositório. O status indica que falta comprovar a sequência completa, registrar evidências e validar rollback.

## Runbooks disponíveis

| Runbook | Estado | Escopo |
|---|---|---|
| [`desenvolvimento-local.md`](./desenvolvimento-local.md) | `draft` | dependências, variáveis públicas, build, testes e Supabase local; |
| [`deploy-vercel.md`](./deploy-vercel.md) | `draft` | frontend, Vercel Functions, variáveis, smoke test e rollback; |
| [`deploy-edge-functions.md`](./deploy-edge-functions.md) | `draft` | checkout, webhook, notificações e reembolsos; |
| [`migrations.md`](./migrations.md) | `draft` | auditoria, replay, testes SQL, aplicação remota e correção; |
| [`validacao-de-pagamentos.md`](./validacao-de-pagamentos.md) | `draft` | checkout, Mercado Pago, webhook, tickets e notificações; |
| [`rollback.md`](./rollback.md) | `draft` | contenção e recuperação por componente. |

## Runbooks ainda planejados

| Arquivo | Escopo |
|---|---|
| `investigacao-de-webhook.md` | assinatura, `payment_events`, consulta ao provedor, falhas temporárias e reprocessamento; |
| `notificacoes.md` | fila, worker, tentativas, providers e diagnóstico; |
| `reembolsos.md` | elegibilidade, aprovação, processamento, inventário e ingressos; |
| `operacao-no-dia-do-evento.md` | check-in, QR Code, vouchers, contingência e permissões; |
| `resposta-a-incidentes.md` | severidade, contenção, comunicação, recuperação e pós-incidente. |

## Documentos substituídos

- [`../DEPLOYMENT.md`](../DEPLOYMENT.md) está `deprecated` e aponta para os runbooks de desenvolvimento, deploy, migrations e rollback.
- [`../PRODUCTION_QA.md`](../PRODUCTION_QA.md) está `deprecated` e aponta para a validação atual de pagamentos e deploy.
- [`../mercado-pago/README.md`](../mercado-pago/README.md) organiza registros históricos da implementação financeira.

## Estrutura obrigatória de cada runbook

1. objetivo;
2. quando executar;
3. responsável e permissões mínimas;
4. pré-condições;
5. ambientes afetados;
6. comandos exatos ou limitação explicitamente declarada;
7. resultado esperado após etapas críticas;
8. evidências registráveis;
9. dados e secrets que não podem ser copiados;
10. critérios de interrupção;
11. rollback;
12. validação final;
13. estado de execução do próprio runbook.

## Regras de segurança

- nunca executar migration isolada para representar o estado atual;
- nunca editar ou excluir migration já aplicada;
- nunca registrar valores de secrets em issues, commits ou documentos;
- nunca confirmar pagamento apenas pelo retorno do navegador;
- nunca testar reembolso real sem autorização explícita e pedido identificado;
- nunca usar service role no frontend;
- preservar eventos financeiros, pedidos, jobs e logs de auditoria durante incidentes;
- tratar commit direto em `main` como potencial deployment de produção.

## Critério para status `canonical`

Um runbook só pode mudar de `draft` para `canonical` quando:

- foi executado integralmente em ambiente controlado;
- comandos correspondem aos scripts atuais;
- functions, rotas e variáveis foram verificadas;
- critérios de interrupção foram observados;
- rollback foi revisado ou ensaiado;
- não contém credenciais ou dados pessoais;
- possui responsável, data e evidências de validação;
- está ligado a testes ou checks automatizados quando possível.

## Próxima prioridade

1. criar investigação de webhook;
2. criar operação de notificações;
3. criar reembolsos;
4. criar operação no dia do evento;
5. validar os seis runbooks atuais em ambiente controlado;
6. promover individualmente para `canonical` apenas os procedimentos comprovados.