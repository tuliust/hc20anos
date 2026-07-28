---
status: generated
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: 227c1da2bea73316877b32a2d075348de27c2531
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
| Build da aplicação | `npm run build` | `skipped` |
| Instalação do Chromium | `npx playwright install --with-deps chromium` | `skipped` |
| E2E de interações em fotos | `npx playwright test tests/e2e/photo-interactions-flow.spec.ts --workers=1` | `skipped` |

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
