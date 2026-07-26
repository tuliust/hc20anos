---
status: historical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
period: validação do incremento de reporting Mercado Pago
superseded_by:
  - docs/10-dominios/checkout-e-pagamentos.md
planned_replacement:
  - docs/40-runbooks/validacao-de-pagamentos.md
---

# Validação do painel administrativo com Mercado Pago — registro histórico

> [!WARNING]
> Checklist preservado da entrega que conectou reporting e administração ao modelo transacional. Rotas, métricas e migrations citadas devem ser conferidas contra o código atual antes de qualquer validação operacional.
>
> A arquitetura financeira vigente está em [`../10-dominios/checkout-e-pagamentos.md`](../10-dominios/checkout-e-pagamentos.md). Um runbook reproduzível de validação ainda será criado.

## Escopo registrado

As rotas avaliadas naquela entrega eram:

- `/admin`;
- `/admin/tickets?tab=orders`;
- `/admin/reports`.

## Banco de dados avaliado

Executar, em ordem, segundo o registro original:

1. `supabase/migrations/20260719000001_admin_mercado_pago_reporting.sql`;
2. `supabase/migrations/20260719000002_admin_orders_mercado_pago_payload.sql`;
3. `supabase/tests/admin_mercado_pago_reporting.sql`.

Hoje, essas migrations não devem ser executadas isoladamente para representar o banco. O procedimento correto é reaplicar toda a cadeia em uma stack limpa e executar todos os testes SQL relevantes.

## Dashboard — critérios registrados

- ingressos vendidos correspondem aos tickets emitidos para pedidos aprovados;
- receita total considera apenas pedidos aprovados;
- pagamentos pendentes incluem `pending`, `in_process` e `authorized`;
- check-ins são contados em `tickets`;
- o gráfico não exibe vendas de demonstração;
- produtos sem venda aparecem com zero.

## Pedidos — critérios registrados

- nome do produto em vez do UUID;
- lote associado;
- comprador e valor total;
- status financeiro;
- participantes e estruturas complementares no payload;
- preferência e pagamento do Mercado Pago;
- status da reserva;
- eventos e falhas do webhook.

## Relatórios — métricas registradas

- receita aprovada, subtotal e ticket médio;
- pedidos por status;
- Pix, cartão e parcelas;
- reservas e preferências;
- webhooks e notificações;
- reembolsos, transferências e vouchers;
- ingressos e check-ins.

Métricas de extras presentes no documento original podem não fazer parte do produto comercial vigente.

## Critério de aceite registrado

1. testes SQL em `PASS`;
2. diagnósticos coerentes com as páginas administrativas;
3. ausência de dados demonstrativos ou UUID de produto exposto;
4. build aprovado;
5. validação em desktop e mobile.

## Uso deste arquivo

O documento pode orientar a criação do runbook futuro, mas não deve ser executado literalmente sem confirmar rotas, scripts, migrations posteriores e o catálogo atual.
