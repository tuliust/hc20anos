---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 8db03f110022b4482d0350c0cdf01ad10c8b1969
source_files:
  - docs/
  - supabase/manual/README_EXECUCAO_CHECKOUT.md
---

# Arquivo documental

## Finalidade

Este índice organiza documentos que preservam contexto, auditorias, planos executados e referências substituídas sem confundi-los com o estado vigente do sistema.

Um documento histórico pode permanecer fora de `docs/archive/` durante a transição, desde que tenha front matter, classificação explícita e indicação da referência vigente. A movimentação física só deve ocorrer depois da revisão de links recebidos, issues, PRs e dependências operacionais.

## Categorias

### `historical`

Registros de uma fase, auditoria, entrega ou decisão anterior. Podem explicar como o sistema chegou ao estado atual, mas não determinam o comportamento vigente.

### `deprecated`

Documentos substituídos por outra referência. Devem apontar para `superseded_by` ou informar claramente o documento vigente.

### `draft`

Referências atuais ainda não comprovadas integralmente por automação, execução operacional ou validação visual. Não pertencem ao arquivo histórico, mas também não possuem a mesma autoridade de um documento `canonical`.

## Registro consolidado de classificação

| Documento | Status | Motivo | Referência vigente |
|---|---|---|---|
| `docs/ROADMAP.md` | `historical` | Planejamento inicial; parte das funcionalidades foi implementada ou alterada. | Epic #41 e documentação por domínio. |
| `docs/PRODUCT_SCOPE.md` | `deprecated` | Escopo resumido substituído por visão de produto e domínios. | `docs/00-visao-geral/produto.md` e `docs/10-dominios/README.md`. |
| `docs/SUPABASE_SCHEMA.md` | `deprecated` | Snapshot parcial limitado às migrations iniciais. | Replay integral de `supabase/migrations/`; contrato gerado pendente. |
| `docs/AUTH_AND_ROLES.md` | `deprecated` | Matriz resumida sem confronto integral com RLS e grants. | `docs/10-dominios/autenticacao-autorizacao-e-roles.md` e `docs/30-contratos/permissoes.md`. |
| `docs/CHECKIN_FLOW.md` | `deprecated` | Fluxo resumido substituído por domínio e runbook operacional. | `docs/10-dominios/checkin-reembolsos-e-operacao.md` e `docs/40-runbooks/operacao-no-dia-do-evento.md`. |
| `docs/PHOTO_MODERATION.md` | `deprecated` | Regras incorporadas à documentação de acervo e memórias. | `docs/10-dominios/acervo-fotos-e-moderacao.md` e `docs/10-dominios/memorias-curiosidades-e-enquetes.md`. |
| `docs/PHASE2_INTERACTIONS.md` | `historical` | Registro de uma fase incremental específica. | Documentação vigente por domínio. |
| `docs/PAYMENTS_MERCADO_PAGO.md` | `deprecated` | Descrevia arquitetura agregada anterior. | `docs/10-dominios/checkout-e-pagamentos.md`. |
| `docs/DEPLOYMENT.md` | `deprecated` | Guia compacto substituído por procedimentos separados. | `docs/40-runbooks/deploy-vercel.md`, `deploy-edge-functions.md`, `migrations.md` e `rollback.md`. |
| `docs/PRODUCTION_QA.md` | `deprecated` | Checklist antigo não refletia integralmente o checkout atual. | `docs/40-runbooks/validacao-de-pagamentos.md` e demais runbooks. |
| `docs/supabase-migration-runbook.md` | `deprecated` | Procedimento da reconciliação inicial substituído pelo runbook vigente. | `docs/40-runbooks/migrations.md`. |
| `docs/supabase-migration-audit-2026-07-21.md` | `historical` | Fotografia do banco e do histórico em 21/07/2026. | Nova auditoria e replay conforme `docs/40-runbooks/migrations.md`. |
| `docs/supabase-migration-repair-execution.md` | `historical` | Registro de uma execução específica de reparo do histórico. | `docs/40-runbooks/migrations.md`. |
| `docs/mercado-pago/01-auditoria-e-plano.md` | `historical` | Auditoria anterior à implementação modular. | `docs/10-dominios/checkout-e-pagamentos.md`. |
| `docs/mercado-pago/02-backend-checkout-create.md` | `historical` | Contrato intermediário já superado. | `docs/10-dominios/checkout-e-pagamentos.md`. |
| `docs/mercado-pago/03-admin-reporting-validation.md` | `historical` | Checklist de uma entrega específica. | `docs/40-runbooks/validacao-de-pagamentos.md`. |
| `docs/mercado-pago/04-operacao-e-deploy.md` | `historical` | Procedimento anterior preservado para rastreabilidade. | Runbooks de deploy e pagamentos. |
| `supabase/manual/README_EXECUCAO_CHECKOUT.md` | `deprecated` | Instruía execução individual de migrations antigas no SQL Editor. | Runbooks de migrations, Edge Functions e validação de pagamentos. |

## Documentos atuais ainda em `draft`

Não são históricos, mas aguardam validação adicional:

- `docs/DESIGN_SYSTEM.md` — validação visual, responsiva e de acessibilidade;
- `docs/DESIGN_TOKENS.md` — comparação com CSS, classes e componentes reais;
- inventários humanos em `docs/30-contratos/` — substituição por contratos gerados;
- `docs/40-runbooks/*.md` — execução integral, evidências e validação de rollback.

## Regras de movimentação física

1. Não mover documentos apenas para reduzir a quantidade de arquivos na raiz.
2. Classificar e apontar o substituto antes da movimentação.
3. Verificar referências em código, issues, PRs, wikis e operação.
4. Fazer a movimentação em commit dedicado.
5. Atualizar todos os links internos no mesmo commit.
6. Preservar o histórico do Git.
7. Não arquivar conteúdo ainda utilizado durante operação ou investigação.

## Critério para remoção definitiva

Um documento histórico só pode ser removido quando:

- não contém contexto exclusivo;
- não é referenciado por código, issues, PRs ou operação;
- sua exclusão não prejudica auditoria;
- o conteúdo útil foi incorporado a uma referência vigente;
- a remoção foi revisada explicitamente.

## Próxima revisão

A próxima revisão deste índice deve ocorrer depois de:

1. versionamento da baseline dos contratos estáticos;
2. geração do schema e contratos do banco;
3. validação dos runbooks críticos;
4. decisão sobre movimentação física dos arquivos históricos;
5. validação do design system e dos tokens.