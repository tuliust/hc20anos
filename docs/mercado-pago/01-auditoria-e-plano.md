# Checkout Pro — auditoria inicial e plano de execução

Issue de acompanhamento: #6

## Escopo

Concluir a integração de venda de ingressos do evento HC 20 Anos com Mercado Pago Checkout Pro, Supabase, ingressos individuais, aprovação de convidados, lotes, extras, transferências, reembolsos e check-in.

## Linha de base observada

### Frontend

O fluxo de checkout está concentrado em `src/app/App.tsx`.

O frontend atualmente:

- seleciona o tipo de ingresso;
- coleta comprador e quantidade;
- calcula quantidade e valor para apresentação;
- cria um pedido através da camada de serviços;
- solicita uma preferência de pagamento;
- redireciona para a URL retornada;
- lê parâmetros de retorno e consulta o pedido.

Riscos identificados:

1. Parte do modelo atual trata acompanhantes apenas como quantidade, sem registros individuais completos.
2. O frontend ainda mantém cálculo de preço para apresentação; o backend deve ser a única autoridade financeira.
3. O redirecionamento prioriza `init_point` antes de `sandbox_init_point`, sem uma seleção explícita de ambiente.
4. O checkout atual não representa os pacotes familiares, convidados aprovados, extras por participante e limite de seis pessoas.

### Camada de serviços

`src/lib/services.ts` já expõe operações equivalentes a:

- `createCheckoutOrder`;
- `createPaymentPreference`;
- `getCheckoutOrder`.

As chamadas usam rotas da Edge Function. O contrato deve evoluir para:

- criação autenticada de pedido com participantes;
- cálculo integral no backend;
- retorno de uma única propriedade `checkout_url`;
- consulta segura por token público, sem depender apenas do UUID interno.

### Backend / Edge Function

A Edge Function atual usa Hono e service role do Supabase. Ela já possui:

- criação de pedido;
- criação de preferência via API REST do Mercado Pago;
- `back_urls` e `notification_url`;
- validação HMAC do webhook;
- consulta direta do pagamento no Mercado Pago;
- atualização de pedido;
- geração de ingressos após aprovação;
- incremento de quantidade vendida;
- envio de e-mail e integração opcional de WhatsApp.

Riscos identificados:

1. A criação de pedido não exige autenticação de forma suficiente para a nova regra de negócio.
2. O payload ainda representa apenas um `ticket_type_id`, quantidade e comprador.
3. Não existe reserva transacional completa por 30 minutos.
4. A preferência não usa uma variável explícita `MERCADO_PAGO_ENV`.
5. O webhook não valida integralmente valor, moeda, preferência, ambiente e recebedor.
6. O webhook pode regredir estados e apagar `paid_at` em eventos posteriores.
7. A idempotência depende parcialmente de consulta prévia, sujeita a corrida.
8. Falhas internas são respondidas com HTTP 200, impedindo retentativas úteis.
9. A criação de ingressos, incremento de vendas e notificações não está encapsulada em transação idempotente.
10. Reembolso, chargeback e cancelamento não invalidam integralmente ingressos e check-in.
11. E-mail é enviado durante o processamento crítico do webhook.
12. Código de WhatsApp deve ser removido ou mantido inativo; o canal não fará parte desta entrega.

### Modelo de dados esperado

A implementação deverá adaptar estruturas existentes e adicionar apenas o que estiver ausente. O modelo funcional exige suporte para:

- pedidos;
- participantes por pedido;
- lotes e preços por produto;
- preferências de pagamento;
- eventos de pagamento;
- solicitações de aprovação de convidados;
- ingressos individuais;
- extras por participante;
- fila de notificações;
- reembolsos;
- transferências;
- auditoria;
- check-in e entrega de fichas.

## Regras consolidadas

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

### Lotes

- Inicial: até 31/07/2026.
- 1º lote: a partir de 01/08/2026.
- 2º lote: a partir de 15/08/2026.
- 3º lote: a partir de 01/09/2026.
- Sem limite de capacidade por lote neste momento.
- Preços armazenados no banco e administráveis.

### Participantes

- Máximo de seis pessoas por pedido.
- Um registro, ingresso e QR Code por pessoa.
- Tipos: ex-aluno, cônjuge, filho e convidado externo.
- Convidado externo cria conta simplificada e depende de aprovação do ex-aluno.
- Máximo de seis convidados externos aprovados por ex-aluno.

### Extras

- Bebidas: cada unidade representa 10 latas.
- Churrasco: cada unidade representa 10 churrasquinhos.
- Quantidade ilimitada.
- Extras vinculados a participantes.
- Fichas físicas entregues no check-in.
- Entrega registrada uma única vez.

### Reembolso

- Desistência em até sete dias corridos da compra.
- Limite absoluto: 17/10/2026.
- Desconto apenas de taxas comprovadamente não recuperáveis.
- Ingresso usado não pode ser reembolsado.
- Cancelamento do evento gera reembolso integral.

### Transferência

- Até 24 horas antes do evento.
- Individual.
- Novo titular autenticado ou com cadastro simplificado.
- QR Code anterior invalidado.
- Extras acompanham o ingresso.
- Ingresso-base de ex-aluno não pode ser transferido a convidado externo.

## Plano de implementação

### Etapa 1 — auditoria e documentação

- Registrar linha de base.
- Mapear migrations e estruturas existentes.
- Confirmar contratos atuais.
- Criar checklist operacional.

### Etapa 2 — modelo transacional

- Criar migrations incrementais.
- Adicionar participantes, lotes, preços, preferências, aprovações, extras, notificações, reembolsos e transferências.
- Adicionar constraints, índices, RLS e funções transacionais.

### Etapa 3 — pedidos, preços e reservas

- Criar cálculo de preço exclusivamente no backend.
- Validar composição dos pacotes.
- Criar reserva de 30 minutos.
- Implementar expiração idempotente.

### Etapa 4 — Mercado Pago

- Introduzir `MERCADO_PAGO_ENV`.
- Retornar apenas `checkout_url`.
- Fortalecer preferência, webhook, máquina de estados e reconciliação.

### Etapa 5 — experiência do usuário

- Refatorar checkout.
- Implementar conta simplificada e aprovação de convidado.
- Conectar `/minha-area`.

### Etapa 6 — ingressos e operação

- Gerar QR Codes seguros.
- Criar fila de e-mails.
- Implementar transferências, reembolsos, check-in e fichas.

### Etapa 7 — administração e qualidade

- Conectar painéis e relatórios.
- Adicionar testes unitários, integração e E2E.
- Atualizar documentação e checklist de produção.

## Primeiro incremento de código

O primeiro incremento após esta auditoria deverá ser uma migration autocontida que estabeleça o modelo complementar e as funções transacionais sem quebrar tabelas existentes. Antes de escrevê-la, é obrigatório abrir e comparar todas as migrations relacionadas a pedidos, ingressos e pagamentos.
