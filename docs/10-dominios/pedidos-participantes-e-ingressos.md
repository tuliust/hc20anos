---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 54685a2c10a0034cc821906e2e0d73f0713d50a3
source_files:
  - src/lib/checkout.ts
  - src/app/BuyerOrdersPage.tsx
  - build/buyerOrdersSharedRouteTransform.mjs
  - src/app/App.tsx
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/migrations/
---

# Pedidos, participantes e ingressos

## Objetivo

Documentar o ciclo que começa na criação de um pedido e termina na disponibilização de ingressos individuais ao comprador e aos participantes.

## Entidades principais

### `orders`

Representa a transação comercial do comprador.

Responsabilidades funcionais:

- identificar evento, comprador, produto e lote;
- registrar valor calculado no backend;
- manter status de reserva e pagamento;
- associar preferência e pagamento do provedor;
- expor um `public_token` para consultas controladas;
- vincular o usuário comprador quando autenticado;
- preservar idempotência e auditoria financeira.

### `order_participants`

Representa cada pessoa incluída no pedido.

Um pedido pode conter diferentes papéis, como:

- ex-aluno;
- cônjuge;
- filho;
- convidado externo.

Cada participante deve possuir uma chave estável no payload de checkout para relacionar extras e evitar ambiguidades durante a criação transacional.

### `participant_extras`

Registra itens adicionais vinculados a participantes quando o modelo comercial os suporta. O modelo público vigente pode desabilitar extras mesmo que tabelas históricas permaneçam no banco.

### `tickets`

Representa o direito individual de acesso ao evento.

Cada ingresso deve possuir:

- pedido de origem;
- participante ou pessoa relacionada;
- nome do titular;
- status;
- identificador e token de QR Code;
- dados de check-in;
- informações de cancelamento, transferência ou reembolso quando aplicável.

## Princípio de individualização

Quantidade no pedido não substitui participantes individuais. Quando o produto inclui várias pessoas, cada participante precisa ser persistido separadamente e receber ingresso próprio depois da aprovação financeira.

## Criação do pedido

O pedido é criado por `create_checkout_order`, chamada pela Edge Function `checkout-create` com service role após autenticar o usuário.

A RPC deve executar de forma transacional:

1. validar produto e composição;
2. identificar lote ativo;
3. calcular preço no banco;
4. validar limite de participantes;
5. criar ou reutilizar pedido idempotente;
6. persistir participantes;
7. persistir extras permitidos;
8. reservar inventário;
9. retornar resumo necessário à preferência de pagamento.

O navegador não escreve diretamente em `orders`, `order_participants` ou `tickets`.

## Reserva

Pedidos iniciados podem manter reserva até `expires_at`. O estado da reserva deve impedir venda inconsistente e permitir expiração idempotente.

Quando uma reserva expira:

- o pedido deixa de estar elegível para pagamento pela preferência antiga;
- o inventário deve ser liberado conforme a função transacional vigente;
- o comprador precisa iniciar uma nova compra;
- nenhuma rotina deve emitir ingresso para pagamento posterior incompatível sem reconciliação.

## Pagamento e emissão

O retorno do navegador não emite ingressos. A emissão depende do webhook validado e da RPC que aplica o pagamento do Mercado Pago.

Quando o pagamento é aprovado, a operação transacional deve:

- validar valor, moeda e referência;
- avançar o status sem regressão indevida;
- registrar `paid_at`;
- criar um ingresso por participante;
- gerar QR Code e token individual;
- consumir a reserva ou confirmar inventário;
- criar jobs de notificação idempotentes.

Webhook duplicado não pode duplicar ingressos.

## Área do comprador

A rota efetiva `/meus-pedidos`, com alias legado `/meus-ingressos`, é injetada no build pelo transform de rota compartilhada.

A página deve apresentar somente pedidos acessíveis ao usuário autenticado e seus ingressos relacionados.

Informações esperadas:

- produto e lote;
- valor total;
- status financeiro e da reserva;
- participantes;
- ingressos emitidos;
- QR Code e código textual quando liberados;
- ações permitidas, como reenvio, transferência ou solicitação de reembolso.

## Consulta por token público

`get_checkout_status_by_token` permite acompanhar o pedido a partir de um token público de alta entropia.

O token:

- não substitui autenticação para ações sensíveis;
- não deve ser previsível;
- não deve expor dados além do necessário ao acompanhamento;
- deve ser removido de logs e analytics quando possível;
- não deve ser tratado como UUID interno do pedido.

## Status financeiros

O sistema trabalha com estados como:

- `pending`;
- `in_process`;
- `approved`;
- `rejected`;
- `cancelled`;
- `expired`;
- `refunded`;
- `charged_back`.

A máquina de estados final é definida pelas migrations e RPCs. A interface deve exibir rótulos amigáveis sem alterar a semântica do banco.

## Status do ingresso

Estados podem incluir condições como ativo, utilizado, transferido, cancelado ou reembolsado. A autoridade final é o schema gerado e as funções transacionais.

Ingresso somente pode ser usado quando:

- o pedido está financeiramente aprovado;
- o ingresso está em estado válido;
- não foi reembolsado, cancelado ou substituído;
- ainda não foi utilizado.

## Transferência

Quando disponível, a transferência deve:

1. validar elegibilidade e prazo;
2. identificar novo titular;
3. invalidar o QR Code anterior;
4. preservar histórico do titular anterior;
5. transferir extras vinculados quando a regra permitir;
6. impedir transferência incompatível com o produto;
7. criar notificação idempotente.

## Reembolso e cancelamento

Um reembolso aprovado invalida ingressos e participantes relacionados, restaura inventário uma única vez e preserva o histórico financeiro.

Consulte [`checkin-reembolsos-e-operacao.md`](./checkin-reembolsos-e-operacao.md) e o runbook [`../40-runbooks/reembolsos.md`](../40-runbooks/reembolsos.md).

## Segurança

- Usuário comum consulta apenas os próprios pedidos.
- Token público permite somente o contrato mínimo de acompanhamento.
- Administradores usam RPCs ou views autorizadas.
- Service role permanece em Functions server-side.
- QR token bruto não deve ser exposto em listagens administrativas desnecessárias.
- Mudanças de status financeiro não são realizadas pelo cliente.
- Eventos financeiros e logs não devem ser excluídos durante suporte ou incidentes.

## Testes mínimos

- pedido idempotente não duplica participantes;
- composição inválida é rejeitada no backend;
- preço manipulado no navegador não altera o total;
- reserva expira e libera inventário uma vez;
- webhook aprovado emite um ingresso por participante;
- webhook duplicado não duplica ingressos;
- pedido de outro usuário não é acessível;
- token público retorna somente dados permitidos;
- reembolso invalida ingressos;
- ingresso transferido não aceita QR anterior;
- alias e rota principal da área do comprador funcionam após o build.

## Dívidas conhecidas

- A rota da área do comprador é injetada por substituição textual no build.
- O inventário completo de estados e constraints precisa ser gerado do banco reproduzido.
- Estruturas antigas de aprovação de convidados, extras e produtos podem permanecer por compatibilidade e devem ser diferenciadas do modelo comercial vigente.
