---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 75e6326c99dfd57fcbc062da57df95e5a019d9b6
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
    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for locator('label').filter({ hasText: 'Enviar sem mostrar meu nome' }).getByRole('button')


      31 |     await memoryField.fill("Lembro das conversas no corredor antes da primeira aula.");
      32 |     const anonymousControl = page.locator("label").filter({ hasText: "Enviar sem mostrar meu nome" }).getByRole("button");
    > 33 |     await anonymousControl.click();
         |                            ^
      34 |     await submitMemory.click();
      35 |
      36 |     await expect.poll(() => api.memoryCalls.length, { timeout: 20_000 }).toBe(1);
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:33:28

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  2) tests/e2e/engagement-flow.spec.ts:50:3 › memórias e enquetes › registra voto único e só exibe resultados depois da participação 

    Error: expect(locator).toHaveCount(expected) failed

    Locator:  getByText('Gincana', { exact: true })
    Expected: 0
    Received: 1
    Timeout:  5000ms

    Call log:
      - Expect "toHaveCount" with timeout 5000ms
      - waiting for getByText('Gincana', { exact: true })
        14 × locator resolved to 1 element
           - unexpected value "1"


      56 |     await expect(page.getByRole("heading", { name: "Qual lugar mais representa a turma?" })).toBeVisible();
      57 |     await expect(page.getByRole("heading", { name: "Qual tradição deve voltar no reencontro?" })).toHaveCount(0);
    > 58 |     await expect(page.getByText("Gincana", { exact: true })).toHaveCount(0);
         |                                                              ^
      59 |     await expect(page.getByText("Os resultados serão exibidos depois do seu voto.", { exact: true })).toBeVisible();
      60 |     await expect(page.getByText("2 votos", { exact: true })).toHaveCount(0);
      61 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:58:62

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

    Error: expect(locator).toHaveCount(expected) failed

    Locator:  getByText('Gincana', { exact: true })
    Expected: 0
    Received: 1
    Timeout:  5000ms

    Call log:
      - Expect "toHaveCount" with timeout 5000ms
      - waiting for getByText('Gincana', { exact: true })
        14 × locator resolved to 1 element
           - unexpected value "1"


      56 |     await expect(page.getByRole("heading", { name: "Qual lugar mais representa a turma?" })).toBeVisible();
      57 |     await expect(page.getByRole("heading", { name: "Qual tradição deve voltar no reencontro?" })).toHaveCount(0);
    > 58 |     await expect(page.getByText("Gincana", { exact: true })).toHaveCount(0);
         |                                                              ^
      59 |     await expect(page.getByText("Os resultados serão exibidos depois do seu voto.", { exact: true })).toBeVisible();
      60 |     await expect(page.getByText("2 votos", { exact: true })).toHaveCount(0);
      61 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:58:62

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

    Error: expect(locator).toHaveCount(expected) failed

    Locator:  getByText('Gincana', { exact: true })
    Expected: 0
    Received: 1
    Timeout:  5000ms

    Call log:
      - Expect "toHaveCount" with timeout 5000ms
      - waiting for getByText('Gincana', { exact: true })
        14 × locator resolved to 1 element
           - unexpected value "1"


      56 |     await expect(page.getByRole("heading", { name: "Qual lugar mais representa a turma?" })).toBeVisible();
      57 |     await expect(page.getByRole("heading", { name: "Qual tradição deve voltar no reencontro?" })).toHaveCount(0);
    > 58 |     await expect(page.getByText("Gincana", { exact: true })).toHaveCount(0);
         |                                                              ^
      59 |     await expect(page.getByText("Os resultados serão exibidos depois do seu voto.", { exact: true })).toBeVisible();
      60 |     await expect(page.getByText("2 votos", { exact: true })).toHaveCount(0);
      61 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:58:62

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
    tests/e2e/engagement-flow.spec.ts:50:3 › memórias e enquetes › registra voto único e só exibe resultados depois da participação 
```
