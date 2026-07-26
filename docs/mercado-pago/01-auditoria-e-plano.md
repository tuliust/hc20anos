---
status: historical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
period: auditoria anterior à implementação comercial atual
superseded_by:
  - docs/10-dominios/checkout-e-pagamentos.md
---

# Checkout Pro — auditoria inicial e plano de execução

> [!WARNING]
> Registro histórico da auditoria que orientou a implementação. Riscos, pendências e regras descritos aqui podem ter sido resolvidos, alterados ou removidos por migrations posteriores. Não usar como contrato vigente.
>
> Consulte [`../10-dominios/checkout-e-pagamentos.md`](../10-dominios/checkout-e-pagamentos.md) e as fontes verificáveis indicadas nesse documento.

Issue de acompanhamento original: #6

## Escopo registrado

Concluir a integração de venda de ingressos do evento HC 20 Anos com Mercado Pago Checkout Pro, Supabase, ingressos individuais, aprovação de convidados, lotes, extras, transferências, reembolsos e check-in.

## Linha de base observada

### Frontend

O fluxo de checkout estava concentrado em `src/app/App.tsx`.

O frontend então:

- selecionava o tipo de ingresso;
- coletava comprador e quantidade;
- calculava quantidade e valor para apresentação;
- criava um pedido através da camada de serviços;
- solicitava uma preferência de pagamento;
- redirecionava para a URL retornada;
- lia parâmetros de retorno e consultava o pedido.

Riscos identificados na época:

1. Parte do modelo tratava acompanhantes apenas como quantidade, sem registros individuais completos.
2. O frontend mantinha cálculo de preço para apresentação; o backend deveria ser a única autoridade financeira.
3. O redirecionamento priorizava `init_point` antes de `sandbox_init_point`, sem seleção explícita de ambiente.
4. O checkout não representava adequadamente pacotes, convidados, extras e limites.

### Camada de serviços

`src/lib/services.ts` expunha operações equivalentes a:

- `createCheckoutOrder`;
- `createPaymentPreference`;
- `getCheckoutOrder`.

O contrato pretendido era evoluir para:

- criação autenticada de pedido com participantes;
- cálculo integral no backend;
- uma propriedade única `checkout_url`;
- consulta segura por token público.

### Backend / Edge Function

A Edge Function agregada usava Hono e service role. A auditoria registrou capacidades e riscos anteriores, incluindo autenticação insuficiente, modelo simples de pedido, ausência de reserva transacional completa, validação incompleta do webhook, concorrência de idempotência, notificações no caminho crítico e tratamento incompleto de reembolso e chargeback.

Essas observações motivaram a separação atual entre `checkout-create`, `payment-webhook`, `notification-worker`, `refund-processor` e RPCs transacionais.

## Modelo de dados esperado na auditoria

A auditoria propôs suporte para:

- pedidos;
- participantes por pedido;
- lotes e preços por produto;
- preferências de pagamento;
- eventos de pagamento;
- aprovações de convidados;
- ingressos individuais;
- extras por participante;
- fila de notificações;
- reembolsos;
- transferências;
- auditoria;
- check-in e entrega de fichas.

A presença de um item nessa lista não significa que ele permaneça no modelo comercial atual.

## Regras registradas na época

### Evento

- Data: 24/10/2026.
- Timezone: `America/Sao_Paulo`.
- URL de produção: `https://hc20anos.com.br`.

### Pagamento

- Mercado Pago Checkout Pro.
- Pix e cartão.
- Sem boleto.
- Até três parcelas.
- Juros pagos pelo comprador.
- Reserva por 30 minutos.
- Pix expirado exige nova preferência.

### Lotes planejados

- Inicial: até 31/07/2026.
- 1º lote: a partir de 01/08/2026.
- 2º lote: a partir de 15/08/2026.
- 3º lote: a partir de 01/09/2026.
- Preços armazenados no banco e administráveis.

Datas, preços e disponibilidade devem ser consultados no catálogo vigente do banco.

### Participantes planejados

- Máximo de seis pessoas por pedido.
- Um registro, ingresso e QR Code por pessoa.
- Tipos avaliados: ex-aluno, cônjuge, filho e convidado externo.

Regras de aprovação de convidado e composição foram alteradas posteriormente e não devem ser inferidas deste arquivo.

### Extras planejados

- Bebidas e churrasco vinculados a participantes.
- Fichas físicas entregues no check-in.

Extras não fazem parte do catálogo comercial vigente e permanecem apenas como estruturas de compatibilidade em partes do código e do banco.

### Reembolso planejado

- Desistência em até sete dias corridos da compra.
- Limite absoluto registrado: 17/10/2026.
- Ingresso usado não poderia ser reembolsado.
- Cancelamento do evento geraria reembolso integral.

A política operacional vigente deve ser validada nas migrations, no painel e no runbook de reembolsos quando concluído.

### Transferência planejada

- Até 24 horas antes do evento.
- Individual.
- QR Code anterior invalidado.
- Extras acompanhariam o ingresso.

## Plano de implementação registrado

1. Auditoria e documentação.
2. Modelo transacional.
3. Pedidos, preços e reservas.
4. Mercado Pago.
5. Experiência do usuário.
6. Ingressos e operação.
7. Administração e qualidade.

Este plano é evidência do processo de construção, não backlog atual.
