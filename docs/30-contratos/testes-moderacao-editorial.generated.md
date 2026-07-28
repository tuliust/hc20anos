---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: 227c1da2bea73316877b32a2d075348de27c2531
generation_command: GitHub Actions / Editorial moderation functional tests
source_files:
  - playwright.config.ts
  - tests/e2e/editorial-moderation-flow.spec.ts
  - tests/e2e/editorial-moderation-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/App.tsx
  - src/lib/services.ts
  - src/lib/engagement.types.ts
  - src/lib/photo.types.ts
---

# Testes funcionais de moderação editorial

> Relatório gerado pelo workflow `Editorial moderation functional tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação | `npm run build` | `skipped` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `skipped` |
| E2E de moderação editorial | `npx playwright test tests/e2e/editorial-moderation-flow.spec.ts --workers=1` | `skipped` |

## Cobertura funcional

- somente usuário administrativo entra nas filas editoriais;
- memória anônima não revela a autoria protegida na fila;
- aprovação de memória envia status, administrador e timestamp;
- rejeição de comentário envia status e limpa aprovação anterior;
- itens deixam a fila pendente depois da transição;
- cada decisão cria registro de auditoria com entidade e identificador.

## Interpretação

A execução encontrou regressão. O diagnóstico abaixo deve ser resolvido antes de considerar a moderação editorial validada.
