---
status: draft
owner: tuliust
last_verified: 2026-07-29
source_files:
  - src/lib/checkout.ts
  - api/checkout-create.ts
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/refund-processor/index.ts
  - supabase/functions/notification-worker/index.ts
  - supabase/migrations/20260716000004_create_checkout_order_rpc.sql
  - supabase/migrations/20260716000005_payment_processing_rpc.sql
  - supabase/migrations/20260719000009_transfers_refunds_checkin_operations.sql
  - supabase/migrations/20260719000010_refund_inventory_restore.sql
  - supabase/tests/transfers_refunds_checkin.sql
  - scripts/phase3-financial-preflight.mjs
  - .github/workflows/phase3-financial-readiness.yml
---

# Fase 3 — validação financeira integrada

## Estado

A Fase 3 está **preparada, mas não executada**. Este documento organiza a execução controlada prevista para o próximo ciclo. Nenhuma preferência, pagamento, webhook, transferência, cancelamento, reembolso ou notificação foi disparado durante a preparação.

## Objetivo

Validar o ciclo financeiro completo em ambiente de teste, do checkout à comunicação transacional, comprovando que o navegador não atua como autoridade financeira e que os efeitos internos permanecem consistentes, transacionais e idempotentes.

## Limite obrigatório de ambiente

A primeira execução deve usar exclusivamente:

```text
MERCADO_PAGO_ENV=test
```

A execução deve ser interrompida se qualquer URL, token, preferência ou resposta indicar ambiente de produção. Não converter uma execução de teste em produção alterando somente uma variável durante o processo.

## Escopo

| Etapa | Validação | Evidência mínima |
|---|---|---|
| 15 | checkout integrado | pedido criado pelo backend, lote e total definidos no banco |
| 16 | preferência de teste | `sandbox_init_point`, preferência persistida e reutilização idempotente |
| 17 | webhook assinado | assinatura válida aceita; assinatura ausente, inválida ou expirada rejeitada |
| 18 | idempotência e reconciliação | evento repetido sem duplicar transição, ingresso, reserva ou job |
| 19 | emissão de ingressos | um ingresso válido por participante elegível após pagamento aprovado |
| 20 | transferência e cancelamento | QR anterior invalidado, novo ingresso consistente e cancelamento sem duplicidade |
| 21 | reembolso e inventário | pagamento e ingressos invalidados, inventário restaurado uma única vez |
| 22 | notificações e retentativas | jobs idempotentes, sucesso/falha rastreáveis e retentativa limitada |

## Componentes já existentes

O repositório já contém:

- `checkout-create`, que autentica o comprador, chama `create_checkout_order`, cria a preferência e persiste `payment_preferences`;
- `payment-webhook`, que valida HMAC, consulta o pagamento no Mercado Pago e chama `apply_mercado_pago_payment`;
- RPCs para solicitar, aceitar, rejeitar e cancelar transferência;
- RPCs para solicitar e revisar reembolso;
- `refund-processor`, que chama o provedor, invalida ingressos e solicita restauração do inventário;
- `notification-worker`, que reivindica jobs, entrega por canal e conclui tentativa;
- testes SQL de transferências, reembolsos e check-in;
- testes funcionais de checkout com fixtures HTTP, sem provedor real.

A Fase 3 não deve reimplementar esses componentes antes de testá-los. Ajustes devem responder a falhas observadas na execução integrada.

## Preparação automatizada sem efeitos financeiros

O workflow `Phase 3 financial readiness` existe apenas para preflight. Ele:

1. só pode ser iniciado manualmente;
2. exige a confirmação `PREPARAR_FASE_3_TESTE`;
3. fixa `PHASE3_ENV=test`;
4. verifica arquivos, contratos e nomes de secrets;
5. valida que o payload não envia preço, total ou `ticket_type_id` como autoridade;
6. não usa `curl`, não publica Functions e não chama provedores;
7. gera `artifacts/phase3-financial-readiness.json` com presença ou ausência de configuração, sem valores.

## Pré-condições técnicas

Antes da execução financeira:

- Fase 2 concluída e consolidada em `main`;
- migrations reproduzidas integralmente e testes SQL aprovados;
- build e contratos gerados aprovados;
- quatro Edge Functions publicadas no ambiente controlado;
- projeto Supabase e projeto Mercado Pago de teste identificados;
- `SITE_URL`, URL pública das Functions e URL do webhook coerentes;
- lote de teste ativo, com capacidade suficiente para toda a sequência;
- nenhum dado financeiro real no cenário;
- baseline de estoque, pedidos, ingressos e jobs registrada antes do checkout.

## Identidades de teste necessárias

A execução exige três identidades separadas:

