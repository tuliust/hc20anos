---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 47cc0e8901c216b91af2f3fbcc1a57b96d466284
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
| E2E de catálogo e checkout | `npx playwright test tests/e2e/ticket-catalog-source-of-truth.spec.ts tests/e2e/checkout-flow.spec.ts --workers=1` | `success` |

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

A execução automatizada com fixtures HTTP isoladas foi aprovada. Ela não substitui testes integrados com banco, provedor e webhook.

## Diagnóstico E2E

```text

Running 3 tests using 1 worker

[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
[WebServer] [BABEL] Note: The code generator has deoptimised the styling of /home/runner/work/hc20anos/hc20anos/src/app/App.tsx as it exceeds the max of 500KB.
  ✓  1 tests/e2e/checkout-flow.spec.ts:14:3 › catálogo e checkout › preserva o perfil vinculado e envia um pedido normalizado e autenticado (5.8s)
  ✓  2 tests/e2e/ticket-catalog-source-of-truth.spec.ts:88:1 › Home usa nome e preços do lote vigente (1.5s)
  ✓  3 tests/e2e/ticket-catalog-source-of-truth.spec.ts:105:1 › Home e página de ingressos exibem o mesmo catálogo (2.2s)

  3 passed (12.0s)
```
