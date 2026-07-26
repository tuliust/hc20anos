---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - supabase/functions/notification-worker/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/refund-processor/index.ts
  - supabase/migrations/
---

# Notificações transacionais

## Objetivo

Documentar a fila, o processamento e a entrega de mensagens relacionadas a pedidos, pagamentos, ingressos, transferências e reembolsos.

## Princípio central

Notificações não fazem parte da transação crítica do webhook. O processamento financeiro cria jobs idempotentes; um worker separado tenta entregar as mensagens e registra o resultado.

Falha de e-mail ou WhatsApp não deve reverter pagamento aprovado nem duplicar ingressos.

## Entidade `notification_jobs`

A fila registra, conforme o contrato vigente:

- tipo de evento;
- canal;
- pedido e ingresso relacionados;
- destinatário;
- payload mínimo;
- chave de idempotência;
- status;
- quantidade de tentativas;
- disponibilidade para processamento;
- worker que assumiu o job;
- erro da última tentativa;
- identificador e resposta do provedor.

## Criação de jobs

Jobs podem ser criados por operações como:

- pagamento recebido ou aprovado;
- pagamento recusado, expirado, cancelado ou contestado;
- ingresso emitido ou reenviado;
- solicitação ou decisão de convidado em estruturas legadas;
- transferência de ingresso;
- reembolso concluído.

A criação deve usar chave de idempotência para que o mesmo evento de negócio não gere mensagens duplicadas.

## Worker

`notification-worker`:

1. exige `POST`;
2. valida `x-worker-key` contra `NOTIFICATION_WORKER_KEY`;
3. usa service role para acessar a fila;
4. chama `claim_notification_jobs` com limite de jobs;
5. hidrata dados necessários de pedido, ingresso e produto;
6. escolhe canal conforme o tipo do evento;
7. envia ao provedor;
8. registra resposta e identificador do provedor;
9. chama `complete_notification_job` com sucesso ou erro.

A autenticação do worker é independente da sessão de usuário.

## E-mail

O canal de e-mail usa Resend quando configurado.

Variáveis:

- `RESEND_API_KEY`;
- `TRANSACTIONAL_FROM_EMAIL`.

A mensagem pode incluir:

- nome do participante ou comprador;
- status do pagamento;
- valor formatado;
- código resumido do pedido;
- link para a Área do Comprador;
- código do ingresso quando aplicável.

Dados inseridos em HTML devem ser escapados.

## WhatsApp

O worker possui integração com a API do WhatsApp Cloud quando as variáveis necessárias estão configuradas.

Variáveis principais:

- `WHATSAPP_ACCESS_TOKEN`;
- `WHATSAPP_PHONE_NUMBER_ID`;
- `WHATSAPP_GRAPH_VERSION`;
- `WHATSAPP_TEMPLATE_LANGUAGE`;
- templates por categoria de evento.

O número é normalizado para formato internacional. Falta de configuração ou template deve produzir falha registrada no job, não envio parcial silencioso.

## Tipos de evento

O código deriva a comunicação de tipos como:

- `payment_pending`;
- `payment_in_process`;
- `payment_approved`;
- `payment_rejected`;
- `payment_expired`;
- `payment_cancelled`;
- `payment_refunded`;
- `payment_charged_back`;
- eventos de ingresso e reenvio;
- eventos de transferência;
- eventos de aprovação de convidado mantidos por compatibilidade.

Sufixos como `_email` e `_whatsapp` podem indicar o canal sem alterar o evento de negócio base.

## Idempotência

A chave de idempotência deve representar o evento de negócio e seu destinatário. Exemplos conceituais:

```text
payment-approved:<order_id>:<recipient>
refund-completed:<refund_request_id>
ticket-resend:<ticket_id>:<recipient>
```

Não usar timestamps aleatórios como única chave quando a intenção for impedir duplicidade.

## Tentativas e backoff

As RPCs da fila devem controlar:

- quais jobs podem ser assumidos;
- bloqueio temporário durante processamento;
- incremento de tentativas;
- próxima data de execução;
- limite ou estado terminal;
- liberação de jobs abandonados por worker interrompido.

O contrato exato será documentado pelo schema e pelas RPCs geradas.

## Privacidade

Payloads devem conter apenas dados necessários à mensagem. Não incluir:

- tokens de sessão;
- service role;
- respostas de reivindicação;
- dados completos do pagamento;
- QR token bruto quando um link autenticado for suficiente;
- informações de outros participantes não necessárias ao destinatário.

Respostas dos provedores podem conter dados pessoais e não devem ser publicadas em logs ou issues.

## Observabilidade

Indicadores mínimos:

- jobs aguardando;
- jobs em processamento;
- jobs concluídos;
- jobs com falha;
- tentativas por job;
- latência entre criação e entrega;
- erros por provedor e canal;
- duplicidades ignoradas pela chave de idempotência.

## Testes mínimos

- job idempotente é criado uma vez;
- worker rejeita chave inválida;
- worker assume no máximo o limite definido;
- dois workers não processam o mesmo job simultaneamente;
- ausência de configuração de e-mail registra falha sem quebrar outros jobs;
- HTML recebe valores escapados;
- telefone inválido é rejeitado;
- template ausente é registrado;
- sucesso persiste `provider_message_id`;
- falha incrementa tentativas e preserva erro;
- pagamento continua aprovado mesmo quando notificação falha.

## Operação

Consulte o runbook [`../40-runbooks/notificacoes.md`](../40-runbooks/notificacoes.md) para diagnóstico e reprocessamento.

## Dívidas conhecidas

- O mecanismo que agenda ou invoca periodicamente o worker deve ser documentado e verificado no ambiente real.
- Eventos legados de aprovação de convidado permanecem no código e precisam ser reconciliados com o modelo comercial vigente.
- A matriz automática de templates, variáveis e tipos de eventos ainda deve ser gerada.