1. **comprador**: usuário autenticado com perfil e vínculo elegíveis para o produto escolhido;
2. **destinatário da transferência**: segundo usuário autenticado, diferente do comprador;
3. **administrador**: usuário com role `admin` ou `superadmin` para revisão de reembolso e consultas operacionais.

As credenciais devem ficar em secrets do ambiente `phase3-test`. Não documentar e-mails, senhas, UUIDs completos ou tokens em commits, issues ou relatórios públicos.

## Secrets e configuração do preflight

Obrigatórios:

```text
PHASE3_SUPABASE_URL
PHASE3_SUPABASE_ANON_KEY
PHASE3_BUYER_EMAIL
PHASE3_BUYER_PASSWORD
PHASE3_ADMIN_EMAIL
PHASE3_ADMIN_PASSWORD
PHASE3_TRANSFER_RECIPIENT_EMAIL
PHASE3_TRANSFER_RECIPIENT_PASSWORD
PHASE3_MERCADO_PAGO_ACCESS_TOKEN
PHASE3_MERCADO_PAGO_WEBHOOK_SECRET
PHASE3_NOTIFICATION_WORKER_KEY
PHASE3_CHECKOUT_PAYLOAD_JSON
```

Para e-mail:

```text
PHASE3_RESEND_API_KEY
PHASE3_TRANSACTIONAL_FROM_EMAIL
PHASE3_TEST_RECIPIENT_EMAIL
```

Para WhatsApp:

```text
PHASE3_WHATSAPP_ACCESS_TOKEN
PHASE3_WHATSAPP_PHONE_NUMBER_ID
PHASE3_WHATSAPP_GRAPH_VERSION
PHASE3_TEST_RECIPIENT_PHONE
```

O payload de checkout deve conter apenas comprador, produto, participantes, extras permitidos e chave de idempotência. Não deve conter preço, total, moeda ou tipo interno de ingresso.

## Sequência de execução

### 1. Preflight

Executar manualmente o workflow `Phase 3 financial readiness` a partir de `main`.

Resultado esperado:

- todos os marcadores de código presentes;
- secrets obrigatórios presentes;
- ambiente igual a `test`;
- payload válido e sem autoridade financeira;
- relatório com `provider_calls_performed: false`.

### 2. Baseline antes do checkout

Registrar contagens e estados, sem dados pessoais completos:

- lote e capacidade;
- quantidade vendida e reservada;
- pedidos do comprador;
- ingressos ativos;
- preferências e eventos financeiros relacionados ao cenário;
- jobs pendentes, processando, falhos e enviados.

Usar identificadores truncados somente nas evidências.

### 3. Checkout integrado e preferência de teste

Executar o checkout pela aplicação autenticada ou pelo endpoint canônico `/api/checkout-create`.

Validar:

- sessão obrigatória;
- chave de idempotência única para o cenário;
- pedido criado pela RPC `create_checkout_order`;
- total calculado no banco;
- reserva e expiração coerentes;
- preferência persistida;
- URL proveniente de `sandbox_init_point`;
- segunda chamada com a mesma chave reutiliza a preferência ativa;
- chamada concorrente não cria dois pedidos ou duas reservas equivalentes.

Não concluir o pagamento antes de registrar o estado intermediário.

### 4. Pagamento de teste

A conclusão no Checkout Pro exige ação humana com conta, usuário e meio de pagamento de teste fornecidos pelo Mercado Pago.

Registrar somente:

- horário;
- resultado do cenário;
- ID de pagamento truncado;
- ID de preferência truncado;
- status apresentado pelo provedor.

O retorno do navegador não encerra esta etapa. Prosseguir somente após o webhook ou consulta autoritativa.

### 5. Webhook assinado

Validar primeiro os casos negativos:

- sem `x-signature`;
- assinatura divergente;
- timestamp expirado;
- ausência de `x-request-id`;
- tipo de evento não financeiro.

Depois, validar o evento assinado do pagamento de teste:

- HMAC aceito;
- pagamento consultado em `GET /v1/payments/:id`;
- `external_reference`, preferência, valor e moeda reconciliados;
- `payment_events` finalizado;
- falha temporária retorna status retentável;
- repetição do mesmo evento não reaplica efeitos.

A idempotência deve ser comprovada em duas camadas: deduplicação do evento e idempotência transacional de `apply_mercado_pago_payment`.

### 6. Reconciliação e emissão

Após aprovação, conferir:

- pedido aprovado e `paid_at` preenchido;
- valor e moeda iguais ao pedido;
- reserva consumida ou liberada conforme contrato;
- um ingresso por participante elegível;
- QR ou token individual;
- nenhum ingresso duplicado após repetição do webhook;
- jobs de pagamento e ingresso enfileirados com chaves idempotentes;
- reporting administrativo coerente com o estado transacional.

