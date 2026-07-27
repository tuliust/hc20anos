---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: d2a6c0a50d00061cba03ec3454460a7024a9fcdf
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

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('button', { name: 'Enviar para moderação', exact: true })


      23 |     await expect(memoryField).toBeVisible();
      24 |     await memoryField.fill("Curta");
    > 25 |     await page.getByRole("button", { name: "Enviar para moderação", exact: true }).click();
         |                                                                                    ^
      26 |     await expect(page.getByText("Escreva uma memória com pelo menos 10 caracteres.", { exact: true })).toBeVisible();
      27 |     expect(api.memoryCalls).toHaveLength(0);
      28 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:25:84

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  2) tests/e2e/engagement-flow.spec.ts:48:3 › memórias e enquetes › registra voto único e só exibe resultados depois da participação 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Qual tradição deve voltar no reencontro?' })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByRole('heading', { name: 'Qual tradição deve voltar no reencontro?' })


      53 |     await expect(page.getByRole("heading", { name: "O raio-X da Turma 2006" })).toBeVisible({ timeout: 20_000 });
      54 |     await expect(page.getByRole("heading", { name: "Qual lugar mais representa a turma?" })).toBeVisible();
    > 55 |     await expect(page.getByRole("heading", { name: "Qual tradição deve voltar no reencontro?" })).toBeVisible();
         |                                                                                                   ^
      56 |     await expect(page.getByText("Os resultados serão exibidos depois do seu voto.", { exact: true })).toBeVisible();
      57 |     await expect(page.getByText("2 votos", { exact: true })).toHaveCount(0);
      58 |     const closedOption = page.getByText("Gincana", { exact: true }).locator("xpath=ancestor::button");
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:55:99

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Qual tradição deve voltar no reencontro?' })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByRole('heading', { name: 'Qual tradição deve voltar no reencontro?' })


      53 |     await expect(page.getByRole("heading", { name: "O raio-X da Turma 2006" })).toBeVisible({ timeout: 20_000 });
      54 |     await expect(page.getByRole("heading", { name: "Qual lugar mais representa a turma?" })).toBeVisible();
    > 55 |     await expect(page.getByRole("heading", { name: "Qual tradição deve voltar no reencontro?" })).toBeVisible();
         |                                                                                                   ^
      56 |     await expect(page.getByText("Os resultados serão exibidos depois do seu voto.", { exact: true })).toBeVisible();
      57 |     await expect(page.getByText("2 votos", { exact: true })).toHaveCount(0);
      58 |     const closedOption = page.getByText("Gincana", { exact: true }).locator("xpath=ancestor::button");
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:55:99

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Qual tradição deve voltar no reencontro?' })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByRole('heading', { name: 'Qual tradição deve voltar no reencontro?' })


      53 |     await expect(page.getByRole("heading", { name: "O raio-X da Turma 2006" })).toBeVisible({ timeout: 20_000 });
      54 |     await expect(page.getByRole("heading", { name: "Qual lugar mais representa a turma?" })).toBeVisible();
    > 55 |     await expect(page.getByRole("heading", { name: "Qual tradição deve voltar no reencontro?" })).toBeVisible();
         |                                                                                                   ^
      56 |     await expect(page.getByText("Os resultados serão exibidos depois do seu voto.", { exact: true })).toBeVisible();
      57 |     await expect(page.getByText("2 votos", { exact: true })).toHaveCount(0);
      58 |     const closedOption = page.getByText("Gincana", { exact: true }).locator("xpath=ancestor::button");
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:55:99

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-ae80e-ados-depois-da-participação-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  2 failed
    tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação 
    tests/e2e/engagement-flow.spec.ts:48:3 › memórias e enquetes › registra voto único e só exibe resultados depois da participação 
```
