# Execução do reparo do histórico remoto

## Pré-requisitos

- branch atual: `chore/supabase-migration-reconciliation`;
- projeto Supabase vinculado: `tjnqqsbwgjcdzcxykyif`;
- auditoria local com `0` erros e `0` alertas;
- replay integral e testes SQL aprovados no GitHub Actions.

## Modo de planejamento

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-supabase-migration-history.ps1
```

Esse modo apenas lista as 39 versões que serão registradas.

## Aplicação

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-supabase-migration-history.ps1 -Apply -Confirmation REPAIR_HISTORY_ONLY
```

O script executa somente `supabase migration repair --status applied` e verificações de histórico. Nenhuma migration SQL é executada.

## Evidências geradas

- `supabase-migration-list-before-repair.txt`;
- `supabase-migration-list-after-repair.txt`;
- `supabase-db-push-dry-run-after-repair.txt`.

## Resultado esperado

- as versões `20260716000001` a `20260716000017` aparecem nas duas colunas;
- as versões `20260716000100` a `20260716000103` aparecem nas duas colunas;
- as versões `20260719000001` a `20260719000018` aparecem nas duas colunas;
- `20260721000031` e `20260721000032` permanecem alinhadas;
- `db push --dry-run` não tenta reaplicar migrations históricas.

## Proibição

Não executar `supabase db push` real, `supabase db reset --linked` ou o script manual de limpeza comercial durante esta etapa.
