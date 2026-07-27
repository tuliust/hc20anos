---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 652045c36c1afb9bac046f3600df24565cb4d3dc
generation_command: GitHub Actions / Commerce functional tests
source_files:
  - src/main.tsx
  - playwright.config.ts
  - tests/e2e/ticket-catalog-source-of-truth.spec.ts
  - tests/e2e/checkout-flow.spec.ts
  - tests/e2e/commerce-fixtures.ts
  - tests/e2e/home-fixtures.ts
  - tests/e2e/profile-claim-fixtures.ts
  - src/app/PublicTicketsCatalogMount.tsx
  - src/app/SecureCheckoutPage.tsx
  - src/lib/currentTicketCatalog.ts
  - src/lib/checkout.ts
  - src/lib/commerce.types.ts
---

# Testes funcionais de catálogo e checkout

> Relatório gerado pelo workflow `Commerce functional tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de catálogo e checkout | `npx playwright test tests/e2e/ticket-catalog-source-of-truth.spec.ts tests/e2e/checkout-flow.spec.ts --workers=1` | `failure` |

## Cobertura funcional

- Home e página de ingressos usam o mesmo catálogo vigente;
- nome do lote e preços em reais vêm das RPCs de catálogo;
- seleção do ingresso é preservada até o checkout;
- ingresso de ex-aluno exige perfil vinculado;
- termos são obrigatórios antes da criação do pagamento;
- requisição à API contém sessão, chave pública e chave de idempotência;
- nome e e-mail são normalizados antes do envio;
- o payload do navegador não envia preço, total ou tipo de ingresso como fonte de verdade;
- redirecionamento do provedor é simulado, sem chamada ao Mercado Pago.

## Interpretação

A execução encontrou regressão. O diagnóstico abaixo deve ser resolvido antes de considerar catálogo e checkout validados.

## Diagnóstico E2E

```text
         - retrying click action
           - waiting 500ms


      16 |     await expect(simpleCard).toContainText("2º LOTE ADMINISTRATIVO");
      17 |     await expect(simpleCard).toContainText("R$ 159,00");
    > 18 |     await simpleCard.getByRole("button", { name: "Comprar agora", exact: true }).click();
         |                                                                                  ^
      19 |
      20 |     await expect(page).toHaveURL(/\/checkout$/);
      21 |     await expect(page.getByRole("heading", { name: "Participantes e pagamento" })).toBeVisible({ timeout: 20_000 });
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:18:82

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado/trace.zip
    Usage:

        npx playwright show-trace test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for locator('[data-ticket-product-code="simple"]').getByRole('button', { name: 'Comprar agora', exact: true })
        - locator resolved to <button type="button" class="mt-auto flex min-h-14 w-full items-center justify-center bg-[#2d6a4f] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#f0ebe0] disabled:cursor-not-allowed disabled:opacity-50">Comprar agora</button>
      - attempting click action
        2 × waiting for element to be visible, enabled and stable
          - element is visible, enabled and stable
          - scrolling into view if needed
          - done scrolling
          - <div class="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">…</div> intercepts pointer events
        - retrying click action
        - waiting 20ms
        2 × waiting for element to be visible, enabled and stable
          - element is visible, enabled and stable
          - scrolling into view if needed
          - done scrolling
          - <div class="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">…</div> intercepts pointer events
        - retrying click action
          - waiting 100ms
        53 × waiting for element to be visible, enabled and stable
           - element is visible, enabled and stable
           - scrolling into view if needed
           - done scrolling
           - <div class="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">…</div> intercepts pointer events
         - retrying click action
           - waiting 500ms


      16 |     await expect(simpleCard).toContainText("2º LOTE ADMINISTRATIVO");
      17 |     await expect(simpleCard).toContainText("R$ 159,00");
    > 18 |     await simpleCard.getByRole("button", { name: "Comprar agora", exact: true }).click();
         |                                                                                  ^
      19 |
      20 |     await expect(page).toHaveURL(/\/checkout$/);
      21 |     await expect(page.getByRole("heading", { name: "Participantes e pagamento" })).toBeVisible({ timeout: 20_000 });
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:18:82

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for locator('[data-ticket-product-code="simple"]').getByRole('button', { name: 'Comprar agora', exact: true })
        - locator resolved to <button type="button" class="mt-auto flex min-h-14 w-full items-center justify-center bg-[#2d6a4f] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#f0ebe0] disabled:cursor-not-allowed disabled:opacity-50">Comprar agora</button>
      - attempting click action
        2 × waiting for element to be visible, enabled and stable
          - element is visible, enabled and stable
          - scrolling into view if needed
          - done scrolling
          - <div class="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">…</div> intercepts pointer events
        - retrying click action
        - waiting 20ms
        2 × waiting for element to be visible, enabled and stable
          - element is visible, enabled and stable
          - scrolling into view if needed
          - done scrolling
          - <div class="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">…</div> intercepts pointer events
        - retrying click action
          - waiting 100ms
        55 × waiting for element to be visible, enabled and stable
           - element is visible, enabled and stable
           - scrolling into view if needed
           - done scrolling
           - <div class="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">…</div> intercepts pointer events
         - retrying click action
           - waiting 500ms


      16 |     await expect(simpleCard).toContainText("2º LOTE ADMINISTRATIVO");
      17 |     await expect(simpleCard).toContainText("R$ 159,00");
    > 18 |     await simpleCard.getByRole("button", { name: "Comprar agora", exact: true }).click();
         |                                                                                  ^
      19 |
      20 |     await expect(page).toHaveURL(/\/checkout$/);
      21 |     await expect(page.getByRole("heading", { name: "Participantes e pagamento" })).toBeVisible({ timeout: 20_000 });
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:18:82

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/checkout-flow-catálogo-e-c-02afc-o-normalizado-e-autenticado-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/e2e/checkout-flow.spec.ts:9:3 › catálogo e checkout › seleciona o preço vigente e envia um pedido normalizado e autenticado 
  2 passed (1.7m)
```
