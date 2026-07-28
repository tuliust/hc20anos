---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: eb956992069e064ce5589d42b630137b2a21649e
generation_command: GitHub Actions / Engagement functional tests
source_files:
  - index.html
  - playwright.config.ts
  - tests/e2e/engagement-flow.spec.ts
  - tests/e2e/engagement-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/App.tsx
  - src/historyContentEnhancements.ts
  - src/memoryAnonymityEnhancement.ts
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
- o controle de anonimato permanece visível e acessível como `switch`;
- memória curta é rejeitada antes da escrita;
- nova memória é enviada como `pending` para moderação;
- enquete aberta permite voto de usuário autenticado;
- voto único remove seleção anterior antes da nova inserção;
- resultados ficam ocultos antes da participação;
- enquete fechada não aceita voto.

## Interpretação

A execução automatizada com fixtures HTTP isoladas foi aprovada. Ela comprova apresentação, privacidade e contratos de escrita, mas não substitui RLS, triggers, moderação ou controles de abuso em ambiente integrado.

## Diagnóstico E2E

```text

Running 2 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✓  1 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (4.3s)
  ✓  2 tests/e2e/engagement-flow.spec.ts:53:3 › memórias e enquetes › registra voto único e impede novo voto em enquete fechada (1.3s)

  2 passed (8.2s)
```
