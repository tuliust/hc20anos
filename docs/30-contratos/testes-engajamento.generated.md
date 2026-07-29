---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: e4faaa0787c1b8dd5149e9ce288f0ce6d6281e3d
generation_command: GitHub Actions / Engagement functional tests
source_files:
  - index.html
  - playwright.config.ts
  - tests/e2e/engagement-flow.spec.ts
  - tests/e2e/engagement-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/App.tsx
  - src/historyContentEnhancements.ts
  - src/lib/services.ts
  - src/lib/engagement.types.ts
---

# Testes funcionais de memórias e enquetes

> Relatório gerado pelo workflow `Engagement functional tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de memórias e enquetes | `npx playwright test tests/e2e/engagement-flow.spec.ts --workers=1` | `success` |

## Cobertura funcional

- somente memórias aprovadas são carregadas na página pública;
- memória anônima não exibe o nome administrativo do autor;
- o controle de anonimato pertence ao componente React e permanece acessível como `switch`;
- memória curta é rejeitada antes da escrita;
- nova memória é enviada como `pending` para moderação;
- enquete aberta permite voto de usuário autenticado;
- voto único remove seleção anterior antes da nova inserção;
- resultados ficam ocultos antes da participação;
- enquete fechada não aceita voto.

## Interpretação

A execução automatizada com fixtures HTTP isoladas foi aprovada. Ela comprova apresentação, privacidade e contratos de escrita. A validação integrada de RLS, sanitização, rate limiting e concorrência pertence ao workflow Phase 2 content and Storage.

## Diagnóstico E2E

```text

Running 2 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✓  1 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (4.8s)
  ✓  2 tests/e2e/engagement-flow.spec.ts:53:3 › memórias e enquetes › registra voto único e impede novo voto em enquete fechada (1.4s)

  2 passed (8.6s)
```
