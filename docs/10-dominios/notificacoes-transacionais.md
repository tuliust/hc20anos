---
status: canonical
owner: tuliust
last_verified: 2026-09-21
source_files:
  - supabase/functions/notification-worker/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/refund-processor/index.ts
  - supabase/migrations/
---

# Notificações transacionais

## Objetivo

Documentar a fila, o processamento e a entrega de e-mails relacionados a pedidos, pagamentos, ingressos, transferências e reembolsos.

## Princípio central

Notificações não fazem parte da transação crítica do webhook. O processamento financeiro cria jobs idempotentes; um worker separado tenta entregar os e-mails e registra o resultado.

Falha de e-mail não deve reverter pagamento aprovado nem duplicar ingressos.

## Entidade `notification_jobs`

A fila registra tipo de evento, canal, pedido/ingresso relacionados, destinatário, payload mínimo, chave de idempotência, status, tentativas, disponibilidade para processamento, erro e identificador/resposta do provedor.

O único canal operacional é `email`.

## Worker

`notification-worker`:

1. exige `POST`;
2. valida `x-worker-key` contra `NOTIFICATION_WORKER_KEY`;
3. usa service role;
4. chama `claim_notification_jobs`;
5. hidrata os dados necessários;
6. envia pelo Resend;
7. persiste resposta e identificador do provedor;
8. chama `complete_notification_job`.

## E-mail

Variáveis:

- `RESEND_API_KEY`;
- `TRANSACTIONAL_FROM_EMAIL`.

A mensagem pode incluir nome do participante/comprador, status do pagamento, valor, referência do pedido, link da Área do Comprador e código do ingresso quando aplicável.

Dados inseridos em HTML devem ser escapados.

## Tipos de evento

O código deriva comunicações de eventos financeiros, ingresso/reenvio, transferência, reembolso e estruturas legadas de convidado. O sufixo `_email` identifica o canal transacional vigente.

## Idempotência

A chave de idempotência deve representar o evento de negócio e seu destinatário. Não usar timestamps aleatórios como única chave quando a intenção for impedir duplicidade.

## Privacidade

Payloads devem conter apenas os dados necessários à mensagem. Não incluir tokens de sessão, service role, respostas completas do pagamento ou informações de outros participantes.

## Testes mínimos

- job idempotente é criado uma vez;
- worker rejeita chave inválida;
- dois workers não processam o mesmo job simultaneamente;
- ausência de configuração de e-mail registra falha;
- HTML recebe valores escapados;
- sucesso persiste `provider_message_id`;
- falha incrementa tentativas e preserva erro;
- pagamento continua aprovado mesmo quando a notificação falha.

## Operação

Consulte o runbook [`../40-runbooks/notificacoes.md`](../40-runbooks/notificacoes.md).
