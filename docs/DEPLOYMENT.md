---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 45c8e164c9ed503817f203bd1bbbabe006bace2e
superseded_by:
  - docs/40-runbooks/desenvolvimento-local.md
  - docs/40-runbooks/deploy-vercel.md
  - docs/40-runbooks/deploy-edge-functions.md
  - docs/40-runbooks/migrations.md
  - docs/40-runbooks/rollback.md
---

# Deployment — referência depreciada

Este documento foi substituído por runbooks separados e não deve mais ser usado como procedimento operacional completo.

## Referências vigentes

- [`40-runbooks/desenvolvimento-local.md`](./40-runbooks/desenvolvimento-local.md)
- [`40-runbooks/deploy-vercel.md`](./40-runbooks/deploy-vercel.md)
- [`40-runbooks/deploy-edge-functions.md`](./40-runbooks/deploy-edge-functions.md)
- [`40-runbooks/migrations.md`](./40-runbooks/migrations.md)
- [`40-runbooks/rollback.md`](./40-runbooks/rollback.md)

## Conteúdo histórico preservado

A versão anterior registrava corretamente alguns elementos ainda existentes:

- build por `npm run build`;
- Vite, Tailwind e transforms registrados em `vite.config.ts`;
- deploy do frontend a partir de `main`;
- variáveis públicas `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_DEV_MODE`;
- alternativas server-side para geração de mini bio por IA;
- proibição de versionar `.env*`, `dist/`, `node_modules/` e `supabase/.temp/`.

Esses pontos foram redistribuídos e contextualizados nos runbooks atuais, com pré-condições, validação, critérios de interrupção e rollback.

## Limite de autoridade

Em divergência, prevalecem o código, scripts, configuração, workflow e os runbooks apontados acima. Este arquivo permanece somente para preservar rastreabilidade de referências antigas.