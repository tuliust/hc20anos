---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 8b8086f2d95ec4e6018bb854f2e8bed04d0d0f07
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
| E2E de autorização e operação | `npx playwright test tests/e2e/operations-flow.spec.ts --workers=1` | `success` |

## Cobertura funcional

- visitante sem sessão é redirecionado para o login;
- somente `superadmin`, `admin` e `checkin_staff` entram na rota standalone;
- `checkin_staff` registra e desfaz entrada, além de controlar vouchers;
- `checkin_staff` não recebe a aba de reembolsos nem indicadores financeiros;
- `admin` e `superadmin` recebem reembolsos e indicadores;
- chamadas operacionais enviam os argumentos esperados às RPCs.

## Interpretação

A proteção da rota e a segregação de funções foram aprovadas com fixtures isoladas. As RPCs e RLS continuam sendo a autoridade server-side.

## Diagnóstico E2E

```text

Running 3 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✓  1 tests/e2e/operations-flow.spec.ts:8:3 › operação do evento › redireciona visitante sem sessão para o login (2.9s)
  ✓  2 tests/e2e/operations-flow.spec.ts:13:3 › operação do evento › restringe checkin_staff à operação de entrada e vouchers (1.1s)
  ✓  3 tests/e2e/operations-flow.spec.ts:46:3 › operação do evento › mantém reembolsos e indicadores restritos a admin (987ms)

  3 passed (8.3s)
```
