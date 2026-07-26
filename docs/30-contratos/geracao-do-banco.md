---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 2aa87edf5eed0d50e93d0af4a1b62a5f1e94e80e
source_files:
  - scripts/generate-database-contracts.mjs
  - .github/workflows/database-migrations.yml
  - supabase/config.toml
  - supabase/migrations/
  - supabase/tests/
  - package.json
---

# Geração dos contratos do banco

## Objetivo

Gerar documentação verificável do Postgres a partir de uma instância Supabase local reconstruída por todas as migrations do repositório.

O processo não consulta produção, não copia registros reais e não usa o snapshot manual depreciado em `docs/SUPABASE_SCHEMA.md`.

## Pré-condições

- Node.js 22;
- Docker disponível;
- dependências instaladas com `npm ci`;
- Supabase CLI disponível pelas dependências do projeto;
- stack local iniciada;
- replay integral concluído com `npx supabase db reset --local`;
- testes SQL aprovados;
- container local do Postgres identificado como `supabase_db_hc20anos`.

O nome do container pode ser substituído pela variável `SUPABASE_DB_CONTAINER` quando necessário.

## Comandos

Gerar ou atualizar os contratos:

```bash
npm run docs:generate-db-contracts
```

Verificar se os arquivos versionados correspondem ao banco reproduzido:

```bash
npm run docs:check-db-contracts
```

O modo `--check` não altera arquivos. Ele retorna erro quando uma saída está ausente ou diferente do conteúdo esperado.

## Sequência local completa

```bash
npm ci
npx supabase start
npx supabase db reset --local
npm run docs:generate-db-contracts
npm run audit:docs
npx supabase stop --no-backup
```

Antes de promover uma saída, também devem ser executados os testes SQL de `supabase/tests/` conforme o runbook de migrations.

## Saídas

| Arquivo | Conteúdo |
|---|---|
| `banco.generated.md` | enums, tabelas, colunas, constraints, índices, views e triggers do schema `public`; |
| `RPCs.generated.md` | funções do schema `public`, argumentos, retorno, volatilidade, `security definer` e ACL; |
| `RLS.generated.md` | estado de RLS, policies e grants de tabelas e rotinas; |
| `erd.generated.mmd` | entidades, colunas e relacionamentos de chave estrangeira em Mermaid; |
| `database.types.generated.ts` | tipos TypeScript produzidos pela Supabase CLI contra o banco local. |

Os arquivos são determinísticos para o mesmo conjunto de migrations, configuração e versão do gerador.

## Fontes consultadas

O gerador consulta somente:

- catálogos do Postgres local;
- `information_schema`;
- `pg_catalog`;
- Supabase CLI local para geração de tipos;
- histórico Git dos arquivos-fonte para metadados.

Não são lidos:

- dados de produção;
- secrets remotos;
- tokens de provedores;
- arquivos `.env`;
- payloads financeiros reais.

## Informações extraídas

### Banco

- enums e valores ordenados;
- tabelas e colunas;
- tipos, nullability e defaults;
- chaves primárias, estrangeiras, uniques e checks;
- índices;
- views e materialized views;
- triggers não internos.

### Funções e RPCs

- nome e schema;
- argumentos de identidade;
- tipo de retorno;
- volatilidade;
- uso de `security definer`;
- ACL registrada no catálogo.

A presença de uma função no contrato não significa que ela esteja exposta ao público. A autorização efetiva depende de grants, RLS e validações internas.

### Segurança

- RLS habilitada ou forçada por tabela;
- nome, modo, roles, comando, `USING` e `WITH CHECK` de cada policy;
- grants de tabelas;
- grants de rotinas.

Revokes são representados pelo estado final dos grants. O contrato não tenta reconstruir a sequência histórica de comandos executados pelas migrations.

## ERD

O diagrama Mermaid usa as chaves estrangeiras registradas no banco reproduzido.

Ele representa relacionamentos estruturais, não regras de negócio, cardinalidades condicionais ou dependências implementadas apenas dentro de funções.

## Workflow

O workflow `.github/workflows/database-migrations.yml` executa, nesta ordem:

1. auditoria estática das migrations;
2. build da aplicação;
3. inicialização do Supabase local;
4. replay integral em banco vazio;
5. instalação da fixture autenticada de teste;
6. testes SQL;
7. geração dos contratos;
8. auditoria documental;
9. verificação de drift em pull requests;
10. publicação dos arquivos em `main` quando a execução é disparada por push;
11. upload dos contratos e logs como artefato.

Nenhum contrato é publicado quando o replay ou os testes falham.

## Critérios de interrupção

Interromper o processo quando:

- uma migration não puder ser reaplicada;
- um teste SQL retornar erro ou `FAIL`;
- o container esperado não estiver disponível;
- uma consulta de catálogo falhar;
- os tipos Supabase não puderem ser gerados;
- a auditoria documental detectar arquivo inválido;
- surgir dado real ou secret em uma saída.

## Limitações

- somente objetos do schema `public` são documentados;
- extensões e schemas internos do Supabase não entram no contrato;
- dependências internas entre funções ainda não são analisadas semanticamente;
- políticas e ACLs refletem o estado final, não a ordem histórica das migrations;
- o ERD não substitui documentação funcional de cada domínio;
- alterações de versão da CLI ou do Postgres podem mudar a formatação sem alterar a semântica.

## Promoção e autoridade

Os arquivos gerados possuem precedência sobre inventários humanos quando:

- o replay concluiu com sucesso;
- todos os testes SQL foram aprovados;
- a geração foi executada pelo commit correspondente;
- o CI não detecta drift;
- nenhuma saída contém dados indevidos.

O snapshot `docs/SUPABASE_SCHEMA.md` permanece apenas para rastreabilidade histórica.
