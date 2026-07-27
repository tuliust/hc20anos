---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 95469d5a2bb1a8e4c6d885913f04e55b59c32396
generation_command: GitHub Actions / Functional regression tests
source_files:
  - package.json
  - playwright.config.ts
  - tests/unit/faq.test.mjs
  - tests/e2e/profile-claim-flow.spec.ts
  - tests/e2e/profile-claim-fixtures.ts
  - tests/e2e/faq-flow.spec.ts
  - tests/e2e/faq-fixtures.ts
  - src/lib/faq.ts
  - src/lib/faqPresentation.ts
  - src/lib/profileClaimIdentity.ts
  - src/app/home/HomeFaqSection.tsx
  - src/app/home/HomeFaqSectionLoader.tsx
  - src/app/admin/faq/
---

# Testes funcionais de perfil e FAQ

> Relatório gerado pelo workflow `Functional regression tests`. Não editar manualmente.

| Verificação | Comando | Resultado |
|---|---|---|
| Build da aplicação e verificadores de perfil | `npm run build` | `success` |
| Unitários do FAQ | `npm run test:faq` | `success` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `success` |
| E2E de perfil e FAQ | `npm run test:e2e:functional` | `success` |

## Cobertura funcional

- retomada da reivindicação após confirmação de e-mail e login;
- abertura administrativa de disputas e exibição de evidências atuais e legadas;
- geração de mini-bio por IA sem envio de data de nascimento, e-mail ou telefone;
- FAQ público estruturado com categorias, busca normalizada e expansão de respostas;
- exclusão da categoria `Dados e privacidade` da Home;
- fallback para `faq_items_json` quando não existem perguntas estruturadas.

## Interpretação

O resultado `success` comprova a execução automatizada com fixtures HTTP isoladas. Ele não substitui testes contra um ambiente integrado com autenticação, RLS e dados reais controlados.
