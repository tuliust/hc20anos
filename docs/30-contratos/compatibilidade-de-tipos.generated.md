---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 865faafda8d2f606c258db0934a956bb523b0864
generation_command: npm run docs:generate-type-compatibility
source_files:
  - src/lib/database.types.ts
  - docs/30-contratos/database.types.generated.ts
  - scripts/audit-database-types.mjs
---

# Compatibilidade dos tipos Supabase

> Relatório gerado por comparação estrutural. Não editar manualmente.

## Conclusão

`src/lib/database.types.ts` não é uma saída atual da Supabase CLI. Ele combina interfaces de domínio, agregados de interface, aliases históricos e um mapa parcial do banco.

A substituição direta é insegura. A migração deve separar o contrato bruto do Supabase dos tipos de domínio e apresentação usados pelos componentes.

## Cobertura estrutural

| Categoria | Baseline gerada | Mapa manual | Ausentes no manual | Somente no manual |
|---|---|---|---|---|
| Tabelas | 45 | 30 | 19 | 4 |
| Views | 6 | 2 | 4 | 0 |
| Funções/RPCs | 80 | 7 | 73 | 0 |
| Enums | 11 | 9 | 2 | 0 |

## Objetos ausentes no mapa manual

### Tabelas (19)

`checkin_events`, `cms_assets`, `content_moderation_settings`, `event_archive_settings`, `faq_items_backup_20260716`, `guest_approval_requests`, `notification_jobs`, `order_participants`, `participant_extras`, `payment_preferences`, `profile_identity_verifications`, `public_page_content`, `rate_limit_buckets`, `refund_policy`, `refund_requests`, `security_audit_log`, `ticket_lot_prices`, `ticket_lots`, `ticket_transfers`

### Views (4)

`public_alumni_directory_status`, `public_curiosity_profile_stats`, `public_profile_cards`, `public_school_questionnaire_option_stats`

### Funções e RPCs (73)

`accept_ticket_transfer`, `admin_archive_ticket_lot`, `admin_can_manage_people`, `admin_clear_person_profile`, `admin_delete_person_profile`, `admin_get_person_details`, `admin_get_profile_claim_disputes_with_identity`, `admin_get_ticket_lots`, `admin_import_people`, `admin_update_person_and_profile`, `admin_update_refund_policy`, `admin_upsert_ticket_lot`, `age_on_date`, `age_on_event_date`, `apply_mercado_pago_payment`, `calculate_refund_quote`, `cancel_guest_approval_request`, `cancel_ticket_transfer`, `claim_notification_jobs`, `cleanup_security_operational_data`, `complete_notification_job`, `complete_profile_registration_v3`, `count_approved_external_guests`, `create_checkout_order`, `create_guest_approval_request`, `current_security_role`, `decide_guest_approval_request`, `enforce_rate_limit`, `expire_checkout_reservations`, `expire_guest_approval_requests`, `expire_ticket_transfers`, `export_checkin_report`, `get_admin_commerce_report`, `get_admin_orders`, `get_admin_orders_mercado_pago_base`, `get_admin_refund_requests`, `get_admin_security_audit`, `get_checkin_activity`, `get_checkin_dashboard`, `get_checkin_operation_metrics`, `get_checkout_status_by_token`, `get_current_ticket_catalog`, `get_current_ticket_lot`, `get_event_reports_mercado_pago_base`, `get_my_commerce_orders`, `get_my_guest_approval_requests`, `get_my_ticket_transfers`, `get_public_ticket_catalog`, `has_admin_role`, `is_admin_panel_user`, `is_superadmin`, `normalize_profile_answer`, `normalize_profile_identity_text`, `perform_ticket_checkin`, `profile_claim_penultimate_surname`, `refresh_ticket_type_sold_quantity`, `reject_ticket_transfer`, `release_expired_ticket_reservations`, `request_order_refund`, `request_ticket_resend`, `request_ticket_transfer`, `respond_guest_approval_request`, `restore_refunded_order_inventory`, `retry_order_payment`, `review_refund_request`, `run_commerce_automation`, `search_external_guest_sponsors`, `set_participant_vouchers_delivered`, `show_limit`, `show_trgm`, `sync_ticket_lot_statuses`, `update_my_public_profile`, `write_security_audit`

