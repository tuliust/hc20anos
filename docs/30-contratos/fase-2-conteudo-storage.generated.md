---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: b9074fd31f0be5e31c9e92364fdcdce95b389845
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
  duration_ms: 1.415554
  type: 'test'
  ...
# Subtest: rejeita MIME divergente da assinatura
ok 2 - rejeita MIME divergente da assinatura
  ---
  duration_ms: 0.540534
  type: 'test'
  ...
# Subtest: rejeita EXIF e metadados textuais
ok 3 - rejeita EXIF e metadados textuais
  ---
  duration_ms: 0.494317
  type: 'test'
  ...
# Subtest: rejeita arquivo com dados anexados depois da imagem
ok 4 - rejeita arquivo com dados anexados depois da imagem
  ---
  duration_ms: 0.231404
  type: 'test'
  ...
# Subtest: rejeita SVG ou HTML disfarçado de imagem
ok 5 - rejeita SVG ou HTML disfarçado de imagem
  ---
  duration_ms: 0.33057
  type: 'test'
  ...
# Subtest: rejeita dimensões e quantidade de pixels abusivas
ok 6 - rejeita dimensões e quantidade de pixels abusivas
  ---
  duration_ms: 0.246242
  type: 'test'
  ...
# Subtest: rejeita arquivo acima do limite
ok 7 - rejeita arquivo acima do limite
  ---
  duration_ms: 0.230693
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
# duration_ms 127.849493
```

## phase2-supabase-start.log

```text
814dd06d26c7: Waiting
55afa1ecc21d: Already exists
565df2d910df: Pulling fs layer
dc286a8aa197: Pulling fs layer
79ee4066848c: Pulling fs layer
4b1c10f5635f: Pulling fs layer
03bc85a5a5ef: Pulling fs layer
565df2d910df: Waiting
79ee4066848c: Waiting
dc286a8aa197: Waiting
4b1c10f5635f: Waiting
03bc85a5a5ef: Waiting
c651f6fbec0a: Verifying Checksum
c651f6fbec0a: Download complete
5c32499ab806: Verifying Checksum
5c32499ab806: Download complete
7ff4e6b4b099: Verifying Checksum
7ff4e6b4b099: Download complete
a6c402c1c1a7: Download complete
7b18341145e7: Verifying Checksum
7b18341145e7: Download complete
2422c2c034eb: Verifying Checksum
2422c2c034eb: Download complete
4a9cfffa288e: Verifying Checksum
4a9cfffa288e: Download complete
d71214b4506e: Verifying Checksum
d71214b4506e: Download complete
21b7c3f31e06: Download complete
3982d643246d: Verifying Checksum
3982d643246d: Download complete
4f4fb700ef54: Download complete
276a0b8305a2: Verifying Checksum
276a0b8305a2: Download complete
213ec9aee27d: Verifying Checksum
213ec9aee27d: Download complete
a70653f7a2d5: Verifying Checksum
a70653f7a2d5: Download complete
814dd06d26c7: Verifying Checksum
814dd06d26c7: Download complete
565df2d910df: Verifying Checksum
565df2d910df: Download complete
213ec9aee27d: Pull complete
531e3bd93090: Verifying Checksum
531e3bd93090: Download complete
dc286a8aa197: Verifying Checksum
dc286a8aa197: Download complete
79ee4066848c: Verifying Checksum
79ee4066848c: Download complete
4b1c10f5635f: Verifying Checksum
4b1c10f5635f: Download complete
03bc85a5a5ef: Download complete
565df2d910df: Pull complete
a70653f7a2d5: Pull complete
dc286a8aa197: Pull complete
79ee4066848c: Pull complete
4b1c10f5635f: Pull complete
03bc85a5a5ef: Pull complete
Digest: sha256:b252efb680be37d4a8bf77c210cf0439c19b63a4b51929233a65dd101d25bdab
Status: Downloaded newer image for public.ecr.aws/supabase/gotrue:v2.192.0
5c32499ab806: Pull complete
531e3bd93090: Pull complete
814dd06d26c7: Pull complete
Digest: sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d
Status: Downloaded newer image for public.ecr.aws/supabase/kong:2.8.1
1.46.0: Pulling from supabase/logflare
failed to display json stream: toomanyrequests: Rate exceeded
Retrying after 8s: public.ecr.aws/supabase/logflare:1.46.0
17.6.1.143: Pulling from supabase/postgres
e6f31ffc071e: Already exists
1c0396601337: Pulling fs layer
9918c0ca3fb2: Pulling fs layer
c9a5bdeb38c4: Pulling fs layer
0d9502de34ca: Pulling fs layer
d03e110f15b3: Pulling fs layer
54b222fe0c5b: Pulling fs layer
55541ba25baf: Pulling fs layer
f6bdea2be18c: Pulling fs layer
75efb44ab4c9: Pulling fs layer
7c8f5e9f8055: Pulling fs layer
b9965acde846: Pulling fs layer
c80343e291d0: Pulling fs layer
f0199592d423: Pulling fs layer
8972c7a7171b: Pulling fs layer
530c3bcf58fd: Pulling fs layer
2acb3852c9cb: Pulling fs layer
12102920ba5a: Pulling fs layer
63215bcdb820: Pulling fs layer
1889860cc5fd: Pulling fs layer
a25d0edefeeb: Pulling fs layer
9fe841240ceb: Pulling fs layer
2ce0daa4dfbe: Pulling fs layer
ab651ad7651b: Pulling fs layer
60e903a27082: Pulling fs layer
37c7c2f4a5f2: Pulling fs layer
24eb1e934cad: Pulling fs layer
997211c7723e: Pulling fs layer
9760957a42e0: Pulling fs layer
530c3bcf58fd: Waiting
2acb3852c9cb: Waiting
12102920ba5a: Waiting
63215bcdb820: Waiting
1889860cc5fd: Waiting
a25d0edefeeb: Waiting
9fe841240ceb: Waiting
75efb44ab4c9: Waiting
7c8f5e9f8055: Waiting
b9965acde846: Waiting
c80343e291d0: Waiting
f0199592d423: Waiting
0d9502de34ca: Waiting
d03e110f15b3: Waiting
8972c7a7171b: Waiting
54b222fe0c5b: Waiting
55541ba25baf: Waiting
f6bdea2be18c: Waiting
2ce0daa4dfbe: Waiting
ab651ad7651b: Waiting
60e903a27082: Waiting
37c7c2f4a5f2: Waiting
24eb1e934cad: Waiting
997211c7723e: Waiting
9760957a42e0: Waiting
9918c0ca3fb2: Verifying Checksum
9918c0ca3fb2: Download complete
1c0396601337: Verifying Checksum
1c0396601337: Download complete
0d9502de34ca: Verifying Checksum
0d9502de34ca: Download complete
d03e110f15b3: Verifying Checksum
d03e110f15b3: Download complete
54b222fe0c5b: Verifying Checksum
54b222fe0c5b: Download complete
55541ba25baf: Verifying Checksum
55541ba25baf: Download complete
f6bdea2be18c: Verifying Checksum
f6bdea2be18c: Download complete
75efb44ab4c9: Verifying Checksum
75efb44ab4c9: Download complete
7c8f5e9f8055: Verifying Checksum
7c8f5e9f8055: Download complete
b9965acde846: Verifying Checksum
b9965acde846: Download complete
c80343e291d0: Verifying Checksum
c80343e291d0: Download complete
f0199592d423: Verifying Checksum
f0199592d423: Download complete
1c0396601337: Pull complete
8972c7a7171b: Verifying Checksum
8972c7a7171b: Download complete
530c3bcf58fd: Verifying Checksum
530c3bcf58fd: Download complete
9918c0ca3fb2: Pull complete
2acb3852c9cb: Verifying Checksum
2acb3852c9cb: Download complete
12102920ba5a: Verifying Checksum
12102920ba5a: Download complete
63215bcdb820: Verifying Checksum
63215bcdb820: Download complete
1889860cc5fd: Verifying Checksum
1889860cc5fd: Download complete
a25d0edefeeb: Verifying Checksum
a25d0edefeeb: Download complete
9fe841240ceb: Download complete
2ce0daa4dfbe: Verifying Checksum
2ce0daa4dfbe: Download complete
ab651ad7651b: Verifying Checksum
ab651ad7651b: Download complete
c9a5bdeb38c4: Verifying Checksum
c9a5bdeb38c4: Download complete
60e903a27082: Verifying Checksum
60e903a27082: Download complete
37c7c2f4a5f2: Verifying Checksum
37c7c2f4a5f2: Download complete
24eb1e934cad: Verifying Checksum
24eb1e934cad: Download complete
997211c7723e: Verifying Checksum
997211c7723e: Download complete
9760957a42e0: Verifying Checksum
9760957a42e0: Download complete
7ff4e6b4b099: Pull complete
```
