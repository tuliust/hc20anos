---
status: generated
owner: tuliust
last_verified: 2026-09-22
last_verified_commit: 830931341c805e65f264a70a1caa19df430ff84e
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
