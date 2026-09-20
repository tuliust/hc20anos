---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - supabase/migrations/20260920102400_advisor_batch3_rls_indexes_policy_overlap.sql
  - supabase/tests/advisor_batch3.sql
---

# Supabase Advisors — rodada 3 de 20/09/2026

Terceira rodada incremental, partindo do estado já mergeado pela PR #90.

## Escopo

A rodada foi limitada a três grupos de alterações com contrato verificável:

1. eliminar as ocorrências restantes de `auth_rls_initplan`;
2. adicionar oito índices de FKs ligados a fluxos operacionais;
3. remover sobreposição de SELECT em três policies `ALL` onde a leitura já estava coberta por outra policy.

O acesso anônimo deliberado de `/buscar` permanece fora de qualquer tentativa de endurecimento automático.

## Baseline

Antes desta migration:

- FKs sem índice: **38**;
- `auth_rls_initplan`: **16**;
- múltiplas policies permissivas: **84**;
- `SECURITY DEFINER` executáveis por `anon`: **7**;
- `SECURITY DEFINER` executáveis por `authenticated`: **64**.

## Índices adicionados

- `faq_items(category_id)`;
- `photo_tags(created_by_user_id)`;
- `photo_removal_requests(requester_user_id)`;
- `guest_approval_requests(sponsor_user_id)`;
- `refund_requests(ticket_id)`;
- `ticket_transfers(to_user_id)`;
- `tickets(physical_vouchers_delivered_by)`;
- `content_moderation_events(actor_user_id)`.

A seleção prioriza relações usadas por FAQ, autoria/moderação, pedidos de remoção, convidados, reembolsos, transferências e operação física.

## RLS initplan

As 16 policies ainda sinalizadas passaram a avaliar `auth.uid()` por meio de `(select auth.uid())`.

Foram tratadas policies de:

- fotos;
- tags;
- pedidos de remoção;
- conteúdo do evento;
- questionário escolar;
- conteúdo público;
- assets do CMS;
- configurações de moderação;
- FAQ;
- eventos de moderação;
- coletores de contatos.

A policy `removal_requests_owner_read`, que dependia de `auth.uid()` mas estava em `public`, foi limitada a `authenticated`. Isso não remove acesso anônimo funcional, pois `auth.uid()` já era nulo para `anon`.

## Redução de policies permissivas

Três policies `ALL` tinham SELECT redundante:

- `event_page_content_manage_admins`;
- `public_page_content_manage_admins`;
- `content_moderation_settings_admin_write`.

Nos dois conteúdos públicos, a leitura já é garantida por policy pública `SELECT true`. A policy administrativa foi dividida apenas em `INSERT`, `UPDATE` e `DELETE`.

Em `content_moderation_settings`, a leitura administrativa já é coberta por `content_moderation_settings_admin_read`; a antiga policy `ALL` foi igualmente dividida em três operações de escrita.

Não houve tentativa de consolidar outras sobreposições cuja semântica de autorização ainda precisa de análise específica.

## Reprodutibilidade

O primeiro replay em banco local vazio identificou um drift histórico: `faq_items_manage_admins` existia no banco remoto, mas não tinha origem na cadeia versionada de migrations.

A migration desta rodada foi tornada replay-safe: ela altera a policy quando já existe e a reconstrói quando está ausente. A busca pelas outras 15 policies tratadas confirmou origem versionada na cadeia anterior.

Isso faz o estado reproduzido do zero convergir para o estado remoto sem depender do drift histórico.

## Resultado remoto

Depois da migration:

- FKs sem índice: **38 → 30**;
- `auth_rls_initplan`: **16 → 0**;
- múltiplas policies permissivas: **84 → 81**;
- `SECURITY DEFINER` com `anon`: **7**, sem alteração;
- `SECURITY DEFINER` com `authenticated`: **64**, sem alteração.

O contador de índices não utilizados subiu de 41 para 49 imediatamente após a criação dos oito índices. Isso é esperado antes de tráfego real e não deve motivar remoção automática.

## Regressões verificadas

Foram confirmados no banco remoto:

- os oito índices existem;
- as duas RPCs anônimas de `/buscar` continuam executáveis por `anon`;
- as policies públicas de leitura de `event_page_content` e `public_page_content` permanecem;
- as três antigas policies `ALL` foram removidas;
- as policies administrativas de escrita foram recriadas por operação;
- `removal_requests_owner_read` está restrita a `authenticated`.

## Pendências após esta rodada

Os próximos lotes devem tratar separadamente:

- 30 FKs ainda sem índice;
- 81 sobreposições de policies permissivas;
- 64 funções `SECURITY DEFINER` acessíveis por usuários autenticados;
- 7 funções `SECURITY DEFINER` anônimas, várias delas públicas por contrato deliberado;
- `pg_trgm` instalado em `public`;
- leaked password protection dependente de configuração do Auth/Dashboard;
- tabelas sem PK/policies, apenas em tarefa específica de retenção/arquivamento.

A próxima rodada deve priorizar semântica de autorização, e não apenas redução numérica dos Advisors.
