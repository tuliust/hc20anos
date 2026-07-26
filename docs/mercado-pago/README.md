---
status: historical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
period: implementação e validação inicial do fluxo comercial
superseded_by:
  - docs/10-dominios/checkout-e-pagamentos.md
---

# Registros da implementação do Mercado Pago

Esta pasta preserva auditorias, planos e checklists produzidos durante a construção do fluxo comercial.

Os arquivos não possuem autoridade uniforme e não devem ser lidos como uma sequência operacional vigente.

## Conteúdo

| Arquivo | Natureza | Uso atual |
|---|---|---|
| `01-auditoria-e-plano.md` | Auditoria e plano inicial. | Contexto histórico dos riscos e do escopo planejado. |
| `02-backend-checkout-create.md` | Registro do primeiro incremento da Edge Function. | Evolução do contrato de checkout. |
| `03-admin-reporting-validation.md` | Checklist de validação de uma entrega administrativa. | Insumo para o futuro runbook de validação. |
| `04-operacao-e-deploy.md` | Procedimento operacional de uma fase anterior. | Insumo para os futuros runbooks de deploy e rollback. |

## Referência vigente

Consulte [`../10-dominios/checkout-e-pagamentos.md`](../10-dominios/checkout-e-pagamentos.md).

Para contratos exatos, prevalecem:

- `src/lib/checkout.ts`;
- `api/checkout-create.ts`;
- `supabase/functions/checkout-create/`;
- `supabase/functions/payment-webhook/`;
- `supabase/functions/notification-worker/`;
- `supabase/functions/refund-processor/`;
- o replay completo de `supabase/migrations/`;
- `supabase/tests/`.
