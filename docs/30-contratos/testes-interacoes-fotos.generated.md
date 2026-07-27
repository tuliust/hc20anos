---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: f0c6fa7f1e1641aaf53c24e0dc416f4a9f856cc3
generation_command: GitHub Actions / Photo interactions functional tests
source_files:
  - playwright.config.ts
  - tests/e2e/photo-interactions-flow.spec.ts
  - tests/e2e/photo-interactions-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/App.tsx
  - src/lib/services.ts
  - src/lib/photo.types.ts
---

# Testes funcionais de interações em fotos

> Relatório gerado pelo workflow `Photo interactions functional tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de interações em fotos | `npx playwright test tests/e2e/photo-interactions-flow.spec.ts --workers=1` | `failure` |

## Cobertura funcional

- galeria pública carrega foto aprovada e selecionada pela organização;
- detalhe exibe comentário aprovado e contadores agregados;
- curtida autenticada envia somente foto e usuário;
- novo comentário é enviado como `pending`;
- nova marcação é enviada como `pending`;
- solicitação de remoção registra motivo e identidade autenticada;
- nenhuma dessas escritas publica conteúdo diretamente.

## Interpretação

A execução encontrou regressão. O diagnóstico abaixo deve ser resolvido antes de considerar as interações em fotos validadas.

## Diagnóstico E2E

```text

Running 1 test using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✘  1 tests/e2e/photo-interactions-flow.spec.ts:10:3 › interações em fotos › mantém escritas pendentes e permite marcar pessoa elegível (30.2s)
  ✘  2 tests/e2e/photo-interactions-flow.spec.ts:10:3 › interações em fotos › mantém escritas pendentes e permite marcar pessoa elegível (retry #1) (30.3s)
  ✘  3 tests/e2e/photo-interactions-flow.spec.ts:10:3 › interações em fotos › mantém escritas pendentes e permite marcar pessoa elegível (retry #2) (30.2s)


  1) tests/e2e/photo-interactions-flow.spec.ts:10:3 › interações em fotos › mantém escritas pendentes e permite marcar pessoa elegível 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('button', { name: 'João Vitor Melo', exact: true })


      44 |
      45 |     await page.getByPlaceholder("Marcar alguém da turma...").fill("João");
    > 46 |     await page.getByRole("button", { name: "João Vitor Melo", exact: true }).click();
         |                                                                              ^
      47 |     await expect.poll(() => api.tagCalls.length, { timeout: 20_000 }).toBe(1);
      48 |     await expect(page.getByText("Marcação enviada para moderação.", { exact: true })).toBeVisible();
      49 |     expect(api.tagCalls[0]).toMatchObject({
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/photo-interactions-flow.spec.ts:46:78

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível/trace.zip
    Usage:

        npx playwright show-trace test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('button', { name: 'João Vitor Melo', exact: true })


      44 |
      45 |     await page.getByPlaceholder("Marcar alguém da turma...").fill("João");
    > 46 |     await page.getByRole("button", { name: "João Vitor Melo", exact: true }).click();
         |                                                                              ^
      47 |     await expect.poll(() => api.tagCalls.length, { timeout: 20_000 }).toBe(1);
      48 |     await expect(page.getByText("Marcação enviada para moderação.", { exact: true })).toBeVisible();
      49 |     expect(api.tagCalls[0]).toMatchObject({
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/photo-interactions-flow.spec.ts:46:78

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('button', { name: 'João Vitor Melo', exact: true })


      44 |
      45 |     await page.getByPlaceholder("Marcar alguém da turma...").fill("João");
    > 46 |     await page.getByRole("button", { name: "João Vitor Melo", exact: true }).click();
         |                                                                              ^
      47 |     await expect.poll(() => api.tagCalls.length, { timeout: 20_000 }).toBe(1);
      48 |     await expect(page.getByText("Marcação enviada para moderação.", { exact: true })).toBeVisible();
      49 |     expect(api.tagCalls[0]).toMatchObject({
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/photo-interactions-flow.spec.ts:46:78

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/photo-interactions-flow-in-745c8-mite-marcar-pessoa-elegível-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/e2e/photo-interactions-flow.spec.ts:10:3 › interações em fotos › mantém escritas pendentes e permite marcar pessoa elegível 
```
