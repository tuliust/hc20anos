---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 6b73969e40f7495997b703be245b7f73f06ae41c
generation_command: GitHub Actions / Photo interactions functional tests
source_files:
  - playwright.config.ts
  - tests/e2e/photo-interactions-flow.spec.ts
  - tests/e2e/photo-interactions-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/App.tsx
  - src/lib/services.ts
  - src/lib/photo.types.ts
---

# Testes funcionais de interações em fotos

> Relatório gerado pelo workflow `Photo interactions functional tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de interações em fotos | `npx playwright test tests/e2e/photo-interactions-flow.spec.ts --workers=1` | `success` |

## Cobertura funcional

- galeria pública carrega foto aprovada e selecionada pela organização;
- detalhe exibe comentário aprovado e contadores agregados;
- curtida autenticada envia somente foto e usuário;
- novo comentário é enviado como `pending`;
- nova marcação é enviada como `pending`;
- solicitação de remoção registra motivo e identidade autenticada;
- nenhuma dessas escritas publica conteúdo diretamente.

## Interpretação

A execução automatizada com fixtures HTTP isoladas foi aprovada. Ela comprova os contratos do frontend, mas não substitui Storage, RLS, moderação administrativa, antivírus ou tratamento de solicitações em ambiente integrado.

## Diagnóstico E2E

```text

Running 1 test using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✓  1 tests/e2e/photo-interactions-flow.spec.ts:10:3 › interações em fotos › mantém escritas pendentes e permite marcar pessoa elegível (2.4s)

  1 passed (6.0s)
```
