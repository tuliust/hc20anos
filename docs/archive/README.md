---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - docs/
---

# Arquivo documental

## Finalidade

Este diretório organiza documentos que preservam contexto, auditorias, planos executados e arquiteturas anteriores sem confundi-los com o estado vigente do sistema.

Um documento histórico pode continuar fora de `docs/archive/` durante a transição, desde que possua front matter e aviso explícito de vigência. A movimentação física deve ocorrer em PRs próprios para preservar links e facilitar revisão.

## Categorias

### Auditorias

Diagnósticos produzidos antes de uma implementação ou correção.

Uso adequado:

- reconstruir riscos identificados;
- compreender por que uma mudança foi iniciada;
- comparar situação anterior e posterior.

Não usar para determinar o comportamento atual.

### Planos de implementação

Sequências de trabalho, etapas e critérios projetados em um momento específico.

Uso adequado:

- rastrear decisões e entregas;
- verificar escopo originalmente planejado;
- identificar itens abandonados ou alterados.

Não tratar checklist antigo como backlog vigente.

### Documentos substituídos

Referências que já foram canônicas, mas perderam autoridade após mudança de arquitetura ou contrato.

Devem apontar para `superseded_by` e permanecer acessíveis enquanto houver valor de rastreabilidade.

## Registro inicial de classificação

| Documento | Status | Motivo | Referência vigente |
|---|---|---|---|
| `docs/ROADMAP.md` | `historical` | Planejamento inicial; funcionalidades listadas como futuras já foram implementadas ou alteradas. | `docs/00-visao-geral/produto.md` e Epic #41. |
| `docs/SUPABASE_SCHEMA.md` | `deprecated` | Snapshot limitado às migrations iniciais. | Replay completo de `supabase/migrations/`; contrato gerado pendente. |
| `docs/PAYMENTS_MERCADO_PAGO.md` | `deprecated` | Descreve rotas agregadas `make-server-62fab262`. | `docs/10-dominios/checkout-e-pagamentos.md`. |
| `docs/mercado-pago/01-auditoria-e-plano.md` | `historical` | Auditoria anterior à implementação modular. | `docs/10-dominios/checkout-e-pagamentos.md`. |
| `docs/mercado-pago/02-backend-checkout-create.md` | `historical` | Contrato intermediário e pendências já superadas. | `docs/10-dominios/checkout-e-pagamentos.md`. |
| `docs/mercado-pago/03-admin-reporting-validation.md` | `historical` | Checklist específico de uma entrega. | Runbook de validação ainda pendente. |
| `docs/mercado-pago/04-operacao-e-deploy.md` | `historical` | Procedimento parcialmente válido, ainda não revalidado. | Runbooks de deploy e pagamentos pendentes. |
| `docs/DEPLOYMENT.md` | em revisão | Conteúdo útil, sem classificação canônica completa. | `docs/40-runbooks/deploy-vercel.md` e `deploy-edge-functions.md` pendentes. |
| `docs/PRODUCTION_QA.md` | em revisão | Checklist útil, mas não reconciliado com todos os fluxos atuais. | Runbooks e matriz de testes pendentes. |

## Regras de movimentação

1. Não mover documentos apenas para “limpar” a raiz.
2. Primeiro classificar e apontar substituto.
3. Verificar links recebidos e referências em issues ou PRs.
4. Mover em commit dedicado quando a nova referência já existir.
5. Manter histórico do Git; não copiar e apagar conteúdo sem necessidade.
6. Não arquivar documentação canônica que ainda seja usada por operação.

## Critério para remoção definitiva

Um documento histórico só deve ser removido quando:

- não contém contexto exclusivo;
- não é referenciado por código, issues, PRs ou operação;
- sua exclusão não prejudica auditoria;
- o conteúdo útil foi incorporado a uma referência vigente;
- a remoção foi revisada explicitamente.
