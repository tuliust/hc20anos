---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
superseded_by:
  - docs/40-runbooks/migrations.md
source_files:
  - scripts/validate-supabase-migrations.mjs
  - scripts/repair-supabase-migration-history.ps1
  - supabase/manual/audit_migration_state.sql
  - supabase/migrations/
---

# Runbook de reconciliação das migrations do Supabase

> **Documento substituído.** Este texto registra o procedimento usado durante a reconciliação inicial do histórico remoto. Para operações atuais, use [`40-runbooks/migrations.md`](./40-runbooks/migrations.md). Não execute comandos deste documento sem confrontá-los com o runbook vigente e com o estado atual do banco.

## Objetivo histórico

Restabelecer uma sequência de migrations que pudesse ser reproduzida em um banco vazio e reconciliar o histórico remoto sem executar operações destrutivas ou marcar versões como aplicadas sem evidência.

## Situação registrada na época

O histórico remoto estava alinhado até `20260715000039`. As migrations posteriores de comércio, FAQ e operações existiam no repositório, mas parte delas não estava registrada no Supabase remoto.

Também foram identificados:

- arquivos com timestamp inválido;
- timestamp duplicado;
- dependências do checkout em arquivos ignorados pelo CLI;
- migration de FAQ dependente de uma tabela de backup não garantida;
- migrations de reset que excluíam dados transacionais;
- seed comercial incompatível com o limite de 500 unidades adotado naquele momento.

## Regras obrigatórias registradas

1. Não executar `supabase db push` enquanto o `--dry-run` listar migrations históricas não reconciliadas.
2. Não usar `migration repair --status applied` sem verificar os objetos e invariantes correspondentes.
3. Não executar migrations de reset em produção.
4. Registrar contagens transacionais antes e depois de cada etapa.
5. Tratar cada família de migrations separadamente.
6. Fazer backup lógico antes de qualquer alteração de histórico ou schema remoto.

## Ferramentas usadas

### Auditoria local

```powershell
npm run audit:migrations
```

O comando verifica nomes, timestamps duplicados, SQL destrutivo não autorizado e dependências conhecidas.

Saída estruturada:

```powershell
node scripts/validate-supabase-migrations.mjs --json
```

### Auditoria remota

Consulta somente leitura:

```text
supabase/manual/audit_migration_state.sql
```

A consulta foi usada para inspecionar histórico, objetos, contagens, capacidade, FAQ, RLS e extensões.

## Classificação usada na reconciliação

| Classificação | Critério | Ação histórica |
|---|---|---|
| Integralmente presente | Objetos e invariantes existentes | Registrar como aplicada |
| Parcialmente presente | Parte do schema existente | Criar correção aditiva |
| Ausente e segura | SQL aditivo e não destrutivo | Aplicar controladamente |
| Superada | Estado final estabelecido por versão posterior | Registrar sem executar |
| Destrutiva | Risco de excluir ou alterar dados | Retirar do fluxo automático |
| Ambígua | Evidência insuficiente | Interromper e investigar |

## Ordem histórica de reconciliação

1. Fundação comercial.
2. Funções comerciais e RLS.
3. Dependências e RPC do checkout.
4. FAQ estruturado.
5. Relatórios administrativos.
6. Capacidade e resets superados.
7. Automação comercial.
8. Convidados e notificações.
9. Transferências e reembolsos.
10. Check-in e auditoria.
11. Reivindicação de perfil.

## Procedimento histórico por família

### Registrar estado inicial

```powershell
npx supabase migration list --linked
npm run audit:migrations
```

### Comparar objetos

Verificar tabelas, colunas, índices, constraints, funções, triggers, RLS, grants, cron jobs e invariantes.

### Criar correção aditiva

Quando o estado fosse parcial, a orientação era criar migration nova e idempotente, preservando dados e abortando quando não houvesse reconciliação segura.

### Testar

```powershell
npx supabase db reset
npm run build
npm run test:faq
npm run test:e2e
```

Além dos testes SQL relacionados.

### Reparar o histórico

Somente após confirmação dos objetos:

```powershell
npx supabase migration repair <VERSAO> --status applied --linked
```

### Confirmar preservação

Comparar contagens antes e depois e interromper diante de redução não planejada.

## Migrations destrutivas

As migrations de reset comercial não deveriam permanecer no fluxo automático. Limpezas deveriam ser transferidas para scripts manuais protegidos, com confirmação, filtro por evento, contagens e bloqueio para pedidos aprovados.

## Critérios históricos para liberar `db push`

- nenhum arquivo ignorado pelo CLI;
- ausência de timestamps duplicados;
- replay local completo;
- auditor sem erros;
- migrations destrutivas fora do fluxo automático;
- histórico remoto reconciliado;
- `db push --dry-run` contendo apenas mudanças novas;
- testes SQL e funcionais aprovados.

## Referência vigente

Consulte [`40-runbooks/migrations.md`](./40-runbooks/migrations.md) antes de qualquer operação atual.