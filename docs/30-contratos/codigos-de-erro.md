---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/lib/checkout.ts
  - api/checkout-create.ts
  - api/generate-profile-bio.ts
  - supabase/functions/checkout-create/index.ts
  - supabase/functions/payment-webhook/index.ts
  - supabase/functions/notification-worker/index.ts
  - supabase/functions/refund-processor/index.ts
  - supabase/migrations/
---

# Inventário de códigos de erro

> Inventário manual. O contrato definitivo deve ser extraído automaticamente do código e das RPCs.

## Convenção

- códigos estáveis em `snake_case`;
- mensagens amigáveis são responsabilidade do cliente;
- detalhes internos permanecem em logs protegidos;
- códigos 4xx representam entrada, autenticação ou regra de negócio;
- códigos 5xx representam configuração, provedor ou falha temporária;
- o mesmo código deve manter a mesma semântica entre camadas.

## HTTP e método

| Código | HTTP típico | Significado |
|---|---:|---|
| `method_not_allowed` | 405 | método não suportado |
| `invalid_payload` | 400 | corpo ausente ou formato inválido |
| `internal_error` | 500 | falha inesperada sem código específico |

## Autenticação e autorização

| Código | HTTP típico | Significado |
|---|---:|---|
| `authentication_required` | 401 | sessão ausente ou inválida |
| `unauthorized` | 401 | credencial interna, como worker key, inválida |
| `admin_required` | 403 | usuário autenticado sem role administrativa necessária |
| `invalid_signature` | 401 | assinatura do webhook inválida |
| `missing_webhook_secret` | 401/500 | secret não configurado para validar webhook |

## Checkout — entrada

| Código | Significado |
|---|---|
| `buyer_name_required` | nome do comprador ausente |
| `buyer_email_invalid` | e-mail inválido |
| `idempotency_key_required` | chave ausente, vazia ou excede limite |
| `participants_must_be_array` | participantes não são uma lista |
| `extras_must_be_array` | extras não são uma lista |
| `participant_limit_exceeded` | quantidade fora do limite de 1 a 6 |
| `participant_client_key_invalid` | chave do participante ausente |
| `participant_client_key_duplicate` | chave repetida no mesmo pedido |
| `participant_type_invalid` | tipo de participante não aceito |
| `participant_name_required` | nome do participante ausente |
| `child_birth_date_required` | filho sem data exigida |
| `child_birth_date_invalid` | data inválida |
| `child_birth_date_future` | data futura |
| `external_guest_data_required` | dados mínimos de convidado ausentes |
| `external_guest_birth_date_invalid` | data do convidado inválida |
| `external_guest_must_be_adult` | convidado não atende maioridade |
| `extra_participant_not_found` | extra referencia participante inexistente |
| `invalid_extra` | categoria ou duplicidade inválida |
| `invalid_extra_quantity` | quantidade não é inteiro positivo |

## Checkout — catálogo e composição

| Código | Significado |
|---|---|
| `no_active_lot` | não existe lote vigente |
| `invalid_primary_product` | produto não pertence ao lote vigente |
| `unsupported_primary_product` | produto não pode ser comprado no fluxo atual |
| `alumni_registration_required` | produto exige ex-aluno pré-cadastrado e vinculado |
| `exactly_one_alumni_required` | composição exige exatamente um ex-aluno |
| `simple_package_invalid_composition` | Individual contém participantes incompatíveis |
| `family_full_invalid_composition` | Família não contém ex-aluno, cônjuge e filho(s) exigidos |
| `family_single_parent_invalid_composition` | erro legado de composição de produto não vigente |
| `external_guest_package_invalid_composition` | Convidado não contém exatamente um adulto válido |
| `external_guest_not_approved` | regra legada de aprovação não atendida |
| `additional_child_price_missing` | preço de filho adicional não configurado |
| `external_guest_price_missing` | preço de convidado não configurado |
| `extra_price_missing` | preço de extra não configurado |
| `extras_not_supported` | modelo vigente não aceita extras |

## Checkout — serviço e Mercado Pago

