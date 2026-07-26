---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 0a97147b33aa567c776ea34c14aaff3e789b7474
source_files:
  - README.md
  - docs/
---

# Documentação canônica — HC 20 Anos

Este diretório é o portal de referência técnica, funcional e operacional do projeto **HC 20 Anos**.

A documentação canônica descreve o estado vigente do produto e da arquitetura. Runbooks em `draft` descrevem procedimentos conferidos contra o código, mas ainda aguardam execução integral em ambiente controlado. Documentos históricos, planos e auditorias não prevalecem sobre as fontes de verdade definidas em [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md).

## Comece por aqui

1. [`00-visao-geral/produto.md`](./00-visao-geral/produto.md) — objetivo, públicos e capacidades do produto.
2. [`00-visao-geral/arquitetura.md`](./00-visao-geral/arquitetura.md) — visão do sistema em runtime e suas integrações.
3. [`00-visao-geral/mapa-do-repositorio.md`](./00-visao-geral/mapa-do-repositorio.md) — responsabilidade de cada diretório.
4. [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md) — autoridade de código, banco, CMS e documentação.
5. [`00-visao-geral/glossario.md`](./00-visao-geral/glossario.md) — termos usados no domínio e no código.
6. [`10-dominios/checkout-e-pagamentos.md`](./10-dominios/checkout-e-pagamentos.md) — checkout, Mercado Pago, webhook e estado financeiro.
7. [`30-contratos/README.md`](./30-contratos/README.md) — plano para referências geradas a partir do código e do banco.
8. [`40-runbooks/README.md`](./40-runbooks/README.md) — índice e critérios dos procedimentos operacionais.
9. [`50-governanca/politica-de-documentacao.md`](./50-governanca/politica-de-documentacao.md) — regras para manter a documentação válida.
10. [`archive/README.md`](./archive/README.md) — classificação e preservação de registros históricos.

## Runbooks disponíveis

| Procedimento | Estado |
|---|---|
| [`40-runbooks/desenvolvimento-local.md`](./40-runbooks/desenvolvimento-local.md) | `draft`; |
| [`40-runbooks/deploy-vercel.md`](./40-runbooks/deploy-vercel.md) | `draft`; |
| [`40-runbooks/deploy-edge-functions.md`](./40-runbooks/deploy-edge-functions.md) | `draft`; |
| [`40-runbooks/migrations.md`](./40-runbooks/migrations.md) | `draft`; |
| [`40-runbooks/validacao-de-pagamentos.md`](./40-runbooks/validacao-de-pagamentos.md) | `draft`; |
| [`40-runbooks/rollback.md`](./40-runbooks/rollback.md) | `draft`. |

`draft` significa que o procedimento foi reconciliado com o repositório, mas ainda não recebeu evidência de execução completa. Não significa que um documento histórico ou depreciado possa substituí-lo.

## Reconciliação concluída

| Documento anterior | Classificação | Resultado |
|---|---|---|
| `ROADMAP.md` | `historical` | planejamento inicial; não representa backlog atual; |
| `SUPABASE_SCHEMA.md` | `deprecated` | snapshot parcial; banco depende do replay integral; |
| `PAYMENTS_MERCADO_PAGO.md` | `deprecated` | fluxo agregado antigo substituído pela referência de domínio; |
| `DEPLOYMENT.md` | `deprecated` | substituído por runbooks separados; |
| `PRODUCTION_QA.md` | `deprecated` | substituído pela matriz atual de validação; |
| `mercado-pago/01-auditoria-e-plano.md` | `historical` | auditoria anterior à implementação; |
| `mercado-pago/02-backend-checkout-create.md` | `historical` | contrato intermediário; |
| `mercado-pago/03-admin-reporting-validation.md` | `historical` | checklist de uma entrega específica; |
| `mercado-pago/04-operacao-e-deploy.md` | `historical` | procedimento anterior ainda preservado. |

## Documentos que ainda exigem reconciliação

- `AUTH_AND_ROLES.md`: comparar com roles, policies e grants finais;
- `CHECKIN_FLOW.md`: comparar com RPCs, página de operação e regras atuais;
- `PRODUCT_SCOPE.md`: integrar aos documentos de domínio sem duplicar a visão geral;
- documentos de fotos, design e interações: classificar por vigência;
- demais documentos de fases anteriores: adicionar metadados e apontar substitutos.

## Contratos que ainda precisam ser gerados

- rotas efetivas após transforms;
- Vercel Functions e Edge Functions;
- schema final após replay;
- tabelas, views, enums, RPCs, triggers, policies e grants;
- matriz de variáveis de ambiente;
- códigos de erro;
- tipos TypeScript do Supabase;
- diagrama de entidades.

## Convenção de status

| Status | Significado |
|---|---|
| `canonical` | referência humana vigente e aprovada; |
| `generated` | derivado automaticamente; não editar manualmente; |
| `draft` | em elaboração ou ainda sem execução integral; |
| `historical` | registro de uma fase anterior; |
| `deprecated` | substituído, preservado por rastreabilidade. |

## Regra de precedência

Quando houver divergência:

1. comportamento validado no estado final das migrations, código compilado e testes;
2. contratos gerados automaticamente;
3. documentação `canonical`;
4. runbooks vigentes e executados;
5. runbooks `draft`, com limitações declaradas;
6. ADRs;
7. planos, auditorias e documentos históricos.

A documentação humana não deve tentar substituir contratos verificáveis. Deve explicar contexto, intenção, limites, operação e critérios de segurança.