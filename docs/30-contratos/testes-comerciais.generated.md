---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 1231cf9b78d19ba709dcab93fa1f81c5f22c3b9e
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

Running 3 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✘  1 tests/e2e/checkout-flow.spec.ts:9:3 › catálogo e checkout › seleciona o preço vigente e envia um pedido normalizado e autenticado (21.9s)
  ✘  2 tests/e2e/checkout-flow.spec.ts:9:3 › catálogo e checkout › seleciona o preço vigente e envia um pedido normalizado e autenticado (retry #1) (21.1s)
  ✘  3 tests/e2e/checkout-flow.spec.ts:9:3 › catálogo e checkout › seleciona o preço vigente e envia um pedido normalizado e autenticado (retry #2) (20.9s)
  ✓  4 tests/e2e/ticket-catalog-source-of-truth.spec.ts:88:1 › Home usa nome e preços do lote vigente (1.3s)
  ✓  5 tests/e2e/ticket-catalog-source-of-truth.spec.ts:105:1 › Home e página de ingressos exibem o mesmo catálogo (1.7s)


  1) tests/e2e/checkout-flow.spec.ts:9:3 › catálogo e checkout › seleciona o preço vigente e envia um pedido normalizado e autenticado 

    Error: expect(locator).toBeVisible() failed

    Locator: locator('[data-ticket-product-code="simple"]')
    Expected: visible
    Timeout: 20000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 20000ms
      - waiting for locator('[data-ticket-product-code="simple"]')


      13 |
      14 |     const simpleCard = page.locator('[data-ticket-product-code="simple"]');
    > 15 |     await expect(simpleCard).toBeVisible({ timeout: 20_000 });
         |                              ^
      16 |     await expect(simpleCard).toContainText("2º LOTE ADMINISTRATIVO");
      17 |     await expect(simpleCard).toContainText("R$ 159,00");
      18 |     await simpleCard.getByRole("button", { name: "Comprar agora", exact: true }).click();
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:15:30

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

    Error: expect(locator).toBeVisible() failed

    Locator: locator('[data-ticket-product-code="simple"]')
    Expected: visible
    Timeout: 20000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 20000ms
      - waiting for locator('[data-ticket-product-code="simple"]')


      13 |
      14 |     const simpleCard = page.locator('[data-ticket-product-code="simple"]');
    > 15 |     await expect(simpleCard).toBeVisible({ timeout: 20_000 });
         |                              ^
      16 |     await expect(simpleCard).toContainText("2º LOTE ADMINISTRATIVO");
      17 |     await expect(simpleCard).toContainText("R$ 159,00");
      18 |     await simpleCard.getByRole("button", { name: "Comprar agora", exact: true }).click();
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:15:30

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

    Error: expect(locator).toBeVisible() failed

    Locator: locator('[data-ticket-product-code="simple"]')
    Expected: visible
    Timeout: 20000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 20000ms
      - waiting for locator('[data-ticket-product-code="simple"]')


      13 |
      14 |     const simpleCard = page.locator('[data-ticket-product-code="simple"]');
    > 15 |     await expect(simpleCard).toBeVisible({ timeout: 20_000 });
         |                              ^
      16 |     await expect(simpleCard).toContainText("2º LOTE ADMINISTRATIVO");
      17 |     await expect(simpleCard).toContainText("R$ 159,00");
      18 |     await simpleCard.getByRole("button", { name: "Comprar agora", exact: true }).click();
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:15:30

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
  2 passed (1.2m)
```
