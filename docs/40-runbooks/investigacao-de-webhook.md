---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - supabase/functions/payment-webhook/index.ts
  - supabase/migrations/
  - docs/10-dominios/checkout-e-pagamentos.md
  - docs/40-runbooks/validacao-de-pagamentos.md
---

# Runbook — investigação de webhook do Mercado Pago

## Objetivo

Diagnosticar notificações ausentes, inválidas, duplicadas ou com falha sem criar efeitos financeiros adicionais.

## Quando executar

- pagamento aparece aprovado no Mercado Pago, mas pedido permanece pendente;
- `payment_events` contém falhas;
- ingressos não foram emitidos;
- webhook retorna 401 ou 503;
- eventos duplicados aparecem;
- status local diverge do provedor;
- pagamento foi aplicado com valor ou referência incompatível.

## Responsável e permissões

- operador técnico com leitura no Supabase e logs das Edge Functions;
- acesso ao painel do Mercado Pago;
- acesso de escrita somente quando a reconciliação for aprovada;
- service role nunca deve ser copiada para ferramentas client-side.

## Pré-condições

Registrar antes de qualquer ação:

- ambiente: teste ou produção;
- ID do pedido;
- ID do pagamento no Mercado Pago;
- horário aproximado;
- status observado no provedor;
- status local;
- responsável pela investigação.

Não colar tokens, assinatura completa, dados de cartão ou payload integral em issues.

## Visão do fluxo

```text
Mercado Pago
  → POST payment-webhook
  → valida assinatura e idade do timestamp
  → grava payment_events
  → consulta GET /v1/payments/:id
  → valida external_reference e valor
  → RPC apply_mercado_pago_payment
  → atualiza pedido, ingressos, inventário e jobs
```

## Etapa 1 — confirmar o endpoint

Verificar se a URL cadastrada no Mercado Pago termina em:

```text
/functions/v1/payment-webhook
```

Confirmar que aponta para o projeto Supabase correto e para o ambiente esperado.

### Interromper se

- a URL aponta para outro projeto;
- o evento é de produção e o endpoint usa credenciais de teste;
- a configuração do provedor não pode ser confirmada.

## Etapa 2 — consultar logs da Function

No painel do Supabase, filtrar logs de `payment-webhook` pelo horário e pelo identificador técnico disponível.

Procurar mensagens como:

- `payment_webhook_invalid_signature`;
- `payment_event_insert_failed`;
- `payment_webhook_failed`;
- `missing_access_token`;
- `temporary_processing_failure`;
- erros retornados pela RPC.

Registrar apenas código de erro, timestamp e IDs não sensíveis.

## Etapa 3 — consultar `payment_events`

Localizar eventos pelo `payment_id`, `order_id`, `provider_event_id` ou intervalo de tempo.

Verificar:

- `signature_valid`;
- `processing_status`;
- `processing_error`;
- `attempt_count`;
- `processed_at`;
- pedido associado;
- existência de duplicidade pela chave única.

### Interpretação

| Situação | Interpretação inicial |
|---|---|
| sem registro | chamada não chegou ou falhou antes da inserção |
| `received` antigo | processamento interrompido |
| `ignored` | notificação não era pagamento aplicável |
| `processed` | webhook terminou; investigar RPC ou leitura da interface |
| `failed` | erro temporário ou de validação requer reconciliação |
| duplicado | evento já registrado; não reaplicar sem confirmar efeitos |

## Etapa 4 — validar assinatura

A Function exige:

- `x-signature` com `ts` e `v1`;
- `x-request-id`;
- ID de pagamento;
- timestamp dentro da janela aceita;
- HMAC SHA-256 com `MERCADO_PAGO_WEBHOOK_SECRET`.

Se houver `invalid_signature`:

1. confirmar secret no Supabase;
2. confirmar que o secret pertence ao ambiente e aplicação corretos;
3. confirmar que o ID usado no manifesto coincide com a notificação;
4. verificar relógio e idade do evento;
5. não desabilitar validação para “testar” em produção.

## Etapa 5 — consultar o pagamento no provedor

No painel do Mercado Pago, confirmar:

- ID;
- status e detalhe;
- `external_reference`;
- valor;
- moeda;
- preferência;
- ambiente;
- data de aprovação.

A Function também consulta `/v1/payments/:id`; o payload da notificação não é autoridade suficiente.

### Interromper se

- `external_reference` não é um pedido válido;
- valor ou moeda divergem;
- pagamento pertence a outro ambiente ou recebedor;
- há suspeita de fraude ou chargeback.

Escalar antes de qualquer mutação local.

## Etapa 6 — consultar o pedido

Verificar no Supabase:

- `payment_status`;
- `paid_at`;
- IDs do pagamento e preferência;
- valor total;
- ambiente;
- reserva;
- ingressos existentes;
- jobs de notificação.

Não alterar o status manualmente para contornar a RPC.

## Etapa 7 — verificar efeitos transacionais

Para pagamento aprovado, confirmar:

- pedido `approved`;
- `paid_at` preenchido;
- um ingresso por participante;
- ausência de ingressos duplicados;
- inventário consistente;
- jobs de notificação idempotentes.

Se o evento está `processed`, mas os efeitos não existem, revisar o retorno e os logs de `apply_mercado_pago_payment`.

## Etapa 8 — decidir reprocessamento

Reprocessar somente quando:

- o pagamento foi confirmado no provedor;
- valor, moeda, referência e ambiente coincidem;
- o estado local está incompleto;
- a operação transacional é idempotente;
- existe autorização técnica registrada.

Métodos preferidos, em ordem:

1. solicitar reenvio do evento pelo provedor;
2. usar procedimento de reconciliação/RPC específico, quando existir;
3. executar ação administrativa controlada e auditada.

Não reenviar manualmente payload alterado nem chamar RPC financeira com valores inventados.

## Webhook duplicado

Se a chave única rejeitou o evento e o primeiro registro está `processed`, não há ação.

Se o primeiro registro está `failed`, investigar o efeito local antes de tentar novamente. Duplicidade do evento não prova ausência de efeitos.

## Falha temporária

A Function retorna 503 em falhas que devem permitir retentativa. Confirmar:

- disponibilidade do Supabase;
- access token do Mercado Pago;
- conectividade com API externa;
- migrations e RPC presentes;
- locks ou constraints;
- logs do banco.

## Evidências

Registrar:

- ambiente;
- pedido e pagamento;
- timestamps;
- status antes e depois;
- códigos de erro;
- consulta ao provedor resumida;
- efeitos verificados;
- ação executada;
- responsável.

Não registrar secrets ou dados financeiros completos.

## Rollback

Não existe rollback simples de pagamento confirmado. Em caso de aplicação local incorreta:

- interromper vendas ou processamento afetado;
- preservar todos os eventos;
- reconciliar com o provedor;
- usar migrations ou RPC corretiva revisada;
- não apagar pedidos, ingressos ou `payment_events`.

## Validação final

- pedido coincide com provedor;
- ingressos são únicos e válidos;
- inventário está consistente;
- evento está `processed` ou possui motivo documentado;
- notificações podem ser processadas separadamente;
- incidente foi registrado quando houve impacto real.

## Escalonamento

Escalar imediatamente quando houver:

- divergência de valor ou moeda;
- pagamento de outro recebedor;
- múltiplos pedidos para o mesmo pagamento;
- ingressos duplicados utilizados;
- chargeback ou suspeita de fraude;
- necessidade de alteração manual de dados financeiros.
