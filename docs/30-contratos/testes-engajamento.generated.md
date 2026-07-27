---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 03d9df76f5dd0d7f5f942bf591660abdb86fe84a
generation_command: GitHub Actions / Engagement functional tests
source_files:
  - playwright.config.ts
  - tests/e2e/engagement-flow.spec.ts
  - tests/e2e/engagement-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/App.tsx
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
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: locator('label').filter({ hasText: 'Enviar sem mostrar meu nome' }).locator('input[type="checkbox"]')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for locator('label').filter({ hasText: 'Enviar sem mostrar meu nome' }).locator('input[type="checkbox"]')


      31 |     await memoryField.fill("Lembro das conversas no corredor antes da primeira aula.");
      32 |     const anonymousControl = page.locator("label").filter({ hasText: "Enviar sem mostrar meu nome" }).locator('input[type="checkbox"]');
    > 33 |     await expect(anonymousControl).toBeVisible();
         |                                    ^
      34 |     await anonymousControl.check();
      35 |     await submitMemory.click();
      36 |
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:33:36

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-99200-ria-pendente-para-moderação-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  2) tests/e2e/engagement-flow.spec.ts:51:3 › memórias e enquetes › registra voto único e impede novo voto em enquete fechada 

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('2 votos', { exact: true })
    Expected: visible
    Error: strict mode violation: getByText('2 votos', { exact: true }) resolved to 2 elements:
        1) <span class="text-[#7a9a7a] font-mono text-xs">2 votos</span> aka getByRole('button', { name: 'Pátio da escola 2 votos 50%' })
        2) <span class="text-[#7a9a7a] font-mono text-xs">2 votos</span> aka getByRole('button', { name: 'Corredor principal 2 votos 50%' })

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('2 votos', { exact: true })


      67 |     await expect.poll(() => api.pollVoteDeletes, { timeout: 20_000 }).toBe(1);
      68 |     await expect(page.getByText("Voto registrado.", { exact: true })).toBeVisible();
    > 69 |     await expect(page.getByText("2 votos", { exact: true })).toBeVisible();
         |                                                              ^
      70 |
      71 |     expect(api.pollVoteCalls[0]).toMatchObject({
      72 |       poll_id: TEST_POLL_ID,
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:69:62

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('2 votos', { exact: true })
    Expected: visible
    Error: strict mode violation: getByText('2 votos', { exact: true }) resolved to 2 elements:
        1) <span class="text-[#7a9a7a] font-mono text-xs">2 votos</span> aka getByRole('button', { name: 'Pátio da escola 2 votos 50%' })
        2) <span class="text-[#7a9a7a] font-mono text-xs">2 votos</span> aka getByRole('button', { name: 'Corredor principal 2 votos 50%' })

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('2 votos', { exact: true })


      67 |     await expect.poll(() => api.pollVoteDeletes, { timeout: 20_000 }).toBe(1);
      68 |     await expect(page.getByText("Voto registrado.", { exact: true })).toBeVisible();
    > 69 |     await expect(page.getByText("2 votos", { exact: true })).toBeVisible();
         |                                                              ^
      70 |
      71 |     expect(api.pollVoteCalls[0]).toMatchObject({
      72 |       poll_id: TEST_POLL_ID,
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:69:62

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('2 votos', { exact: true })
    Expected: visible
    Error: strict mode violation: getByText('2 votos', { exact: true }) resolved to 2 elements:
        1) <span class="text-[#7a9a7a] font-mono text-xs">2 votos</span> aka getByRole('button', { name: 'Pátio da escola 2 votos 50%' })
        2) <span class="text-[#7a9a7a] font-mono text-xs">2 votos</span> aka getByRole('button', { name: 'Corredor principal 2 votos 50%' })

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByText('2 votos', { exact: true })


      67 |     await expect.poll(() => api.pollVoteDeletes, { timeout: 20_000 }).toBe(1);
      68 |     await expect(page.getByText("Voto registrado.", { exact: true })).toBeVisible();
    > 69 |     await expect(page.getByText("2 votos", { exact: true })).toBeVisible();
         |                                                              ^
      70 |
      71 |     expect(api.pollVoteCalls[0]).toMatchObject({
      72 |       poll_id: TEST_POLL_ID,
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/engagement-flow.spec.ts:69:62

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/engagement-flow-memórias-e-1203c-ovo-voto-em-enquete-fechada-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  2 failed
    tests/e2e/engagement-flow.spec.ts:10:3 › memórias e enquetes › preserva anonimato público e envia memória pendente para moderação 
    tests/e2e/engagement-flow.spec.ts:51:3 › memórias e enquetes › registra voto único e impede novo voto em enquete fechada 
```
