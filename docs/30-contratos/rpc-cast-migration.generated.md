---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: cb819fce889baa9a49d8398054a649516f9c51ab
generation_command: GitHub Actions / RPC cast migration
source_files:
  - src/
  - build/
  - src/lib/rpc.types.ts
  - scripts/migrate-rpc-any-casts.mjs
  - scripts/generate-consumed-rpc-contracts.mjs
  - .github/workflows/rpc-cast-migration.yml
---

# Migração final dos casts de RPC

| Verificação | Resultado |
|---|---|
| Instalação das dependências | `success` |
| Substituição de `(supabase as any).rpc` | `success` |
| Regeneração dos contratos consumidos | `success` |
| Build tipado da aplicação | `success` |
| Verificação de zero casts RPC | `success` |

## Alterações detectadas

```text

> @figma/my-make-file@0.0.1 rpc:fix-any-casts
> node scripts/migrate-rpc-any-casts.mjs --fix

Migração concluída: 0 ocorrência(s).
```

## Diagnóstico do build

```text

> @figma/my-make-file@0.0.1 build
> vite build && node scripts/verify-profile-claim-bundle.mjs && node scripts/verify-profile-bio-api.mjs

[36mvite v6.4.3 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 1856 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                            [39m[1m[2m  0.72 kB[22m[1m[22m[2m │ gzip:   0.43 kB[22m
[2mdist/[22m[2massets/[22m[32mrn-invertido-CxW9ocNo.png      [39m[1m[2m109.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[32mrn-verde-zAZA77b1.png          [39m[1m[2m123.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[32mbrasil-invertido-vDkAUxkR.png  [39m[1m[2m169.00 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[32mbrasil-verde-CwdE0OFX.png      [39m[1m[2m181.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[32mmundo-invertido-NBpwfEb7.png   [39m[1m[2m253.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[32mmundo-verde-Be-ErQXr.png       [39m[1m[2m273.22 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-D2wPSAN3.css             [39m[1m[2m155.28 kB[22m[1m[22m[2m │ gzip:  26.26 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-gF-emakl.js             [39m[1m[2m472.45 kB[22m[1m[22m[2m │ gzip: 136.64 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-C_QWUcDE.js              [39m[1m[33m746.04 kB[39m[22m[2m │ gzip: 180.13 kB[22m
[33m
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 4.26s[39m
PASS obrigatório: "Qual é a sua data de nascimento?" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Essas informações ajudam a proteger o vínculo do perfil" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "complete_profile_registration_v3" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Apelido, nickname ou ex-perfil do Fotolog" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Meu perfil" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Responda 5 perguntas" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Gerando perfil com IA" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Eu vou!" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Não sei ainda..." em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Solteiro (a)" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "Casado (a)" em dist/assets/index-C_QWUcDE.js
PASS obrigatório: "/api/generate-profile-bio" em dist/assets/index-C_QWUcDE.js
PASS ausente: "Qual é seu ano de nascimento?"
PASS ausente: "Ex.: 1988"
PASS ausente: "A integração com IA será ativada depois. Por enquanto, o modal prepara uma prévia editável a partir das respostas."
PASS ausente: "Mini bio em 5 perguntas"
PASS ausente: "Apresente seu perfil com apenas 5 perguntas"
PASS ausente: "Refazer mini bio com 5 perguntas"
PASS ausente: "Gerar prévia"
PASS ausente: "OPENAI_API_KEY"
PASS ausente: "api.openai.com"

Bundle validado em 2 arquivo(s) JavaScript.
PASS: endpoint usa a variável server-side OPENAI_API_KEY
PASS: endpoint usa a Responses API
PASS: respostas não são armazenadas pela integração
PASS: saída da IA é validada por JSON Schema
PASS: endpoint possui limitação de tentativas
PASS: prompt inclui o relacionamento declarado
PASS: prompt inclui a informação declarada sobre filhos
PASS: cliente aceita o relacionamento do formulário
PASS: cliente aceita a informação sobre filhos
PASS: cliente chama somente o endpoint interno
PASS: cliente não referencia a chave da OpenAI
PASS: cliente não chama a OpenAI diretamente
PASS: data de nascimento não é enviada para geração
PASS: WhatsApp não é enviado para geração
PASS: e-mail não é enviado para geração

Contrato da integração OpenAI validado.
```
