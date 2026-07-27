---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 9dd8be93dc99ecec8ca535605c4bf69016a62183
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
    +       "full_name": "claimant",
            "participant_type": "alumni",
    -       "person_id": "00000000-0000-4000-8000-000000000201",
    +       "phone": null,
            "user_id": "00000000-0000-4000-8000-000000000101",
          },
        ],
        "product_code": "simple",
      }

      53 |     expect(headers["idempotency-key"]).toBeTruthy();
      54 |
    > 55 |     expect(body).toMatchObject({
         |                  ^
      56 |       buyer_name: "Maria Cabeção",
      57 |       buyer_email: "claimant@example.com",
      58 |       buyer_phone: "84999999999",
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:55:18

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado/trace.zip
    Usage:

        npx playwright show-trace test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(received).toMatchObject(expected)

    - Expected  - 4
    + Received  + 6

      Object {
        "buyer_email": "claimant@example.com",
    -   "buyer_name": "Maria Cabeção",
    +   "buyer_name": "claimant",
        "buyer_phone": "84999999999",
        "participants": Array [
    -     ObjectContaining {
    +     Object {
    +       "birth_date": null,
    +       "client_key": "alumni-acafe162-9da8-4efd-959b-a246389e9af1",
            "email": "claimant@example.com",
    -       "full_name": "Maria Cabeção",
    +       "full_name": "claimant",
            "participant_type": "alumni",
    -       "person_id": "00000000-0000-4000-8000-000000000201",
    +       "phone": null,
            "user_id": "00000000-0000-4000-8000-000000000101",
          },
        ],
        "product_code": "simple",
      }

      53 |     expect(headers["idempotency-key"]).toBeTruthy();
      54 |
    > 55 |     expect(body).toMatchObject({
         |                  ^
      56 |       buyer_name: "Maria Cabeção",
      57 |       buyer_email: "claimant@example.com",
      58 |       buyer_phone: "84999999999",
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:55:18

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry1/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry1/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry1/trace.zip
    Usage:

        npx playwright show-trace test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(received).toMatchObject(expected)

    - Expected  - 4
    + Received  + 6

      Object {
        "buyer_email": "claimant@example.com",
    -   "buyer_name": "Maria Cabeção",
    +   "buyer_name": "claimant",
        "buyer_phone": "84999999999",
        "participants": Array [
    -     ObjectContaining {
    +     Object {
    +       "birth_date": null,
    +       "client_key": "alumni-57f7f8d3-e213-4d11-be22-a8026c38fa49",
            "email": "claimant@example.com",
    -       "full_name": "Maria Cabeção",
    +       "full_name": "claimant",
            "participant_type": "alumni",
    -       "person_id": "00000000-0000-4000-8000-000000000201",
    +       "phone": null,
            "user_id": "00000000-0000-4000-8000-000000000101",
          },
        ],
        "product_code": "simple",
      }

      53 |     expect(headers["idempotency-key"]).toBeTruthy();
      54 |
    > 55 |     expect(body).toMatchObject({
         |                  ^
      56 |       buyer_name: "Maria Cabeção",
      57 |       buyer_email: "claimant@example.com",
      58 |       buyer_phone: "84999999999",
        at /home/runner/work/hc20anos/hc20anos/tests/e2e/checkout-flow.spec.ts:55:18

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry2/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry2/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry2/trace.zip
    Usage:

        npx playwright show-trace test-results/checkout-flow-catálogo-e-c-91a75-o-normalizado-e-autenticado-retry2/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/e2e/checkout-flow.spec.ts:14:3 › catálogo e checkout › usa a seleção vigente e envia um pedido normalizado e autenticado 
  2 passed (18.7s)
```
