---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: 227c1da2bea73316877b32a2d075348de27c2531
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
| Build da aplicação | `npm run build` | `skipped` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `skipped` |
| E2E de autorização e operação | `npx playwright test tests/e2e/operations-flow.spec.ts --workers=1` | `skipped` |

## Cobertura funcional

- visitante sem sessão é redirecionado para o login;
- somente `superadmin`, `admin` e `checkin_staff` entram na rota standalone;
- `checkin_staff` registra e desfaz entrada, além de controlar vouchers;
- `checkin_staff` não recebe a aba de reembolsos nem indicadores financeiros;
- `admin` e `superadmin` recebem reembolsos e indicadores;
- chamadas operacionais enviam os argumentos esperados às RPCs.

## Interpretação

A execução encontrou regressão operacional. O diagnóstico abaixo deve ser resolvido antes de promover a proteção e o runbook.
