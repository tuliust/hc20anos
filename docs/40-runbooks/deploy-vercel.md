---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: a6fd273c8d7ca863ee672e428d728941559acc4a
source_files:
  - package.json
  - vercel.json
  - api/
  - vite.config.ts
  - docs/DEPLOYMENT.md
---

# Deploy Vercel

## Objetivo

Publicar o frontend Vite e as Vercel Functions de `api/`, validar o deployment e definir critérios de rollback.

## Escopo

A Vercel hospeda:

- o frontend React/Vite;
- as funções server-side em `api/`;
- o rewrite de SPA definido em `vercel.json`.

Edge Functions, migrations e secrets do Supabase não são publicados por este processo.

## Gatilho atual

A branch de produção é `main`. Commits diretos em `main` podem iniciar deployment de produção automaticamente, conforme a configuração do projeto Vercel.

Como esse fluxo pode não passar por preview, cada commit direto deve ser pequeno, reversível e validado imediatamente após a publicação.

## Pré-condições

- `main` contém somente alterações intencionais;
- dependências instaladas com `npm ci`;
- build local aprovado;
- variáveis necessárias configuradas no ambiente correto da Vercel;
- nenhum secret exposto com prefixo `VITE_`.

## Variáveis públicas

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_DEV_MODE=false
```

## Variáveis server-side da mini bio por IA

Configure uma das alternativas:

1. `OPENAI_API_KEY`;
2. `AI_GATEWAY_API_KEY`;
3. `VERCEL_OIDC_TOKEN`, quando disponibilizado automaticamente pela Vercel.

Opcional:

```text
OPENAI_PROFILE_MODEL
```

O modelo padrão no código é `gpt-5-mini`.

## Validação anterior ao commit

```bash
npm ci
npm run build
```

Quando o escopo afetar os fluxos correspondentes, execute também:

```bash
npm run test:faq
npm run audit:cms-strict
npm run audit:bundle
npm run test:e2e
```

## Publicação

1. confirme que o commit está em `main`;
2. acompanhe o deployment associado ao commit no painel da Vercel;
3. não considere a publicação concluída apenas porque o GitHub aceitou o commit;
4. aguarde o status final do deployment;
5. registre o commit publicado e o ambiente.

## Validação pós-deploy

### Infraestrutura

- deployment em estado `Ready` ou equivalente;
- domínio principal respondendo por HTTPS;
- rotas internas carregando após refresh direto;
- `/api/generate-profile-bio` sem exposição de credenciais;
- `/api/checkout-create` respondendo apenas a `POST` e exigindo autenticação.

### Smoke test público

- home;
- evento;
- ingressos;
- quem vai;
- história e memórias;
- termos e privacidade.

### Smoke test autenticado

- login;
- área do ex-aluno;
- edição de perfil;
- área do comprador;
- checkout em ambiente de teste, quando aplicável.

### Responsividade mínima

- 375 px;
- 390 px;
- 768 px;
- 1440 px.

## Critérios de interrupção

Interrompa e inicie rollback quando houver:

- página em branco ou erro fatal de JavaScript;
- CSS ausente;
- falha generalizada de autenticação;
- rota pública retornando conteúdo incorreto após refresh;
- função `api/` retornando erro de configuração;
- segredo presente no bundle, HTML ou resposta pública;
- checkout apontando para ambiente financeiro incorreto.

## Rollback

Preferência:

1. promover novamente o último deployment estável no painel da Vercel; ou
2. reverter o commit causador em `main` e aguardar novo deployment.

Não altere migrations nem Edge Functions para corrigir problema exclusivo do frontend.

## Evidências recomendadas

- SHA do commit;
- URL e identificador do deployment;
- status final;
- rotas verificadas;
- horário da validação;
- responsável;
- erros sem tokens, dados pessoais ou payloads financeiros completos.

## Estado de validação

Este runbook foi conferido contra a configuração e os scripts atuais, mas ainda não foi executado integralmente nesta revisão. Permanece `draft`.