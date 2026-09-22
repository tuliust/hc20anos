---
status: canonical
owner: tuliust
last_verified: 2026-09-21
source_files:
  - supabase/functions/notification-worker/index.ts
  - supabase/migrations/
  - docs/10-dominios/notificacoes-transacionais.md
---

# Runbook — notificações e reprocessamento

## Objetivo

Diagnosticar e reprocessar jobs de e-mail sem duplicar mensagens nem alterar o estado financeiro do pedido.

## Escopo vigente

O HC 20 Anos utiliza **somente e-mail transacional**. Não existe integração automatizada de WhatsApp/Meta no runtime.

## Quando executar

- pagamento foi aprovado, mas nenhum e-mail chegou;
- job permanece pendente;
- job possui tentativas e erro;
- worker retorna 401 ou 500;
- Resend rejeita remetente ou destinatário;
- mensagens duplicadas foram observadas;
- fila cresce sem processamento.

## Responsável e permissões

- operador técnico com leitura de `notification_jobs`;
- acesso aos logs da Edge Function;
- acesso ao painel do Resend;
- capacidade de invocar o worker somente por mecanismo autorizado.

## Fluxo

```text
operação de negócio
  → upsert notification_jobs por idempotency_key
  → worker autenticado por x-worker-key
  → claim_notification_jobs
  → hidratação do payload
  → Resend
  → complete_notification_job
```

## Configuração

Variáveis necessárias:

```text
NOTIFICATION_WORKER_KEY
RESEND_API_KEY
TRANSACTIONAL_FROM_EMAIL
```

Verificar:

- domínio e remetente validados;
- chave pertence ao ambiente correto;
- endereço do destinatário é válido;
- resposta e `provider_message_id` foram persistidos;
- conteúdo não excede limites.

Erros típicos:

- `email_configuration_missing`;
- `recipient_email_missing`;
- `email_provider_error_<status>`.

## Validação do payload

Confirmar:

- ingresso ainda existe quando o job depende de ingresso;
- pedido está em estado compatível;
- e-mail está disponível;
- payload não referencia titular antigo após transferência;
- ingresso reembolsado não recebe mensagem de confirmação;
- link aponta para `/meus-pedidos`.

## Evitar duplicidade

Antes de reprocessar, verificar:

- `idempotency_key`;
- `provider_message_id`;
- resposta do provedor;
- status concluído anterior;
- mensagens relacionadas ao mesmo pedido e evento.

Se o provedor aceitou a mensagem, mas o job não foi marcado como concluído, reconciliar o registro em vez de enviar novamente quando possível.

## Reprocessamento

Reprocessar somente depois de corrigir a causa e confirmar que não houve entrega anterior.

1. registrar autorização;
2. limpar lock abandonado ou alterar estado por RPC administrativa aprovada;
3. manter a mesma chave de idempotência quando o evento for o mesmo;
4. disponibilizar o job para nova tentativa;
5. invocar o worker;
6. acompanhar logs e Resend;
7. confirmar conclusão.

Não editar diretamente payload, destinatário ou tentativas em produção sem procedimento auditado.

## Evidências

- ID do job;
- evento;
- status antes e depois;
- código de erro;
- provider message ID;
- ação executada;
- confirmação de não duplicidade;
- responsável.

## Rollback

E-mails enviados não podem ser recolhidos de forma confiável. O rollback consiste em interromper o worker, bloquear novos jobs afetados, corrigir código/configuração, preservar registros e retomar gradualmente.

## Validação final

- job concluído ou motivo terminal documentado;
- Resend confirmou aceitação;
- destinatário e conteúdo estão corretos;
- não houve duplicidade;
- fila voltou a processar;
- nenhuma alteração financeira foi realizada.
