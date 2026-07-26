---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - supabase/functions/notification-worker/index.ts
  - supabase/migrations/
  - docs/10-dominios/notificacoes-transacionais.md
---

# Runbook — notificações e reprocessamento

## Objetivo

Diagnosticar e reprocessar jobs de e-mail ou WhatsApp sem duplicar mensagens nem alterar o estado financeiro do pedido.

## Quando executar

- pagamento foi aprovado, mas nenhuma mensagem chegou;
- job permanece pendente;
- job possui tentativas e erro;
- worker retorna 401 ou 500;
- provedor rejeita remetente, template ou destinatário;
- mensagens duplicadas foram observadas;
- fila cresce sem processamento.

## Responsável e permissões

- operador técnico com leitura de `notification_jobs`;
- acesso aos logs da Edge Function;
- acesso aos painéis do Resend ou WhatsApp quando configurados;
- capacidade de invocar o worker somente por mecanismo autorizado.

## Pré-condições

Registrar:

- ambiente;
- ID do job;
- `event_type`;
- pedido ou ingresso relacionado;
- canal;
- status e tentativas;
- erro atual;
- destinatário mascarado;
- responsável.

Não copiar tokens, chaves, conteúdo integral do payload ou dados de outros participantes.

## Fluxo

```text
operação de negócio
  → upsert notification_jobs por idempotency_key
  → worker autenticado por x-worker-key
  → claim_notification_jobs
  → hidratação do payload
  → Resend ou WhatsApp Cloud
  → complete_notification_job
```

## Etapa 1 — confirmar criação do job

Consultar `notification_jobs` pelo pedido, ingresso, destinatário ou chave de idempotência.

Se não houver job:

1. confirmar se o evento de negócio realmente ocorreu;
2. revisar logs da RPC ou Function que deveria criar a notificação;
3. confirmar se a criação é obrigatória para aquele estado;
4. não criar manualmente uma mensagem genérica sem identificar a chave correta.

## Etapa 2 — interpretar o estado

| Estado observado | Ação inicial |
|---|---|
| aguardando e disponível | verificar se o worker está sendo invocado |
| bloqueado por worker | aguardar janela ou investigar worker interrompido |
| concluído | consultar provedor e destinatário; não reenviar automaticamente |
| falhou com tentativas restantes | corrigir causa e liberar próxima tentativa |
| falhou terminalmente | revisar e autorizar reprocessamento explícito |

Os nomes exatos de status e campos dependem do schema vigente.

## Etapa 3 — verificar invocação do worker

Confirmar:

- Edge Function `notification-worker` publicada;
- `NOTIFICATION_WORKER_KEY` configurada;
- invocador envia `x-worker-key` correto;
- método `POST`;
- mecanismo de agenda ou chamada está ativo;
- logs mostram jobs assumidos.

O worker processa um lote limitado por chamada. Fila crescente pode indicar frequência insuficiente ou falhas repetidas.

## Etapa 4 — investigar e-mail

Variáveis necessárias:

```text
RESEND_API_KEY
TRANSACTIONAL_FROM_EMAIL
```

Verificar:

- domínio e remetente validados;
- chave pertence ao ambiente correto;
- endereço do destinatário é válido;
- provedor não bloqueou a mensagem;
- resposta e `provider_message_id` foram persistidos;
- conteúdo não excede limites.

Erros típicos:

- `email_configuration_missing`;
- `recipient_email_missing`;
- `email_provider_error_<status>`.

## Etapa 5 — investigar WhatsApp

Variáveis principais:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_GRAPH_VERSION
WHATSAPP_TEMPLATE_LANGUAGE
WHATSAPP_TEMPLATE_*
```

Verificar:

- número normalizado com código do país;
- template aprovado e compatível com o evento;
- idioma correto;
- token e phone number ID do ambiente correto;
- resposta do Graph API.

Erros típicos:

- `recipient_phone_invalid`;
- `whatsapp_configuration_missing`;
- `whatsapp_template_missing:<VAR>`;
- `whatsapp_provider_error_<status>`.

## Etapa 6 — validar payload hidratado

O worker pode buscar dados de ingresso, pedido e tipo de ingresso antes de enviar.

Confirmar:

- ingresso ainda existe;
- pedido está em estado compatível;
- e-mail ou telefone está disponível;
- payload não referencia titular antigo após transferência;
- ingresso reembolsado não recebe mensagem de confirmação;
- link aponta para `/meus-pedidos`.

## Etapa 7 — evitar duplicidade

Antes de reprocessar, verificar:

- `idempotency_key`;
- `provider_message_id`;
- resposta do provedor;
- status concluído anterior;
- mensagens relacionadas ao mesmo pedido e evento.

Se o provedor aceitou a mensagem, mas o job não foi marcado como concluído, reconciliar o registro em vez de enviar novamente quando possível.

## Etapa 8 — reprocessar

Reprocessar somente depois de corrigir a causa e confirmar que não houve entrega anterior.

Procedimento conceitual:

1. registrar autorização;
2. limpar lock abandonado ou alterar estado por RPC administrativa aprovada;
3. manter a mesma chave de idempotência quando o evento for o mesmo;
4. disponibilizar o job para nova tentativa;
5. invocar o worker;
6. acompanhar logs e provedor;
7. confirmar conclusão.

Não editar diretamente payload, destinatário ou tentativas em produção sem procedimento auditado.

## Mensagem incorreta

Se a mensagem foi enviada com conteúdo ou destinatário incorreto:

- interromper jobs equivalentes;
- identificar a origem do payload;
- corrigir template ou hidratação;
- avaliar necessidade de comunicação corretiva;
- não apagar evidências do envio;
- abrir incidente quando houver exposição de dados pessoais.

## Evidências

- ID do job;
- evento e canal;
- status antes e depois;
- código de erro;
- provedor e message ID;
- ação executada;
- confirmação de não duplicidade;
- responsável.

## Critérios de interrupção

Interromper e escalar se:

- destinatário não corresponde ao pedido;
- mensagem contém dados de outra pessoa;
- há envio em massa inesperado;
- credencial pode estar comprometida;
- provedor aceitou múltiplas mensagens idênticas;
- reprocessamento exige alteração direta de estado financeiro.

## Rollback

Mensagens enviadas não podem ser recolhidas de forma confiável. O rollback consiste em:

- interromper o worker;
- bloquear novos jobs afetados;
- corrigir código ou configuração;
- preservar registros;
- comunicar os afetados quando necessário;
- retomar gradualmente.

## Validação final

- job concluído ou motivo terminal documentado;
- provedor confirmou aceitação;
- destinatário e conteúdo estão corretos;
- não houve duplicidade;
- fila voltou a processar;
- nenhuma alteração financeira foi realizada.
