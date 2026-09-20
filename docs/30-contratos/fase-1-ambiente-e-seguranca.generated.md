---
status: generated
owner: tuliust
last_verified: 2026-09-19
last_verified_commit: 4182bf45b2cd349a257b6b376c87a178d66d07e8
generation_command: GitHub Actions / Phase 1 environment and security
source_files:
  - supabase/migrations/
  - supabase/tests/
  - src/lib/rpc.types.ts
  - scripts/generate-consumed-rpc-contracts.mjs
  - scripts/migrate-rpc-any-casts.mjs
  - .github/workflows/phase1-environment-security.yml
---

# Fase 1 — ambiente e segurança

| Verificação | Resultado |
|---|---|
| Inventário e contratos das RPCs consumidas | `success` |
| Zero casts `(supabase as any).rpc` | `success` |
| Build TypeScript e aplicação | `success` |
| Inicialização do Supabase local | `success` |
| Replay integral das migrations | `success` |
| Usuários e roles determinísticos | `success` |
| RLS, grants, triggers, constraints e roles | `success` |
| Regeneração dos contratos do banco | `success` |
| Auditoria documental | `success` |

O ambiente usa somente Supabase local e dados sintéticos. Nenhum banco remoto ou dado de produção é consultado. Os logs SQL completos permanecem nos artefatos do workflow.
