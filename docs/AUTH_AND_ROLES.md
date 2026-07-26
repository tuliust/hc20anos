---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: fe8faad93f8c0f39aefdc7ff11458f1c92ec7b53
superseded_by:
  - docs/10-dominios/autenticacao-autorizacao-e-roles.md
  - docs/30-contratos/permissoes.md
---

# Autenticação e roles — referência substituída

Este documento resumido foi substituído por:

- [`10-dominios/autenticacao-autorizacao-e-roles.md`](./10-dominios/autenticacao-autorizacao-e-roles.md), que descreve sessão, RLS, RPCs, service role e autorização das Functions;
- [`30-contratos/permissoes.md`](./30-contratos/permissoes.md), que contém a matriz inicial de atores e operações.

A referência antiga não cobria as verificações específicas de checkout, webhook, worker, reembolso, rotas protegidas e RPCs `security definer`.

Para uma decisão de segurança, prevalecem as migrations, policies, grants, Functions e contratos gerados do banco.
