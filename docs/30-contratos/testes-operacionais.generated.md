---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: 39f723afddcac504bbdfbdb856b665b090324089
generation_command: GitHub Actions / Operations functional tests
source_files:
  - playwright.config.ts
  - tests/e2e/operations-flow.spec.ts
  - tests/e2e/operations-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/main.tsx
  - src/app/OperationsRouteGuard.tsx
  - src/app/OperationsPage.tsx
  - src/app/OperationsReportingPanel.tsx
  - src/app/CheckinScanner.tsx
  - docs/30-contratos/permissoes.md
---

# Testes funcionais da operação

> Relatório gerado pelo workflow `Operations functional tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de autorização e operação | `npx playwright test tests/e2e/operations-flow.spec.ts --workers=1` | `failure` |

## Cobertura funcional

- visitante sem sessão é redirecionado para o login;
- somente `superadmin`, `admin` e `checkin_staff` entram na rota standalone;
- `checkin_staff` registra e desfaz entrada, além de controlar vouchers;
- `checkin_staff` não recebe a aba de reembolsos nem indicadores financeiros;
- `admin` e `superadmin` recebem reembolsos e indicadores;
- chamadas operacionais enviam os argumentos esperados às RPCs.

## Interpretação

A execução encontrou regressão operacional. O diagnóstico abaixo deve ser resolvido antes de promover a proteção e o runbook.

## Diagnóstico E2E

```text

Running 3 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✓  1 tests/e2e/operations-flow.spec.ts:8:3 › operação do evento › redireciona visitante sem sessão para o login (1.4s)
  ✓  2 tests/e2e/operations-flow.spec.ts:13:3 › operação do evento › restringe checkin_staff à operação de entrada e vouchers (821ms)
  ✘  3 tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin (5.7s)
  ✘  4 tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin (retry #1) (5.9s)
  ✘  5 tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin (retry #2) (5.9s)


  1) tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin 

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('40%', { exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('40%', { exact: true })


      50 |     await expect(page.getByRole("heading", { name: "Check-in e reembolsos", exact: true })).toBeVisible({ timeout: 20_000 });
      51 |     await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toBeVisible();
    > 52 |     await expect(page.getByText("40%", { exact: true })).toBeVisible();
         |                                                          ^
      53 |
      54 |     await page.getByRole("button", { name: "Reembolsos", exact: true }).click();
      55 |     await expect(page.getByText("Participante não poderá comparecer.", { exact: true })).toBeVisible();
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/operations-flow.spec.ts:52:58

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin/trace.zip
    Usage:

        npx playwright show-trace test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('40%', { exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('40%', { exact: true })


      50 |     await expect(page.getByRole("heading", { name: "Check-in e reembolsos", exact: true })).toBeVisible({ timeout: 20_000 });
      51 |     await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toBeVisible();
    > 52 |     await expect(page.getByText("40%", { exact: true })).toBeVisible();
         |                                                          ^
      53 |
      54 |     await page.getByRole("button", { name: "Reembolsos", exact: true }).click();
      55 |     await expect(page.getByText("Participante não poderá comparecer.", { exact: true })).toBeVisible();
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/operations-flow.spec.ts:52:58

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('40%', { exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('40%', { exact: true })


      50 |     await expect(page.getByRole("heading", { name: "Check-in e reembolsos", exact: true })).toBeVisible({ timeout: 20_000 });
      51 |     await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toBeVisible();
    > 52 |     await expect(page.getByText("40%", { exact: true })).toBeVisible();
         |                                                          ^
      53 |
      54 |     await page.getByRole("button", { name: "Reembolsos", exact: true }).click();
      55 |     await expect(page.getByText("Participante não poderá comparecer.", { exact: true })).toBeVisible();
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/operations-flow.spec.ts:52:58

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin 
  2 passed (22.9s)
```
