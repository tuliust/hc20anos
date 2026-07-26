---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 23666f0bebd43acc0ee4b2ffabbe210bc6e3056b
source_files:
  - src/
  - api/
  - build/
  - scripts/generate-static-contracts.mjs
  - scripts/generate-routes-contract.mjs
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

As categorias técnicas planejadas possuem baselines versionadas com `status: generated`:

- rotas efetivas;
- Vercel Functions;
- Supabase Edge Functions;
- variáveis de ambiente;
- códigos de erro literais;
- schema do banco;
- RPCs e funções públicas;
- RLS, policies e grants;
- tipos TypeScript do Supabase;
- ERD.

Os arquivos gerados têm precedência sobre inventários humanos para estruturas verificáveis. Documentos manuais continuam úteis para explicar intenção, semântica, responsabilidades e limitações que não podem ser inferidas automaticamente.

## Baselines geradas

### Runtime e Functions

| Contrato | Arquivo | Fonte principal | Comando |
|---|---|---|---|
| Rotas efetivas | [`rotas.generated.md`](./rotas.generated.md) | `App.tsx` transformado, `main.tsx` e Vercel | `npm run docs:generate-routes` |
| Vercel Functions | [`APIs.generated.md`](./APIs.generated.md) | `api/` | `npm run docs:generate-contracts` |
| Edge Functions | [`edge-functions.generated.md`](./edge-functions.generated.md) | `supabase/functions/` | `npm run docs:generate-contracts` |
| Variáveis | [`variaveis-de-ambiente.generated.md`](./variaveis-de-ambiente.generated.md) | análise estática do repositório | `npm run docs:generate-contracts` |
| Erros literais | [`codigos-de-erro.generated.md`](./codigos-de-erro.generated.md) | JavaScript e TypeScript | `npm run docs:generate-contracts` |

Procedimentos:

- [`geracao-estatica.md`](./geracao-estatica.md);
- [`geracao-de-rotas.md`](./geracao-de-rotas.md).

### Banco reproduzido

| Contrato | Arquivo | Conteúdo | Comando |
|---|---|---|---|
| Schema final | [`banco.generated.md`](./banco.generated.md) | enums, tabelas, colunas, constraints, índices, views e triggers | `npm run docs:generate-db-contracts` |
| RPCs | [`RPCs.generated.md`](./RPCs.generated.md) | argumentos, retorno, volatilidade, `security definer` e ACL | `npm run docs:generate-db-contracts` |
| Segurança | [`RLS.generated.md`](./RLS.generated.md) | estado de RLS, policies e grants | `npm run docs:generate-db-contracts` |
| Tipos | [`database.types.generated.ts`](./database.types.generated.ts) | tipos TypeScript gerados pela Supabase CLI | `npm run docs:generate-db-contracts` |
| ERD | [`erd.generated.mmd`](./erd.generated.mmd) | entidades, colunas e chaves estrangeiras | `npm run docs:generate-db-contracts` |

Procedimento: [`geracao-do-banco.md`](./geracao-do-banco.md).

## Evidência de geração

### Contratos estáticos e rotas

A baseline vigente foi publicada pelo GitHub Actions no commit:

```text
9c6eba3bd05a16511bd8160b3e0d621c34f9918e
```

Antes da publicação, o workflow:

1. gerou os contratos estáticos;
2. aplicou o transform real de pedidos;
3. gerou o contrato de rotas;
4. executou a auditoria documental;
5. detectou arquivos novos e modificados;
6. publicou apenas a lista explícita de contratos.

### Banco

A baseline vigente foi publicada pelo GitHub Actions no commit:

```text
2e90f45cb57c001ba5510d9918345b763578b265
```

Antes da publicação, o workflow:

1. auditou as migrations;
2. executou o build;
3. iniciou uma stack Supabase local;
4. reaplicou todas as migrations em banco vazio;
5. instalou a fixture autenticada de teste;
6. executou todos os testes SQL;
7. consultou os catálogos do Postgres local;
8. gerou schema, RPCs, RLS, tipos e ERD;
9. executou a auditoria documental.

Nenhum gerador consulta o banco de produção.

## Verificação de drift

### Runtime e Functions

```bash
npm run docs:check-contracts
npm run docs:check-routes
```

O workflow `Static contract generation` falha em pull requests quando as saídas esperadas diferem da baseline versionada.

### Banco

```bash
npm run docs:check-db-contracts
```

O workflow `Database migration safety` gera os contratos somente depois do replay e dos testes. Em pull requests, qualquer diferença não versionada falha o check.

## Inventários humanos complementares

| Documento | Estado | Uso permitido |
|---|---|---|
| [`rotas.md`](./rotas.md) | `deprecated` | redirect documental para a baseline gerada |
| [`apis-e-functions.md`](./apis-e-functions.md) | `draft` | responsabilidades, exemplos de payload e integrações |
| [`variaveis-de-ambiente.md`](./variaveis-de-ambiente.md) | `draft` | obrigatoriedade, sensibilidade e configuração operacional |
| [`codigos-de-erro.md`](./codigos-de-erro.md) | `draft` | semântica de interface e fluxos que não são literais |
| [`permissoes.md`](./permissoes.md) | `draft` | matriz funcional de atores e papéis |

Esses documentos não podem contradizer as baselines geradas. Quando houver divergência estrutural, prevalece o arquivo `generated` produzido pelo código ou banco reproduzido.

## Limites dos contratos

- análise estática não compreende integralmente autenticação encapsulada;
- códigos de erro dinâmicos ou retornados por providers podem não aparecer;
- o contrato de rotas não executa navegação E2E de cada caminho;
- o ERD mostra relações estruturais, não regras condicionais internas às RPCs;
- grants representam o estado final e não a sequência histórica de `GRANT` e `REVOKE`;
- tipos gerados ainda precisam de revisão de compatibilidade antes de substituir o arquivo usado pela aplicação;
- a existência de rota, tabela ou função não comprova autorização funcional adequada.

## Regras

- não editar arquivos `generated` manualmente;
- corrigir a fonte ou o gerador e regenerar;
- nunca incluir secrets, tokens ou dados pessoais reais;
- manter comandos e workflows reproduzíveis;
- revisar diffs gerados como mudança de contrato;
- atualizar documentação de domínio quando uma alteração estrutural mudar regra de negócio;
- registrar ADR quando a mudança alterar arquitetura, autoridade ou estratégia de compatibilidade.

## Pendências restantes

1. comparar `database.types.generated.ts` com `src/lib/database.types.ts` e definir migração segura;
2. aprofundar contratos de payload e resposta que não podem ser inferidos estaticamente;
3. revisar alertas de segurança revelados por RLS, grants ou funções `security definer`;
4. depreciar outros inventários manuais somente quando o conteúdo explicativo tiver substituto;
5. manter os checks de drift obrigatórios em futuras mudanças estruturais.

O snapshot manual `docs/SUPABASE_SCHEMA.md` permanece depreciado e não deve voltar a ser usado como representação do banco vigente.
