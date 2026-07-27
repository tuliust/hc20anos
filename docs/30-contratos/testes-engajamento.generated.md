---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 8df19e09dfb2a459abce0b3b48bf779e4888737c
generation_command: GitHub Actions / Engagement functional tests
source_files:
  - playwright.config.ts
  - tests/e2e/engagement-flow.spec.ts
  - tests/e2e/engagement-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/App.tsx
  - src/lib/services.ts
  - src/lib/engagement.types.ts
---

# Testes funcionais de memórias e enquetes

> Relatório gerado pelo workflow `Engagement functional tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de memórias e enquetes | `npx playwright test tests/e2e/engagement-flow.spec.ts --workers=1` | `failure` |

## Cobertura funcional

- somente memórias aprovadas são carregadas na página pública;
- memória anônima não exibe o nome administrativo do autor;
- memória curta é rejeitada antes da escrita;
- nova memória é enviada como `pending` para moderação;
- enquete aberta permite voto de usuário autenticado;
- voto único remove seleção anterior antes da nova inserção;
- resultados ficam ocultos antes da participação;
- enquete fechada não aceita voto.

## Interpretação

A execução encontrou regressão. O diagnóstico abaixo deve ser resolvido antes de considerar memórias e enquetes validadas.

## Diagnóstico E2E

```text

Running 2 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✘  1 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (10.2s)
  ✘  2 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (retry #1) (6.5s)
  ✘  3 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (retry #2) (6.5s)
  ✓  4 tests/e2e/engagement-flow.spec.ts:51:3 › memórias e enquetes › registra voto único e impede novo voto em enquete fechada (1.7s)


  1) tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação 

    Error: expect(locator).toBeVisible() failed

    Locator:  getByText('Enviar sem mostrar meu nome', { exact: true })
    Expected: visible
    Received: hidden
    Timeout:  5000ms

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('Enviar sem mostrar meu nome', { exact: true })
        14 × locator resolved to <span class="text-[#f0ebe0] text-sm">Enviar sem mostrar meu nome</span>
           - unexpected value "hidden"


      31 |     await memoryField.fill("Lembro das conversas no corredor antes da primeira aula.");
      32 |     const anonymousControl = page.getByText("Enviar sem mostrar meu nome", { exact: true });
    > 33 |     await expect(anonymousControl).toBeVisible();
         |                                    ^
      34 |     await anonymousControl.click();
      35 |     await submitMemory.click();
      36 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:33:36

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator:  getByText('Enviar sem mostrar meu nome', { exact: true })
    Expected: visible
    Received: hidden
    Timeout:  5000ms

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('Enviar sem mostrar meu nome', { exact: true })
        14 × locator resolved to <span class="text-[#f0ebe0] text-sm">Enviar sem mostrar meu nome</span>
           - unexpected value "hidden"


      31 |     await memoryField.fill("Lembro das conversas no corredor antes da primeira aula.");
      32 |     const anonymousControl = page.getByText("Enviar sem mostrar meu nome", { exact: true });
    > 33 |     await expect(anonymousControl).toBeVisible();
         |                                    ^
      34 |     await anonymousControl.click();
      35 |     await submitMemory.click();
      36 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:33:36

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator:  getByText('Enviar sem mostrar meu nome', { exact: true })
    Expected: visible
    Received: hidden
    Timeout:  5000ms

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('Enviar sem mostrar meu nome', { exact: true })
        14 × locator resolved to <span class="text-[#f0ebe0] text-sm">Enviar sem mostrar meu nome</span>
           - unexpected value "hidden"


      31 |     await memoryField.fill("Lembro das conversas no corredor antes da primeira aula.");
      32 |     const anonymousControl = page.getByText("Enviar sem mostrar meu nome", { exact: true });
    > 33 |     await expect(anonymousControl).toBeVisible();
         |                                    ^
      34 |     await anonymousControl.click();
      35 |     await submitMemory.click();
      36 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:33:36

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação 
  1 passed (29.4s)
```
