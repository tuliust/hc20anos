---
status: historical
owner: tuliust
last_verified: 2026-07-26
source_files:
  - scripts/repair-supabase-migration-history.ps1
  - supabase/manual/audit_migration_state.sql
related_docs:
  - docs/supabase-migration-audit-2026-07-21.md
  - docs/40-runbooks/migrations.md
---

# Execução do reparo do histórico remoto

> **Registro histórico.** Este documento descreve uma execução específica de reconciliação do histórico remoto. Não constitui autorização permanente para repetir o reparo. Para procedimentos atuais, use [`40-runbooks/migrations.md`](./40-runbooks/migrations.md).

## Pré-requisitos usados na execução

- branch de trabalho: `chore/supabase-migration-reconciliation`;
- projeto Supabase vinculado: `tjnqqsbwgjcdzcxykyif`;
- auditoria local com `0` erros e `0` alertas;
- replay integral e testes SQL aprovados no GitHub Actions.

## Modo de planejamento utilizado

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-supabase-migration-history.ps1
```

Esse modo listava as 39 versões previstas para registro.

## Aplicação utilizada

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-supabase-migration-history.ps1 -Apply -Confirmation REPAIR_HISTORY_ONLY
```

O script executava apenas `supabase migration repair --status applied` e verificações de histórico. Nenhuma migration SQL era executada.

## Evidências previstas

- `supabase-migration-list-before-repair.txt`;
- `supabase-migration-list-after-repair.txt`;
- `supabase-db-push-dry-run-after-repair.txt`.

## Resultado esperado naquela execução

- versões `20260716000001` a `20260716000017` presentes nas duas colunas;
- versões `20260716000100` a `20260716000103` presentes nas duas colunas;
- versões `20260719000001` a `20260719000018` presentes nas duas colunas;
- `20260721000031` e `20260721000032` permanecendo alinhadas;
- `db push --dry-run` sem tentativa de reaplicar migrations históricas.

## Proibições registradas

Durante essa etapa, não deveriam ser executados:

- `supabase db push` real;
- `supabase db reset --linked`;
- script manual de limpeza comercial.

## Uso atual permitido

Este documento pode ser usado somente para auditoria e reconstrução do contexto da reconciliação. Qualquer novo reparo exige nova evidência, revisão do script e aplicação do runbook vigente.