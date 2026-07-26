---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 85560128df6aa6de8f46aa4a2150d339cef2a5e6
source_files:
  - src/
  - api/
  - build/
  - scripts/generate-static-contracts.mjs
  - scripts/generate-database-contracts.mjs
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/
  - docs/30-contratos/
  - .github/workflows/static-contracts.yml
  - .github/workflows/database-migrations.yml
---

# Contratos técnicos

## Estado

A seção possui quatro níveis de maturidade:

1. inventários humanos em `draft`, usados para interpretação imediata;
2. geração estática implementada para APIs, Edge Functions, variáveis e códigos de erro;
3. geração do Postgres implementada para schema, RPCs, RLS, tipos e ERD;
4. baselines `generated` ainda condicionadas à execução bem-sucedida dos workflows.

O índice é `canonical`, mas cada artefato mantém seu próprio status e autoridade.

## Inventários humanos atuais

| Documento | Conteúdo | Limitação |
|---|---|---|
| [`rotas.md`](./rotas.md) | rotas públicas, autenticadas, administrativas e aliases | extraído manualmente; precisa observar bundle após transforms |
| [`apis-e-functions.md`](./apis-e-functions.md) | Vercel Functions, Edge Functions e RPCs relacionadas | assinaturas e respostas ainda não são geradas integralmente |
| [`variaveis-de-ambiente.md`](./variaveis-de-ambiente.md) | variáveis por runtime e sensibilidade | obrigatoriedade inferida do código |
| [`codigos-de-erro.md`](./codigos-de-erro.md) | códigos do frontend, Functions e fluxos financeiros | faltam erros SQL e mensagens dinâmicas |
| [`permissoes.md`](./permissoes.md) | atores, roles e matriz funcional | precisa ser confrontado com RLS, grants e `security definer` finais |

## Geração estática

O gerador está em `scripts/generate-static-contracts.mjs`.

```bash
npm run docs:generate-contracts
npm run docs:check-contracts
```

Procedimento: [`geracao-estatica.md`](./geracao-estatica.md).

### Saídas estáticas

| Arquivo | Fonte | Situação |
|---|---|---|
| `APIs.generated.md` | `api/` | gerador e publicação automática implementados; baseline depende da execução do workflow |
| `edge-functions.generated.md` | `supabase/functions/` | gerador e publicação automática implementados; baseline depende da execução do workflow |
| `variaveis-de-ambiente.generated.md` | análise estática | gerador e publicação automática implementados; baseline depende da execução do workflow |
| `codigos-de-erro.generated.md` | literais em JavaScript e TypeScript | gerador e publicação automática implementados; baseline depende da execução do workflow |

O workflow `.github/workflows/static-contracts.yml`:

- gera e audita os quatro contratos;
- detecta arquivos novos e modificados com `git status --porcelain`;
- exige baseline atualizada em pull requests;
- publica os arquivos em `main` quando executado por push;
- envia a saída como artefato por 14 dias.

## Geração do banco

O gerador está em `scripts/generate-database-contracts.mjs`.

```bash
npm run docs:generate-db-contracts
npm run docs:check-db-contracts
```

Procedimento: [`geracao-do-banco.md`](./geracao-do-banco.md).

### Saídas do banco

| Arquivo | Fonte | Conteúdo |
|---|---|---|
| `banco.generated.md` | Postgres local após replay | enums, tabelas, colunas, constraints, índices, views e triggers |
| `RPCs.generated.md` | `pg_proc` e catálogos relacionados | argumentos, retorno, volatilidade, `security definer` e ACL |
| `RLS.generated.md` | `pg_class`, `pg_policies` e `information_schema` | estado de RLS, policies e grants de tabelas e rotinas |
| `database.types.generated.ts` | Supabase CLI contra banco local | tipos TypeScript reproduzíveis |
| `erd.generated.mmd` | chaves estrangeiras e colunas | diagrama Mermaid de entidades |

O workflow `.github/workflows/database-migrations.yml` executa a geração somente depois de:

1. auditoria estática das migrations;
2. build da aplicação;
3. inicialização do Supabase local;
4. replay integral em banco vazio;
5. instalação da fixture de teste;
6. aprovação dos testes SQL.

Em pull requests, o workflow falha quando os contratos estão desatualizados. Em pushes para `main`, publica a baseline e também envia contratos e logs como artefato.

## Rotas efetivas

`rotas.generated.md` continua pendente. A extração deve considerar:

- `App.tsx`;
- composição em `src/main.tsx`;
- mounts independentes;
- enhancements;
- transforms registrados no Vite;
- aliases e History API;
- resultado compilado.

Uma busca simples por strings no código não é suficiente para promover esse contrato a `generated`.

## Regras

- Arquivos `generated` não devem ser editados manualmente.
- Cada saída deve registrar comando, commit e data da fonte.
- A geração não pode depender do banco de produção.
- Secrets e valores reais nunca devem aparecer.
- Dados pessoais e financeiros reais não entram nos artefatos.
- A mesma entrada deve produzir a mesma saída.
- Inventários humanos continuam `draft` até serem substituídos.
- Contratos estáticos não substituem introspecção de banco ou testes de integração.
- Contratos do banco só têm autoridade quando replay e testes SQL estão aprovados.

## Pendências restantes

1. confirmar a primeira execução dos workflows em `main`;
2. revisar as baselines publicadas;
3. confirmar `docs:check-contracts` e `docs:check-db-contracts` sem drift;
4. gerar `rotas.generated.md` a partir do runtime compilado;
5. substituir os tipos usados pela aplicação somente após revisão de compatibilidade;
6. promover inventários humanos substituídos para `deprecated`.

A geração do banco substituirá definitivamente o snapshot incompleto em `docs/SUPABASE_SCHEMA.md` quando a primeira baseline for publicada e validada.
