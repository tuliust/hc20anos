---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: ee5b6b03bdce7a2b4f4fda55cee41c2c6bf6cb5b
source_files:
  - README.md
  - docs/
  - scripts/generate-static-contracts.mjs
  - scripts/generate-routes-contract.mjs
  - scripts/generate-database-contracts.mjs
  - .github/workflows/documentation.yml
  - .github/workflows/static-contracts.yml
  - .github/workflows/database-migrations.yml
---

# Documentação canônica — HC 20 Anos

Este é o portal de referência técnica, funcional e operacional do projeto **HC 20 Anos**.

Documentos `canonical` descrevem regras humanas vigentes. Arquivos `generated` representam estruturas extraídas do código, do runtime composto ou do banco reproduzido. Runbooks e inventários `draft` permanecem referências auxiliares até receberem validação operacional ou substituto completo. Registros `historical` e `deprecated` não prevalecem sobre as fontes definidas em [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md).

## Comece por aqui

1. [`00-visao-geral/produto.md`](./00-visao-geral/produto.md) — objetivo, públicos e capacidades.
2. [`00-visao-geral/arquitetura.md`](./00-visao-geral/arquitetura.md) — runtime, integrações e fontes técnicas.
3. [`00-visao-geral/mapa-do-repositorio.md`](./00-visao-geral/mapa-do-repositorio.md) — responsabilidade dos diretórios.
4. [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md) — precedência entre banco, código, CMS e documentos.
5. [`00-visao-geral/glossario.md`](./00-visao-geral/glossario.md) — vocabulário funcional e técnico.
6. [`10-dominios/README.md`](./10-dominios/README.md) — regras de negócio.
7. [`30-contratos/README.md`](./30-contratos/README.md) — contratos gerados e inventários complementares.
8. [`40-runbooks/README.md`](./40-runbooks/README.md) — procedimentos operacionais.
9. [`50-governanca/politica-de-documentacao.md`](./50-governanca/politica-de-documentacao.md) — classificação e manutenção.
10. [`50-governanca/processo-de-atualizacao.md`](./50-governanca/processo-de-atualizacao.md) — fluxo de atualização e validação.
11. [`archive/README.md`](./archive/README.md) — classificação dos registros históricos.

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

## Contratos técnicos gerados

### Runtime, APIs e configuração

| Contrato | Arquivo | Estado |
|---|---|---|
| Rotas efetivas | [`30-contratos/rotas.generated.md`](./30-contratos/rotas.generated.md) | `generated` |
| Vercel Functions | [`30-contratos/APIs.generated.md`](./30-contratos/APIs.generated.md) | `generated` |
| Edge Functions | [`30-contratos/edge-functions.generated.md`](./30-contratos/edge-functions.generated.md) | `generated` |
| Variáveis de ambiente | [`30-contratos/variaveis-de-ambiente.generated.md`](./30-contratos/variaveis-de-ambiente.generated.md) | `generated` |
| Códigos de erro literais | [`30-contratos/codigos-de-erro.generated.md`](./30-contratos/codigos-de-erro.generated.md) | `generated` |

Procedimentos:

- [`30-contratos/geracao-estatica.md`](./30-contratos/geracao-estatica.md);
- [`30-contratos/geracao-de-rotas.md`](./30-contratos/geracao-de-rotas.md).

A baseline foi publicada pelo workflow no commit `9c6eba3bd05a16511bd8160b3e0d621c34f9918e`.

### Banco reproduzido

| Contrato | Arquivo | Estado |
|---|---|---|
| Schema final | [`30-contratos/banco.generated.md`](./30-contratos/banco.generated.md) | `generated` |
| RPCs e funções | [`30-contratos/RPCs.generated.md`](./30-contratos/RPCs.generated.md) | `generated` |
| RLS, policies e grants | [`30-contratos/RLS.generated.md`](./30-contratos/RLS.generated.md) | `generated` |
| Tipos TypeScript | [`30-contratos/database.types.generated.ts`](./30-contratos/database.types.generated.ts) | `generated` |
| ERD Mermaid | [`30-contratos/erd.generated.mmd`](./30-contratos/erd.generated.mmd) | `generated` |

Procedimento: [`30-contratos/geracao-do-banco.md`](./30-contratos/geracao-do-banco.md).

A baseline foi publicada no commit `2e90f45cb57c001ba5510d9918345b763578b265`, depois de replay integral das migrations e aprovação dos testes SQL.

### Inventários humanos complementares

| Documento | Estado | Finalidade |
|---|---|---|
| [`30-contratos/rotas.md`](./30-contratos/rotas.md) | `deprecated` | redirecionar referências anteriores |
| [`30-contratos/apis-e-functions.md`](./30-contratos/apis-e-functions.md) | `draft` | responsabilidades e exemplos de fluxo |
| [`30-contratos/variaveis-de-ambiente.md`](./30-contratos/variaveis-de-ambiente.md) | `draft` | sensibilidade e configuração operacional |
| [`30-contratos/codigos-de-erro.md`](./30-contratos/codigos-de-erro.md) | `draft` | semântica de interface e erros dinâmicos |
| [`30-contratos/permissoes.md`](./30-contratos/permissoes.md) | `draft` | matriz funcional de atores e papéis |

Quando houver divergência estrutural, prevalece a baseline `generated`.

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
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | `draft` | revisão visual, acessibilidade e breakpoints |
| [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) | `draft` | comparação com CSS, classes e componentes reais |

## Reconciliação histórica

A classificação completa está em [`archive/README.md`](./archive/README.md). Foram reconciliados, entre outros:

- roadmap e escopo inicial;
- snapshot antigo do Supabase;
- guias anteriores de autenticação, check-in e moderação;
- documentação legada do Mercado Pago;
- deployment e QA anteriores;
- auditoria e reparo histórico das migrations;
- execução manual antiga do checkout;
- inventário manual de rotas.

## Governança implementada

- `npm run audit:docs`;
- validação de front matter, links, arquivos-fonte e substituições;
- workflow `Documentation safety`;
- workflow `Static contract generation`;
- workflow `Database migration safety`;
- checks de drift para contratos estáticos, rotas e banco;
- publicação automática das baselines em `main`;
- `CODEOWNERS`;
- template de PR com impacto documental;
- processo de atualização;
- template e índice de ADRs.

## Pendências técnicas reais

### Compatibilidade e semântica

- comparar `database.types.generated.ts` com `src/lib/database.types.ts`;
- decidir uma migração segura dos tipos usados pela aplicação;
- aprofundar contratos de payload e resposta além da análise estática;
- revisar achados de RLS, grants e funções `security definer`;
- manter inventários humanos apenas enquanto agregarem contexto exclusivo.

### Operação

- executar todos os runbooks em ambiente controlado;
- registrar evidências;
- ensaiar rollback e resposta a incidentes;
- simular operação presencial;
- validar pagamentos, notificações e reembolsos em ambiente controlado;
- promover apenas procedimentos comprovados.

### Design

- validar visualmente os breakpoints;
- executar revisão de acessibilidade;
- comparar tokens documentados com CSS e componentes;
- promover documentos comprovados para `canonical`.

## Convenção de status

| Status | Significado |
|---|---|
| `canonical` | referência humana vigente e aprovada |
| `generated` | derivado automaticamente; não editar manualmente |
| `draft` | referência sem validação ou substituição completa |
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