| Código | HTTP típico | Significado |
|---|---:|---|
| `supabase_anon_key_missing` | 500 | proxy sem anon key |
| `checkout_service_unavailable` | 502 | upstream inacessível |
| `checkout_upstream_error` | conforme upstream | erro não estruturado da Edge Function |
| `checkout_validation_failed` | 500/400 | RPC falhou sem código reconhecido |
| `order_creation_failed` | 500 | RPC não retornou pedido |
| `order_not_found_after_creation` | 500 | pedido não pôde ser relido |
| `mercado_pago_not_configured` | 503 | access token ausente |
| `mercado_pago_environment_invalid` | 500/503 | ambiente diferente de `test` ou `production` |
| `mercado_pago_preference_failed` | 503 | provedor rejeitou preferência |
| `mercado_pago_checkout_url_missing` | 503 | preferência sem URL esperada |
| `invalid_checkout_response` | 502/cliente | resposta sem URL de checkout |
| `functions_public_url_missing` | 500 | URL de webhook não pôde ser derivada |

## Webhook

| Código/razão | Significado |
|---|---|
| `signature_fields_missing` | headers, timestamp, assinatura ou ID ausentes |
| `signature_timestamp_invalid` | timestamp não numérico |
| `signature_timestamp_expired` | evento fora da janela aceita |
| `signature_format_invalid` | assinatura não é hexadecimal válida |
| `signature_mismatch` | HMAC não coincide |
| `payment_event_insert_failed` | evento não pôde ser registrado |
| `missing_access_token` | token do Mercado Pago ausente |
| `payment_id_mismatch` | pagamento consultado não coincide com a notificação |
| `missing_or_invalid_external_reference` | pedido ausente ou referência inválida |
| `invalid_transaction_amount` | valor não numérico ou negativo |
| `temporary_processing_failure` | falha retentável; Function responde 503 |

Erros de `apply_mercado_pago_payment` podem incluir validações adicionais de moeda, valor, preferência, estado e ambiente. Devem ser extraídos das migrations.

## Notificações

| Código | Significado |
|---|---|
| `server_configuration_missing` | URL ou service role ausente |
| `ticket_hydration_failed` | consulta do ingresso falhou |
| `ticket_not_found` | ingresso relacionado não existe |
| `email_configuration_missing` | Resend ou remetente ausente |
| `recipient_email_missing` | destinatário de e-mail ausente |
| `email_provider_error_<status>` | Resend respondeu erro |
| `recipient_phone_invalid` | telefone não pôde ser normalizado |
| `whatsapp_configuration_missing` | credenciais do WhatsApp incompletas |
| `whatsapp_template_missing:<VAR>` | template necessário ausente |
| `whatsapp_provider_error_<status>` | Graph API respondeu erro |
| `notification_error` | erro não classificado do job |

## Reembolsos

| Código | HTTP típico | Significado |
|---|---:|---|
| `server_configuration_missing` | 500 | configuração de Supabase ou Mercado Pago ausente |
| `authentication_required` | 401 | sessão inválida |
| `admin_required` | 403 | role insuficiente |
| `request_id_required` | 400 | solicitação não informada |
| `refund_request_not_found` | 404 | solicitação inexistente |
| `refund_not_approved` | 409 | decisão administrativa ainda não aprovou |
| `payment_id_missing` | 409 | pagamento do provedor não identificado |
| `mercado_pago_refund_failed` | 502 | provedor rejeitou o reembolso |

Outros erros podem ser retornados diretamente pelo Supabase durante atualização local. Esses detalhes não devem ser apresentados integralmente ao usuário final.

## Mini bio por IA

Categorias esperadas, a confirmar por geração automática:

- método inválido;
- origem não permitida;
- rate limit excedido;
- payload inválido ou insuficiente;
- provedor não configurado;
- erro do provedor;
- resposta estruturada inválida;
- saída vazia ou acima do limite.

A interface deve manter edição manual disponível em todas essas falhas.

## Mapeamento para mensagens

O frontend pode traduzir códigos para português amigável, mas deve preservar o código para diagnóstico.

Exemplo:

```text
no_active_lot
→ Não há lote de ingressos disponível neste momento.
```

Não apresentar stack trace, query SQL, resposta completa do provedor ou secret.

## Observabilidade

Logs devem incluir:

- código;
- componente;
- timestamp;
- request/job/event ID não sensível;
- status HTTP;
- contexto mínimo.

Evitar nome, e-mail, telefone, token público e payload completo.

## Geração futura

O gerador deve extrair:

- `throw new Error("...")`;
- objetos e sets de códigos;
- respostas `{ error: "..." }`;
- mensagens do cliente;
- exceções levantadas por SQL/RPC;
- códigos documentados nos testes.

O CI deve falhar quando um novo código não estiver classificado ou quando um código removido continuar documentado como vigente.
