---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: ad7ff1734ec86cdc471444bf5afa91f05721eae3
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
| E2E de interações em fotos | `npx playwright test tests/e2e/photo-interactions-flow.spec.ts --workers=1` | `failure` |

## Cobertura funcional

- galeria pública carrega foto aprovada e selecionada pela organização;
- detalhe exibe comentário aprovado e contadores agregados;
- curtida autenticada envia somente foto e usuário;
- novo comentário é enviado como `pending`;
- nova marcação é enviada como `pending`;
- solicitação de remoção registra motivo e identidade autenticada;
- nenhuma dessas escritas publica conteúdo diretamente.

## Interpretação

A execução encontrou regressão. O diagnóstico abaixo deve ser resolvido antes de considerar as interações em fotos validadas.

## Diagnóstico E2E

```text

Running 1 test using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✘  1 tests/e2e/photo-interactions-flow.spec.ts:12:3 › interações em fotos › mantém escrita pendente e contratos de privacidade auditáveis (9.4s)
  ✘  2 tests/e2e/photo-interactions-flow.spec.ts:12:3 › interações em fotos › mantém escrita pendente e contratos de privacidade auditáveis (retry #1) (6.3s)
  ✘  3 tests/e2e/photo-interactions-flow.spec.ts:12:3 › interações em fotos › mantém escrita pendente e contratos de privacidade auditáveis (retry #2) (6.3s)


  1) tests/e2e/photo-interactions-flow.spec.ts:12:3 › interações em fotos › mantém escrita pendente e contratos de privacidade auditáveis 

    Error: expect(locator).toBeVisible() failed

    Locator:  getByText('1 fotos selecionadas pela organização', { exact: true })
    Expected: visible
    Received: hidden
    Timeout:  5000ms

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('1 fotos selecionadas pela organização', { exact: true })
        14 × locator resolved to <p data-history-photo-counter-hidden="true" class="text-[#7a9a7a] mt-2 font-mono text-sm">1 fotos selecionadas pela organização</p>
           - unexpected value "hidden"


      16 |
      17 |     await expect(page.getByRole("heading", { name: "Fotos da Época" })).toBeVisible({ timeout: 20_000 });
    > 18 |     await expect(page.getByText("1 fotos selecionadas pela organização", { exact: true })).toBeVisible();
         |                                                                                            ^
      19 |     await page.getByRole("img", { name: "Gincana no pátio" }).first().click();
      20 |
      21 |     await expect(page).toHaveURL(/\/foto$/);
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/photo-interactions-flow.spec.ts:18:92

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis/trace.zip
    Usage:

        npx playwright show-trace test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator:  getByText('1 fotos selecionadas pela organização', { exact: true })
    Expected: visible
    Received: hidden
    Timeout:  5000ms

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('1 fotos selecionadas pela organização', { exact: true })
        14 × locator resolved to <p data-history-photo-counter-hidden="true" class="text-[#7a9a7a] mt-2 font-mono text-sm">1 fotos selecionadas pela organização</p>
           - unexpected value "hidden"


      16 |
      17 |     await expect(page.getByRole("heading", { name: "Fotos da Época" })).toBeVisible({ timeout: 20_000 });
    > 18 |     await expect(page.getByText("1 fotos selecionadas pela organização", { exact: true })).toBeVisible();
         |                                                                                            ^
      19 |     await page.getByRole("img", { name: "Gincana no pátio" }).first().click();
      20 |
      21 |     await expect(page).toHaveURL(/\/foto$/);
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/photo-interactions-flow.spec.ts:18:92

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator:  getByText('1 fotos selecionadas pela organização', { exact: true })
    Expected: visible
    Received: hidden
    Timeout:  5000ms

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('1 fotos selecionadas pela organização', { exact: true })
        14 × locator resolved to <p data-history-photo-counter-hidden="true" class="text-[#7a9a7a] mt-2 font-mono text-sm">1 fotos selecionadas pela organização</p>
           - unexpected value "hidden"


      16 |
      17 |     await expect(page.getByRole("heading", { name: "Fotos da Época" })).toBeVisible({ timeout: 20_000 });
    > 18 |     await expect(page.getByText("1 fotos selecionadas pela organização", { exact: true })).toBeVisible();
         |                                                                                            ^
      19 |     await page.getByRole("img", { name: "Gincana no pátio" }).first().click();
      20 |
      21 |     await expect(page).toHaveURL(/\/foto$/);
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/photo-interactions-flow.spec.ts:18:92

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/photo-interactions-flow-in-d06ad-s-de-privacidade-auditáveis-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/e2e/photo-interactions-flow.spec.ts:12:3 › interações em fotos › mantém escrita pendente e contratos de privacidade auditáveis 
```
