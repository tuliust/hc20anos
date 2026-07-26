---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/app/OperationsPage.tsx
  - src/app/App.tsx
  - supabase/functions/refund-processor/index.ts
  - supabase/migrations/20260719000009_transfers_refunds_checkin_operations.sql
  - supabase/migrations/
---

# Check-in, reembolsos e operação

## Objetivo

Documentar as operações administrativas executadas depois da venda: validação de ingresso, check-in, entrega de vouchers, análise de reembolso e processamento financeiro.

## Página de operações

`OperationsPage.tsx` é uma superfície administrativa independente destinada à operação do evento.

Capacidades observadas:

- consultar dashboard de check-in;
- atualizar indicadores em intervalo periódico;
- localizar e validar ingresso;
- executar check-in por RPC;
- registrar entrega de vouchers ou fichas;
- consultar solicitações de reembolso;
- revisar solicitações;
- acionar a Edge Function de processamento depois da aprovação.

A rota operacional deve exigir autenticação e role compatível. A existência de uma URL separada não constitui proteção.

## Check-in

### Autoridade

O banco, por RPC, decide se um ingresso pode ser utilizado. O frontend apenas apresenta o resultado.

A validação deve confirmar:

- ingresso existente;
- pedido financeiramente aprovado;
- status do ingresso válido;
- ingresso não reembolsado, cancelado ou transferido;
- ingresso ainda não utilizado;
- evento correto;
- operador autorizado.

### Registro

O estado de check-in é persistido no próprio ingresso ou nas estruturas finais definidas pelas migrations, incluindo:

- `checked_in`;
- `checked_in_at`;
- `checked_in_by_admin_id`.

A operação deve ser transacional e idempotente. Repetir o mesmo QR Code deve retornar “já utilizado” sem gravar um segundo check-in.

### QR Code e fallback

O QR Code deve conter token não previsível e não apenas o ID sequencial ou UUID exposto do ingresso.

A operação precisa oferecer fallback por código textual quando câmera ou `BarcodeDetector` não estiverem disponíveis.

Não registrar QR tokens completos em capturas, issues ou mensagens de suporte.

## Dashboard

`get_checkin_dashboard` fornece visão operacional atualizada. Métricas podem incluir:

- ingressos elegíveis;
- check-ins realizados;
- pendentes;
- check-ins recentes;
- vouchers entregues;
- exceções ou estados inválidos.

A atualização periódica não substitui confirmação da resposta de cada check-in.

## Vouchers e fichas

Itens adicionais ou benefícios físicos podem exigir registro de entrega.

A operação deve:

- identificar ingresso ou participante;
- mostrar quantidade elegível;
- registrar cada categoria entregue;
- impedir entrega duplicada;
- permitir consulta posterior;
- funcionar independentemente do estado visual local do navegador.

## Solicitação de reembolso

Uma solicitação deve registrar:

- pedido relacionado;
- solicitante;
- motivo;
- valor solicitado ou calculado;
- estado;
- prazo e elegibilidade;
- decisão administrativa;
- pagamento do provedor relacionado;
- timestamps e auditoria.

A criação da solicitação não executa o reembolso automaticamente.

## Revisão administrativa

RPCs como `get_admin_refund_requests` e `review_refund_request` permitem consultar e decidir solicitações.

A aprovação deve exigir `superadmin` ou `admin`, conforme o código da Function. A decisão precisa validar:

- pedido aprovado e não reembolsado;
- prazo aplicável;
- ingresso ainda elegível;
- valor coerente;
- ausência de processamento concorrente;
- justificativa e responsável.

## Processamento do reembolso

`refund-processor`:

1. exige sessão Supabase;
2. valida que o usuário está em `admin_users` com role autorizada;
3. recebe `request_id`;
4. carrega solicitação e pedido;
5. exige solicitação previamente aprovada;
6. identifica o pagamento do Mercado Pago;
7. marca a solicitação como `processing`;
8. chama a API de reembolso com chave idempotente;
9. atualiza pedido para `refunded`;
10. invalida ingressos e participantes;
11. restaura inventário uma única vez;
12. registra resposta do provedor;
13. cria job de notificação idempotente.

## Idempotência do reembolso

A chamada ao Mercado Pago usa chave baseada no ID da solicitação. A restauração de inventário depende de marcador como `inventory_restored_at` para impedir devolução duplicada.

Retentativas devem consultar o estado já persistido antes de repetir efeitos locais.

## Estados de reembolso

O modelo pode incluir:

- `pending`;
- `approved`;
- `rejected`;
- `processing`;
- `refunded`;
- `failed`.

O contrato final será gerado das migrations.

## Falhas parciais

O fluxo atravessa provedor externo e banco. Possíveis falhas:

- provedor reembolsa, mas atualização local falha;
- pedido local é atualizado, mas notificação falha;
- inventário ainda não é restaurado;
- Function é interrompida durante o processamento.

Em qualquer caso:

- não assumir o estado apenas pela resposta do navegador;
- consultar Mercado Pago e registros locais;
- preservar `provider_response_json` e auditoria;
- reconciliar antes de nova tentativa;
- não apagar `payment_events`, pedidos ou solicitações.

## Permissões mínimas

| Operação | Role esperada |
|---|---|
| Visualizar dashboard de operação | `checkin_staff`, `admin` ou `superadmin`, conforme RPC final |
| Executar check-in | `checkin_staff`, `admin` ou `superadmin` |
| Entregar vouchers | equipe operacional autorizada |
| Consultar reembolsos | `admin` ou `superadmin` |
| Aprovar e processar reembolso | `admin` ou `superadmin` |
| Alterar policies ou dados financeiros manualmente | acesso técnico excepcional e auditado |

A matriz final depende das policies e RPCs geradas.

## Testes mínimos

### Check-in

- ingresso aprovado é aceito;
- ingresso pendente é rejeitado;
- ingresso reembolsado é rejeitado;
- ingresso transferido usa somente token atual;
- ingresso já utilizado retorna estado idempotente;
- operador sem role é rejeitado;
- fallback textual funciona;
- dashboard reflete o check-in.

### Reembolso

- solicitação não aprovada não é processada;
- usuário comum não processa reembolso;
- chave idempotente impede duplicidade no provedor;
- pedido muda para `refunded`;
- ingressos são invalidados;
- participantes são atualizados;
- inventário é restaurado uma vez;
- job de notificação é criado uma vez;
- falha do provedor deixa estado diagnosticável.

## Runbooks relacionados

- [`../40-runbooks/operacao-no-dia-do-evento.md`](../40-runbooks/operacao-no-dia-do-evento.md)
- [`../40-runbooks/reembolsos.md`](../40-runbooks/reembolsos.md)
- [`../40-runbooks/resposta-a-incidentes.md`](../40-runbooks/resposta-a-incidentes.md)

## Dívidas conhecidas

- O polling do dashboard precisa ser avaliado quanto a carga e comportamento em conectividade instável.
- O contrato automático de roles e RPCs ainda não foi gerado.
- O procedimento de contingência offline deve ser testado antes do evento.
