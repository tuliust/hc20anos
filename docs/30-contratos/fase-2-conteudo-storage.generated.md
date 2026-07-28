---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: bdb89487a0de04cdd440211c0acf1d9b69edaa3f
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
  duration_ms: 1.633187
  type: 'test'
  ...
# Subtest: rejeita MIME divergente da assinatura
ok 2 - rejeita MIME divergente da assinatura
  ---
  duration_ms: 0.643214
  type: 'test'
  ...
# Subtest: rejeita EXIF e metadados textuais
ok 3 - rejeita EXIF e metadados textuais
  ---
  duration_ms: 0.633646
  type: 'test'
  ...
# Subtest: rejeita arquivo com dados anexados depois da imagem
ok 4 - rejeita arquivo com dados anexados depois da imagem
  ---
  duration_ms: 0.296836
  type: 'test'
  ...
# Subtest: rejeita SVG ou HTML disfarçado de imagem
ok 5 - rejeita SVG ou HTML disfarçado de imagem
  ---
  duration_ms: 0.361466
  type: 'test'
  ...
# Subtest: rejeita dimensões e quantidade de pixels abusivas
ok 6 - rejeita dimensões e quantidade de pixels abusivas
  ---
  duration_ms: 0.266088
  type: 'test'
  ...
# Subtest: rejeita arquivo acima do limite
ok 7 - rejeita arquivo acima do limite
  ---
  duration_ms: 0.290193
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
# duration_ms 126.523382
```

## phase2-supabase-start.log

```text
213ec9aee27d: Pull complete
abecb94bba46: Verifying Checksum
abecb94bba46: Download complete
16733d1099a5: Pull complete
a70653f7a2d5: Pull complete
09ddda476dba: Pull complete
0d8aa8e026f1: Pull complete
5c32499ab806: Pull complete
b9136609bef0: Pull complete
3de69d675a4d: Pull complete
6c81c36100ac: Pull complete
c08735c7f0f9: Pull complete
v1.30.2: Pulling from supabase/mailpit
55afa1ecc21d: Already exists
95403727e7d4: Pulling fs layer
e326d083c2c9: Pulling fs layer
e326d083c2c9: Verifying Checksum
e326d083c2c9: Download complete
95403727e7d4: Verifying Checksum
95403727e7d4: Download complete
bfab333b5e81: Pull complete
95403727e7d4: Pull complete
v3.8.0: Pulling from supabase/imgproxy
be4c37910e5f: Pull complete
bd159e379b3b: Pulling fs layer
6309c66995c3: Pulling fs layer
afc82c51c69d: Pulling fs layer
053e09c75ec1: Pulling fs layer
fc6c361fe360: Pulling fs layer
901d40e1841c: Pulling fs layer
053e09c75ec1: Waiting
fc6c361fe360: Waiting
901d40e1841c: Waiting
1.46.0: Pulling from supabase/logflare
6309c66995c3: Verifying Checksum
6309c66995c3: Download complete
e326d083c2c9: Pull complete
531e3bd93090: Pull complete
Digest: sha256:37a38e48e9338cd7e89dfeb487f37b02ebfcd9cb23111bed2d345e79d37d6dd6
Status: Downloaded newer image for public.ecr.aws/supabase/mailpit:v1.30.2
814dd06d26c7: Pull complete
Digest: sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d
Status: Downloaded newer image for public.ecr.aws/supabase/kong:2.8.1
bd159e379b3b: Verifying Checksum
bd159e379b3b: Download complete
119d43eec815: Pulling fs layer
7d7005e1e86f: Pulling fs layer
53a4f725a55f: Pulling fs layer
16c9d41cbff6: Pulling fs layer
5a0a0059a9b1: Pulling fs layer
8e738bf3bcd1: Pulling fs layer
50049dab3aef: Pulling fs layer
8fa7eb23f04e: Pulling fs layer
4f4fb700ef54: Pulling fs layer
8fe621592d04: Pulling fs layer
119d43eec815: Waiting
7d7005e1e86f: Waiting
53a4f725a55f: Waiting
16c9d41cbff6: Waiting
5a0a0059a9b1: Waiting
8e738bf3bcd1: Waiting
50049dab3aef: Waiting
8fa7eb23f04e: Waiting
4f4fb700ef54: Waiting
8fe621592d04: Waiting
afc82c51c69d: Verifying Checksum
afc82c51c69d: Download complete
053e09c75ec1: Verifying Checksum
053e09c75ec1: Download complete
fc6c361fe360: Verifying Checksum
fc6c361fe360: Download complete
901d40e1841c: Verifying Checksum
901d40e1841c: Download complete
53a4f725a55f: Verifying Checksum
53a4f725a55f: Download complete
7d7005e1e86f: Verifying Checksum
7d7005e1e86f: Download complete
119d43eec815: Verifying Checksum
119d43eec815: Download complete
5a0a0059a9b1: Verifying Checksum
5a0a0059a9b1: Download complete
8e738bf3bcd1: Verifying Checksum
8e738bf3bcd1: Download complete
50049dab3aef: Verifying Checksum
50049dab3aef: Download complete
8fa7eb23f04e: Verifying Checksum
8fa7eb23f04e: Download complete
16c9d41cbff6: Verifying Checksum
16c9d41cbff6: Download complete
4f4fb700ef54: Verifying Checksum
4f4fb700ef54: Download complete
8fe621592d04: Verifying Checksum
8fe621592d04: Download complete
119d43eec815: Pull complete
bd159e379b3b: Pull complete
6309c66995c3: Pull complete
724041fce750: Pull complete
d2f04496a183: Pull complete
52cd27cac02e: Pull complete
b6d85ef1ea27: Pull complete
a7537cf4b694: Pull complete
afc82c51c69d: Pull complete
7ff4e6b4b099: Pull complete
7d7005e1e86f: Pull complete
c651f6fbec0a: Pull complete
a6c402c1c1a7: Pull complete
7b18341145e7: Pull complete
053e09c75ec1: Pull complete
53a4f725a55f: Pull complete
fc6c361fe360: Pull complete
2422c2c034eb: Pull complete
901d40e1841c: Pull complete
Digest: sha256:0facd355d50f3be665ebe674486f2b2e9cdaebd3f74404acd9b7fece2f661435
Status: Downloaded newer image for public.ecr.aws/supabase/imgproxy:v3.8.0
4a9cfffa288e: Pull complete
d71214b4506e: Pull complete
21b7c3f31e06: Pull complete
e5723cc41baf: Pull complete
155fb8f314df: Pull complete
55468a10f7b3: Pull complete
276a0b8305a2: Pull complete
6536cd218a00: Pull complete
e1920959fc02: Pull complete
3982d643246d: Pull complete
4f4fb700ef54: Pull complete
Digest: sha256:7b56da34216fd568042be043900d15cdd33c2c48c2116c9a333f9465255da80d
Status: Downloaded newer image for public.ecr.aws/supabase/realtime:v2.112.6
58d7aefebc2b: Pull complete
abecb94bba46: Pull complete
0367cb7f5023: Pull complete
Digest: sha256:a82676277615aee03c4f288cbbbf68dedb5ba8693073e567ab8dbfdd11ba5d45
Status: Downloaded newer image for public.ecr.aws/supabase/edge-runtime:v1.74.2
16c9d41cbff6: Pull complete
5a0a0059a9b1: Pull complete
8e738bf3bcd1: Pull complete
c9a5bdeb38c4: Pull complete
0d9502de34ca: Pull complete
d03e110f15b3: Pull complete
54b222fe0c5b: Pull complete
55541ba25baf: Pull complete
f6bdea2be18c: Pull complete
75efb44ab4c9: Pull complete
7c8f5e9f8055: Pull complete
b9965acde846: Pull complete
c80343e291d0: Pull complete
f0199592d423: Pull complete
8972c7a7171b: Pull complete
530c3bcf58fd: Pull complete
2acb3852c9cb: Pull complete
12102920ba5a: Pull complete
63215bcdb820: Pull complete
1889860cc5fd: Pull complete
a25d0edefeeb: Pull complete
9fe841240ceb: Pull complete
2ce0daa4dfbe: Pull complete
ab651ad7651b: Pull complete
60e903a27082: Pull complete
37c7c2f4a5f2: Pull complete
24eb1e934cad: Pull complete
997211c7723e: Pull complete
50049dab3aef: Pull complete
9760957a42e0: Pull complete
Digest: sha256:80d7b27c3e8d77cfa7226eee9508671796da214781ff15a35b3670d7ad5ee453
Status: Downloaded newer image for public.ecr.aws/supabase/postgres:17.6.1.143
8fa7eb23f04e: Pull complete
4f4fb700ef54: Pull complete
8fe621592d04: Pull complete
Digest: sha256:f3c7a387ab7bb94af001b907c08df14258bd255f29d4cdb8bf6b393707558bf2
Status: Downloaded newer image for public.ecr.aws/supabase/logflare:1.46.0
3a8f883f95f0: Pull complete
7764ce1676d8: Pull complete
Digest: sha256:4a5163e33578b346e6eab1352034d29140cf84b6d9989aab6fcf4b39edb3b13c
Status: Downloaded newer image for public.ecr.aws/supabase/studio:2026.07.06-sha-66cf431
e958952de594: Pull complete
f41c2ed3946e: Pull complete
cc2ec52924e2: Pull complete
Digest: sha256:1dbe962d9862ef12e20357f9d7ba5431989c1daf4a556d6cb20ee4efd1c57320
Status: Downloaded newer image for public.ecr.aws/supabase/storage-api:v1.62.5
Starting database...
Initialising schema...
```
