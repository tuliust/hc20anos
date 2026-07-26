---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 897b45631650faf30c7a01ceeb1b35fe18f3d6f1
source_files:
  - README.md
  - docs/
---

# Documentação canônica — HC 20 Anos

Este é o portal de referência técnica, funcional e operacional do projeto **HC 20 Anos**.

Documentos `canonical` descrevem regras humanas vigentes conferidas contra o repositório. Inventários e runbooks `draft` são referências atuais, mas ainda aguardam automação ou evidência operacional. Registros `historical` e `deprecated` não prevalecem sobre as fontes definidas em [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md).

## Comece por aqui

1. [`00-visao-geral/produto.md`](./00-visao-geral/produto.md) — objetivo, públicos e capacidades.
2. [`00-visao-geral/arquitetura.md`](./00-visao-geral/arquitetura.md) — runtime, integrações e fontes técnicas.
3. [`00-visao-geral/mapa-do-repositorio.md`](./00-visao-geral/mapa-do-repositorio.md) — responsabilidade dos diretórios.
4. [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md) — precedência entre banco, código, CMS e documentos.
5. [`00-visao-geral/glossario.md`](./00-visao-geral/glossario.md) — vocabulário funcional e técnico.
6. [`10-dominios/README.md`](./10-dominios/README.md) — índice das regras de negócio.
7. [`30-contratos/README.md`](./30-contratos/README.md) — inventários atuais e geração automática planejada.
8. [`40-runbooks/README.md`](./40-runbooks/README.md) — procedimentos operacionais.
9. [`50-governanca/politica-de-documentacao.md`](./50-governanca/politica-de-documentacao.md) — classificação e manutenção.
10. [`50-governanca/processo-de-atualizacao.md`](./50-governanca/processo-de-atualizacao.md) — fluxo de atualização e validação.
11. [`archive/README.md`](./archive/README.md) — registros históricos.

## Domínios documentados

| Domínio | Documento | Estado |
|---|---|---|
| Evento e CMS | [`10-dominios/evento-e-cms.md`](./10-dominios/evento-e-cms.md) | `canonical` |
| Pessoas e privacidade | [`10-dominios/pessoas-perfis-e-privacidade.md`](./10-dominios/pessoas-perfis-e-privacidade.md) | `canonical` |
| Reivindicação de identidade | [`10-dominios/reivindicacao-de-perfil.md`](./10-dominios/reivindicacao-de-perfil.md) | `canonical` |
| Fotos e moderação | [`10-dominios/acervo-fotos-e-moderacao.md`](./10-dominios/acervo-fotos-e-moderacao.md) | `canonical` |
| Memórias e enquetes | [`10-dominios/memorias-curiosidades-e-enquetes.md`](./10-dominios/memorias-curiosidades-e-enquetes.md) | `canonical` |
| Catálogo de ingressos | [`10-dominios/catalogo-de-ingressos.md`](./10-dominios/catalogo-de-ingressos.md) | `canonical` |
| Checkout e pagamentos | [`10-dominios/checkout-e-pagamentos.md`](./10-dominios/checkout-e-pagamentos.md) | `canonical` |
| Pedidos e ingressos | [`10-dominios/pedidos-participantes-e-ingressos.md`](./10-dominios/pedidos-participantes-e-ingressos.md) | `canonical` |
| Notificações | [`10-dominios/notificacoes-transacionais.md`](./10-dominios/notificacoes-transacionais.md) | `canonical` |
| Check-in e reembolsos | [`10-dominios/checkin-reembolsos-e-operacao.md`](./10-dominios/checkin-reembolsos-e-operacao.md) | `canonical` |
| Autenticação e roles | [`10-dominios/autenticacao-autorizacao-e-roles.md`](./10-dominios/autenticacao-autorizacao-e-roles.md) | `canonical` |
| Mini bio por IA | [`10-dominios/mini-bio-por-ia.md`](./10-dominios/mini-bio-por-ia.md) | `canonical` |

## Inventários técnicos atuais

| Contrato | Documento | Estado |
|---|---|---|
| Rotas | [`30-contratos/rotas.md`](./30-contratos/rotas.md) | `draft`; aguarda extração pós-transform |
| APIs e Functions | [`30-contratos/apis-e-functions.md`](./30-contratos/apis-e-functions.md) | `draft`; aguarda gerador |
| Variáveis | [`30-contratos/variaveis-de-ambiente.md`](./30-contratos/variaveis-de-ambiente.md) | `draft`; aguarda análise estática automatizada |
| Erros | [`30-contratos/codigos-de-erro.md`](./30-contratos/codigos-de-erro.md) | `draft`; faltam RPCs SQL |
| Permissões | [`30-contratos/permissoes.md`](./30-contratos/permissoes.md) | `draft`; aguarda RLS e grants gerados |

