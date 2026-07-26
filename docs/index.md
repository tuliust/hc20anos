---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
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
6. [`50-governanca/politica-de-documentacao.md`](./50-governanca/politica-de-documentacao.md) — regras para manter a documentação válida.

## Estado da documentação

A fundação canônica está em implantação incremental. Nesta etapa, os documentos acima passam a orientar novas mudanças, mas os documentos técnicos existentes ainda precisam ser revisados e classificados.

### Documentos existentes que exigem reconciliação

- `ROADMAP.md`: mistura planejamento histórico e funcionalidades já implementadas.
- `SUPABASE_SCHEMA.md`: descreve apenas parte das migrations existentes.
- `PAYMENTS_MERCADO_PAGO.md` e `docs/mercado-pago/*`: contêm registros de diferentes fases da integração.
- `DEPLOYMENT.md` e `PRODUCTION_QA.md`: possuem conteúdo operacional útil, mas ainda não estão integrados ao modelo de runbooks canônicos.

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