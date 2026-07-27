---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 35dd8a7d03505855d9c1dbb2cfdc0b1f487c2248
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
| E2E de memórias e enquetes | `npx playwright test tests/e2e/engagement-flow.spec.ts --workers=1` | `failure` |

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

A execução encontrou regressão. O diagnóstico abaixo deve ser resolvido antes de considerar memórias e enquetes validadas.

## Diagnóstico E2E

```text

Running 2 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✘  1 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (9.8s)
  ✘  2 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (retry #1) (6.5s)
  ✘  3 tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação (retry #2) (6.5s)
  ✓  4 tests/e2e/engagement-flow.spec.ts:53:3 › memórias e enquetes › registra voto único e impede novo voto em enquete fechada (1.6s)


  1) tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação 

    Error: expect(locator).toHaveAttribute(expected) failed

    Locator:  getByRole('switch', { name: 'Enviar sem mostrar meu nome' })
    Expected: "true"
    Received: "false"
    Timeout:  5000ms

    Call log:
      - Expect "toHaveAttribute" with timeout 5000ms
      - waiting for getByRole('switch', { name: 'Enviar sem mostrar meu nome' })
        - locator resolved to <button type="button" role="switch" aria-checked="false" aria-label="Enviar sem mostrar meu nome" class="relative w-12 h-6 transition-colors bg-[#2d6a4f]">…</button>
        13 × unexpected value "false"
           - locator resolved to <button type="button" role="switch" aria-checked="false" aria-label="Enviar sem mostrar meu nome" class="relative w-12 h-6 transition-colors bg-[#1a2e1a] border border-[#2d6a4f]/30">…</button>
        - unexpected value "false"


      34 |     await expect(anonymousControl).toHaveAttribute("aria-checked", "false");
      35 |     await anonymousControl.click();
    > 36 |     await expect(anonymousControl).toHaveAttribute("aria-checked", "true");
         |                                    ^
      37 |     await submitMemory.click();
      38 |
      39 |     await expect.poll(() => api.memoryCalls.length, { timeout: 20_000 }).toBe(1);
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:36:36

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toHaveAttribute(expected) failed

    Locator:  getByRole('switch', { name: 'Enviar sem mostrar meu nome' })
    Expected: "true"
    Received: "false"
    Timeout:  5000ms

    Call log:
      - Expect "toHaveAttribute" with timeout 5000ms
      - waiting for getByRole('switch', { name: 'Enviar sem mostrar meu nome' })
        14 × locator resolved to <button type="button" role="switch" aria-checked="false" aria-label="Enviar sem mostrar meu nome" class="relative w-12 h-6 transition-colors bg-[#1a2e1a] border border-[#2d6a4f]/30">…</button>
           - unexpected value "false"


      34 |     await expect(anonymousControl).toHaveAttribute("aria-checked", "false");
      35 |     await anonymousControl.click();
    > 36 |     await expect(anonymousControl).toHaveAttribute("aria-checked", "true");
         |                                    ^
      37 |     await submitMemory.click();
      38 |
      39 |     await expect.poll(() => api.memoryCalls.length, { timeout: 20_000 }).toBe(1);
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:36:36

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

    Error: expect(locator).toHaveAttribute(expected) failed

    Locator:  getByRole('switch', { name: 'Enviar sem mostrar meu nome' })
    Expected: "true"
    Received: "false"
    Timeout:  5000ms

    Call log:
      - Expect "toHaveAttribute" with timeout 5000ms
      - waiting for getByRole('switch', { name: 'Enviar sem mostrar meu nome' })
        - locator resolved to <button type="button" role="switch" aria-checked="false" aria-label="Enviar sem mostrar meu nome" class="relative w-12 h-6 transition-colors bg-[#2d6a4f]">…</button>
        13 × unexpected value "false"
           - locator resolved to <button type="button" role="switch" aria-checked="false" aria-label="Enviar sem mostrar meu nome" class="relative w-12 h-6 transition-colors bg-[#1a2e1a] border border-[#2d6a4f]/30">…</button>
        - unexpected value "false"


      34 |     await expect(anonymousControl).toHaveAttribute("aria-checked", "false");
      35 |     await anonymousControl.click();
    > 36 |     await expect(anonymousControl).toHaveAttribute("aria-checked", "true");
         |                                    ^
      37 |     await submitMemory.click();
      38 |
      39 |     await expect.poll(() => api.memoryCalls.length, { timeout: 20_000 }).toBe(1);
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:36:36

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação 
  1 passed (28.7s)
```
