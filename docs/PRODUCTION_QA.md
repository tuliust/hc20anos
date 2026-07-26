---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: b825583ee87b5f6405f28b78a2377d4ba5f02feb
superseded_by:
  - docs/40-runbooks/validacao-de-pagamentos.md
  - docs/40-runbooks/deploy-vercel.md
  - docs/40-runbooks/deploy-edge-functions.md
---

# QA operacional de produção — referência depreciada

Este checklist foi substituído por runbooks alinhados ao checkout e à arquitetura atuais.

## Referências vigentes

- [`40-runbooks/validacao-de-pagamentos.md`](./40-runbooks/validacao-de-pagamentos.md)
- [`40-runbooks/deploy-vercel.md`](./40-runbooks/deploy-vercel.md)
- [`40-runbooks/deploy-edge-functions.md`](./40-runbooks/deploy-edge-functions.md)
- [`40-runbooks/rollback.md`](./40-runbooks/rollback.md)

## Motivo da substituição

A versão anterior ainda descrevia:

- seleção por `ticket_type_id`;
- retorno por `?checkout=...&order=...`;
- botão direcionado genericamente a `my-ticket`;
- um fluxo anterior ao proxy `/api/checkout-create` e ao uso de `public_token`.

O checkout vigente usa `product_code`, participantes estruturados, autenticação, chave de idempotência, proxy Vercel, Edge Function dedicada e consulta pública por token.

## Conteúdo ainda relevante

Os seguintes princípios foram incorporados aos runbooks atuais:

- testar pagamento aprovado, pendente, recusado, expirado e duplicado;
- não duplicar tickets em webhook repetido;
- verificar envio ou falha controlada de e-mail;
- validar QR Code e fallback textual;
- testar check-in válido, já utilizado, pendente e não encontrado;
- testar responsividade e operação em navegador móvel;
- mascarar dados pessoais em evidências.

## Limite de autoridade

Este arquivo permanece somente como rastreabilidade. Não use seus nomes de campos, rotas ou parâmetros como contrato vigente.