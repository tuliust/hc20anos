---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 5705aca4f48bcc4cdf2085d8a41de8535d462e68
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
| Build da aplicação | `npm run build` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de catálogo e checkout | `npx playwright test tests/e2e/ticket-catalog-source-of-truth.spec.ts tests/e2e/checkout-flow.spec.ts` | `failure` |

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

O resultado `success` comprova a integração do frontend com fixtures HTTP isoladas. Não comprova criação real de preferência, webhook, reserva no banco, emissão de ingresso ou reconciliação financeira.
