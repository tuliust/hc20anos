---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
period: arquitetura agregada anterior ao fluxo checkout-create
superseded_by:
  - docs/10-dominios/checkout-e-pagamentos.md
---

# Pagamentos — referência legada do Mercado Pago

> [!CAUTION]
> Este documento descrevia a arquitetura anterior baseada em `supabase/functions/server/index.ts` e nas rotas `make-server-62fab262`. Esse não é o caminho canônico do checkout atual.
>
> A referência vigente está em [`10-dominios/checkout-e-pagamentos.md`](./10-dominios/checkout-e-pagamentos.md).

## Arquitetura atual resumida

```text
Frontend React
  -> POST /api/checkout-create
  -> Supabase Edge Function checkout-create
  -> RPC create_checkout_order
  -> Mercado Pago Checkout Pro

Mercado Pago
  -> Supabase Edge Function payment-webhook
  -> consulta direta do pagamento no provedor
  -> RPC apply_mercado_pago_payment
```

O retorno do navegador não confirma pagamento. A confirmação financeira depende do webhook assinado, da consulta ao Mercado Pago e da aplicação transacional do pagamento no banco.

## Conteúdo preservado da versão anterior

A versão anterior registrava o seguinte fluxo:

1. O usuário escolhia um tipo de ingresso.
2. O checkout coletava nome, e-mail, WhatsApp e aceite dos termos.
3. O frontend chamava `POST /functions/v1/make-server-62fab262/orders`.
4. A função criava `orders` com `payment_status='pending'` usando service role.
5. O frontend chamava `POST /functions/v1/make-server-62fab262/mp/preference`.
6. A função criava a preferência no Mercado Pago e retornava `init_point`.
7. O navegador redirecionava para o checkout hospedado do Mercado Pago.
8. O Mercado Pago retornava para `/?checkout=<status>&order=<order_id>`.
9. O frontend consultava `GET /functions/v1/make-server-62fab262/orders/:id`.
10. O Mercado Pago chamava `POST /functions/v1/make-server-62fab262/mp/webhook`.
11. O webhook validava assinatura, consultava o pagamento e atualizava o pedido.
12. Quando aprovado, o backend criava ingressos, atualizava vendas e disparava comunicações.

Esses endpoints e essa sequência são mantidos aqui apenas para rastreabilidade histórica.

## Princípios que continuam válidos

- O frontend não deve receber tokens privados.
- O frontend não deve criar pedidos ou ingressos diretamente no banco.
- O webhook deve validar assinatura e consultar o pagamento na API do provedor.
- O `external_reference` deve identificar o pedido interno.
- Credenciais, service role e tokens de provedores não podem ser expostos em variáveis `VITE_*`.
- Eventos financeiros devem permanecer auditáveis.

## Não usar este documento para

- configurar endpoints de produção;
- decidir o contrato atual de checkout;
- determinar produtos ou preços vigentes;
- determinar as migrations já aplicadas;
- operar reembolso, webhook ou notificações;
- validar prontidão para produção.

Consulte a referência canônica e, para detalhes verificáveis, o código, as migrations e os testes SQL.
