---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - supabase/migrations/20260920105202_advisor_batch4_restrict_internal_security_definer_helpers.sql
  - supabase/migrations/20260920105712_advisor_batch4_align_rate_limit_service_role.sql
  - supabase/tests/advisor_batch4.sql
---

# Supabase Advisors — rodada 4 de 20/09/2026

Quarta rodada incremental dos Supabase Advisors, iniciada depois da conclusão da PR #91.

## Objetivo

Esta rodada não altera RLS nem contratos de negócio. O foco é reduzir execução direta desnecessária de funções `SECURITY DEFINER` que funcionam como helpers internos.

Foram revisados os consumidores de:

- `current_security_role()`;
- `enforce_rate_limit(...)`;
- `admin_can_manage_people()`;
- `can_manage_contact_research()`.

A revisão mostrou que `current_security_role()` ainda participa diretamente dos testes de papéis e foi preservada nesta rodada. `can_manage_contact_research()` é usada em policies RLS e também deve manter `EXECUTE` para `authenticated`.

## Helpers restringidos

### `enforce_rate_limit(...)`

O código do frontend não chama essa função diretamente. Os consumidores encontrados são RPCs `SECURITY DEFINER` como upload de foto, memórias, comentários, tags e pedidos de remoção.

Permitir chamada direta pelo cliente era desnecessário e ainda permitiria que um usuário autenticado manipulasse diretamente buckets de rate limit. O `EXECUTE` de `authenticated` foi removido.

O replay limpo mostrou ainda que `service_role` nunca recebe esse grant na cadeia canônica. O ambiente remoto possuía esse acesso como drift histórico. A migration corretiva `20260920105712_advisor_batch4_align_rate_limit_service_role` revogou também o `EXECUTE` direto de `service_role`, alinhando produção e replay sem alterar os consumidores internos.

### `admin_can_manage_people()`

O frontend também não chama esse helper diretamente. Ele é usado dentro das RPCs administrativas de leitura, edição, limpeza e remoção de pessoas/perfis, todas `SECURITY DEFINER`.

O `EXECUTE` direto de `authenticated` foi removido, sem alterar o acesso às RPCs administrativas públicas que fazem a checagem internamente.

## Contratos preservados

Continuam inalterados:

- `get_contact_research_directory()` executável por `anon`;
- `save_contact_research(...)` executável por `anon`;
- `create_uploaded_photo(...)` executável por `authenticated`;
- `admin_get_person_details(uuid)` executável por `authenticated`;
- `service_role` continua com acesso a `admin_can_manage_people()`;
- `service_role` não executa diretamente `enforce_rate_limit(...)`, em conformidade com a cadeia reproduzível.

## Resultado remoto

Após as migrations `20260920105202_advisor_batch4_restrict_internal_security_definer_helpers` e `20260920105712_advisor_batch4_align_rate_limit_service_role`:

- migrations remotas: **138**;
- `auth_rls_initplan`: **0**;
- FKs sem índice: **30**;
- múltiplas policies permissivas: **81**;
- `SECURITY DEFINER` executáveis por `anon`: **7**;
- `SECURITY DEFINER` executáveis por `authenticated`: **64 → 62**.

A primeira validação remota passou. O replay integral das migrations identificou apenas o grant remoto excedente de `service_role` em `enforce_rate_limit(...)`; após a migration corretiva, seis checks de alinhamento remoto passaram e o teste da rodada passou a exigir explicitamente que esse helper não seja executável diretamente por `authenticated` nem por `service_role`.

## Decisões preservadas

Não foram alteradas as sete funções `SECURITY DEFINER` anônimas nesta rodada. Entre elas há contratos públicos deliberados, incluindo `/buscar`, catálogo, memórias/FAQ e consulta de checkout.

Também não foi ativada a proteção contra senhas vazadas. Esse item depende da configuração do Supabase Auth/Dashboard e permanece como decisão manual/de plano.

## Próximos lotes

A próxima revisão deve continuar separando:

- RPCs realmente consumidas pelo frontend;
- helpers chamados apenas por outras funções;
- helpers usados por RLS;
- APIs públicas deliberadas;
- functions antigas/legadas sem consumidor atual.

Não remover grants apenas para reduzir o número do Advisor.
