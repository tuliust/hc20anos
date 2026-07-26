---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 9cb75a3c6df703ee8c5c500265589330b31a33ac
source_files:
  - README.md
  - docs/
  - scripts/generate-static-contracts.mjs
  - scripts/generate-database-contracts.mjs
  - .github/workflows/documentation.yml
  - .github/workflows/static-contracts.yml
  - .github/workflows/database-migrations.yml
---

# Documentação canônica — HC 20 Anos

Este é o portal de referência técnica, funcional e operacional do projeto **HC 20 Anos**.

Documentos `canonical` descrevem regras humanas vigentes conferidas contra o repositório. Arquivos `generated` são produzidos automaticamente. Inventários e runbooks `draft` são referências atuais, mas ainda aguardam automação completa ou evidência operacional. Registros `historical` e `deprecated` não prevalecem sobre as fontes definidas em [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md).

## Comece por aqui

1. [`00-visao-geral/produto.md`](./00-visao-geral/produto.md) — objetivo, públicos e capacidades.
2. [`00-visao-geral/arquitetura.md`](./00-visao-geral/arquitetura.md) — runtime, integrações e fontes técnicas.
3. [`00-visao-geral/mapa-do-repositorio.md`](./00-visao-geral/mapa-do-repositorio.md) — responsabilidade dos diretórios.
4. [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md) — precedência entre banco, código, CMS e documentos.
5. [`00-visao-geral/glossario.md`](./00-visao-geral/glossario.md) — vocabulário funcional e técnico.
6. [`10-dominios/README.md`](./10-dominios/README.md) — índice das regras de negócio.
7. [`30-contratos/README.md`](./30-contratos/README.md) — contratos, inventários e geração automática.
8. [`40-runbooks/README.md`](./40-runbooks/README.md) — procedimentos operacionais.
9. [`50-governanca/politica-de-documentacao.md`](./50-governanca/politica-de-documentacao.md) — classificação e manutenção.
10. [`50-governanca/processo-de-atualizacao.md`](./50-governanca/processo-de-atualizacao.md) — fluxo de atualização e validação.
11. [`archive/README.md`](./archive/README.md) — classificação consolidada dos registros históricos.

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

## Contratos técnicos

### Inventários humanos

| Contrato | Documento | Estado |
|---|---|---|
| Rotas | [`30-contratos/rotas.md`](./30-contratos/rotas.md) | `draft`; aguarda extração pós-transform |
| APIs e Functions | [`30-contratos/apis-e-functions.md`](./30-contratos/apis-e-functions.md) | `draft`; será substituído por saídas geradas |
| Variáveis | [`30-contratos/variaveis-de-ambiente.md`](./30-contratos/variaveis-de-ambiente.md) | `draft`; será substituído por saída gerada |
| Erros | [`30-contratos/codigos-de-erro.md`](./30-contratos/codigos-de-erro.md) | `draft`; será complementado por SQL e providers |
| Permissões | [`30-contratos/permissoes.md`](./30-contratos/permissoes.md) | `draft`; aguarda RLS e grants gerados |

### Geração estática implementada

O gerador [`scripts/generate-static-contracts.mjs`](../scripts/generate-static-contracts.mjs) produz:

- `APIs.generated.md`;
- `edge-functions.generated.md`;
- `variaveis-de-ambiente.generated.md`;
- `codigos-de-erro.generated.md`.

```bash
npm run docs:generate-contracts
npm run docs:check-contracts
```

O workflow `Static contract generation` gera, audita, verifica drift em pull requests e publica a baseline em `main` quando executado por push. Consulte [`30-contratos/geracao-estatica.md`](./30-contratos/geracao-estatica.md).

### Geração do banco implementada

O gerador [`scripts/generate-database-contracts.mjs`](../scripts/generate-database-contracts.mjs) produz, após replay integral:

- `banco.generated.md`;
- `RPCs.generated.md`;
- `RLS.generated.md`;
- `database.types.generated.ts`;
- `erd.generated.mmd`.

```bash
npm run docs:generate-db-contracts
npm run docs:check-db-contracts
```

O workflow `Database migration safety` agora roda também em pushes para `main`, executa replay e testes SQL antes da geração, verifica drift em pull requests e publica os contratos somente após aprovação. Consulte [`30-contratos/geracao-do-banco.md`](./30-contratos/geracao-do-banco.md).

### Rotas efetivas

`rotas.generated.md` continua pendente porque deve considerar transforms, mounts, aliases e runtime compilado. Uma busca simples por strings não é suficiente para promover esse contrato a `generated`.

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

A redação está concluída. Falta executar, registrar evidências e promover individualmente os procedimentos comprovados para `canonical`.

## Design

| Documento | Estado | Condição para promoção |
|---|---|---|
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | `draft` | revisão visual do runtime, acessibilidade e breakpoints |
| [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) | `draft` | comparação com CSS, classes e componentes reais |

## Reconciliação histórica

A classificação completa está em [`archive/README.md`](./archive/README.md). Entre os documentos reconciliados estão:

- roadmap e escopo inicial;
- snapshot antigo do Supabase;
- guias anteriores de autenticação, check-in e moderação;
- documentação legada do Mercado Pago;
- deployment e QA anteriores;
- auditoria e reparo histórico das migrations;
- execução manual antiga do checkout.

## Governança implementada

- `npm run audit:docs`;
- validação de front matter, links, arquivos-fonte e substituições;
- workflow `Documentation safety` em PRs e pushes para `main`;
- workflow `Static contract generation`;
- workflow `Database migration safety` em PRs, pushes para `main` e execução manual;
- `CODEOWNERS` para documentação;
- template de PR com impacto documental;
- processo de atualização;
- template e índice de ADRs.

## Pendências técnicas reais

### Baselines geradas

- confirmar a primeira execução dos workflows em `main`;
- revisar os contratos estáticos publicados;
- revisar schema, RPCs, RLS, tipos e ERD publicados;
- confirmar os comandos de check sem drift;
- substituir inventários manuais somente depois da revisão.

### Runtime

- gerar `rotas.generated.md` depois dos transforms;
- validar contratos de respostas e payloads além da análise estática;
- decidir quando substituir `src/lib/database.types.ts` pelo tipo gerado revisado.

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
| `draft` | referência sem automação ou evidência completa |
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
