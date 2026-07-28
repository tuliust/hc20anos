---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: dbdd4900411a303aa8347ac0abeb2a151bc5704e
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
| Testes unitários de assinatura, MIME, EXIF e arquivos disfarçados | `success` |
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
# Subtest: aceita PNG real e identifica dimensões
ok 1 - aceita PNG real e identifica dimensões
  ---
  duration_ms: 1.501392
  type: 'test'
  ...
# Subtest: rejeita MIME divergente da assinatura
ok 2 - rejeita MIME divergente da assinatura
  ---
  duration_ms: 0.650989
  type: 'test'
  ...
# Subtest: rejeita EXIF e metadados textuais
ok 3 - rejeita EXIF e metadados textuais
  ---
  duration_ms: 0.627104
  type: 'test'
  ...
# Subtest: rejeita arquivo com dados anexados depois da imagem
ok 4 - rejeita arquivo com dados anexados depois da imagem
  ---
  duration_ms: 0.280666
  type: 'test'
  ...
# Subtest: rejeita SVG ou HTML disfarçado de imagem
ok 5 - rejeita SVG ou HTML disfarçado de imagem
  ---
  duration_ms: 0.340288
  type: 'test'
  ...
# Subtest: rejeita dimensões e quantidade de pixels abusivas
ok 6 - rejeita dimensões e quantidade de pixels abusivas
  ---
  duration_ms: 0.312154
  type: 'test'
  ...
# Subtest: rejeita arquivo acima do limite
ok 7 - rejeita arquivo acima do limite
  ---
  duration_ms: 0.269284
  type: 'test'
  ...
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 122.038633
```
