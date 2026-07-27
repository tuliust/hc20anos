---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: c4edec2a1f62ac0f5200261024bea5873a65c687
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
| Build da aplicação | `npm run build` | `failure` |
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


      15 |     await page.goto("/admin/operacao");
      16 |
    > 17 |     await expect(page.getByRole("heading", { name: "Check-in", exact: true })).toBeVisible({ timeout: 20_000 });
         |                                                                                ^
      18 |     await expect(page.getByRole("button", { name: "Reembolsos", exact: true })).toHaveCount(0);
      19 |     await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toHaveCount(0);
      20 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/operations-flow.spec.ts:17:80

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-2de6c-ração-de-entrada-e-vouchers-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/operations-flow-operação-d-2de6c-ração-de-entrada-e-vouchers-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-2de6c-ração-de-entrada-e-vouchers-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/operations-flow-operação-d-2de6c-ração-de-entrada-e-vouchers-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  3) tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Check-in e reembolsos', exact: true })
    Expected: visible
    Timeout: 20000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 20000ms
      - waiting for getByRole('heading', { name: 'Check-in e reembolsos', exact: true })


      48 |     await page.goto("/admin/checkin");
      49 |
    > 50 |     await expect(page.getByRole("heading", { name: "Check-in e reembolsos", exact: true })).toBeVisible({ timeout: 20_000 });
         |                                                                                             ^
      51 |     await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toBeVisible();
      52 |     await expect(page.getByText("40%", { exact: true })).toBeVisible();
      53 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/operations-flow.spec.ts:50:93

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

    Locator: getByRole('heading', { name: 'Check-in e reembolsos', exact: true })
    Expected: visible
    Timeout: 20000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 20000ms
      - waiting for getByRole('heading', { name: 'Check-in e reembolsos', exact: true })


      48 |     await page.goto("/admin/checkin");
      49 |
    > 50 |     await expect(page.getByRole("heading", { name: "Check-in e reembolsos", exact: true })).toBeVisible({ timeout: 20_000 });
         |                                                                                             ^
      51 |     await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toBeVisible();
      52 |     await expect(page.getByText("40%", { exact: true })).toBeVisible();
      53 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/operations-flow.spec.ts:50:93

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

    Locator: getByRole('heading', { name: 'Check-in e reembolsos', exact: true })
    Expected: visible
    Timeout: 20000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 20000ms
      - waiting for getByRole('heading', { name: 'Check-in e reembolsos', exact: true })


      48 |     await page.goto("/admin/checkin");
      49 |
    > 50 |     await expect(page.getByRole("heading", { name: "Check-in e reembolsos", exact: true })).toBeVisible({ timeout: 20_000 });
         |                                                                                             ^
      51 |     await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toBeVisible();
      52 |     await expect(page.getByText("40%", { exact: true })).toBeVisible();
      53 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/operations-flow.spec.ts:50:93

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/operations-flow-operação-d-b4a04-dicadores-restritos-a-admin-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  3 failed
    tests/e2e/operations-flow.spec.ts:8:3 › operação do evento › redireciona visitante sem sessão para o login 
    tests/e2e/operations-flow.spec.ts:13:3 › operação do evento › restringe checkin_staff à operação de entrada e vouchers 
    tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin 
```
