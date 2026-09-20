---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - supabase/migrations/20260920100146_advisor_batch2_rls_indexes_policy_cleanup.sql
  - supabase/tests/advisor_batch2.sql
---

# Supabase Advisors — rodada 2 de 20/09/2026

Segunda rodada incremental de redução dos Advisors, aplicada depois da baseline `v1.0.0`.

## Princípios

- não zerar alertas por métrica;
- priorizar mudanças de baixo risco e contratos conhecidos;
- preservar o acesso anônimo deliberado de `/buscar`;
- não revogar RPCs `SECURITY DEFINER` sem demonstrar que são internas;
- validar o resultado no Supabase remoto antes do merge.

## Baseline antes da rodada 2

- FKs sem índice: **46**;
- RLS `auth_rls_initplan`: **32**;
- múltiplas policies permissivas: **85**;
- `SECURITY DEFINER` acessíveis por `anon`: **7**;
- `SECURITY DEFINER` acessíveis por `authenticated`: **64**.

## Índices adicionados

Foram priorizadas relações operacionais de compra, identidade, ingresso, reembolso e transferência:

- `order_participants(guest_approval_request_id)`;
- `order_participants(sponsor_user_id)`;
- `profile_identity_verifications(claimant_user_id)`;
- `profile_identity_verifications(profile_id)`;
- `tickets(checked_in_by_admin_id)`;
- `tickets(transferred_from_ticket_id)`;
- `refund_requests(requested_by_user_id)`;
- `ticket_transfers(from_user_id)`.

## RLS

Foram otimizadas policies de:

- memórias;
- curtidas em fotos;
- votos;
- reivindicações de perfil;
- respostas de reivindicação;
- disputas de reivindicação;
- extras de participantes;
- preferências de pagamento;
- pedidos de reembolso;
- transferências de ingresso.

As expressões passaram a usar `(select auth.uid())` e, no caso de transferência, `(select auth.jwt())`, evitando a reavaliação dos helpers para cada linha.

Policies que dependiam de `auth.uid()` mas estavam anexadas ao papel `public` foram restringidas a `authenticated`. Isso não remove uma autorização anônima funcional: uma sessão `anon` já recebia `NULL` de `auth.uid()` e não satisfazia essas condições.

## FAQ — policy legada removida

Foi removida `faq_items_public_read_visible`, existente no ambiente remoto mas ausente da cadeia canônica reproduzível.

Ela era mais permissiva que `faq_items_public_read`: bastava `is_visible=true`, sem exigir `deleted_at is null` nem que a categoria estivesse visível e ativa.

A policy canônica `faq_items_public_read` permanece disponível para `anon` e `authenticated`. O frontend já filtra itens visíveis e não deletados.

## /buscar preservado

Continuam executáveis por `anon`:

- `get_contact_research_directory()`;
- `save_contact_research(...)`.

A rodada 2 não altera o contrato público do mutirão.

## Resultado verificado no Supabase remoto

Após a migration:

- FKs sem índice: **46 → 38**;
- RLS `auth_rls_initplan`: **32 → 16**;
- múltiplas policies permissivas: **85 → 84**;
- `SECURITY DEFINER` com `anon`: **7**;
- `SECURITY DEFINER` com `authenticated`: **64**.

O total de índices sinalizados como não utilizados aumenta imediatamente após a criação de novos índices. Isso é esperado antes de tráfego real e não deve ser usado isoladamente para removê-los.

## Testes

A validação remota confirmou:

- os oito índices existem;
- as policies de dono selecionadas estão restritas a `authenticated`;
- a policy ampla de FAQ foi removida;
- a policy pública canônica de FAQ continua presente;
- as duas RPCs de `/buscar` continuam disponíveis para `anon`.

## Próximas rodadas

Permanecem para análise gradual:

- 38 FKs sem índice;
- 16 ocorrências de `auth_rls_initplan`;
- 84 sobreposições de policies permissivas;
- 64 funções `SECURITY DEFINER` acessíveis a usuários autenticados;
- 7 funções `SECURITY DEFINER` acessíveis anonimamente, várias por contrato público deliberado;
- `pg_trgm` em `public`;
- leaked password protection dependente de configuração do Auth/Dashboard.

Nenhuma dessas pendências deve ser tratada em massa sem revisão de contrato e regressão.
