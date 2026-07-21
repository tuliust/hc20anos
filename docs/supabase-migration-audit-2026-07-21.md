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

## Classificação final

- `20260716000001` a `20260716000017`: estado funcional presente e replay validado.
- `20260716000100` a `20260716000103`: estado presente, consistente e replay validado.
- `20260719000001` a `20260719000004`: estado presente e testes aprovados.
- `20260719000005` e `20260719000006`: estado final presente; versões históricas classificadas como superadas e não executáveis em produção.
- `20260719000007` a `20260719000018`: objetos finais presentes e testes aprovados.
- `20260721000031` e `20260721000032`: aplicadas, registradas e testadas.

## Gates concluídos

O workflow `Database migration safety` concluiu com sucesso:

- auditoria estática das 85 migrations;
- build da aplicação;
- inicialização do Supabase local em runner Linux;
- replay integral das migrations em banco vazio;
- listagem do histórico local;
- instalação de fixture autenticada exclusiva de teste;
- execução de todos os testes SQL.

## Decisão de reparo

As 39 versões ausentes serão registradas como aplicadas no histórico remoto, sem executar novamente o SQL:

- `20260716000001` a `20260716000017`;
- `20260716000100` a `20260716000103`;
- `20260719000001` a `20260719000018`.

O procedimento está automatizado em:

```text
scripts/repair-supabase-migration-history.ps1
```

O script:

1. valida o project ref vinculado;
2. exige branch e frase de confirmação explícitas;
3. salva a listagem anterior;
4. executa `migration repair --status applied` versão por versão e por família;
5. interrompe no primeiro erro;
6. salva a listagem posterior;
7. executa apenas `db push --dry-run` como verificação final.

Nenhuma migration SQL, reset ou exclusão de dados é executada por esse procedimento. Os resets históricos permanecem fora do fluxo automático; a limpeza comercial só existe no script manual protegido.