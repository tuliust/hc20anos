---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: a6fd273c8d7ca863ee672e428d728941559acc4a
source_files:
  - package.json
  - README.md
  - src/lib/supabase.ts
  - supabase/config.toml
  - .github/workflows/database-migrations.yml
---

# Desenvolvimento local

## Objetivo

Preparar um ambiente reproduzível para executar o frontend, validar o build e, quando necessário, reproduzir o banco Supabase localmente.

## Quando executar

- primeira configuração do repositório;
- atualização de dependências;
- alteração de frontend, Vercel Functions, migrations ou Edge Functions;
- investigação de divergência entre ambiente local e produção.

## Pré-requisitos

- Node.js 22, versão usada no CI;
- npm;
- Docker ativo para a stack Supabase local;
- Supabase CLI disponível por `npx`;
- acesso apenas às variáveis públicas necessárias ao frontend.

## Instalação

```bash
npm ci
```

Resultado esperado: dependências instaladas sem alteração manual do `package-lock.json`.

## Variáveis do frontend

Crie `.env.local`, que não deve ser versionado:

```bash
VITE_SUPABASE_URL=<url-do-projeto>
VITE_SUPABASE_ANON_KEY=<chave-anon>
VITE_DEV_MODE=false
```

Use `VITE_DEV_MODE=true` somente quando a execução com fallbacks e mocks for intencional. Para validar integração real, mantenha `false`.

Nunca use prefixo `VITE_` em service role, tokens do Mercado Pago, OpenAI, Resend ou WhatsApp.

## Executar o frontend

```bash
npm run dev
```

Valide:

1. carregamento sem erro fatal no console;
2. CSS do Tailwind aplicado;
3. autenticação Supabase inicializada;
4. rotas públicas carregando após atualização direta do navegador;
5. ausência de secrets no bundle ou nas requisições do navegador.

## Validar o build

```bash
npm run build
```

O comando executa o build Vite e as verificações do bundle de reivindicação de perfil e da API de mini bio.

O aviso de chunk acima de 500 kB é conhecido, mas qualquer erro de build ou verificação deve interromper a entrega.

## Testes disponíveis

```bash
npm run test:faq
npm run test:e2e
npm run audit:migrations
npm run audit:cms-strict
npm run audit:bundle
```

Para os testes E2E, instale o Chromium do Playwright quando necessário:

```bash
npx playwright install --with-deps chromium
```

## Supabase local

Inicie a stack:

```bash
npx supabase start
```

Reaplique todas as migrations em banco vazio:

```bash
npx supabase db reset --local
```

Confira o histórico local:

```bash
npx supabase migration list --local
```

O estado esperado do banco é o resultado do replay integral de `supabase/migrations/`.

## Testes SQL

O workflow oficial instala o contexto autenticado de teste e executa todos os arquivos `supabase/tests/*.sql` em ordem alfabética. Para alterações de banco, use o workflow como referência de execução e exija que nenhum teste produza `FAIL`.

## Encerrar a stack local

```bash
npx supabase stop --no-backup
```

## Critérios de interrupção

Interrompa a validação quando:

- `npm ci` alterar inesperadamente o lockfile;
- houver migration duplicada, destrutiva ou fora de ordem;
- o build falhar;
- secrets aparecerem no frontend;
- a stack local não conseguir reproduzir todas as migrations;
- qualquer teste SQL produzir `FAIL`.

## Evidências recomendadas

- versão do Node e npm;
- resultado de `npm run build`;
- lista de migrations locais;
- nomes dos testes executados;
- captura do erro sem payloads pessoais ou credenciais.

## Estado de validação

Este runbook foi conferido contra scripts e workflow, mas ainda não foi executado integralmente nesta revisão. Permanece `draft` até uma execução controlada confirmar todos os passos.