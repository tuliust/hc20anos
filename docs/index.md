---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - README.md
  - docs/
---

# Documentação canônica — HC 20 Anos

Este diretório é o portal de referência técnica e funcional do projeto **HC 20 Anos**.

A documentação canônica descreve o estado vigente do produto, da arquitetura e da operação. Documentos históricos, planos de implementação e auditorias podem continuar no repositório, mas não prevalecem sobre as fontes de verdade definidas em [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md).

## Comece por aqui

1. [`00-visao-geral/produto.md`](./00-visao-geral/produto.md) — objetivo, públicos e capacidades do produto.
2. [`00-visao-geral/arquitetura.md`](./00-visao-geral/arquitetura.md) — visão do sistema em runtime e suas integrações.
3. [`00-visao-geral/mapa-do-repositorio.md`](./00-visao-geral/mapa-do-repositorio.md) — responsabilidade de cada diretório.
4. [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md) — autoridade de código, banco, CMS e documentação.
5. [`00-visao-geral/glossario.md`](./00-visao-geral/glossario.md) — termos usados no domínio e no código.
6. [`10-dominios/checkout-e-pagamentos.md`](./10-dominios/checkout-e-pagamentos.md) — checkout, Mercado Pago, webhook e estado financeiro.
7. [`50-governanca/politica-de-documentacao.md`](./50-governanca/politica-de-documentacao.md) — regras para manter a documentação válida.
8. [`archive/README.md`](./archive/README.md) — classificação e preservação de registros históricos.

## Estado da documentação

A fundação canônica está sendo implantada incrementalmente. Os documentos de visão geral e a referência de checkout passam a orientar novas mudanças. Os contratos gerados, demais domínios e runbooks ainda serão acrescentados.

### Reconciliação concluída nesta etapa

| Documento anterior | Classificação | Resultado |
|---|---|---|
| `ROADMAP.md` | `historical` | Mantido como planejamento inicial; não representa backlog ou implementação atual. |
| `SUPABASE_SCHEMA.md` | `deprecated` | Declarado snapshot parcial; banco vigente depende do replay completo das migrations. |
| `PAYMENTS_MERCADO_PAGO.md` | `deprecated` | Fluxo agregado antigo substituído pela referência canônica de checkout. |
| `mercado-pago/01-auditoria-e-plano.md` | `historical` | Preservado como auditoria anterior à implementação. |
| `mercado-pago/02-backend-checkout-create.md` | `historical` | Preservado como contrato intermediário. |
| `mercado-pago/03-admin-reporting-validation.md` | `historical` | Preservado como checklist de uma entrega específica. |
| `mercado-pago/04-operacao-e-deploy.md` | `historical` | Preservado como procedimento ainda não revalidado. |

### Documentos que ainda exigem reconciliação

- `DEPLOYMENT.md`: possui conteúdo operacional útil, mas ainda precisa ser separado entre Vercel, Supabase, migrations e rollback.
- `PRODUCTION_QA.md`: precisa ser reconciliado com os testes automatizados e transformado em matriz reproduzível.
- `AUTH_AND_ROLES.md`: precisa ser comparado com roles, policies e grants finais.
- `CHECKIN_FLOW.md`: precisa ser comparado com RPCs, página de operação e regras atuais.
- `PRODUCT_SCOPE.md`: precisa ser integrado aos documentos de domínio sem duplicar a visão geral.
- Demais documentos de fases anteriores precisam receber metadados de vigência.

Até essa reconciliação ser concluída, use o código e as fontes de verdade declaradas neste portal para resolver divergências.

## Convenção de status

Todo documento canônico deve declarar um dos estados abaixo no front matter:

| Status | Significado |
|---|---|
| `canonical` | Referência humana vigente e aprovada. |
| `generated` | Derivado automaticamente do código ou banco. Não editar manualmente. |
| `draft` | Em elaboração. Não deve ser tratado como decisão vigente. |
| `historical` | Registro de uma fase anterior. |
| `deprecated` | Substituído por outra referência, mantido apenas por rastreabilidade. |

## Regra de precedência

Quando houver divergência:

1. comportamento validado no estado final das migrations, código compilado e testes;
2. contratos gerados automaticamente;
3. documentação `canonical`;
4. runbooks vigentes;
5. ADRs para explicar decisões;
6. planos, auditorias e documentos históricos.

A documentação humana não deve tentar substituir contratos verificáveis. Ela deve explicar contexto, intenção, limites e operação.
