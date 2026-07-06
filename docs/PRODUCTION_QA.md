# QA Operacional — Produção

Este checklist fecha os pontos que dependem de ambiente real, navegador e dados de produção.

## Mercado Pago / Webhook / E-mail

### Pré-requisitos

- `MERCADO_PAGO_ACCESS_TOKEN` configurado apenas no ambiente seguro da Function.
- `SUPABASE_SERVICE_ROLE_KEY` configurado apenas no ambiente seguro da Function.
- `RESEND_API_KEY` configurado se e-mail transacional estiver ativo.
- URL pública do webhook cadastrada no painel Mercado Pago.
- Assinatura/origem do webhook validada no servidor.

### Cenários mínimos

| Cenário | Resultado esperado |
|---|---|
| Pagamento aprovado | `orders.payment_status=approved`, `paid_at` preenchido e `tickets` criados/liberados |
| Pagamento pendente | pedido visível como pendente, sem liberação de check-in |
| Pagamento recusado | estado recusado no retorno e sem ticket aprovado |
| Pagamento cancelado/expirado | estado final refletido no pedido |
| Webhook duplicado | não duplicar tickets |
| E-mail ativo | confirmação enviada ao comprador |
| E-mail sem env | fluxo não quebra; apenas registra/ignora envio |

## Checkout orientado ao ingresso selecionado

- Ao clicar em um card de ingresso, o `ticket_type_id`, nome, preço e `allows_guest` devem acompanhar o usuário até o checkout.
- O resumo do pedido deve refletir o ingresso selecionado.
- O endpoint de preferência deve receber o pedido correto.
- O retorno `?checkout=...&order=...` deve carregar o pedido real.

## Confirmação

- Exibir dados reais do pedido e ingresso quando `order` estiver disponível.
- Se ainda não houver ticket criado, exibir estado de processamento/aguardando webhook.
- Botão principal deve levar para `my-ticket`.

## QR e Check-in

- Testar QR em Chrome Android.
- Testar fallback por código textual em navegador sem `BarcodeDetector`.
- Testar ingresso aprovado, já utilizado, pendente e não encontrado.
- Confirmar que `checked_in`, `checked_in_at` e `checked_in_by_admin_id` são gravados.

## Mobile-first

Testar manualmente:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px

Critérios:

- Header sem quebra.
- CTA principal visível.
- Cards empilhados.
- Tabelas com overflow horizontal.
- Formulários legíveis.
- QR e câmera operáveis.
- Upload sem overflow.
