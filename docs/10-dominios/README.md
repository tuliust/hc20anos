---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: a25e6679e4be26b75f49700a0ed13b0f3b5fe5ef
source_files:
  - docs/10-dominios/
---

# Documentação por domínio

Esta seção descreve regras de negócio, dados, limites de segurança e testes mínimos por área funcional.

## Documentos

| Domínio | Documento | Estado |
|---|---|---|
| Evento e conteúdo | [`evento-e-cms.md`](./evento-e-cms.md) | `canonical` |
| Pessoas e perfil público | [`pessoas-perfis-e-privacidade.md`](./pessoas-perfis-e-privacidade.md) | `canonical` |
| Identidade | [`reivindicacao-de-perfil.md`](./reivindicacao-de-perfil.md) | `canonical` |
| Fotos e acervo | [`acervo-fotos-e-moderacao.md`](./acervo-fotos-e-moderacao.md) | `canonical` |
| Memórias e enquetes | [`memorias-curiosidades-e-enquetes.md`](./memorias-curiosidades-e-enquetes.md) | `canonical` |
| Catálogo comercial | [`catalogo-de-ingressos.md`](./catalogo-de-ingressos.md) | `canonical` |
| Checkout financeiro | [`checkout-e-pagamentos.md`](./checkout-e-pagamentos.md) | `canonical` |
| Pedidos e ingressos | [`pedidos-participantes-e-ingressos.md`](./pedidos-participantes-e-ingressos.md) | `canonical` |
| Comunicações | [`notificacoes-transacionais.md`](./notificacoes-transacionais.md) | `canonical` |
| Operação | [`checkin-reembolsos-e-operacao.md`](./checkin-reembolsos-e-operacao.md) | `canonical` |
| Segurança e acesso | [`autenticacao-autorizacao-e-roles.md`](./autenticacao-autorizacao-e-roles.md) | `canonical` |
| IA de perfil | [`mini-bio-por-ia.md`](./mini-bio-por-ia.md) | `canonical` |

## Como usar

Ao alterar um fluxo:

1. identificar o domínio principal;
2. conferir fontes de verdade e arquivos listados no front matter;
3. atualizar o documento no mesmo commit quando a regra mudar;
4. atualizar contratos e runbooks relacionados;
5. executar os testes mínimos documentados;
6. criar ADR quando a mudança alterar arquitetura ou fonte de verdade.

## Limites

Documentos de domínio explicam intenção e regras. Eles não substituem:

- migrations e estado final do banco;
- RLS, grants e RPCs;
- código compilado após transforms;
- contratos gerados;
- evidência de execução dos runbooks.

Em caso de divergência, aplicar a precedência definida em [`../00-visao-geral/fontes-de-verdade.md`](../00-visao-geral/fontes-de-verdade.md).
