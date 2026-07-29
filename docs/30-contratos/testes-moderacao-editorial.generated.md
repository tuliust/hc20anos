---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 47cc0e8901c216b91af2f3fbcc1a57b96d466284
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
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de moderação editorial | `npx playwright test tests/e2e/editorial-moderation-flow.spec.ts --workers=1` | `success` |

## Cobertura funcional

- somente usuário administrativo entra nas filas editoriais;
- memória anônima não revela a autoria protegida na fila;
- aprovação de memória envia status, administrador e timestamp;
- rejeição de comentário envia status e limpa aprovação anterior;
- itens deixam a fila pendente depois da transição;
- cada decisão cria registro de auditoria com entidade e identificador.

## Interpretação

A execução automatizada com fixtures HTTP isoladas foi aprovada. Ela comprova autorização de interface, filas, patches e auditoria, mas não substitui RLS, grants ou revisão humana em ambiente integrado.

## Diagnóstico E2E

```text

Running 2 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✓  1 tests/e2e/editorial-moderation-flow.spec.ts:9:3 › moderação editorial › aprova memória anônima sem revelar autoria pública (5.1s)
  ✓  2 tests/e2e/editorial-moderation-flow.spec.ts:37:3 › moderação editorial › rejeita comentário pendente e registra auditoria (1.4s)

  2 passed (8.9s)
```
