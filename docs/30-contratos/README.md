---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: fe8faad93f8c0f39aefdc7ff11458f1c92ec7b53
source_files:
  - src/
  - api/
  - build/
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/
  - docs/30-contratos/
---

# Contratos técnicos

## Estado

Foram criados inventários humanos para reduzir lacunas imediatas. Eles permanecem `draft` e não substituem os contratos automáticos planejados.

Um arquivo só poderá usar `status: generated` quando possuir comando determinístico, metadados de geração e verificação em CI.

## Inventários atuais

| Documento | Conteúdo | Limitação |
|---|---|---|
| [`rotas.md`](./rotas.md) | rotas públicas, autenticadas, administrativas e aliases | extraído manualmente; precisa observar bundle após transforms |
| [`apis-e-functions.md`](./apis-e-functions.md) | Vercel Functions, Edge Functions e RPCs relacionadas | assinaturas e respostas ainda não são geradas |
| [`variaveis-de-ambiente.md`](./variaveis-de-ambiente.md) | variáveis por runtime e sensibilidade | obrigatoriedade foi inferida do código |
| [`codigos-de-erro.md`](./codigos-de-erro.md) | códigos do frontend, Functions e fluxos financeiros | faltam erros extraídos de todas as RPCs SQL |
| [`permissoes.md`](./permissoes.md) | atores, roles e matriz funcional | precisa ser confrontado com RLS, grants e `security definer` finais |

## Artefatos automáticos ainda necessários

| Arquivo planejado | Fonte | Conteúdo esperado |
|---|---|---|
| `rotas.generated.md` | runtime efetivo após transforms | rotas, aliases, redirects, proteção e mounts independentes |
| `APIs.generated.md` | `api/` | métodos, caminhos, autenticação, entrada e resposta |
| `edge-functions.generated.md` | `supabase/functions/` | métodos, secrets, autenticação, RPCs e integrações |
| `RPCs.generated.md` | banco após replay | assinaturas, retorno, segurança e dependências |
| `banco.generated.md` | introspecção do Postgres | enums, tabelas, colunas, constraints, índices, views e triggers |
| `RLS.generated.md` | catálogos do Postgres | policies, roles, grants e revokes |
| `variaveis-de-ambiente.generated.md` | análise estática | variáveis, consumidores, defaults e exposição |
| `codigos-de-erro.generated.md` | TypeScript, Functions e SQL | código, origem, HTTP e mensagem de interface |
| `erd.generated.mmd` | relações do banco | diagrama Mermaid de entidades |

## Processo esperado

1. Iniciar o Supabase local.
2. Reaplicar todas as migrations com `supabase db reset`.
3. Executar todos os testes SQL.
4. Consultar catálogos do Postgres.
5. Gerar tipos TypeScript com a CLI do Supabase.
6. Compilar o frontend com transforms.
7. Extrair rotas do resultado efetivo.
8. Analisar `api/` e `supabase/functions/`.
9. Gerar arquivos de forma determinística.
10. Executar novamente em CI e falhar quando houver diff.

## Regras

- Arquivos gerados não devem ser editados manualmente.
- Cada saída deve registrar comando, commit, timestamp e versão das ferramentas.
- A geração não deve depender do banco de produção.
- Secrets e valores reais nunca devem aparecer.
- Dados pessoais e financeiros reais não entram nos artefatos.
- A mesma entrada deve produzir a mesma saída.
- Inventários manuais devem apontar claramente que são `draft`.

## Prioridade

1. `banco.generated.md`;
2. tipos TypeScript do Supabase;
3. `RPCs.generated.md` e `RLS.generated.md`;
4. `rotas.generated.md`;
5. APIs, Edge Functions, variáveis e erros;
6. ERD.

A geração do banco substitui o snapshot incompleto em `docs/SUPABASE_SCHEMA.md` e desbloqueia a validação final de permissões, estados e relacionamentos.
