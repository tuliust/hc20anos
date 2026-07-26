---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: a6fd273c8d7ca863ee672e428d728941559acc4a
source_files:
  - supabase/migrations/
  - supabase/tests/
  - supabase/config.toml
  - scripts/validate-supabase-migrations.mjs
  - scripts/repair-supabase-migration-history.ps1
  - .github/workflows/database-migrations.yml
---

# Migrations do Supabase

## Objetivo

Criar, validar e aplicar alterações de banco de forma reproduzível, preservando histórico e evitando divergência entre ambientes.

## Princípio central

O schema vigente é o resultado do replay integral e ordenado de todos os arquivos em `supabase/migrations/`.

Nenhuma migration isolada, documento manual ou tipo TypeScript substitui esse estado final.

## Regras obrigatórias

- nunca editar, renomear ou excluir migration já aplicada;
- nunca corrigir produção apenas alterando o schema inicial;
- toda correção deve ser uma nova migration aditiva ou explicitamente corretiva;
- toda migration deve possuir nome temporal único e ordenável;
- alterações destrutivas exigem justificativa, estratégia de migração e rollback lógico;
- RLS, grants, triggers e RPCs devem ser testados como contratos de segurança;
- dados financeiros e de auditoria não devem ser descartados durante reparos.

## Pré-condições

- Node.js 22 e npm;
- Docker ativo;
- Supabase CLI disponível por `npx`;
- working tree conhecido;
- impacto funcional e de segurança identificado;
- teste SQL criado ou atualizado quando o comportamento for verificável no banco.

## Auditoria estática

```bash
npm ci
npm run audit:migrations
```

O auditor verifica nomes e padrões SQL considerados perigosos. Qualquer falha deve interromper a entrega.

## Validar plano de reparo do histórico

Em PowerShell:

```powershell
./scripts/repair-supabase-migration-history.ps1
```

O workflow executa o script em modo de planejamento. Não aplique reparo remoto sem revisar integralmente a saída e confirmar o projeto de destino.

## Replay local completo

Inicie a stack:

```bash
npx supabase start
```

Recrie o banco local do zero:

```bash
npx supabase db reset --local
```

Liste o histórico aplicado:

```bash
npx supabase migration list --local
```

Resultado esperado:

- todas as migrations aplicadas em ordem;
- nenhuma migration duplicada ou ausente;
- nenhuma falha SQL;
- schema final compatível com o código e os testes.

## Contexto autenticado de testes

O CI instala as fixtures com:

```bash
docker exec -i supabase_db_hc20anos \
  psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres -P pager=off \
  < supabase/tests/fixtures/local_test_context.sql
```

Esse contexto permite testar policies e RPCs com identidades controladas.

## Executar testes SQL

O workflow executa todos os arquivos `supabase/tests/*.sql` em ordem alfabética e falha quando:

- o SQL retorna erro;
- a saída contém `FAIL`;
- uma fixture necessária não pode ser instalada.

Para uma mudança de banco, o resultado aceitável é ausência de `FAIL` em todos os testes.

## Build de compatibilidade

```bash
npm run build
```

O build deve ocorrer depois do replay para detectar contratos de frontend ou transform incompatíveis.

## Aplicação remota

Este repositório ainda não possui um script npm canônico para aplicar migrations remotas. Até que esse comando seja formalizado e executado em ambiente controlado:

1. confirme o project ref fora de qualquer prompt interativo;
2. compare o histórico remoto com `supabase/migrations/`;
3. aplique somente migrations ainda pendentes usando o procedimento autorizado do projeto;
4. não marque migrations como aplicadas sem evidência de que o SQL correspondente está presente;
5. registre operador, data, ambiente e intervalo de migrations;
6. execute validações funcionais e de segurança imediatamente após a aplicação.

A ausência de um comando remoto validado é uma limitação conhecida deste runbook `draft`.

## Mudanças incompatíveis

Prefira expansão e contração em entregas separadas:

1. adicionar novos campos, tabelas ou RPCs mantendo compatibilidade;
2. publicar backend capaz de ler formatos antigo e novo;
3. migrar consumidores e dados;
4. verificar uso residual;
5. remover estruturas antigas apenas em nova migration.

## Critérios de interrupção

- migration já aplicada foi modificada;
- replay local falha;
- teste SQL retorna `FAIL`;
- RLS ou grant amplia acesso sem justificativa;
- mudança destrutiva não possui estratégia de preservação;
- projeto remoto não está inequivocamente identificado;
- histórico remoto diverge do repositório sem plano de reparo revisado.

## Rollback

Não faça downgrade editando migrations anteriores.

Use uma nova migration para:

- restaurar constraint, policy ou função;
- reintroduzir coluna ou compatibilidade necessária;
- corrigir dados de forma auditável;
- desativar comportamento sem apagar evidências.

Para falha crítica, contenha primeiro o tráfego ou a feature dependente e preserve logs, pedidos, eventos financeiros e trilhas de auditoria.

## Encerrar stack local

```bash
npx supabase stop --no-backup
```

## Estado de validação

O replay e os comandos locais correspondem ao workflow atual. A aplicação remota ainda precisa ser formalizada e executada integralmente; por isso o documento permanece `draft`.