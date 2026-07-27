---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: a9b651f3605449bd4dd2bea313f4e2280b6e24d8
generation_command: GitHub Actions / Commerce functional tests
source_files:
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
| Build da aplicação | `npm run build` | `failure` |
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


      90 |
      91 |   await page.goto("/");
    > 92 |   await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
         |                                                    ^
      93 |
      94 |   const catalog = page.locator("[data-public-ticket-catalog-home='true']");
      95 |   await expect(catalog).toBeVisible();
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/ticket-catalog-source-of-truth.spec.ts:92:52

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-219c0-me-e-preços-do-lote-vigente-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/ticket-catalog-source-of-t-219c0-me-e-preços-do-lote-vigente-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-219c0-me-e-preços-do-lote-vigente-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/ticket-catalog-source-of-t-219c0-me-e-preços-do-lote-vigente-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  3) tests/e2e/ticket-catalog-source-of-truth.spec.ts:104:1 › Home e página de ingressos exibem o mesmo catálogo 

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('[data-public-ticket-catalog-home=\'true\']')
    Expected substring: "R$ 159,00"
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for locator('[data-public-ticket-catalog-home=\'true\']')


      107 |
      108 |   await page.goto("/");
    > 109 |   await expect(page.locator("[data-public-ticket-catalog-home='true']")).toContainText("R$ 159,00");
          |                                                                          ^
      110 |
      111 |   await page.goto("/ingressos");
      112 |   const catalog = page.locator("[data-public-ticket-catalog='true']");
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/ticket-catalog-source-of-truth.spec.ts:109:74

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo/trace.zip
    Usage:

        npx playwright show-trace test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('[data-public-ticket-catalog-home=\'true\']')
    Expected substring: "R$ 159,00"
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for locator('[data-public-ticket-catalog-home=\'true\']')


      107 |
      108 |   await page.goto("/");
    > 109 |   await expect(page.locator("[data-public-ticket-catalog-home='true']")).toContainText("R$ 159,00");
          |                                                                          ^
      110 |
      111 |   await page.goto("/ingressos");
      112 |   const catalog = page.locator("[data-public-ticket-catalog='true']");
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/ticket-catalog-source-of-truth.spec.ts:109:74

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('[data-public-ticket-catalog-home=\'true\']')
    Expected substring: "R$ 159,00"
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for locator('[data-public-ticket-catalog-home=\'true\']')


      107 |
      108 |   await page.goto("/");
    > 109 |   await expect(page.locator("[data-public-ticket-catalog-home='true']")).toContainText("R$ 159,00");
          |                                                                          ^
      110 |
      111 |   await page.goto("/ingressos");
      112 |   const catalog = page.locator("[data-public-ticket-catalog='true']");
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/ticket-catalog-source-of-truth.spec.ts:109:74

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/ticket-catalog-source-of-t-5470d-sos-exibem-o-mesmo-catálogo-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  3 failed
    tests/e2e/checkout-flow.spec.ts:9:3 › catálogo e checkout › seleciona o preço vigente e envia um pedido normalizado e autenticado 
    tests/e2e/ticket-catalog-source-of-truth.spec.ts:87:1 › Home usa nome e preços do lote vigente ─
    tests/e2e/ticket-catalog-source-of-truth.spec.ts:104:1 › Home e página de ingressos exibem o mesmo catálogo 
```