### Enums (2)

`dispute_status`, `removal_request_status`

## Objetos presentes somente no mapa manual

- Tabelas: `public_alumni_directory_status`, `public_curiosity_profile_stats`, `public_profile_cards`, `public_school_questionnaire_option_stats`.
- Views: —.
- Funções: —.
- Enums: —.

Essas diferenças podem representar aliases históricos, objetos removidos, classificação incorreta ou tipos de aplicação que nunca foram objetos físicos do banco.

## Classificação divergente

- Entradas tratadas como tabela no arquivo manual, mas geradas como view: `public_alumni_directory_status`, `public_curiosity_profile_stats`, `public_profile_cards`, `public_school_questionnaire_option_stats`.
- Entradas tratadas como view no arquivo manual, mas geradas como tabela: —.

## Linhas sem tipagem efetiva

Mapeamentos com `Row: any`: `payment_events`.

## Divergência de campos nos objetos comparáveis

| Objeto | Interface manual | Campos ausentes no manual | Campos extras no manual |
|---|---|---|---|
| `events` | `DbEvent` | `event_timezone` | — |
| `ticket_types` | `DbTicketType` | `included_people_count`, `metadata_json`, `package_kind`, `participant_type`, `product_code` | — |
| `orders` | `DbOrder` | `approved_inventory_applied_at`, `buyer_user_id`, `cancelled_at`, `checkout_idempotency_key`, `currency_id`, `extras_amount_cents`, `installments`, `lot_id`, `payment_environment`, `payment_provider_merchant_order_id`, `payment_status_detail`, `payment_type`, `public_token`, `refunded_at`, `reservation_released_at`, `reservation_status`, `subtotal_amount_cents` | — |
| `tickets` | `DbTicket` | `cancellation_reason`, `cancelled_at`, `order_participant_id`, `physical_vouchers_delivered_at`, `physical_vouchers_delivered_by`, `qr_token`, `status`, `transferred_from_ticket_id` | — |
| `payment_events` | `any` | não comparável | não comparável |
| `event_page_content` | `DbEventPageContent` | `local_section_eyebrow`, `local_section_title`, `program_image_alt`, `program_image_url`, `program_section_eyebrow`, `program_section_title`, `show_gallery_preview`, `structure_cards_json`, `structure_section_eyebrow`, `structure_section_subtitle`, `structure_section_title` | — |
| `faq_categories` | `DbFaqCategory` | `icon_key` | — |
| `faq_items` | `DbFaqItem` | `category_key`, `category_label` | `category` |
| `poll_results` | `PollResultRow }` | interface não analisável | interface não analisável |
| `public_profile_locations` | `PublicLocationRow }` | interface não analisável | interface não analisável |

## Estratégia recomendada

1. Manter `database.types.generated.ts` como contrato bruto e não editável.
2. Configurar o cliente Supabase com o tipo bruto gerado.
3. Mover interfaces de tela, conteúdo JSON e agregados para um módulo de tipos de domínio.
4. Substituir gradualmente interfaces `Db*` por aliases derivados de `Database["public"]` quando a forma for idêntica.
5. Criar adaptadores explícitos para formas compostas por tabela, view, RPC ou campos calculados.
6. Remover `any` e objetos inexistentes somente depois de corrigir os consumidores.
7. Executar build, TypeScript e E2E a cada grupo de migração.

## Critérios para substituir o arquivo manual

- nenhum consumidor depende de campo ausente no banco;
- views não são declaradas como tabelas;
- RPCs usadas pelo código existem na baseline gerada;
- tipos de conteúdo JSON possuem adaptadores ou aliases próprios;
- não há `Row: any`;
- build e testes passam com o cliente tipado pela saída gerada;
- a migração é dividida em commits revisáveis.

## Limitações da auditoria

- compara nomes e campos, não equivalência completa de tipos TypeScript;
- não interpreta aliases condicionais ou generics complexos;
- tipos de domínio sem correspondência direta são preservados;
- diferenças exigem análise funcional antes de correção.

