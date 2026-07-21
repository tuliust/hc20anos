# Auditoria remota das migrations — 21/07/2026

## Histórico registrado

O histórico remoto está registrado até `20260715000039`, seguido apenas por:

- `20260721000031_profile_claim_identity_verification`;
- `20260721000032_revoke_anon_profile_registration`.

As versões de comércio, FAQ e operações entre esses blocos não constam do histórico remoto.

## Objetos confirmados no banco

A consulta `supabase/manual/audit_migration_state.sql` confirmou como presentes:

- tabelas, funções e RLS da fundação comercial;
- colunas e índices de idempotência do checkout;
- função `age_on_event_date` e RPC `create_checkout_order`;
- FAQ relacional, backup, consolidação e RPC de movimentação;
- relatórios administrativos e limitadores de capacidade;
- fluxos de convidados, notificações, transferências e reembolsos;
- check-in, auditoria de segurança e rate limiting;
- evidências privadas da reivindicação de perfil.

## Evento e capacidade

- Evento: `00000000-0000-0000-0000-000000000001`.
- Data: `2026-10-24`.
- Timezone: `America/Sao_Paulo`.
- Todos os lotes auditados possuem capacidade `500` e estado válido.
- Não foram identificadas inconsistências no mapeamento do FAQ.

## Dados transacionais a preservar

| Entidade | Registros |
| --- | ---: |
| orders | 4 |
| order_participants | 4 |
| participant_extras | 1 |
| payment_preferences | 4 |
| notification_jobs | 8 |
| tickets | 0 |
| payment_events | 0 |
| refund_requests | 0 |
| ticket_transfers | 0 |
| guest_approval_requests | 0 |

## Classificação inicial

- `20260716000001` a `20260716000017`: estado funcional presente; validar testes por família antes do repair.
- `20260716000100` a `20260716000103`: estado presente e consistente.
- `20260719000001` a `20260719000004`: estado presente; validar funções e permissões.
- `20260719000005` e `20260719000006`: estado final presente, mas o SQL histórico era destrutivo; não executar.
- `20260719000007` a `20260719000018`: objetos finais presentes; validar testes existentes.
- `20260721000031` e `20260721000032`: aplicadas, registradas e testadas.

## Decisão

Os resets históricos não serão executados. A branch substitui o conteúdo automático por normalização não destrutiva e move a limpeza para um script manual protegido. O histórico remoto só será reparado depois do replay local e da execução dos testes SQL.
