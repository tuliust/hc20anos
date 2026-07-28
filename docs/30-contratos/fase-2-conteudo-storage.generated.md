---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: 6235f215ad6082c841664e46340f94a774acdfe2
generation_command: GitHub Actions / Phase 2 content and Storage
source_files:
  - src/lib/imageUploadSecurity.ts
  - src/lib/secureImageStorage.ts
  - supabase/functions/_shared/image-security.ts
  - supabase/functions/photo-storage/index.ts
  - supabase/migrations/20260728000001_phase2_content_storage_security.sql
  - supabase/migrations/20260728000002_phase2_moderation_concurrency.sql
  - supabase/tests/phase2_content_storage.sql
  - scripts/test-phase2-content-storage.mjs
  - tests/unit/image-upload-security.test.mts
  - tests/e2e/phase2-content-security.spec.ts
  - .github/workflows/phase2-content-storage.yml
---

# Fase 2 — conteúdo e Storage

| Verificação | Resultado |
|---|---|
| Dependências | `success` |
| Integração do runtime e refatoração do anonimato | `success` |
| Testes unitários de assinatura, MIME, EXIF e arquivos disfarçados | `failure` |
| Supabase local | `cancelled` |
| Replay integral das migrations | `skipped` |
| Usuários e roles reais no Auth local | `skipped` |
| RLS, policies, sanitização, rate limit e contratos SQL | `skipped` |
| Tipos e contratos do banco | `skipped` |
| Contratos das RPCs consumidas | `skipped` |
| Build tipado | `skipped` |
| Edge Function local | `skipped` |
| Upload, concorrência, moderação e remoção integrados | `skipped` |
| Chromium | `skipped` |
| Regressões E2E | `skipped` |

A execução usa Supabase Auth, Postgres, Storage e Edge Runtime locais. Nenhum banco, bucket ou usuário de produção é acessado.

## phase2-image-unit.log

```text

> @figma/my-make-file@0.0.1 test:image-security
> node --experimental-strip-types --test tests/unit/image-upload-security.test.mts

TAP version 13
# node:internal/modules/run_main:123
#     triggerUncaughtException(
#     ^
# file:///home/runner/work/hc20anos/hc20anos/supabase/functions/_shared/image-security.ts:21
# export class ImageSecurityError extends Error {
#   constructor(public readonly code: string, message = code) {
#                               ^^^^^^^^^^^^
#     super(message);
# SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
#     at parseTypeScript (node:internal/modules/typescript:63:40)
#     at processTypeScriptCode (node:internal/modules/typescript:133:42)
#     at stripTypeScriptModuleTypes (node:internal/modules/typescript:163:10)
#     at ModuleLoader.<anonymous> (node:internal/modules/esm/translators:656:29)
#     at \#translate (node:internal/modules/esm/loader:559:20)
#     at afterLoad (node:internal/modules/esm/loader:612:29)
#     at ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:617:12)
#     at \#createModuleJob (node:internal/modules/esm/loader:640:36)
#     at \#getJobFromResolveResult (node:internal/modules/esm/loader:353:34)
#     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:321:41) {
#   code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX'
# }
# Node.js v22.23.1
# Subtest: tests/unit/image-upload-security.test.mts
not ok 1 - tests/unit/image-upload-security.test.mts
  ---
  duration_ms: 66.499388
  type: 'test'
  location: '/home/runner/work/hc20anos/hc20anos/tests/unit/image-upload-security.test.mts:1:1'
  failureType: 'testCodeFailure'
  exitCode: 1
  signal: ~
  error: 'test failed'
  code: 'ERR_TEST_FAILURE'
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 74.628783
```