Ainda precisam ser gerados automaticamente: schema final, RPCs, RLS, grants, tipos Supabase, rotas efetivas, APIs, Edge Functions, variáveis, erros e ERD.

## Runbooks disponíveis

| Procedimento | Estado |
|---|---|
| [`40-runbooks/desenvolvimento-local.md`](./40-runbooks/desenvolvimento-local.md) | `draft` |
| [`40-runbooks/deploy-vercel.md`](./40-runbooks/deploy-vercel.md) | `draft` |
| [`40-runbooks/deploy-edge-functions.md`](./40-runbooks/deploy-edge-functions.md) | `draft` |
| [`40-runbooks/migrations.md`](./40-runbooks/migrations.md) | `draft` |
| [`40-runbooks/validacao-de-pagamentos.md`](./40-runbooks/validacao-de-pagamentos.md) | `draft` |
| [`40-runbooks/investigacao-de-webhook.md`](./40-runbooks/investigacao-de-webhook.md) | `draft` |
| [`40-runbooks/notificacoes.md`](./40-runbooks/notificacoes.md) | `draft` |
| [`40-runbooks/reembolsos.md`](./40-runbooks/reembolsos.md) | `draft` |
| [`40-runbooks/operacao-no-dia-do-evento.md`](./40-runbooks/operacao-no-dia-do-evento.md) | `draft` |
| [`40-runbooks/resposta-a-incidentes.md`](./40-runbooks/resposta-a-incidentes.md) | `draft` |
| [`40-runbooks/rollback.md`](./40-runbooks/rollback.md) | `draft` |

A documentação dos procedimentos está concluída. A pendência é executá-los, registrar evidências e promover individualmente os comprovados para `canonical`.

## Design

| Documento | Estado | Condição para promoção |
|---|---|---|
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | `draft` | revisão visual do runtime, acessibilidade e breakpoints |
| [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) | `draft` | comparação com CSS, classes e componentes reais |

## Reconciliação concluída

| Documento anterior | Classificação | Substituição |
|---|---|---|
| `ROADMAP.md` | `historical` | Epic e documentação por domínio |
| `PRODUCT_SCOPE.md` | `deprecated` | produto e domínios |
| `SUPABASE_SCHEMA.md` | `deprecated` | futuro `banco.generated.md` |
| `AUTH_AND_ROLES.md` | `deprecated` | autenticação e matriz de permissões |
| `CHECKIN_FLOW.md` | `deprecated` | domínio de operação e runbook do evento |
| `PHOTO_MODERATION.md` | `deprecated` | domínios de acervo e memórias |
| `PHASE2_INTERACTIONS.md` | `historical` | preservado como incremento anterior |
| `PAYMENTS_MERCADO_PAGO.md` | `deprecated` | checkout e pagamentos |
| `DEPLOYMENT.md` | `deprecated` | runbooks de deploy, migrations e rollback |
| `PRODUCTION_QA.md` | `deprecated` | validação de pagamentos e runbooks |
| `mercado-pago/*` | `historical` | registros de auditoria e implementação |

## Governança implementada

- `npm run audit:docs`;
- validação de front matter, links, arquivos-fonte e substituições;
- workflow `Documentation safety` em PRs e pushes para `main`;
- `CODEOWNERS` para documentação;
- template de PR com impacto documental;
- processo de atualização;
- template e índice de ADRs.

## Pendências técnicas reais

### Geração automática

- reproduzir banco com todas as migrations;
- gerar schema, enums, constraints, índices, views e triggers;
- gerar RPCs e segurança;
- gerar RLS, grants e revokes;
- regenerar tipos TypeScript do Supabase;
- gerar ERD;
- extrair rotas depois dos transforms;
- extrair APIs, Functions, variáveis e erros;
- validar divergência dos arquivos gerados no CI.

### Governança restante

- implementar geradores determinísticos;
- exigir atualização dos contratos gerados no CI;
- reconstruir ADRs de decisões anteriores apenas quando houver necessidade prática;
- classificar relatórios auxiliares de migrations ainda sem front matter.

### Operação

- executar todos os runbooks em ambiente controlado;
- ensaiar rollback e incidente;
- simular operação presencial;
- validar visual e acessibilidade;
- promover apenas documentos comprovados.

## Convenção de status

| Status | Significado |
|---|---|
| `canonical` | referência humana vigente e aprovada |
| `generated` | derivado automaticamente; não editar manualmente |
| `draft` | referência em elaboração, sem automação ou evidência completa |
| `historical` | registro de fase anterior |
| `deprecated` | substituído e preservado por rastreabilidade |

## Regra de precedência

1. estado final das migrations, código compilado e testes;
2. contratos gerados automaticamente;
3. documentação `canonical`;
4. runbooks executados e validados;
5. inventários e runbooks `draft`;
6. ADRs;
7. planos, auditorias e registros históricos.

A documentação humana explica contexto, intenção, limites e operação. Ela não substitui contratos verificáveis.
