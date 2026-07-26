---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: d730cf0fd1891c5670b24d493090ec0789d7e073
source_files:
  - src/
  - api/
  - build/
  - scripts/generate-static-contracts.mjs
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/
  - docs/30-contratos/
  - .github/workflows/static-contracts.yml
---

# Contratos técnicos

## Estado

A seção possui três níveis de maturidade:

1. inventários humanos em `draft`, usados para interpretação imediata;
2. geração estática implementada para APIs, Edge Functions, variáveis e códigos de erro;
3. contratos de banco ainda pendentes de replay e introspecção do Postgres.

O índice é `canonical`, mas cada artefato mantém seu próprio status e autoridade.

## Inventários humanos atuais

| Documento | Conteúdo | Limitação |
|---|---|---|
| [`rotas.md`](./rotas.md) | rotas públicas, autenticadas, administrativas e aliases | extraído manualmente; precisa observar bundle após transforms |
| [`apis-e-functions.md`](./apis-e-functions.md) | Vercel Functions, Edge Functions e RPCs relacionadas | assinaturas e respostas ainda não são geradas integralmente |
| [`variaveis-de-ambiente.md`](./variaveis-de-ambiente.md) | variáveis por runtime e sensibilidade | obrigatoriedade inferida do código |
| [`codigos-de-erro.md`](./codigos-de-erro.md) | códigos do frontend, Functions e fluxos financeiros | faltam erros SQL e mensagens dinâmicas |
| [`permissoes.md`](./permissoes.md) | atores, roles e matriz funcional | precisa ser confrontado com RLS, grants e `security definer` finais |

## Geração estática implementada

O gerador está em `scripts/generate-static-contracts.mjs`.

Comandos:

```bash
npm run docs:generate-contracts
npm run docs:check-contracts
```

Procedimento completo: [`geracao-estatica.md`](./geracao-estatica.md).

### Saídas

| Arquivo | Fonte | Estado do processo |
|---|---|---|
| `APIs.generated.md` | `api/` | gerador implementado; baseline versionado ainda pendente |
| `edge-functions.generated.md` | `supabase/functions/` | gerador implementado; baseline versionado ainda pendente |
| `variaveis-de-ambiente.generated.md` | análise estática de código | gerador implementado; baseline versionado ainda pendente |
| `codigos-de-erro.generated.md` | literais em JavaScript e TypeScript | gerador implementado; baseline versionado ainda pendente |

O workflow `.github/workflows/static-contracts.yml` executa a geração, audita os arquivos e publica as quatro saídas como artefato. Ele usa permissões somente de leitura e não faz commits automáticos em `main`.

Depois da revisão da primeira saída, os arquivos devem ser versionados e `npm run docs:check-contracts` poderá se tornar um check bloqueante.

## Contratos ainda dependentes do banco

| Arquivo planejado | Fonte | Conteúdo esperado |
|---|---|---|
| `banco.generated.md` | introspecção após replay | enums, tabelas, colunas, constraints, índices, views e triggers |
| `RPCs.generated.md` | catálogos do Postgres | assinaturas, parâmetros, retorno, segurança e dependências |
| `RLS.generated.md` | catálogos do Postgres | policies, roles, grants, revokes e funções auxiliares |
| tipos Supabase | CLI contra banco reproduzido | tipos TypeScript completos e atualizados |
| `erd.generated.mmd` | relações e constraints | diagrama Mermaid de entidades |

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

## Processo para contratos do banco

1. Iniciar Supabase local.
2. Reaplicar todas as migrations com `supabase db reset --local`.
3. Executar todos os testes SQL.
4. Consultar catálogos do Postgres.
5. Gerar tipos TypeScript com a CLI do Supabase.
6. Gerar schema, RPCs, RLS e ERD de forma determinística.
7. Executar novamente no CI.
8. Falhar quando houver diff não versionado.

## Regras

- Arquivos `generated` não devem ser editados manualmente.
- Cada saída deve registrar comando, commit e data da fonte.
- A geração não pode depender do banco de produção.
- Secrets e valores reais nunca devem aparecer.
- Dados pessoais e financeiros reais não entram nos artefatos.
- A mesma entrada deve produzir a mesma saída.
- Inventários humanos continuam `draft` até serem substituídos.
- Contratos estáticos não substituem introspecção de banco ou testes de integração.

## Prioridades restantes

1. revisar o artefato da primeira execução do workflow;
2. versionar a baseline dos quatro contratos estáticos;
3. ativar `npm run docs:check-contracts` como check bloqueante;
4. reproduzir o banco;
5. gerar schema, RPCs, RLS, tipos e ERD;
6. gerar rotas efetivas depois dos transforms.

A geração do banco substituirá definitivamente o snapshot incompleto em `docs/SUPABASE_SCHEMA.md`.