---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
superseded_by:
  - docs/40-runbooks/migrations.md
  - docs/40-runbooks/deploy-edge-functions.md
  - docs/40-runbooks/validacao-de-pagamentos.md
source_files:
  - supabase/migrations/
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
---

# Execução manual no Supabase — Checkout Pro

> **Procedimento substituído.** Não execute migrations individuais no SQL Editor para representar o estado atual do checkout. O banco vigente depende do replay integral e ordenado de `supabase/migrations/`. Use os runbooks de [migrations](../../docs/40-runbooks/migrations.md), [deploy de Edge Functions](../../docs/40-runbooks/deploy-edge-functions.md) e [validação de pagamentos](../../docs/40-runbooks/validacao-de-pagamentos.md).

## Contexto histórico

Este arquivo foi criado quando o checkout comercial ainda era aplicado manualmente em blocos. A sequência registrada era:

1. `20260716000001_ticketing_commerce_foundation.sql`;
2. `20260716000002_ticketing_commerce_functions.sql`;
3. `20260716000003_ticketing_commerce_rls.sql`;
4. arquivos intermediários de suporte ao checkout;
5. RPCs de criação e processamento de pagamento;
6. smoke test manual.

Essa sequência não representa todas as migrations posteriores, correções, substituições de RPC, compatibilidades e regras de segurança hoje existentes.

## Por que não usar este procedimento

- executar migrations isoladas pode produzir estado diferente do replay integral;
- alguns nomes e timestamps históricos foram reconciliados ou substituídos;
- migrations posteriores alteraram checkout, catálogo, idempotência, pagamentos, notificações e administração;
- o smoke test antigo não cobre os testes SQL atuais;
- comandos sem `--project-ref` podem publicar no projeto errado;
- secrets e funções vigentes abrangem mais componentes que os listados originalmente.

## Regras atuais

1. Execute `npm run audit:migrations`.
2. Inicie uma stack Supabase local.
3. Execute `npx supabase db reset --local`.
4. Rode todos os testes SQL em `supabase/tests/`.
5. Compare o histórico local e remoto.
6. Aplique mudanças remotas somente conforme o runbook vigente.
7. Publique as Edge Functions pelos scripts npm com project ref fixo.
8. Nunca copie tokens ou secrets para documentos, logs ou commits.

## Uso permitido deste arquivo

Este texto permanece apenas como registro da fase de implantação manual. Não deve ser usado como checklist de produção, recuperação, implantação ou reparo do checkout.