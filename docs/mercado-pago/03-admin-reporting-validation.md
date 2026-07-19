# Validação do painel administrativo com Mercado Pago

## Escopo

As rotas abaixo devem refletir exclusivamente o modelo transacional do Mercado Pago:

- `/admin`
- `/admin/tickets?tab=orders`
- `/admin/reports`

## Banco de dados

Executar, em ordem:

1. `supabase/migrations/20260719000001_admin_mercado_pago_reporting.sql`
2. `supabase/migrations/20260719000002_admin_orders_mercado_pago_payload.sql`
3. `supabase/tests/admin_mercado_pago_reporting.sql`

O teste deve retornar cinco verificações com `PASS` e, em seguida, dois conjuntos diagnósticos:

- os 20 pedidos mais recentes já enriquecidos com Mercado Pago;
- o JSON consolidado do relatório administrativo.

## Dashboard

Confirmar:

- ingressos vendidos correspondem aos tickets emitidos para pedidos aprovados;
- receita total considera apenas pedidos aprovados;
- pagamentos pendentes incluem `pending`, `in_process` e `authorized`;
- check-ins são contados diretamente em `tickets`;
- o gráfico não exibe vendas de demonstração;
- produtos sem venda aparecem com zero, sem denominadores inválidos.

## Pedidos

Confirmar:

- nome do produto em vez do UUID do tipo de ingresso;
- lote associado;
- comprador e valor total;
- status financeiro;
- quantidade de participantes e extras no payload;
- preferência e pagamento do Mercado Pago no payload;
- status da reserva;
- eventos e falhas do webhook.

## Relatórios

Confirmar a presença das métricas:

- receita aprovada, subtotal, extras e ticket médio;
- pedidos por status;
- Pix, cartão e parcelas;
- reservas e preferências;
- webhooks e notificações;
- pacotes de bebidas e churrasco;
- reembolsos, transferências e vouchers;
- ingressos e check-ins.

## Critério de aceite

O PR só deve ser mesclado quando:

1. os cinco testes SQL estiverem em `PASS`;
2. os diagnósticos coincidirem com as três páginas;
3. não houver dados demonstrativos ou UUID de produto exposto;
4. o build da branch estiver aprovado;
5. as três rotas forem validadas em desktop e mobile.
