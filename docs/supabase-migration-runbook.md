# Runbook de reconciliação das migrations do Supabase

## Objetivo

Restabelecer uma sequência de migrations que possa ser reproduzida em um banco vazio e reconciliar o histórico remoto sem executar operações destrutivas ou marcar versões como aplicadas sem evidência.

## Situação conhecida

O histórico remoto está alinhado até `20260715000039`. As migrations posteriores de comércio, FAQ e operações existem no repositório, mas parte delas não está registrada no Supabase remoto.

Também foram identificados:

- arquivos com timestamp inválido;
- timestamp duplicado;
- dependências do checkout em arquivos ignorados pelo CLI;
- migration de FAQ dependente de uma tabela de backup não garantida;
- migrations de reset que excluem dados transacionais;
- seed comercial incompatível com o limite atual de 500 unidades.

## Regras obrigatórias

1. Não executar `supabase db push` enquanto o `--dry-run` listar migrations históricas não reconciliadas.
2. Não usar `migration repair --status applied` sem verificar os objetos e invariantes correspondentes.
3. Não executar migrations de reset em produção.
4. Registrar as contagens de pedidos, ingressos, pagamentos, participantes e notificações antes e depois de cada etapa.
5. Tratar cada família de migrations separadamente.
6. Fazer backup lógico antes de qualquer alteração de histórico ou schema remoto.

## Ferramentas adicionadas

### Auditoria local

```powershell
npm run audit:migrations
```

O comando verifica:

- padrão `<14 dígitos>_<nome_em_snake_case>.sql`;
- timestamps duplicados;
- SQL destrutivo não autorizado;
- UUID fixo do evento de demonstração;
- referência a tabela de backup sem criação rastreada.

Enquanto houver erros conhecidos, o comando deve terminar com código diferente de zero. Isso é esperado durante a fase de correção.

Para saída estruturada:

```powershell
node scripts/validate-supabase-migrations.mjs --json
```

### Auditoria remota

Executar no SQL Editor do Supabase:

```text
supabase/manual/audit_migration_state.sql
```

A consulta é somente leitura e retorna:

- histórico remoto;
- matriz de objetos por versão;
- eventos e datas configuradas;
- contagens transacionais;
- capacidade dos produtos e lotes;
- integridade do FAQ;
- políticas RLS;
- extensões e disponibilidade do catálogo do `pg_cron`.

## Classificação das migrations

Cada versão deve receber uma das classificações abaixo:

| Classificação | Critério | Ação |
| --- | --- | --- |
| Integralmente presente | Todos os objetos e invariantes existem | Registrar como aplicada |
| Parcialmente presente | Parte do schema existe | Criar migration corretiva e testar |
| Ausente e segura | SQL é aditivo e não destrutivo | Aplicar de forma controlada |
| Superada | Estado final já foi estabelecido por versões posteriores | Registrar como aplicada sem executar |
| Destrutiva | Pode excluir ou alterar dados de negócio | Retirar do fluxo automático |
| Ambígua | Não há evidência suficiente | Interromper e investigar |

## Ordem de reconciliação

1. Fundação comercial.
2. Funções comerciais e RLS.
3. Dependências e RPC do checkout.
4. FAQ estruturado e consolidação.
5. Relatórios administrativos.
6. Capacidade e resets superados.
7. Automação comercial.
8. Convidados externos e notificações.
9. Transferências e reembolsos.
10. Check-in, relatórios e auditoria de segurança.
11. Reivindicação de perfil.

## Procedimento por família

### 1. Registrar estado inicial

```powershell
npx supabase migration list --linked
npm run audit:migrations
```

Executar a auditoria remota e salvar os resultados.

### 2. Comparar objetos

Verificar:

- tabelas e colunas;
- índices e constraints;
- funções e assinaturas;
- triggers;
- políticas RLS;
- grants;
- cron jobs;
- invariantes de dados.

### 3. Criar correção aditiva

Quando o estado for parcial, criar uma migration nova e idempotente. Não modificar o banco remoto diretamente para esconder divergências.

A migration corretiva deve:

- criar somente objetos ausentes;
- substituir funções pela versão final;
- reconstruir grants e políticas;
- preservar dados;
- validar o estado ao final;
- abortar quando não houver forma segura de reconciliar.

### 4. Testar

Executar:

```powershell
npx supabase db reset
npm run build
npm run test:faq
npm run test:e2e
```

Executar também os testes SQL relacionados à família.

### 5. Reparar o histórico

Somente depois da confirmação:

```powershell
npx supabase migration repair <VERSAO> --status applied --linked
```

Repetir de forma granular. Evitar reparar várias famílias em um único comando.

### 6. Confirmar preservação de dados

Comparar as contagens transacionais antes e depois. Qualquer redução não planejada interrompe o processo.

## Migrations destrutivas

As migrations de reset comercial não devem permanecer executáveis automaticamente. A lógica de limpeza deverá ser transferida para `supabase/manual/reset_commerce_data.sql` com:

- confirmação explícita;
- filtro obrigatório por evento;
- contagens antes da exclusão;
- bloqueio quando houver pedidos aprovados;
- registro da operação em auditoria.

## Critérios para liberar `db push`

O uso normal de `npx supabase db push` só será retomado quando:

- nenhum arquivo for ignorado pelo CLI;
- não houver timestamps duplicados;
- o replay local concluir do zero;
- o auditor local não retornar erros;
- as migrations destrutivas estiverem fora do fluxo automático;
- `migration list --linked` estiver reconciliado;
- `db push --dry-run` listar apenas migrations novas e intencionais;
- os testes SQL e funcionais estiverem aprovados.
