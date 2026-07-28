---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: b006249d183c77dfc8373dfa87c6041e1a7f8102
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
  duration_ms: 1.517318
  type: 'test'
  ...
# Subtest: rejeita MIME divergente da assinatura
ok 2 - rejeita MIME divergente da assinatura
  ---
  duration_ms: 0.669503
  type: 'test'
  ...
# Subtest: rejeita EXIF e metadados textuais
ok 3 - rejeita EXIF e metadados textuais
  ---
  duration_ms: 0.633695
  type: 'test'
  ...
# Subtest: rejeita arquivo com dados anexados depois da imagem
ok 4 - rejeita arquivo com dados anexados depois da imagem
  ---
  duration_ms: 0.271157
  type: 'test'
  ...
# Subtest: rejeita SVG ou HTML disfarçado de imagem
ok 5 - rejeita SVG ou HTML disfarçado de imagem
  ---
  duration_ms: 0.371996
  type: 'test'
  ...
# Subtest: rejeita dimensões e quantidade de pixels abusivas
ok 6 - rejeita dimensões e quantidade de pixels abusivas
  ---
  duration_ms: 0.266638
  type: 'test'
  ...
# Subtest: rejeita arquivo acima do limite
ok 7 - rejeita arquivo acima do limite
  ---
  duration_ms: 0.292477
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
# duration_ms 125.458047
```

## phase2-supabase-start.log

```text
 155fb8f314df Extracting [=========================>                         ]   67.4MB/130.5MB
 c9a5bdeb38c4 Extracting [===================>                               ]  143.7MB/360.6MB
 276a0b8305a2 Extracting [=========================>                         ]  7.209MB/14.27MB
 d2f04496a183 Extracting [================================>                  ]  72.97MB/111.2MB
 155fb8f314df Extracting [===========================>                       ]  72.97MB/130.5MB
 c9a5bdeb38c4 Extracting [====================>                              ]  144.8MB/360.6MB
 d2f04496a183 Extracting [==================================>                ]  76.87MB/111.2MB
 276a0b8305a2 Extracting [============================>                      ]  8.028MB/14.27MB
 155fb8f314df Extracting [=============================>                     ]  76.87MB/130.5MB
 c9a5bdeb38c4 Extracting [====================>                              ]  149.8MB/360.6MB
 d2f04496a183 Extracting [====================================>              ]  81.89MB/111.2MB
 155fb8f314df Extracting [===============================>                   ]  81.33MB/130.5MB
 276a0b8305a2 Extracting [=============================>                     ]   8.52MB/14.27MB
 c9a5bdeb38c4 Extracting [=====================>                             ]  155.4MB/360.6MB
 d2f04496a183 Extracting [=======================================>           ]   86.9MB/111.2MB
 155fb8f314df Extracting [================================>                  ]  85.23MB/130.5MB
 c9a5bdeb38c4 Extracting [======================>                            ]  160.4MB/360.6MB
 276a0b8305a2 Extracting [===============================>                   ]  8.847MB/14.27MB
 d2f04496a183 Extracting [=========================================>         ]  91.91MB/111.2MB
 155fb8f314df Extracting [=================================>                 ]  88.57MB/130.5MB
 c9a5bdeb38c4 Extracting [=======================>                           ]  166.6MB/360.6MB
 276a0b8305a2 Extracting [================================>                  ]  9.339MB/14.27MB
 d2f04496a183 Extracting [===========================================>       ]  96.93MB/111.2MB
 155fb8f314df Extracting [==================================>                ]   90.8MB/130.5MB
 c9a5bdeb38c4 Extracting [=======================>                           ]  172.1MB/360.6MB
 276a0b8305a2 Extracting [====================================>              ]  10.32MB/14.27MB
 d2f04496a183 Extracting [==============================================>    ]  103.1MB/111.2MB
 c9a5bdeb38c4 Extracting [========================>                          ]  174.9MB/360.6MB
 155fb8f314df Extracting [===================================>               ]  92.47MB/130.5MB
 d2f04496a183 Extracting [================================================>  ]  108.6MB/111.2MB
 276a0b8305a2 Extracting [=====================================>             ]  10.81MB/14.27MB
 c9a5bdeb38c4 Extracting [========================>                          ]  178.3MB/360.6MB
 d2f04496a183 Extracting [==================================================>]  111.2MB/111.2MB
 276a0b8305a2 Extracting [=======================================>           ]   11.3MB/14.27MB
 155fb8f314df Extracting [===================================>               ]  93.03MB/130.5MB
 276a0b8305a2 Extracting [=========================================>         ]   11.8MB/14.27MB
 155fb8f314df Extracting [====================================>              ]  95.26MB/130.5MB
 276a0b8305a2 Extracting [============================================>      ]  12.78MB/14.27MB
 c9a5bdeb38c4 Extracting [=========================>                         ]  181.6MB/360.6MB
 276a0b8305a2 Extracting [===============================================>   ]  13.43MB/14.27MB
 155fb8f314df Extracting [====================================>              ]  96.37MB/130.5MB
 276a0b8305a2 Extracting [=================================================> ]  14.25MB/14.27MB
 276a0b8305a2 Extracting [==================================================>]  14.27MB/14.27MB
 c9a5bdeb38c4 Extracting [=========================>                         ]  182.7MB/360.6MB
 155fb8f314df Extracting [=====================================>             ]  96.93MB/130.5MB
 155fb8f314df Extracting [======================================>            ]  101.4MB/130.5MB
 155fb8f314df Extracting [=========================================>         ]  108.1MB/130.5MB
 c9a5bdeb38c4 Extracting [=========================>                         ]  184.9MB/360.6MB
 155fb8f314df Extracting [===========================================>       ]  113.6MB/130.5MB
 c9a5bdeb38c4 Extracting [=========================>                         ]  187.2MB/360.6MB
 155fb8f314df Extracting [=============================================>     ]  119.2MB/130.5MB
 c9a5bdeb38c4 Extracting [==========================>                        ]  189.4MB/360.6MB
 155fb8f314df Extracting [==============================================>    ]  120.9MB/130.5MB
 c9a5bdeb38c4 Extracting [==========================>                        ]  193.3MB/360.6MB
 155fb8f314df Extracting [==============================================>    ]  122.6MB/130.5MB
 c9a5bdeb38c4 Extracting [===========================>                       ]  195.5MB/360.6MB
 d2f04496a183 Pull complete 
 52cd27cac02e Extracting [==================================================>]      91B/91B
 52cd27cac02e Extracting [==================================================>]      91B/91B
 276a0b8305a2 Pull complete 
 c9a5bdeb38c4 Extracting [===========================>                       ]  196.6MB/360.6MB
 3982d643246d Extracting [==================================================>]  1.576kB/1.576kB
 52cd27cac02e Pull complete 
 3982d643246d Pull complete 
 b6d85ef1ea27 Extracting [=======>                                           ]  32.77kB/213.9kB
 4f4fb700ef54 Extracting [==================================================>]      32B/32B
 b6d85ef1ea27 Extracting [==================================================>]  213.9kB/213.9kB
 b6d85ef1ea27 Extracting [==================================================>]  213.9kB/213.9kB
 4f4fb700ef54 Pull complete 
 b6d85ef1ea27 Pull complete 
 realtime Pulled 
 a7537cf4b694 Extracting [==================================================>]     658B/658B
 a7537cf4b694 Extracting [==================================================>]     658B/658B
 a7537cf4b694 Pull complete 
 e5723cc41baf Extracting [>                                                  ]  131.1kB/12.85MB
 c9a5bdeb38c4 Extracting [===========================>                       ]  197.8MB/360.6MB
 e5723cc41baf Extracting [================>                                  ]  4.194MB/12.85MB
 155fb8f314df Extracting [================================================>  ]  125.3MB/130.5MB
 155fb8f314df Extracting [================================================>  ]  126.5MB/130.5MB
 c9a5bdeb38c4 Extracting [===========================>                       ]  198.9MB/360.6MB
 e5723cc41baf Extracting [======================================>            ]   9.83MB/12.85MB
 155fb8f314df Extracting [================================================>  ]  127.6MB/130.5MB
 c9a5bdeb38c4 Extracting [===========================>                       ]  200.5MB/360.6MB
 e5723cc41baf Extracting [=======================================>           ]  10.09MB/12.85MB
 c9a5bdeb38c4 Extracting [============================>                      ]  203.3MB/360.6MB
 155fb8f314df Extracting [=================================================> ]  129.2MB/130.5MB
 e5723cc41baf Extracting [========================================>          ]  10.35MB/12.85MB
 e5723cc41baf Extracting [=========================================>         ]  10.75MB/12.85MB
 c9a5bdeb38c4 Extracting [============================>                      ]  204.4MB/360.6MB
 155fb8f314df Extracting [=================================================> ]  129.8MB/130.5MB
 e5723cc41baf Extracting [==========================================>        ]  11.01MB/12.85MB
 155fb8f314df Extracting [=================================================> ]  130.4MB/130.5MB
 c9a5bdeb38c4 Extracting [============================>                      ]  207.2MB/360.6MB
 e5723cc41baf Extracting [===========================================>       ]  11.14MB/12.85MB
 155fb8f314df Extracting [==================================================>]  130.5MB/130.5MB
 155fb8f314df Pull complete 
 6536cd218a00 Extracting [>                                                  ]   98.3kB/9.775MB
 c9a5bdeb38c4 Extracting [=============================>                     ]  210.6MB/360.6MB
 e5723cc41baf Extracting [============================================>      ]   11.4MB/12.85MB
 6536cd218a00 Extracting [==========================>                        ]  5.112MB/9.775MB
 c9a5bdeb38c4 Extracting [=============================>                     ]  213.4MB/360.6MB
 6536cd218a00 Extracting [===========================>                       ]  5.308MB/9.775MB
 e5723cc41baf Extracting [=============================================>     ]  11.67MB/12.85MB
 6536cd218a00 Extracting [============================>                      ]  5.603MB/9.775MB
 e5723cc41baf Extracting [===============================================>   ]  12.32MB/12.85MB
 c9a5bdeb38c4 Extracting [==============================>                    ]  218.9MB/360.6MB
 e5723cc41baf Extracting [=================================================> ]  12.71MB/12.85MB
 6536cd218a00 Extracting [=============================>                     ]    5.8MB/9.775MB
 c9a5bdeb38c4 Extracting [==============================>                    ]  219.5MB/360.6MB
 e5723cc41baf Extracting [=================================================> ]  12.85MB/12.85MB
 6536cd218a00 Extracting [=================================>                 ]  6.488MB/9.775MB
 e5723cc41baf Extracting [==================================================>]  12.85MB/12.85MB
 c9a5bdeb38c4 Extracting [==============================>                    ]  220.6MB/360.6MB
 6536cd218a00 Extracting [====================================>              ]  7.176MB/9.775MB
 e5723cc41baf Pull complete 
 55468a10f7b3 Extracting [==================================================>]  28.82kB/28.82kB
 55468a10f7b3 Extracting [==================================================>]  28.82kB/28.82kB
 6536cd218a00 Extracting [======================================>            ]  7.471MB/9.775MB
 55468a10f7b3 Pull complete 
 6536cd218a00 Extracting [==================================================>]  9.775MB/9.775MB
 6536cd218a00 Pull complete 
 e1920959fc02 Extracting [==================================================>]      92B/92B
 e1920959fc02 Extracting [==================================================>]      92B/92B
 e1920959fc02 Pull complete 
 58d7aefebc2b Extracting [>                                                  ]  131.1kB/10.74MB
 58d7aefebc2b Extracting [==========>                                        ]  2.359MB/10.74MB
 e958952de594 Extracting [>                                                  ]  557.1kB/59.66MB
 58d7aefebc2b Extracting [=======================================>           ]  8.389MB/10.74MB
 58d7aefebc2b Extracting [==================================================>]  10.74MB/10.74MB
 58d7aefebc2b Pull complete 
 3a8f883f95f0 Extracting [>                                                  ]  491.5kB/47.1MB
 e958952de594 Extracting [>                                                  ]  1.114MB/59.66MB
 3a8f883f95f0 Extracting [==>                                                ]  2.458MB/47.1MB
 3a8f883f95f0 Extracting [=====>                                             ]  4.915MB/47.1MB
 c9a5bdeb38c4 Extracting [==============================>                    ]  222.3MB/360.6MB
 3a8f883f95f0 Extracting [=====>                                             ]  5.407MB/47.1MB
 c9a5bdeb38c4 Extracting [==============================>                    ]  223.4MB/360.6MB
 c9a5bdeb38c4 Extracting [===============================>                   ]  226.7MB/360.6MB
 3a8f883f95f0 Extracting [======>                                            ]  5.898MB/47.1MB
 3a8f883f95f0 Extracting [=======>                                           ]  6.881MB/47.1MB
 c9a5bdeb38c4 Extracting [===============================>                   ]  230.1MB/360.6MB
 e958952de594 Extracting [=>                                                 ]  1.671MB/59.66MB
 3a8f883f95f0 Extracting [========>                                          ]  7.864MB/47.1MB
 c9a5bdeb38c4 Extracting [================================>                  ]  231.7MB/360.6MB
 3a8f883f95f0 Extracting [=========>                                         ]  8.847MB/47.1MB
 3a8f883f95f0 Extracting [==========>                                        ]   9.83MB/47.1MB
 3a8f883f95f0 Extracting [===========>                                       ]  10.81MB/47.1MB
 3a8f883f95f0 Extracting [============>                                      ]   11.8MB/47.1MB
 c9a5bdeb38c4 Extracting [================================>                  ]  232.8MB/360.6MB
 3a8f883f95f0 Extracting [=============>                                     ]  12.78MB/47.1MB
 c9a5bdeb38c4 Extracting [================================>                  ]    234MB/360.6MB
 3a8f883f95f0 Extracting [==============>                                    ]  13.76MB/47.1MB
 c9a5bdeb38c4 Extracting [=================================>                 ]  241.2MB/360.6MB
 e958952de594 Extracting [=>                                                 ]  2.228MB/59.66MB
 3a8f883f95f0 Extracting [===============>                                   ]  14.75MB/47.1MB
 c9a5bdeb38c4 Extracting [==================================>                ]  245.7MB/360.6MB
 3a8f883f95f0 Extracting [================>                                  ]  15.73MB/47.1MB
 c9a5bdeb38c4 Extracting [==================================>                ]  248.4MB/360.6MB
 3a8f883f95f0 Extracting [=================>                                 ]  16.71MB/47.1MB
 c9a5bdeb38c4 Extracting [==================================>                ]  249.6MB/360.6MB
 3a8f883f95f0 Extracting [==================>                                ]  17.69MB/47.1MB
 3a8f883f95f0 Extracting [===================>                               ]  18.68MB/47.1MB
 c9a5bdeb38c4 Extracting [===================================>               ]    254MB/360.6MB
 3a8f883f95f0 Extracting [====================>                              ]  19.66MB/47.1MB
 c9a5bdeb38c4 Extracting [===================================>               ]  255.1MB/360.6MB
 c9a5bdeb38c4 Extracting [===================================>               ]  257.4MB/360.6MB
 e958952de594 Extracting [==>                                                ]  2.785MB/59.66MB
 3a8f883f95f0 Extracting [=====================>                             ]  20.15MB/47.1MB
 c9a5bdeb38c4 Extracting [===================================>               ]  259.6MB/360.6MB
 3a8f883f95f0 Extracting [=====================>                             ]  20.64MB/47.1MB
 c9a5bdeb38c4 Extracting [====================================>              ]  261.8MB/360.6MB
 3a8f883f95f0 Extracting [============================>                      ]  27.03MB/47.1MB
 c9a5bdeb38c4 Extracting [====================================>              ]  266.8MB/360.6MB
 c9a5bdeb38c4 Extracting [=====================================>             ]  268.5MB/360.6MB
 c9a5bdeb38c4 Extracting [=====================================>             ]  270.2MB/360.6MB
 e958952de594 Extracting [==>                                                ]  3.342MB/59.66MB
 c9a5bdeb38c4 Extracting [=====================================>             ]  271.3MB/360.6MB
 3a8f883f95f0 Extracting [==============================>                    ]     29MB/47.1MB
 c9a5bdeb38c4 Extracting [=====================================>             ]    273MB/360.6MB
 3a8f883f95f0 Extracting [===============================>                   ]  29.49MB/47.1MB
```
