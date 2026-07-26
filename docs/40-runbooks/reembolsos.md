---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - supabase/functions/refund-processor/index.ts
  - src/app/OperationsPage.tsx
  - supabase/migrations/
  - docs/10-dominios/checkin-reembolsos-e-operacao.md
---

# Runbook — reembolsos

## Objetivo

Analisar, aprovar e processar reembolsos no Mercado Pago preservando idempotência, ingressos, participantes, inventário e auditoria.

## Quando executar

- existe solicitação de reembolso pendente;
- solicitação foi aprovada e precisa ser enviada ao provedor;
- processamento falhou;
- Mercado Pago mostra reembolso, mas banco local diverge;
- inventário não foi restaurado;
- ingresso permaneceu válido depois do reembolso.

## Responsável e permissões

- análise e decisão: `admin` ou `superadmin` conforme contrato vigente;
- processamento: usuário autenticado com role autorizada;
- investigação técnica: acesso controlado aos logs, banco e Mercado Pago.

Nunca usar uma conta comum, service role no navegador ou chamada direta não auditada.

## Pré-condições

Registrar:

- ambiente;
- `request_id`;
- pedido;
- comprador mascarado;
- pagamento do provedor;
- valor do pedido e valor solicitado;
- data da compra;
- status dos ingressos e check-in;
- regra de elegibilidade aplicada;
- responsável pela decisão.

## Elegibilidade

Antes de aprovar, confirmar:

- pedido existente e financeiramente aprovado;
- pagamento do Mercado Pago identificável;
- solicitação dentro do prazo aplicável;
- ingresso não utilizado quando essa for condição da política;
- valor solicitado coerente;
- pedido ainda não reembolsado ou contestado;
- ausência de processamento concorrente;
- motivo e documentação suficientes.

Em caso de cancelamento do evento, aplicar a política específica e não tratar cada pedido como desistência comum.

## Etapa 1 — consultar a solicitação

Usar o painel administrativo ou RPC autorizada para verificar:

- status;
- pedido e pagamento;
- valor;
- motivo;
- decisão anterior;
- tentativas;
- resposta do provedor;
- `inventory_restored_at`;
- timestamps.

## Etapa 2 — decidir

### Aprovar

Registrar:

- responsável;
- valor aprovado;
- justificativa;
- notas relevantes;
- data da decisão.

A aprovação não significa que o Mercado Pago já executou o reembolso.

### Rejeitar

Registrar motivo claro e preservar a solicitação para auditoria. Não excluir o registro.

## Etapa 3 — processar pela Function

A Edge Function `refund-processor` recebe:

```json
{
  "request_id": "<uuid>"
}
```

Ela valida sessão e role, carrega a solicitação aprovada e chama:

```text
POST /v1/payments/<payment_id>/refunds
```

com chave:

```text
hc20-refund-<request_id>
```

Não chamar a API do Mercado Pago manualmente em paralelo.

## Etapa 4 — acompanhar o resultado

Em sucesso, confirmar:

- solicitação `refunded`;
- ID de reembolso do provedor persistido;
- pedido `refunded`;
- `refunded_at` preenchido;
- ingressos `refunded` ou invalidados;
- participantes atualizados;
- inventário restaurado;
- `inventory_restored_at` preenchido;
- job `payment_refunded` criado uma vez.

## Etapa 5 — validar inventário

A Function chama `restore_refunded_order_inventory` apenas quando o marcador de restauração ainda não existe.

Confirmar:

- quantidade restaurada corresponde ao pedido;
- nenhuma restauração duplicada;
- lote e produto corretos;
- catálogo e relatórios refletem o novo estado.

## Falha do Mercado Pago

Se a API retornar erro:

- solicitação deve ficar `failed`;
- `failure_reason` deve registrar código resumido;
- resposta do provedor deve permanecer no registro protegido;
- pedido e ingressos não devem ser marcados como reembolsados;
- investigar credencial, pagamento, valor e ambiente antes de retentar.

## Falha local depois do provedor

Possível cenário: Mercado Pago reembolsou, mas a Function falhou ao atualizar o banco.

Procedimento:

1. interromper nova tentativa automática;
2. confirmar reembolso no provedor;
3. registrar ID, valor e horário;
4. comparar pedido, solicitação, ingressos e inventário;
5. preparar reconciliação por RPC ou script revisado;
6. aplicar uma única vez;
7. validar notificação separadamente.

Não chamar novamente a API sem confirmar o estado do provedor.

## Idempotência

Antes de qualquer retentativa:

- consultar `mercado_pago_refund_id`;
- consultar o pagamento no Mercado Pago;
- revisar status da solicitação;
- revisar `inventory_restored_at`;
- revisar status do pedido e ingressos;
- revisar job de notificação.

A mesma solicitação não deve produzir dois reembolsos ou duas restaurações.

## Reembolso parcial

Quando permitido, o valor enviado é `refund_amount_cents / 100`. Confirmar que:

- valor é maior que zero;
- não excede o pagamento elegível;
- moeda é BRL;
- política do produto permite parcial;
- efeitos locais correspondem ao escopo do reembolso.

Se a aplicação invalida todos os ingressos para qualquer valor, reembolso parcial não deve ser usado sem revisão da regra de negócio.

## Ingresso já utilizado

Não aprovar automaticamente. Escalar para decisão administrativa e política aplicável. Preservar registro de check-in e justificativa.

## Chargeback

Chargeback não é reembolso voluntário. Seguir investigação financeira específica, invalidar acessos conforme a máquina de estados e preservar eventos do provedor.

## Evidências

- solicitação e pedido;
- decisão e responsável;
- valor;
- status antes e depois;
- ID do reembolso;
- horário;
- ingressos afetados;
- inventário restaurado;
- job de notificação;
- divergências e correções.

Nunca registrar access token ou dados de cartão.

## Critérios de interrupção

- pagamento pertence a outro ambiente;
- valor diverge do pedido;
- pedido já foi reembolsado ou contestado;
- ingresso usado e política não autoriza;
- reembolso parcial conflita com invalidação integral;
- provedor confirma sucesso, mas estado local é incerto;
- inventário pode ser restaurado em duplicidade.

## Rollback

Reembolso executado no provedor não possui rollback simples. Não tente cobrar novamente automaticamente.

Em erro local:

- preservar registros;
- reconciliar banco com o provedor;
- impedir uso de ingressos reembolsados;
- corrigir inventário;
- comunicar comprador conforme necessário.

## Validação final

- provedor e banco coincidem;
- pedido e ingressos estão invalidados;
- inventário foi restaurado uma vez;
- relatórios refletem o reembolso;
- notificação está criada ou falha separadamente diagnosticada;
- evidências e decisão estão registradas.
