---
status: generated
owner: tuliust
last_verified: 2026-09-17
last_verified_commit: e52f667e5fe7d1b086f6bd19645ed9f438cb0a6d
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