### 7. Transferência e cancelamento

Usar um ingresso ativo do cenário.

Fluxo A — transferência aceita:

1. comprador chama `request_ticket_transfer`;
2. destinatário consulta a solicitação;
3. destinatário chama `accept_ticket_transfer`;
4. ingresso anterior fica inválido ou transferido;
5. novo ingresso aponta para o anterior e possui QR/token próprio;
6. jobs de notificação não são duplicados.

Fluxo B — transferência cancelada:

1. criar nova solicitação elegível;
2. comprador chama `cancel_ticket_transfer` antes da aceitação;
3. ingresso original permanece válido;
4. destinatário não consegue aceitar solicitação cancelada.

Não testar transferência com ingresso reembolsado, cancelado ou já transferido sem um cenário negativo isolado.

### 8. Reembolso e inventário

Executar somente depois de confirmar que o pedido é de teste e que existe autorização explícita para esta etapa.

1. comprador chama `request_order_refund`;
2. conferir cálculo e política aplicável;
3. administrador chama `review_refund_request` com aprovação;
4. administrador autenticado aciona `refund-processor`;
5. confirmar chave idempotente `hc20-refund-<request_id>`;
6. conferir resposta do provedor;
7. validar pedido como reembolsado;
8. validar ingressos e participantes invalidados;
9. validar inventário restaurado uma única vez;
10. repetir a operação e confirmar ausência de novo efeito financeiro.

A sequência deve verificar falhas parciais entre provedor, atualização do pedido, invalidação dos ingressos e restauração do inventário.

### 9. Notificações e retentativas

Validar separadamente e-mail e WhatsApp quando houver configuração aprovada.

- worker exige `x-worker-key` correto;
- claim respeita limite e bloqueio concorrente;
- job concluído não é reivindicado novamente;
- falha incrementa tentativas e registra erro sanitizado;
- próxima tentativa respeita `next_attempt_at`;
- job esgotado vai para dead letter, quando previsto no contrato;
- falha do provedor não reverte pagamento, ingresso, transferência ou reembolso;
- payload não contém credenciais ou dados pessoais desnecessários.

Enviar somente para endereço e telefone controlados pelo executor.

## Riscos que devem ser observados

- `provider_event_id` inclui `x-request-id`; notificações equivalentes com request IDs diferentes precisam continuar seguras pela idempotência da RPC financeira;
- `refund-processor` coordena chamada externa e múltiplas atualizações; deve ser verificado contra falhas parciais e reexecução;
- retorno do navegador pode anteceder o webhook;
- preferência ativa pode expirar entre criação e pagamento;
- concorrência pode disputar a última capacidade do lote;
- notificações podem falhar depois que o pagamento já foi aplicado;
- transferências devem invalidar o QR anterior sem perder rastreabilidade.

## Critérios de interrupção

Interromper imediatamente quando:

- `MERCADO_PAGO_ENV` não for `test`;
- credencial ou conta real aparecer no cenário;
- preço ou total do navegador prevalecer sobre o banco;
- preferência não usar sandbox;
- webhook sem assinatura válida for aceito;
- evento repetido criar novo ingresso, nova reserva ou novo job equivalente;
- pagamento aprovado não reconciliar valor, moeda ou referência;
- transferência mantiver dois ingressos válidos;
- reembolso restaurar inventário mais de uma vez;
- logs ou artifacts expuserem secret, senha, token ou dado pessoal completo;
- provider de notificação apontar para destinatário não controlado.

## Evidências permitidas

- commit e ambiente;
- horário e nome do cenário;
- códigos de produto e lote;
- IDs truncados;
- estados antes e depois;
- contagens de pedidos, ingressos, eventos e jobs;
- resultados de checks e testes;
- screenshots com dados mascarados.

## Evidências proibidas

- access token;
- webhook secret;
- anon key ou service role completas;
- senha de usuário;
- URL integral contendo token público;
- payload financeiro completo;
- e-mail, telefone, QR ou nome completo não mascarados.

## Limpeza do cenário

Ao final:

- preservar `payment_events`, trilhas e jobs necessários para auditoria;
- não excluir migrations nem editar histórico aplicado;
- não apagar manualmente somente o pedido deixando ingressos, preferências ou reservas órfãos;
- identificar registros de teste de forma rastreável e não sensível;
- restaurar configurações temporárias de lote e providers;
- registrar falhas encontradas antes de qualquer correção.

## Critério de conclusão

A Fase 3 só pode ser marcada como concluída quando as etapas 15 a 22 tiverem evidência integrada, o reembolso estiver limitado ao ambiente de teste, nenhuma duplicidade financeira tiver sido observada e os runbooks de pagamentos, webhook, notificações e reembolsos tiverem sido atualizados com o resultado real.
