---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - src/
  - api/
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/
---

# Contratos gerados

## Estado

Esta seção está planejada, mas os artefatos ainda não são gerados automaticamente. Nenhum arquivo futuro listado aqui deve ser tratado como contrato existente até possuir `status: generated`, comando de reprodução e validação em CI.

## Objetivo

Reduzir documentação manual de estruturas que podem ser extraídas do código ou do banco.

## Artefatos planejados

| Arquivo | Fonte | Conteúdo esperado |
|---|---|---|
| `rotas.generated.md` | runtime efetivo após transforms | Rotas públicas, protegidas, administrativas, aliases e mounts independentes. |
| `APIs.generated.md` | `api/` | Métodos, caminhos, autenticação, entradas e respostas das Vercel Functions. |
| `edge-functions.generated.md` | `supabase/functions/` | Funções, métodos, secrets, autenticação e integrações. |
| `RPCs.generated.md` | banco após replay | Assinaturas, retorno, segurança e dependências das RPCs. |
| `banco.generated.md` | introspecção do Postgres | Enums, tabelas, colunas, constraints, índices, views e triggers. |
| `RLS.generated.md` | catálogo do Postgres | Policies, roles, grants e revokes. |
| `variaveis-de-ambiente.generated.md` | busca estática no código | Variáveis, consumidores, exposição e obrigatoriedade. |
| `codigos-de-erro.generated.md` | frontend, functions e SQL | Código, origem, status HTTP e mensagem de interface. |
| `erd.generated.mmd` | relações do banco | Diagrama Mermaid de entidades. |

## Processo esperado

1. Iniciar Supabase local.
2. Reaplicar todas as migrations com `supabase db reset`.
3. Executar os testes SQL.
4. Consultar catálogos do Postgres para schema, RLS e RPCs.
5. Inspecionar o runtime compilado para rotas e transforms.
6. Gerar arquivos de forma determinística.
7. Executar novamente o gerador em CI.
8. Falhar quando houver diff não versionado.

## Regras

- Arquivos gerados não devem ser editados manualmente.
- Cada arquivo deve registrar comando, timestamp, commit e versão das ferramentas.
- A geração não deve depender do ambiente de produção.
- Secrets e valores de credenciais nunca devem aparecer na saída.
- Valores financeiros devem ser descritos como campos e regras, não copiados de dados reais.
- O gerador deve produzir a mesma saída para o mesmo commit e banco reproduzido.

## Primeira prioridade

O primeiro contrato a ser gerado deve ser `banco.generated.md`, acompanhado de tipos TypeScript produzidos pelo Supabase. Isso substitui o snapshot manual e incompleto em `docs/SUPABASE_SCHEMA.md`.
