---
status: historical
owner: tuliust
last_verified: 2026-07-26
recorded_at: 2026-07-21
source_files:
  - supabase/manual/audit_migration_state.sql
  - scripts/repair-supabase-migration-history.ps1
  - .github/workflows/database-migrations.yml
related_docs:
  - docs/supabase-migration-repair-execution.md
  - docs/40-runbooks/migrations.md
---

# Auditoria remota das migrations — 21/07/2026

> **Registro histórico.** Os números, versões e conclusões abaixo representam o banco auditado em 21 de julho de 2026. Não devem ser usados como fotografia atual sem nova execução das consultas e do replay integral.

## Histórico registrado na data

O histórico remoto estava registrado até `20260715000039`, seguido apenas por:

- `20260721000031_profile_claim_identity_verification`;
- `20260721000032_revoke_anon_profile_registration`.

As versões de comércio, FAQ e operações entre esses blocos não constavam do histórico remoto.

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

## Evento e capacidade observados

- Evento: `00000000-0000-0000-0000-000000000001`.
- Data: `2026-10-24`.
- Timezone: `America/Sao_Paulo`.
- Lotes auditados com capacidade `500` e estado considerado válido naquele momento.
- Nenhuma inconsistência identificada no mapeamento do FAQ.

## Dados transacionais observados

| Entidade | Registros em 21/07/2026 |
|---|---:|
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

Essas contagens são evidência histórica e não devem ser comparadas com produção atual sem considerar novas operações.

## Classificação registrada

- `20260716000001` a `20260716000017`: estado funcional presente e replay validado;
- `20260716000100` a `20260716000103`: estado presente, consistente e replay validado;
- `20260719000001` a `20260719000004`: estado presente e testes aprovados;
- `20260719000005` e `20260719000006`: versões históricas consideradas superadas e não executáveis em produção;
- `20260719000007` a `20260719000018`: objetos finais presentes e testes aprovados;
- `20260721000031` e `20260721000032`: aplicadas, registradas e testadas.

## Gates concluídos naquela auditoria

O workflow `Database migration safety` concluiu com sucesso:

- auditoria estática das 85 migrations existentes na data;
- build da aplicação;
- inicialização do Supabase local em runner Linux;
- replay integral em banco vazio;
- listagem do histórico local;
- instalação de fixture autenticada exclusiva de teste;
- execução dos testes SQL existentes.

## Decisão de reparo registrada

As 39 versões ausentes seriam registradas como aplicadas no histórico remoto, sem executar novamente o SQL:

- `20260716000001` a `20260716000017`;
- `20260716000100` a `20260716000103`;
- `20260719000001` a `20260719000018`.

O procedimento foi automatizado em:

```text
scripts/repair-supabase-migration-history.ps1
```

O script validava o projeto, exigia confirmação, preservava listagens antes e depois, executava `migration repair` versão por versão e finalizava apenas com `db push --dry-run`.

## Limite de autoridade

Este documento comprova o estado observado em 21/07/2026. Para determinar o estado vigente:

1. execute o replay integral das migrations atuais;
2. rode todos os testes SQL;
3. execute novamente a auditoria remota;
4. compare os resultados com o histórico vinculado;
5. siga [`40-runbooks/migrations.md`](./40-runbooks/migrations.md).