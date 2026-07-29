---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 116799bbb9c622de23a3246ba82c7c5233618c8f
generation_command: npm run docs:generate-db-contracts
source_files:
  - supabase/config.toml
  - supabase/migrations/
  - scripts/generate-database-contracts.mjs
---

# Contrato do banco de dados

> Arquivo gerado a partir de um banco Supabase local reconstruído por todas as migrations. Não editar manualmente.

## Enums

| Schema | Enum | Ordem | Valor |
|---|---|---|---|
| `public` | `admin_role` | 1 | `superadmin` |
| `public` | `admin_role` | 2 | `moderator` |
| `public` | `admin_role` | 3 | `checkin_staff` |
| `public` | `admin_role` | 4 | `admin` |
| `public` | `admin_role` | 5 | `viewer` |
| `public` | `claim_status` | 1 | `pending` |
| `public` | `claim_status` | 2 | `approved` |
| `public` | `claim_status` | 3 | `rejected` |
| `public` | `claim_status` | 4 | `disputed` |
| `public` | `claim_status` | 5 | `expired` |
| `public` | `dispute_status` | 1 | `pending` |
| `public` | `dispute_status` | 2 | `approved` |
| `public` | `dispute_status` | 3 | `rejected` |
| `public` | `dispute_status` | 4 | `cancelled` |
| `public` | `event_status` | 1 | `draft` |
| `public` | `event_status` | 2 | `published` |
| `public` | `event_status` | 3 | `cancelled` |
| `public` | `event_status` | 4 | `completed` |
| `public` | `payment_status` | 1 | `pending` |
| `public` | `payment_status` | 2 | `in_process` |
| `public` | `payment_status` | 3 | `approved` |
| `public` | `payment_status` | 4 | `rejected` |
| `public` | `payment_status` | 5 | `cancelled` |
| `public` | `payment_status` | 6 | `refunded` |
| `public` | `payment_status` | 7 | `expired` |
| `public` | `payment_status` | 8 | `charged_back` |
| `public` | `photo_status` | 1 | `pending` |
| `public` | `photo_status` | 2 | `approved` |
| `public` | `photo_status` | 3 | `rejected` |
| `public` | `photo_status` | 4 | `removed` |
| `public` | `profile_status` | 1 | `unclaimed` |
| `public` | `profile_status` | 2 | `claimed` |
| `public` | `profile_status` | 3 | `confirmed` |
| `public` | `removal_request_status` | 1 | `pending` |
| `public` | `removal_request_status` | 2 | `approved` |
| `public` | `removal_request_status` | 3 | `rejected` |
| `public` | `removal_request_status` | 4 | `hidden_preventively` |
| `public` | `sales_status` | 1 | `open` |
| `public` | `sales_status` | 2 | `paused` |
| `public` | `sales_status` | 3 | `closed` |
| `public` | `tag_status` | 1 | `pending` |
| `public` | `tag_status` | 2 | `approved` |
| `public` | `tag_status` | 3 | `rejected` |
| `public` | `tag_status` | 4 | `removed` |
| `public` | `ticket_status` | 1 | `draft` |
| `public` | `ticket_status` | 2 | `open` |
| `public` | `ticket_status` | 3 | `paused` |
| `public` | `ticket_status` | 4 | `sold_out` |
| `public` | `ticket_status` | 5 | `closed` |

## Tabelas e colunas

| Tabela | Posição | Coluna | Tipo | Nullable | Default |
|---|---|---|---|---|---|
| `public.admin_users` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.admin_users` | 2 | `user_id` | `uuid` | NO | `—` |
| `public.admin_users` | 3 | `role` | `admin_role` | NO | `'moderator'::admin_role` |
| `public.admin_users` | 4 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.admin_users` | 5 | `display_name` | `text` | YES | `—` |
| `public.admin_users` | 6 | `email` | `text` | YES | `—` |
| `public.admin_users` | 7 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.audit_logs` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.audit_logs` | 2 | `user_id` | `uuid` | YES | `—` |
| `public.audit_logs` | 3 | `action` | `text` | NO | `—` |
| `public.audit_logs` | 4 | `entity_type` | `text` | NO | `—` |
| `public.audit_logs` | 5 | `entity_id` | `uuid` | YES | `—` |
| `public.audit_logs` | 6 | `metadata_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.audit_logs` | 7 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.checkin_events` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.checkin_events` | 2 | `ticket_id` | `uuid` | NO | `—` |
| `public.checkin_events` | 3 | `action` | `text` | NO | `—` |
| `public.checkin_events` | 4 | `operator_user_id` | `uuid` | NO | `—` |
| `public.checkin_events` | 5 | `notes` | `text` | YES | `—` |
| `public.checkin_events` | 6 | `metadata_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.checkin_events` | 7 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.cms_assets` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.cms_assets` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.cms_assets` | 3 | `asset_key` | `text` | NO | `—` |
| `public.cms_assets` | 4 | `label` | `text` | NO | `—` |
| `public.cms_assets` | 5 | `file_url` | `text` | YES | `—` |
| `public.cms_assets` | 6 | `storage_path` | `text` | YES | `—` |
| `public.cms_assets` | 7 | `alt_text` | `text` | YES | `—` |
| `public.cms_assets` | 8 | `caption` | `text` | YES | `—` |
| `public.cms_assets` | 9 | `usage_context` | `text` | YES | `—` |
| `public.cms_assets` | 10 | `sort_order` | `integer` | NO | `0` |
| `public.cms_assets` | 11 | `is_active` | `boolean` | NO | `true` |
| `public.cms_assets` | 12 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.cms_assets` | 13 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.cms_assets` | 14 | `updated_by_admin_id` | `uuid` | YES | `—` |
| `public.content_moderation_events` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.content_moderation_events` | 2 | `event_id` | `uuid` | YES | `—` |
| `public.content_moderation_events` | 3 | `entity_type` | `text` | NO | `—` |
| `public.content_moderation_events` | 4 | `entity_id` | `uuid` | NO | `—` |
| `public.content_moderation_events` | 5 | `previous_status` | `text` | YES | `—` |
| `public.content_moderation_events` | 6 | `new_status` | `text` | NO | `—` |
| `public.content_moderation_events` | 7 | `action` | `text` | NO | `—` |
| `public.content_moderation_events` | 8 | `notes` | `text` | YES | `—` |
| `public.content_moderation_events` | 9 | `actor_user_id` | `uuid` | YES | `—` |
| `public.content_moderation_events` | 10 | `actor_role` | `text` | YES | `—` |
| `public.content_moderation_events` | 11 | `metadata_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.content_moderation_events` | 12 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.content_moderation_settings` | 1 | `event_id` | `uuid` | NO | `—` |
| `public.content_moderation_settings` | 2 | `auto_approve_photos` | `boolean` | NO | `false` |
| `public.content_moderation_settings` | 3 | `auto_approve_comments` | `boolean` | NO | `false` |
| `public.content_moderation_settings` | 4 | `auto_approve_memories` | `boolean` | NO | `false` |
| `public.content_moderation_settings` | 5 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.event_archive_settings` | 1 | `event_id` | `uuid` | NO | `—` |
| `public.event_archive_settings` | 2 | `archive_enabled` | `boolean` | NO | `false` |
| `public.event_archive_settings` | 3 | `post_event_text` | `text` | YES | `—` |
| `public.event_archive_settings` | 4 | `official_video_url` | `text` | YES | `—` |
| `public.event_archive_settings` | 5 | `official_video_title` | `text` | YES | `—` |
| `public.event_archive_settings` | 6 | `official_photo_ids` | `ARRAY` | NO | `'{}'::uuid[]` |
| `public.event_archive_settings` | 7 | `highlight_photo_ids` | `ARRAY` | NO | `'{}'::uuid[]` |
| `public.event_archive_settings` | 8 | `highlights_links` | `jsonb` | NO | `'[]'::jsonb` |
| `public.event_archive_settings` | 9 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.event_archive_settings` | 10 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.event_archive_settings` | 11 | `page_eyebrow` | `text` | NO | `'Pós-festa'::text` |
| `public.event_archive_settings` | 12 | `page_title` | `text` | NO | `'Memórias do reencontro'::text` |
| `public.event_archive_settings` | 13 | `message_label` | `text` | NO | `'Mensagem da organização'::text` |
| `public.event_archive_settings` | 14 | `closed_title` | `text` | NO | `'O acervo será aberto depois do reencontro.'::text` |
| `public.event_archive_settings` | 15 | `closed_text` | `text` | NO | `'Depois do evento, esta página reunirá os registros e lembranças aprovados pela organização.'::text` |
| `public.event_page_content` | 1 | `event_id` | `uuid` | NO | `—` |
| `public.event_page_content` | 2 | `hero_eyebrow` | `text` | NO | `''::text` |
| `public.event_page_content` | 3 | `title` | `text` | NO | `''::text` |
| `public.event_page_content` | 4 | `subtitle` | `text` | NO | `''::text` |
| `public.event_page_content` | 5 | `description` | `text` | NO | `''::text` |
| `public.event_page_content` | 6 | `hero_image_url` | `text` | YES | `—` |
| `public.event_page_content` | 7 | `gallery_json` | `jsonb` | NO | `'[]'::jsonb` |
| `public.event_page_content` | 8 | `map_embed_url` | `text` | YES | `—` |
| `public.event_page_content` | 9 | `map_link_url` | `text` | YES | `—` |
| `public.event_page_content` | 10 | `venue_notes` | `text` | NO | `''::text` |
| `public.event_page_content` | 11 | `attractions_json` | `jsonb` | NO | `'[]'::jsonb` |
| `public.event_page_content` | 12 | `schedule_json` | `jsonb` | NO | `'[]'::jsonb` |
| `public.event_page_content` | 13 | `food_bar_text` | `text` | NO | `''::text` |
| `public.event_page_content` | 14 | `bathrooms_text` | `text` | NO | `''::text` |
| `public.event_page_content` | 15 | `security_text` | `text` | NO | `''::text` |
| `public.event_page_content` | 16 | `extra_info_json` | `jsonb` | NO | `'[]'::jsonb` |
| `public.event_page_content` | 17 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.event_page_content` | 18 | `updated_by_admin_id` | `uuid` | YES | `—` |
| `public.event_page_content` | 19 | `program_image_url` | `text` | YES | `—` |
| `public.event_page_content` | 20 | `program_image_alt` | `text` | YES | `—` |
| `public.event_page_content` | 21 | `structure_cards_json` | `jsonb` | NO | `'[]'::jsonb` |
| `public.event_page_content` | 22 | `show_gallery_preview` | `boolean` | NO | `false` |
| `public.event_page_content` | 23 | `local_section_eyebrow` | `text` | YES | `—` |
| `public.event_page_content` | 24 | `local_section_title` | `text` | YES | `—` |
| `public.event_page_content` | 25 | `program_section_eyebrow` | `text` | YES | `—` |
| `public.event_page_content` | 26 | `program_section_title` | `text` | YES | `—` |
| `public.event_page_content` | 27 | `structure_section_eyebrow` | `text` | YES | `—` |
| `public.event_page_content` | 28 | `structure_section_title` | `text` | YES | `—` |
| `public.event_page_content` | 29 | `structure_section_subtitle` | `text` | YES | `—` |
| `public.events` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.events` | 2 | `title` | `text` | NO | `—` |
| `public.events` | 3 | `slug` | `text` | NO | `—` |
| `public.events` | 4 | `description` | `text` | YES | `—` |
| `public.events` | 5 | `event_date` | `date` | NO | `—` |
| `public.events` | 6 | `event_time` | `time without time zone` | NO | `'19:00:00'::time without time zone` |
| `public.events` | 7 | `location_name` | `text` | NO | `—` |
| `public.events` | 8 | `location_address` | `text` | YES | `—` |
| `public.events` | 9 | `event_status` | `event_status` | NO | `'draft'::event_status` |
| `public.events` | 10 | `sales_status` | `sales_status` | NO | `'closed'::sales_status` |
| `public.events` | 11 | `contact_email` | `text` | YES | `—` |
| `public.events` | 12 | `contact_whatsapp` | `text` | YES | `—` |
| `public.events` | 13 | `general_rules` | `text` | YES | `—` |
| `public.events` | 14 | `companion_policy` | `text` | YES | `—` |
| `public.events` | 15 | `refund_policy` | `text` | YES | `—` |
| `public.events` | 16 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.events` | 17 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.events` | 18 | `event_timezone` | `text` | NO | `'America/Sao_Paulo'::text` |
| `public.faq_categories` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.faq_categories` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.faq_categories` | 3 | `key` | `text` | NO | `—` |
| `public.faq_categories` | 4 | `label` | `text` | NO | `—` |
| `public.faq_categories` | 5 | `description` | `text` | YES | `—` |
| `public.faq_categories` | 6 | `sort_order` | `integer` | NO | `0` |
| `public.faq_categories` | 7 | `is_visible` | `boolean` | NO | `true` |
| `public.faq_categories` | 8 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.faq_categories` | 9 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.faq_categories` | 10 | `created_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_categories` | 11 | `updated_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_categories` | 12 | `deleted_at` | `timestamp with time zone` | YES | `—` |
| `public.faq_categories` | 13 | `deleted_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_categories` | 14 | `icon_key` | `text` | YES | `—` |
| `public.faq_items` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.faq_items` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.faq_items` | 3 | `category_id` | `uuid` | NO | `—` |
| `public.faq_items` | 4 | `slug` | `text` | NO | `—` |
| `public.faq_items` | 5 | `question` | `text` | NO | `—` |
| `public.faq_items` | 6 | `answer` | `text` | NO | `—` |
| `public.faq_items` | 7 | `sort_order` | `integer` | NO | `0` |
| `public.faq_items` | 8 | `is_visible` | `boolean` | NO | `true` |
| `public.faq_items` | 9 | `is_featured` | `boolean` | NO | `false` |
| `public.faq_items` | 10 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.faq_items` | 11 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.faq_items` | 12 | `created_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_items` | 13 | `updated_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_items` | 14 | `deleted_at` | `timestamp with time zone` | YES | `—` |
| `public.faq_items` | 15 | `deleted_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_items` | 16 | `category_key` | `text` | YES | `—` |
| `public.faq_items` | 17 | `category_label` | `text` | YES | `—` |
| `public.faq_items_backup_20260716` | 1 | `id` | `uuid` | YES | `—` |
| `public.faq_items_backup_20260716` | 2 | `event_id` | `uuid` | YES | `—` |
| `public.faq_items_backup_20260716` | 3 | `category_id` | `uuid` | YES | `—` |
| `public.faq_items_backup_20260716` | 4 | `slug` | `text` | YES | `—` |
| `public.faq_items_backup_20260716` | 5 | `question` | `text` | YES | `—` |
| `public.faq_items_backup_20260716` | 6 | `answer` | `text` | YES | `—` |
| `public.faq_items_backup_20260716` | 7 | `sort_order` | `integer` | YES | `—` |
| `public.faq_items_backup_20260716` | 8 | `is_visible` | `boolean` | YES | `—` |
| `public.faq_items_backup_20260716` | 9 | `is_featured` | `boolean` | YES | `—` |
| `public.faq_items_backup_20260716` | 10 | `created_at` | `timestamp with time zone` | YES | `—` |
| `public.faq_items_backup_20260716` | 11 | `updated_at` | `timestamp with time zone` | YES | `—` |
| `public.faq_items_backup_20260716` | 12 | `created_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_items_backup_20260716` | 13 | `updated_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_items_backup_20260716` | 14 | `deleted_at` | `timestamp with time zone` | YES | `—` |
| `public.faq_items_backup_20260716` | 15 | `deleted_by_admin_id` | `uuid` | YES | `—` |
| `public.faq_items_backup_20260716` | 16 | `category_key` | `text` | YES | `—` |
| `public.faq_items_backup_20260716` | 17 | `category_label` | `text` | YES | `—` |
| `public.guest_approval_requests` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.guest_approval_requests` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.guest_approval_requests` | 3 | `guest_user_id` | `uuid` | NO | `—` |
| `public.guest_approval_requests` | 4 | `guest_name` | `text` | NO | `—` |
| `public.guest_approval_requests` | 5 | `guest_email` | `text` | NO | `—` |
| `public.guest_approval_requests` | 6 | `guest_phone` | `text` | NO | `—` |
| `public.guest_approval_requests` | 7 | `relationship_to_alumni` | `text` | NO | `—` |
| `public.guest_approval_requests` | 8 | `sponsor_person_id` | `uuid` | NO | `—` |
| `public.guest_approval_requests` | 9 | `sponsor_user_id` | `uuid` | YES | `—` |
| `public.guest_approval_requests` | 10 | `status` | `text` | NO | `'pending'::text` |
| `public.guest_approval_requests` | 11 | `decided_at` | `timestamp with time zone` | YES | `—` |
| `public.guest_approval_requests` | 12 | `decided_by_user_id` | `uuid` | YES | `—` |
| `public.guest_approval_requests` | 13 | `decision_notes` | `text` | YES | `—` |
| `public.guest_approval_requests` | 14 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.guest_approval_requests` | 15 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.guest_approval_requests` | 16 | `expires_at` | `timestamp with time zone` | YES | `—` |
| `public.guest_approval_requests` | 17 | `cancelled_at` | `timestamp with time zone` | YES | `—` |
| `public.home_page_content` | 1 | `event_id` | `uuid` | NO | `—` |
| `public.home_page_content` | 2 | `hero_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 3 | `hero_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 4 | `hero_tagline` | `text` | NO | `''::text` |
| `public.home_page_content` | 5 | `hero_subtitle` | `text` | NO | `''::text` |
| `public.home_page_content` | 6 | `hero_event_line` | `text` | NO | `''::text` |
| `public.home_page_content` | 7 | `primary_cta_label` | `text` | NO | `''::text` |
| `public.home_page_content` | 8 | `secondary_cta_label` | `text` | NO | `''::text` |
| `public.home_page_content` | 9 | `about_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 10 | `about_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 11 | `about_body_1` | `text` | NO | `''::text` |
| `public.home_page_content` | 12 | `about_body_2` | `text` | NO | `''::text` |
| `public.home_page_content` | 13 | `info_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 14 | `info_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 15 | `tickets_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 16 | `tickets_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 17 | `confirmed_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 18 | `confirmed_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 19 | `photos_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 20 | `photos_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 21 | `timeline_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 22 | `timeline_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 23 | `faq_eyebrow` | `text` | NO | `''::text` |
| `public.home_page_content` | 24 | `faq_title` | `text` | NO | `''::text` |
| `public.home_page_content` | 25 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.home_page_content` | 26 | `updated_by_admin_id` | `uuid` | YES | `—` |
| `public.home_page_content` | 27 | `header_logo_url` | `text` | YES | `—` |
| `public.home_page_content` | 28 | `header_logo_alt` | `text` | NO | `'Turma 2006'::text` |
| `public.home_page_content` | 29 | `header_fallback_badge_main` | `text` | NO | `'HC'::text` |
| `public.home_page_content` | 30 | `header_fallback_badge_year` | `text` | NO | `'20'::text` |
| `public.home_page_content` | 31 | `header_fallback_title` | `text` | NO | `'Turma 2006'::text` |
| `public.home_page_content` | 32 | `header_fallback_subtitle` | `text` | NO | `'20 anos'::text` |
| `public.home_page_content` | 33 | `header_cta_label` | `text` | NO | `'Comprar ingresso'::text` |
| `public.home_page_content` | 34 | `nav_home_label` | `text` | NO | `'Home'::text` |
| `public.home_page_content` | 35 | `nav_who_going_label` | `text` | NO | `'Quem Vai'::text` |
| `public.home_page_content` | 36 | `nav_the_class_label` | `text` | NO | `'A Turma'::text` |
| `public.home_page_content` | 37 | `nav_photos_label` | `text` | NO | `'Nossa História'::text` |
| `public.home_page_content` | 38 | `nav_memories_label` | `text` | NO | `'Caixa de Memórias'::text` |
| `public.home_page_content` | 39 | `nav_polls_label` | `text` | NO | `'Enquetes'::text` |
| `public.home_page_content` | 40 | `nav_where_now_label` | `text` | NO | `'Mapa'::text` |
| `public.home_page_content` | 41 | `nav_archive_label` | `text` | NO | `'Acervo'::text` |
| `public.home_page_content` | 42 | `timeline_items_json` | `text` | NO | `'[<br>  {<br>    "year": "2004",<br>    "label": "Primeiro ano juntos",<br>    "desc": "A turma se forma. Começa a história de três anos que ficaria para sempre."<br>  },<br>  {<br>    "year": "2005",<br>    "label": "No meio do caminho",<br>    "desc": "Gincanas, amizades reforçadas, as primeiras provas difíceis e os momentos que viraram lenda."<br>  },<br>  {<br>    "year": "2006",<br>    "label": "O ano da formatura",<br>    "desc": "Vestibular, colação de grau e o adeus que a gente não sabia que duraria tanto."<br>  },<br>  {<br>    "year": "2016",<br>    "label": "10 anos — onde estávamos?",<br>    "desc": "Alguns se reencontraram. Muitos já tinham filhos, carreiras e histórias novas."<br>  },<br>  {<br>    "year": "2026",<br>    "label": "20 anos depois — aqui estamos",<br>    "desc": "O reencontro que todos esperavam. Uma noite para celebrar quem a gente se tornou."<br>  }<br>]'::text` |
| `public.home_page_content` | 43 | `faq_items_json` | `text` | NO | `'[<br>  {<br>    "q": "Quem pode participar?",<br>    "a": "O evento é exclusivo para ex-alunos do Colégio Henrique Castriciano formados em 2006 e seus acompanhantes."<br>  },<br>  {<br>    "q": "Posso levar acompanhante?",<br>    "a": "Sim! Você pode adquirir o ingresso casal ou mesa VIP. Acompanhantes não precisam ser ex-alunos."<br>  },<br>  {<br>    "q": "Como funciona a reivindicação?",<br>    "a": "Você busca seu nome na lista, informa seus contatos, passa por verificação e responde a perguntas sobre o HC antes de confirmar sua identidade."<br>  },<br>  {<br>    "q": "O ingresso é transferível?",<br>    "a": "Não. O ingresso é nominal e vinculado ao CPF. Em caso de impossibilidade, entre em contato com a organização."<br>  },<br>  {<br>    "q": "Qual é a forma de pagamento?",<br>    "a": "Aceitamos cartão de crédito (até 6× sem juros), débito e PIX via Mercado Pago."<br>  },<br>  {<br>    "q": "Como farei o check-in no dia?",<br>    "a": "Você receberá um QR Code por e-mail após confirmação do pagamento. Apresente na entrada — impresso ou no celular."<br>  }<br>]'::text` |
| `public.home_page_content` | 44 | `footer_eyebrow` | `text` | NO | `'Colégio Henrique Castriciano'::text` |
| `public.home_page_content` | 45 | `footer_title` | `text` | NO | `'Turma 2006'::text` |
| `public.home_page_content` | 46 | `footer_body` | `text` | NO | `'O reencontro dos ex-alunos, 20 anos depois de uma época que ficou para sempre.'::text` |
| `public.home_page_content` | 47 | `footer_nav_title` | `text` | NO | `'Navegação'::text` |
| `public.home_page_content` | 48 | `footer_contact_title` | `text` | NO | `'Contato'::text` |
| `public.home_page_content` | 49 | `footer_email` | `text` | NO | `'turma2006.hc@gmail.com'::text` |
| `public.home_page_content` | 50 | `footer_phone` | `text` | NO | `'(84) 99999-0206'::text` |
| `public.home_page_content` | 51 | `footer_location` | `text` | NO | `'Natal, Rio Grande do Norte'::text` |
| `public.home_page_content` | 52 | `footer_copyright` | `text` | NO | `'© 2026 Turma 2006 — Colégio Henrique Castriciano.'::text` |
| `public.home_page_content` | 53 | `footer_terms_label` | `text` | NO | `'Termos de Uso'::text` |
| `public.home_page_content` | 54 | `footer_privacy_label` | `text` | NO | `'Privacidade'::text` |
| `public.home_page_content` | 55 | `footer_admin_label` | `text` | NO | `'Admin'::text` |
| `public.home_page_content` | 56 | `primary_cta_page` | `text` | NO | `'tickets'::text` |
| `public.home_page_content` | 57 | `secondary_cta_page` | `text` | NO | `'who-going'::text` |
| `public.home_page_content` | 58 | `home_sections_json` | `text` | NO | `'[<br>  {<br>    "key": "hero",<br>    "label": "Hero",<br>    "is_visible": true,<br>    "sort_order": 10<br>  },<br>  {<br>    "key": "about",<br>    "label": "Sobre",<br>    "is_visible": true,<br>    "sort_order": 20<br>  },<br>  {<br>    "key": "info",<br>    "label": "Informações do evento",<br>    "is_visible": true,<br>    "sort_order": 30<br>  },<br>  {<br>    "key": "tickets",<br>    "label": "Ingressos",<br>    "is_visible": true,<br>    "sort_order": 40<br>  },<br>  {<br>    "key": "confirmed",<br>    "label": "Confirmados",<br>    "is_visible": true,<br>    "sort_order": 50<br>  },<br>  {<br>    "key": "photos",<br>    "label": "Fotos",<br>    "is_visible": true,<br>    "sort_order": 60<br>  },<br>  {<br>    "key": "timeline",<br>    "label": "Linha do tempo",<br>    "is_visible": true,<br>    "sort_order": 70<br>  },<br>  {<br>    "key": "faq",<br>    "label": "FAQ",<br>    "is_visible": true,<br>    "sort_order": 80<br>  }<br>]'::text` |
| `public.home_page_content` | 59 | `countdown_days_label` | `text` | NO | `'Dias'::text` |
| `public.home_page_content` | 60 | `countdown_hours_label` | `text` | NO | `'Horas'::text` |
| `public.home_page_content` | 61 | `countdown_minutes_label` | `text` | NO | `'Min'::text` |
| `public.home_page_content` | 62 | `countdown_seconds_label` | `text` | NO | `'Seg'::text` |
| `public.home_page_content` | 63 | `info_date_label` | `text` | NO | `'Data'::text` |
| `public.home_page_content` | 64 | `info_time_label` | `text` | NO | `'Horário'::text` |
| `public.home_page_content` | 65 | `info_location_label` | `text` | NO | `'Local'::text` |
| `public.home_page_content` | 66 | `info_doors_subtitle_template` | `text` | NO | `'Portas abertas às {time}'::text` |
| `public.home_page_content` | 67 | `info_dinner_subtitle_template` | `text` | NO | `'Jantar servido a partir das {time}'::text` |
| `public.home_page_content` | 68 | `info_time_fallback_label` | `text` | NO | `'19h00 — 01h00'::text` |
| `public.home_page_content` | 69 | `tickets_preview_limit` | `text` | NO | `'3'::text` |
| `public.home_page_content` | 70 | `tickets_view_all_label` | `text` | NO | `'Ver todos'::text` |
| `public.home_page_content` | 71 | `tickets_active_lot_label` | `text` | NO | `'Lote ativo'::text` |
| `public.home_page_content` | 72 | `tickets_buy_label` | `text` | NO | `'Comprar agora'::text` |
| `public.home_page_content` | 73 | `tickets_sold_out_label` | `text` | NO | `'Esgotado'::text` |
| `public.home_page_content` | 74 | `tickets_empty_title` | `text` | NO | `'Ingressos em breve'::text` |
| `public.home_page_content` | 75 | `tickets_empty_subtitle` | `text` | NO | `'Os lotes ativos cadastrados no painel aparecerão aqui.'::text` |
| `public.home_page_content` | 76 | `tickets_empty_cta_label` | `text` | NO | `'Abrir página de ingressos'::text` |
| `public.home_page_content` | 77 | `tickets_remaining_label_template` | `text` | NO | `'{available}/{total} restantes'::text` |
| `public.home_page_content` | 78 | `confirmed_preview_limit` | `text` | NO | `'8'::text` |
| `public.home_page_content` | 79 | `confirmed_view_all_label` | `text` | NO | `'Ver todos'::text` |
| `public.home_page_content` | 80 | `confirmed_privacy_note` | `text` | NO | `'Apenas pessoas que autorizaram aparecem na lista.'::text` |
| `public.home_page_content` | 81 | `photos_preview_limit` | `text` | NO | `'6'::text` |
| `public.home_page_content` | 82 | `photos_view_all_label` | `text` | NO | `'Ver todas'::text` |
| `public.home_page_content` | 83 | `photos_empty_title` | `text` | NO | `'Nenhuma foto aprovada ainda'::text` |
| `public.home_page_content` | 84 | `photos_empty_subtitle` | `text` | NO | `'As fotos aprovadas pela moderação aparecerão aqui.'::text` |
| `public.home_page_content` | 85 | `photos_empty_cta_label` | `text` | NO | `'Abrir mural'::text` |
| `public.home_page_content` | 86 | `footer_links_json` | `text` | NO | `'[<br>  {<br>    "page": "tickets",<br>    "label": "Ingressos",<br>    "is_visible": true<br>  },<br>  {<br>    "page": "who-going",<br>    "label": "Quem Vai",<br>    "is_visible": true<br>  },<br>  {<br>    "page": "the-class",<br>    "label": "A Turma",<br>    "is_visible": true<br>  },<br>  {<br>    "page": "photo-wall",<br>    "label": "Mural de Fotos",<br>    "is_visible": true<br>  },<br>  {<br>    "page": "memories",<br>    "label": "Memórias",<br>    "is_visible": true<br>  },<br>  {<br>    "page": "polls",<br>    "label": "Enquetes",<br>    "is_visible": true<br>  },<br>  {<br>    "page": "where-now",<br>    "label": "Onde a turma está",<br>    "is_visible": true<br>  },<br>  {<br>    "page": "archive",<br>    "label": "Acervo Digital",<br>    "is_visible": true<br>  }<br>]'::text` |
| `public.home_page_content` | 87 | `nav_event_label` | `text` | NO | `''::text` |
| `public.home_page_content` | 88 | `header_cta_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 89 | `header_auth_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 90 | `nav_home_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 91 | `nav_event_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 92 | `nav_who_going_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 93 | `nav_the_class_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 94 | `nav_photos_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 95 | `nav_memories_visible` | `boolean` | NO | `false` |
| `public.home_page_content` | 96 | `nav_polls_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 97 | `nav_where_now_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 98 | `nav_archive_visible` | `boolean` | NO | `true` |
| `public.home_page_content` | 99 | `nav_ex_alumni_label` | `text` | YES | `'Ex-alunos'::text` |
| `public.home_page_content` | 100 | `nav_ex_alumni_visible` | `boolean` | YES | `true` |
| `public.home_page_content` | 101 | `favicon_url` | `text` | YES | `—` |
| `public.home_page_content` | 102 | `home_alumni_overview_json` | `text` | NO | `'<br>{<br>  "eyebrow": "Ex-alunos",<br>  "title": "A turma em movimento",<br>  "description": "Uma prévia compacta da página de ex-alunos, com amostras rotativas, presença no reencontro e distribuição por turma.",<br>  "sample_label": "Amostra da turma",<br>  "sample_title_template": "{total} ex-alunos cadastrados",<br>  "presence_label": "Presença",<br>  "presence_title": "Reencontro em formação",<br>  "confirmed_label": "Confirmados",<br>  "intending_label": "Pretendem ir",<br>  "progress_label": "Confirmados sobre a base cadastrada",<br>  "classes_label": "Turmas",<br>  "classes_title": "Distribuição por sala",<br>  "confirmed_grid_label": "Confirmados",<br>  "confirmed_grid_title": "Quem confirmou presença",<br>  "footer_note": "Amostras rotativas com pessoas cadastradas na tabela da turma.",<br>  "view_all_label": "Ver todos"<br>}<br>'::text` |
| `public.home_page_content` | 103 | `home_nostalgia_timeline_json` | `text` | NO | `'<br>[<br>  {"year":"1995","icon":"phone-call","title":"Orelhão pra ligar pra casa","description":"Ainda na nossa época de alfabetização, o normal ainda era usar o orelhão para ligar pra casa."},<br>  {"year":"1996","icon":"laptop","title":"Internet discada e Cadê?","description":"Quando entramos na 1ª série, começava-se a era da internet discada e das buscas no site Cadê?."},<br>  {"year":"1999","icon":"messages-square","title":"mIRC e ICQ","description":"Na 4ª série, começaram os tempos de mIRC e ICQ."},<br>  {"year":"2000","icon":"proportions","title":"MSN Messenger","description":"Boa parte do nosso Ensino Fundamental foi conversando pelo MSN Messenger."},<br>  {"year":"2003","icon":"smartphone","title":"Nokia e SMS","description":"Na 8ª série, passamos a mandar SMS com nossos Nokias."},<br>  {"year":"2004","icon":"book-image","title":"Orkut e Fotolog","description":"No Ensino Médio, Orkut e Fotolog marcaram para sempre nossas vidas."}<br>]<br>'::text` |
| `public.home_page_content` | 104 | `home_profile_stats_json` | `text` | NO | `'<br>[<br>  {"key":"law","icon":"graduation-cap","label":"trabalham na área do Direito","mode":"auto","fallback_value":"5%"},<br>  {"key":"children","icon":"baby","label":"tem filhos","mode":"auto","fallback_value":"40%"},<br>  {"key":"women","icon":"venus","label":"são mulheres","mode":"auto","fallback_value":"55%"}<br>]<br>'::text` |
| `public.home_page_content` | 105 | `home_map_stats_json` | `text` | NO | `'<br>[<br>  {"key":"natal","label":"Natal","mode":"auto","fallback_value":57},<br>  {"key":"interior","label":"Interior","mode":"auto","fallback_value":12},<br>  {"key":"other_state","label":"Outro estado","mode":"auto","fallback_value":25},<br>  {"key":"foreign","label":"Fora do país","mode":"auto","fallback_value":6}<br>]<br>'::text` |
| `public.home_page_content` | 106 | `home_poll_id` | `uuid` | YES | `—` |
| `public.home_page_content` | 107 | `home_poll_fallback_json` | `text` | NO | `'<br>{<br>  "question": "Qual professor te marcou?",<br>  "empty_label": "Configure uma enquete no painel Admin.",<br>  "login_required_label": "Entre para votar.",<br>  "options": ["Agamenon", "Adailton", "Sérgio Trindade"]<br>}<br>'::text` |
| `public.home_page_content` | 108 | `home_about_overview_json` | `text` | NO | `'{}'::text` |
| `public.home_page_content` | 109 | `event_info_view_more_label` | `text` | NO | `''::text` |
| `public.home_page_content` | 110 | `faq_search_placeholder` | `text` | YES | `—` |
| `public.home_page_content` | 111 | `faq_empty_label` | `text` | YES | `—` |
| `public.home_page_content` | 112 | `faq_view_all_label` | `text` | YES | `—` |
| `public.home_page_content` | 113 | `faq_initial_mode` | `text` | YES | `—` |
| `public.memories` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.memories` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.memories` | 3 | `user_id` | `uuid` | YES | `—` |
| `public.memories` | 4 | `person_id` | `uuid` | YES | `—` |
| `public.memories` | 5 | `author_name` | `text` | YES | `—` |
| `public.memories` | 6 | `memory_text` | `text` | NO | `—` |
| `public.memories` | 7 | `is_anonymous` | `boolean` | NO | `false` |
| `public.memories` | 8 | `status` | `text` | NO | `'pending'::text` |
| `public.memories` | 9 | `is_featured` | `boolean` | NO | `false` |
| `public.memories` | 10 | `approved_by_admin_id` | `uuid` | YES | `—` |
| `public.memories` | 11 | `approved_at` | `timestamp with time zone` | YES | `—` |
| `public.memories` | 12 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.memories` | 13 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.notification_jobs` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.notification_jobs` | 2 | `event_type` | `text` | NO | `—` |
| `public.notification_jobs` | 3 | `order_id` | `uuid` | YES | `—` |
| `public.notification_jobs` | 4 | `ticket_id` | `uuid` | YES | `—` |
| `public.notification_jobs` | 5 | `recipient_email` | `text` | NO | `—` |
| `public.notification_jobs` | 6 | `idempotency_key` | `text` | NO | `—` |
| `public.notification_jobs` | 7 | `payload_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.notification_jobs` | 8 | `status` | `text` | NO | `'pending'::text` |
| `public.notification_jobs` | 9 | `attempts` | `integer` | NO | `0` |
| `public.notification_jobs` | 10 | `next_attempt_at` | `timestamp with time zone` | NO | `now()` |
| `public.notification_jobs` | 11 | `last_error` | `text` | YES | `—` |
| `public.notification_jobs` | 12 | `processed_at` | `timestamp with time zone` | YES | `—` |
| `public.notification_jobs` | 13 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.notification_jobs` | 14 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.notification_jobs` | 15 | `channel` | `text` | YES | `—` |
| `public.notification_jobs` | 16 | `provider_message_id` | `text` | YES | `—` |
| `public.notification_jobs` | 17 | `provider_response_json` | `jsonb` | YES | `—` |
| `public.notification_jobs` | 18 | `dead_lettered_at` | `timestamp with time zone` | YES | `—` |
| `public.order_participants` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.order_participants` | 2 | `order_id` | `uuid` | NO | `—` |
| `public.order_participants` | 3 | `user_id` | `uuid` | YES | `—` |
| `public.order_participants` | 4 | `person_id` | `uuid` | YES | `—` |
| `public.order_participants` | 5 | `participant_type` | `text` | NO | `—` |
| `public.order_participants` | 6 | `full_name` | `text` | NO | `—` |
| `public.order_participants` | 7 | `email` | `text` | YES | `—` |
| `public.order_participants` | 8 | `phone` | `text` | YES | `—` |
| `public.order_participants` | 9 | `birth_date` | `date` | YES | `—` |
| `public.order_participants` | 10 | `relationship_to_alumni` | `text` | YES | `—` |
| `public.order_participants` | 11 | `sponsor_person_id` | `uuid` | YES | `—` |
| `public.order_participants` | 12 | `sponsor_user_id` | `uuid` | YES | `—` |
| `public.order_participants` | 13 | `guest_approval_request_id` | `uuid` | YES | `—` |
| `public.order_participants` | 14 | `unit_price_cents` | `integer` | NO | `0` |
| `public.order_participants` | 15 | `status` | `text` | NO | `'reserved'::text` |
| `public.order_participants` | 16 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.order_participants` | 17 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.order_participants` | 18 | `client_key` | `text` | YES | `—` |
| `public.orders` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.orders` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.orders` | 3 | `buyer_name` | `text` | NO | `—` |
| `public.orders` | 4 | `buyer_email` | `text` | NO | `—` |
| `public.orders` | 5 | `buyer_phone` | `text` | YES | `—` |
| `public.orders` | 6 | `person_id` | `uuid` | YES | `—` |
| `public.orders` | 7 | `ticket_type_id` | `uuid` | NO | `—` |
| `public.orders` | 8 | `quantity` | `integer` | NO | `1` |
| `public.orders` | 9 | `total_amount_cents` | `integer` | NO | `—` |
| `public.orders` | 10 | `payment_provider` | `text` | NO | `'mercadopago'::text` |
| `public.orders` | 11 | `payment_provider_order_id` | `text` | YES | `—` |
| `public.orders` | 12 | `payment_provider_preference_id` | `text` | YES | `—` |
| `public.orders` | 13 | `payment_status` | `payment_status` | NO | `'pending'::payment_status` |
| `public.orders` | 14 | `payment_method` | `text` | YES | `—` |
| `public.orders` | 15 | `paid_at` | `timestamp with time zone` | YES | `—` |
| `public.orders` | 16 | `expires_at` | `timestamp with time zone` | YES | `(now() + '00:30:00'::interval)` |
| `public.orders` | 17 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.orders` | 18 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.orders` | 19 | `buyer_user_id` | `uuid` | YES | `—` |
| `public.orders` | 20 | `public_token` | `uuid` | NO | `gen_random_uuid()` |
| `public.orders` | 21 | `lot_id` | `uuid` | YES | `—` |
| `public.orders` | 22 | `subtotal_amount_cents` | `integer` | NO | `0` |
| `public.orders` | 23 | `extras_amount_cents` | `integer` | NO | `0` |
| `public.orders` | 24 | `currency_id` | `text` | NO | `'BRL'::text` |
| `public.orders` | 25 | `payment_status_detail` | `text` | YES | `—` |
| `public.orders` | 26 | `payment_environment` | `text` | YES | `—` |
| `public.orders` | 27 | `payment_provider_merchant_order_id` | `text` | YES | `—` |
| `public.orders` | 28 | `payment_type` | `text` | YES | `—` |
| `public.orders` | 29 | `installments` | `integer` | YES | `—` |
| `public.orders` | 30 | `reservation_status` | `text` | NO | `'active'::text` |
| `public.orders` | 31 | `reservation_released_at` | `timestamp with time zone` | YES | `—` |
| `public.orders` | 32 | `refunded_at` | `timestamp with time zone` | YES | `—` |
| `public.orders` | 33 | `cancelled_at` | `timestamp with time zone` | YES | `—` |
| `public.orders` | 34 | `approved_inventory_applied_at` | `timestamp with time zone` | YES | `—` |
| `public.orders` | 35 | `checkout_idempotency_key` | `text` | YES | `—` |
| `public.participant_extras` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.participant_extras` | 2 | `order_id` | `uuid` | NO | `—` |
| `public.participant_extras` | 3 | `order_participant_id` | `uuid` | NO | `—` |
| `public.participant_extras` | 4 | `extra_type` | `text` | NO | `—` |
| `public.participant_extras` | 5 | `quantity` | `integer` | NO | `—` |
| `public.participant_extras` | 6 | `units_per_package` | `integer` | NO | `10` |
| `public.participant_extras` | 7 | `unit_price_cents` | `integer` | NO | `—` |
| `public.participant_extras` | 8 | `total_price_cents` | `integer` | YES | `—` |
| `public.participant_extras` | 9 | `physical_vouchers_delivered_at` | `timestamp with time zone` | YES | `—` |
| `public.participant_extras` | 10 | `physical_vouchers_delivered_by` | `uuid` | YES | `—` |
| `public.participant_extras` | 11 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.participant_extras` | 12 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.payment_events` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.payment_events` | 2 | `provider` | `text` | NO | `'mercadopago'::text` |
| `public.payment_events` | 3 | `event_type` | `text` | NO | `—` |
| `public.payment_events` | 4 | `provider_event_id` | `text` | YES | `—` |
| `public.payment_events` | 5 | `order_id` | `uuid` | YES | `—` |
| `public.payment_events` | 6 | `payload_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.payment_events` | 7 | `processed_at` | `timestamp with time zone` | YES | `—` |
| `public.payment_events` | 8 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.payment_events` | 9 | `payment_id` | `text` | YES | `—` |
| `public.payment_events` | 10 | `signature_valid` | `boolean` | YES | `—` |
| `public.payment_events` | 11 | `received_at` | `timestamp with time zone` | NO | `now()` |
| `public.payment_events` | 12 | `processing_status` | `text` | NO | `'received'::text` |
| `public.payment_events` | 13 | `processing_error` | `text` | YES | `—` |
| `public.payment_events` | 14 | `attempt_count` | `integer` | NO | `0` |
| `public.payment_preferences` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.payment_preferences` | 2 | `order_id` | `uuid` | NO | `—` |
| `public.payment_preferences` | 3 | `provider` | `text` | NO | `'mercadopago'::text` |
| `public.payment_preferences` | 4 | `provider_preference_id` | `text` | NO | `—` |
| `public.payment_preferences` | 5 | `environment` | `text` | NO | `—` |
| `public.payment_preferences` | 6 | `checkout_url` | `text` | NO | `—` |
| `public.payment_preferences` | 7 | `status` | `text` | NO | `'active'::text` |
| `public.payment_preferences` | 8 | `expires_at` | `timestamp with time zone` | YES | `—` |
| `public.payment_preferences` | 9 | `replaced_by_preference_id` | `uuid` | YES | `—` |
| `public.payment_preferences` | 10 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.payment_preferences` | 11 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.people` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.people` | 2 | `full_name` | `text` | NO | `—` |
| `public.people` | 3 | `class_year` | `integer` | NO | `2006` |
| `public.people` | 4 | `class_group` | `text` | YES | `—` |
| `public.people` | 5 | `nickname_at_school` | `text` | YES | `—` |
| `public.people` | 6 | `profile_status` | `profile_status` | NO | `'unclaimed'::profile_status` |
| `public.people` | 7 | `claimed_by_user_id` | `uuid` | YES | `—` |
| `public.people` | 8 | `claimed_at` | `timestamp with time zone` | YES | `—` |
| `public.people` | 9 | `is_visible` | `boolean` | NO | `true` |
| `public.people` | 10 | `private_notes` | `text` | YES | `—` |
| `public.people` | 11 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.people` | 12 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.people` | 13 | `avatar_url` | `text` | YES | `—` |
| `public.people` | 14 | `birth_year` | `integer` | YES | `—` |
| `public.people` | 15 | `verification_status` | `text` | YES | `'not_started'::text` |
| `public.people` | 16 | `contact_email` | `text` | YES | `—` |
| `public.people` | 17 | `contact_whatsapp` | `text` | YES | `—` |
| `public.people` | 18 | `display_name` | `text` | YES | `—` |
| `public.people` | 19 | `gender` | `text` | YES | `—` |
| `public.photo_comments` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.photo_comments` | 2 | `photo_id` | `uuid` | NO | `—` |
| `public.photo_comments` | 3 | `user_id` | `uuid` | YES | `—` |
| `public.photo_comments` | 4 | `author_name` | `text` | YES | `—` |
| `public.photo_comments` | 5 | `comment_text` | `text` | NO | `—` |
| `public.photo_comments` | 6 | `status` | `text` | NO | `'pending'::text` |
| `public.photo_comments` | 7 | `approved_by_admin_id` | `uuid` | YES | `—` |
| `public.photo_comments` | 8 | `approved_at` | `timestamp with time zone` | YES | `—` |
| `public.photo_comments` | 9 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.photo_comments` | 10 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.photo_likes` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.photo_likes` | 2 | `photo_id` | `uuid` | NO | `—` |
| `public.photo_likes` | 3 | `user_id` | `uuid` | NO | `—` |
| `public.photo_likes` | 4 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.photo_removal_requests` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.photo_removal_requests` | 2 | `photo_id` | `uuid` | NO | `—` |
| `public.photo_removal_requests` | 3 | `requester_user_id` | `uuid` | YES | `—` |
| `public.photo_removal_requests` | 4 | `requester_name` | `text` | NO | `—` |
| `public.photo_removal_requests` | 5 | `requester_email` | `text` | NO | `—` |
| `public.photo_removal_requests` | 6 | `reason` | `text` | NO | `—` |
| `public.photo_removal_requests` | 7 | `status` | `removal_request_status` | NO | `'pending'::removal_request_status` |
| `public.photo_removal_requests` | 8 | `reviewed_by_admin_id` | `uuid` | YES | `—` |
| `public.photo_removal_requests` | 9 | `reviewed_at` | `timestamp with time zone` | YES | `—` |
| `public.photo_removal_requests` | 10 | `admin_notes` | `text` | YES | `—` |
| `public.photo_removal_requests` | 11 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.photo_removal_requests` | 12 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.photo_removal_requests` | 13 | `storage_deleted_at` | `timestamp with time zone` | YES | `—` |
| `public.photo_removal_requests` | 14 | `removal_error` | `text` | YES | `—` |
| `public.photo_tags` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.photo_tags` | 2 | `photo_id` | `uuid` | NO | `—` |
| `public.photo_tags` | 3 | `person_id` | `uuid` | NO | `—` |
| `public.photo_tags` | 4 | `tagged_name_snapshot` | `text` | NO | `—` |
| `public.photo_tags` | 5 | `status` | `tag_status` | NO | `'pending'::tag_status` |
| `public.photo_tags` | 6 | `created_by_user_id` | `uuid` | YES | `—` |
| `public.photo_tags` | 7 | `approved_by_admin_id` | `uuid` | YES | `—` |
| `public.photo_tags` | 8 | `approved_at` | `timestamp with time zone` | YES | `—` |
| `public.photo_tags` | 9 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.photo_tags` | 10 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.photos` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.photos` | 2 | `event_id` | `uuid` | YES | `—` |
| `public.photos` | 3 | `image_url` | `text` | NO | `—` |
| `public.photos` | 4 | `thumbnail_url` | `text` | YES | `—` |
| `public.photos` | 5 | `storage_path` | `text` | YES | `—` |
| `public.photos` | 6 | `caption` | `text` | YES | `—` |
| `public.photos` | 7 | `year_approx` | `integer` | YES | `—` |
| `public.photos` | 8 | `location_text` | `text` | YES | `—` |
| `public.photos` | 9 | `uploaded_by_user_id` | `uuid` | YES | `—` |
| `public.photos` | 10 | `uploaded_by_name` | `text` | YES | `—` |
| `public.photos` | 11 | `authorization_given` | `boolean` | NO | `false` |
| `public.photos` | 12 | `status` | `photo_status` | NO | `'pending'::photo_status` |
| `public.photos` | 13 | `approved_by_admin_id` | `uuid` | YES | `—` |
| `public.photos` | 14 | `approved_at` | `timestamp with time zone` | YES | `—` |
| `public.photos` | 15 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.photos` | 16 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.photos` | 17 | `is_featured` | `boolean` | NO | `false` |
| `public.photos` | 18 | `featured_by_admin_id` | `uuid` | YES | `—` |
| `public.photos` | 19 | `featured_at` | `timestamp with time zone` | YES | `—` |
| `public.photos` | 20 | `original_file_name` | `text` | YES | `—` |
| `public.photos` | 21 | `content_type` | `text` | YES | `—` |
| `public.photos` | 22 | `file_size_bytes` | `bigint` | YES | `—` |
| `public.photos` | 23 | `content_sha256` | `text` | YES | `—` |
| `public.photos` | 24 | `image_width` | `integer` | YES | `—` |
| `public.photos` | 25 | `image_height` | `integer` | YES | `—` |
| `public.photos` | 26 | `metadata_stripped` | `boolean` | NO | `false` |
| `public.photos` | 27 | `removed_at` | `timestamp with time zone` | YES | `—` |
| `public.photos` | 28 | `removed_by_admin_id` | `uuid` | YES | `—` |
| `public.poll_options` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.poll_options` | 2 | `poll_id` | `uuid` | NO | `—` |
| `public.poll_options` | 3 | `option_text` | `text` | NO | `—` |
| `public.poll_options` | 4 | `sort_order` | `integer` | NO | `0` |
| `public.poll_options` | 5 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.poll_votes` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.poll_votes` | 2 | `poll_id` | `uuid` | NO | `—` |
| `public.poll_votes` | 3 | `option_id` | `uuid` | NO | `—` |
| `public.poll_votes` | 4 | `user_id` | `uuid` | NO | `—` |
| `public.poll_votes` | 5 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.polls` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.polls` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.polls` | 3 | `question` | `text` | NO | `—` |
| `public.polls` | 4 | `description` | `text` | YES | `—` |
| `public.polls` | 5 | `status` | `text` | NO | `'draft'::text` |
| `public.polls` | 6 | `allow_multiple_votes` | `boolean` | NO | `false` |
| `public.polls` | 7 | `created_by_admin_id` | `uuid` | YES | `—` |
| `public.polls` | 8 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.polls` | 9 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_claim_answers` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.profile_claim_answers` | 2 | `claim_id` | `uuid` | NO | `—` |
| `public.profile_claim_answers` | 3 | `question_key` | `text` | NO | `—` |
| `public.profile_claim_answers` | 4 | `answer_text` | `text` | NO | `—` |
| `public.profile_claim_answers` | 5 | `score_value` | `integer` | NO | `0` |
| `public.profile_claim_answers` | 6 | `is_match` | `boolean` | YES | `—` |
| `public.profile_claim_answers` | 7 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_claim_disputes` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.profile_claim_disputes` | 2 | `person_id` | `uuid` | NO | `—` |
| `public.profile_claim_disputes` | 3 | `current_claimant_user_id` | `uuid` | YES | `—` |
| `public.profile_claim_disputes` | 4 | `requester_user_id` | `uuid` | YES | `—` |
| `public.profile_claim_disputes` | 5 | `requester_name` | `text` | NO | `—` |
| `public.profile_claim_disputes` | 6 | `requester_email` | `text` | NO | `—` |
| `public.profile_claim_disputes` | 7 | `requester_phone` | `text` | YES | `—` |
| `public.profile_claim_disputes` | 8 | `reason` | `text` | NO | `—` |
| `public.profile_claim_disputes` | 9 | `evidence_text` | `text` | YES | `—` |
| `public.profile_claim_disputes` | 10 | `status` | `dispute_status` | NO | `'pending'::dispute_status` |
| `public.profile_claim_disputes` | 11 | `reviewed_by_admin_id` | `uuid` | YES | `—` |
| `public.profile_claim_disputes` | 12 | `reviewed_at` | `timestamp with time zone` | YES | `—` |
| `public.profile_claim_disputes` | 13 | `admin_notes` | `text` | YES | `—` |
| `public.profile_claim_disputes` | 14 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_claim_disputes` | 15 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_claims` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.profile_claims` | 2 | `person_id` | `uuid` | NO | `—` |
| `public.profile_claims` | 3 | `requester_user_id` | `uuid` | YES | `—` |
| `public.profile_claims` | 4 | `requester_name` | `text` | NO | `—` |
| `public.profile_claims` | 5 | `requester_email` | `text` | NO | `—` |
| `public.profile_claims` | 6 | `requester_phone` | `text` | YES | `—` |
| `public.profile_claims` | 7 | `verification_score` | `integer` | YES | `0` |
| `public.profile_claims` | 8 | `status` | `claim_status` | NO | `'pending'::claim_status` |
| `public.profile_claims` | 9 | `reviewed_by_admin_id` | `uuid` | YES | `—` |
| `public.profile_claims` | 10 | `reviewed_at` | `timestamp with time zone` | YES | `—` |
| `public.profile_claims` | 11 | `rejection_reason` | `text` | YES | `—` |
| `public.profile_claims` | 12 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_claims` | 13 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_identity_verifications` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.profile_identity_verifications` | 2 | `person_id` | `uuid` | NO | `—` |
| `public.profile_identity_verifications` | 3 | `profile_id` | `uuid` | YES | `—` |
| `public.profile_identity_verifications` | 4 | `claimant_user_id` | `uuid` | NO | `—` |
| `public.profile_identity_verifications` | 5 | `declared_birth_date` | `date` | NO | `—` |
| `public.profile_identity_verifications` | 6 | `penultimate_surname_answer` | `text` | NO | `—` |
| `public.profile_identity_verifications` | 7 | `class_group_answer` | `text` | NO | `—` |
| `public.profile_identity_verifications` | 8 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_identity_verifications` | 9 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_school_questionnaire_answers` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.profile_school_questionnaire_answers` | 2 | `event_id` | `uuid` | NO | `'00000000-0000-0000-0000-000000000001'::uuid` |
| `public.profile_school_questionnaire_answers` | 3 | `profile_id` | `uuid` | NO | `—` |
| `public.profile_school_questionnaire_answers` | 4 | `person_id` | `uuid` | NO | `—` |
| `public.profile_school_questionnaire_answers` | 5 | `question_id` | `text` | NO | `—` |
| `public.profile_school_questionnaire_answers` | 6 | `selected_options_json` | `jsonb` | NO | `'[]'::jsonb` |
| `public.profile_school_questionnaire_answers` | 7 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.profile_school_questionnaire_answers` | 8 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.profiles` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.profiles` | 2 | `person_id` | `uuid` | NO | `—` |
| `public.profiles` | 3 | `user_id` | `uuid` | NO | `—` |
| `public.profiles` | 4 | `display_name` | `text` | YES | `—` |
| `public.profiles` | 5 | `current_photo_url` | `text` | YES | `—` |
| `public.profiles` | 6 | `current_city` | `text` | YES | `—` |
| `public.profiles` | 7 | `current_state` | `text` | YES | `—` |
| `public.profiles` | 8 | `current_country` | `text` | YES | `'Brasil'::text` |
| `public.profiles` | 9 | `profession` | `text` | YES | `—` |
| `public.profiles` | 10 | `bio` | `text` | YES | `—` |
| `public.profiles` | 11 | `memory_text` | `text` | YES | `—` |
| `public.profiles` | 12 | `instagram_url` | `text` | YES | `—` |
| `public.profiles` | 13 | `linkedin_url` | `text` | YES | `—` |
| `public.profiles` | 14 | `show_current_photo` | `boolean` | NO | `true` |
| `public.profiles` | 15 | `show_city` | `boolean` | NO | `true` |
| `public.profiles` | 16 | `show_profession` | `boolean` | NO | `true` |
| `public.profiles` | 17 | `show_social_links` | `boolean` | NO | `false` |
| `public.profiles` | 18 | `allow_photo_tags` | `boolean` | NO | `true` |
| `public.profiles` | 19 | `show_confirmed_status` | `boolean` | NO | `true` |
| `public.profiles` | 20 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.profiles` | 21 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.profiles` | 22 | `contact_email` | `text` | YES | `—` |
| `public.profiles` | 23 | `contact_whatsapp` | `text` | YES | `—` |
| `public.profiles` | 24 | `relationship_status` | `text` | YES | `—` |
| `public.profiles` | 25 | `has_children` | `boolean` | NO | `false` |
| `public.profiles` | 26 | `children_count` | `integer` | YES | `—` |
| `public.profiles` | 27 | `intends_to_attend` | `boolean` | YES | `—` |
| `public.public_page_content` | 1 | `event_id` | `uuid` | NO | `—` |
| `public.public_page_content` | 2 | `page_slug` | `text` | NO | `—` |
| `public.public_page_content` | 3 | `content_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.public_page_content` | 4 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.public_page_content` | 5 | `updated_by_admin_id` | `uuid` | YES | `—` |
| `public.rate_limit_buckets` | 1 | `bucket_key` | `text` | NO | `—` |
| `public.rate_limit_buckets` | 2 | `action` | `text` | NO | `—` |
| `public.rate_limit_buckets` | 3 | `actor_user_id` | `uuid` | YES | `—` |
| `public.rate_limit_buckets` | 4 | `window_started_at` | `timestamp with time zone` | NO | `—` |
| `public.rate_limit_buckets` | 5 | `request_count` | `integer` | NO | `0` |
| `public.rate_limit_buckets` | 6 | `expires_at` | `timestamp with time zone` | NO | `—` |
| `public.rate_limit_buckets` | 7 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.refund_policy` | 1 | `id` | `boolean` | NO | `true` |
| `public.refund_policy` | 2 | `enabled` | `boolean` | NO | `false` |
| `public.refund_policy` | 3 | `percentage_basis_points` | `integer` | NO | `0` |
| `public.refund_policy` | 4 | `fixed_fee_cents` | `integer` | NO | `0` |
| `public.refund_policy` | 5 | `maximum_fee_cents` | `integer` | YES | `—` |
| `public.refund_policy` | 6 | `policy_label` | `text` | NO | `'Reembolso integral'::text` |
| `public.refund_policy` | 7 | `policy_notice` | `text` | NO | `'Nenhuma taxa não recuperável está configurada.'::text` |
| `public.refund_policy` | 8 | `updated_by_user_id` | `uuid` | YES | `—` |
| `public.refund_policy` | 9 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.refund_requests` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.refund_requests` | 2 | `order_id` | `uuid` | NO | `—` |
| `public.refund_requests` | 3 | `ticket_id` | `uuid` | YES | `—` |
| `public.refund_requests` | 4 | `requested_by_user_id` | `uuid` | YES | `—` |
| `public.refund_requests` | 5 | `reason` | `text` | NO | `—` |
| `public.refund_requests` | 6 | `status` | `text` | NO | `'requested'::text` |
| `public.refund_requests` | 7 | `gross_amount_cents` | `integer` | NO | `—` |
| `public.refund_requests` | 8 | `non_recoverable_fee_cents` | `integer` | NO | `0` |
| `public.refund_requests` | 9 | `refund_amount_cents` | `integer` | NO | `—` |
| `public.refund_requests` | 10 | `mercado_pago_refund_id` | `text` | YES | `—` |
| `public.refund_requests` | 11 | `requested_at` | `timestamp with time zone` | NO | `now()` |
| `public.refund_requests` | 12 | `reviewed_at` | `timestamp with time zone` | YES | `—` |
| `public.refund_requests` | 13 | `reviewed_by_admin_id` | `uuid` | YES | `—` |
| `public.refund_requests` | 14 | `processed_at` | `timestamp with time zone` | YES | `—` |
| `public.refund_requests` | 15 | `notes` | `text` | YES | `—` |
| `public.refund_requests` | 16 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.refund_requests` | 17 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.refund_requests` | 18 | `provider_payment_id` | `text` | YES | `—` |
| `public.refund_requests` | 19 | `provider_response_json` | `jsonb` | YES | `—` |
| `public.refund_requests` | 20 | `inventory_restored_at` | `timestamp with time zone` | YES | `—` |
| `public.refund_requests` | 21 | `failure_reason` | `text` | YES | `—` |
| `public.refund_requests` | 22 | `policy_snapshot_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.security_audit_log` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.security_audit_log` | 2 | `actor_user_id` | `uuid` | YES | `—` |
| `public.security_audit_log` | 3 | `actor_role` | `text` | YES | `—` |
| `public.security_audit_log` | 4 | `action` | `text` | NO | `—` |
| `public.security_audit_log` | 5 | `entity_type` | `text` | NO | `—` |
| `public.security_audit_log` | 6 | `entity_id` | `text` | YES | `—` |
| `public.security_audit_log` | 7 | `request_key` | `text` | YES | `—` |
| `public.security_audit_log` | 8 | `metadata_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.security_audit_log` | 9 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_lot_prices` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.ticket_lot_prices` | 2 | `lot_id` | `uuid` | NO | `—` |
| `public.ticket_lot_prices` | 3 | `ticket_type_id` | `uuid` | NO | `—` |
| `public.ticket_lot_prices` | 4 | `price_cents` | `integer` | NO | `—` |
| `public.ticket_lot_prices` | 5 | `is_active` | `boolean` | NO | `true` |
| `public.ticket_lot_prices` | 6 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_lot_prices` | 7 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_lots` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.ticket_lots` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.ticket_lots` | 3 | `code` | `text` | NO | `—` |
| `public.ticket_lots` | 4 | `name` | `text` | NO | `—` |
| `public.ticket_lots` | 5 | `sort_order` | `integer` | NO | `—` |
| `public.ticket_lots` | 6 | `starts_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_lots` | 7 | `ends_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_lots` | 8 | `capacity` | `integer` | YES | `500` |
| `public.ticket_lots` | 9 | `status` | `text` | NO | `'scheduled'::text` |
| `public.ticket_lots` | 10 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_lots` | 11 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_transfers` | 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| `public.ticket_transfers` | 2 | `ticket_id` | `uuid` | NO | `—` |
| `public.ticket_transfers` | 3 | `from_user_id` | `uuid` | YES | `—` |
| `public.ticket_transfers` | 4 | `to_user_id` | `uuid` | YES | `—` |
| `public.ticket_transfers` | 5 | `to_email` | `text` | NO | `—` |
| `public.ticket_transfers` | 6 | `status` | `text` | NO | `'requested'::text` |
| `public.ticket_transfers` | 7 | `requested_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_transfers` | 8 | `accepted_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_transfers` | 9 | `completed_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_transfers` | 10 | `cancelled_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_transfers` | 11 | `old_qr_invalidated_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_transfers` | 12 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_transfers` | 13 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_transfers` | 14 | `to_name` | `text` | YES | `—` |
| `public.ticket_transfers` | 15 | `to_phone` | `text` | YES | `—` |
| `public.ticket_transfers` | 16 | `accepted_by_user_id` | `uuid` | YES | `—` |
| `public.ticket_transfers` | 17 | `replacement_ticket_id` | `uuid` | YES | `—` |
| `public.ticket_transfers` | 18 | `expires_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_transfers` | 19 | `admin_notes` | `text` | YES | `—` |
| `public.ticket_types` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.ticket_types` | 2 | `event_id` | `uuid` | NO | `—` |
| `public.ticket_types` | 3 | `name` | `text` | NO | `—` |
| `public.ticket_types` | 4 | `description` | `text` | YES | `—` |
| `public.ticket_types` | 5 | `price_cents` | `integer` | NO | `—` |
| `public.ticket_types` | 6 | `available_quantity` | `integer` | NO | `—` |
| `public.ticket_types` | 7 | `sold_quantity` | `integer` | NO | `0` |
| `public.ticket_types` | 8 | `sales_start_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_types` | 9 | `sales_end_at` | `timestamp with time zone` | YES | `—` |
| `public.ticket_types` | 10 | `allows_guest` | `boolean` | NO | `false` |
| `public.ticket_types` | 11 | `status` | `ticket_status` | NO | `'draft'::ticket_status` |
| `public.ticket_types` | 12 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_types` | 13 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.ticket_types` | 14 | `product_code` | `text` | YES | `—` |
| `public.ticket_types` | 15 | `participant_type` | `text` | YES | `—` |
| `public.ticket_types` | 16 | `package_kind` | `text` | YES | `—` |
| `public.ticket_types` | 17 | `included_people_count` | `integer` | NO | `1` |
| `public.ticket_types` | 18 | `metadata_json` | `jsonb` | NO | `'{}'::jsonb` |
| `public.tickets` | 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| `public.tickets` | 2 | `order_id` | `uuid` | NO | `—` |
| `public.tickets` | 3 | `ticket_type_id` | `uuid` | NO | `—` |
| `public.tickets` | 4 | `person_id` | `uuid` | YES | `—` |
| `public.tickets` | 5 | `attendee_name` | `text` | NO | `—` |
| `public.tickets` | 6 | `attendee_email` | `text` | NO | `—` |
| `public.tickets` | 7 | `attendee_phone` | `text` | YES | `—` |
| `public.tickets` | 8 | `guest_name` | `text` | YES | `—` |
| `public.tickets` | 9 | `qr_code` | `text` | NO | `—` |
| `public.tickets` | 10 | `qr_token_hash` | `text` | NO | `—` |
| `public.tickets` | 11 | `checked_in` | `boolean` | NO | `false` |
| `public.tickets` | 12 | `checked_in_at` | `timestamp with time zone` | YES | `—` |
| `public.tickets` | 13 | `checked_in_by_admin_id` | `uuid` | YES | `—` |
| `public.tickets` | 14 | `created_at` | `timestamp with time zone` | NO | `now()` |
| `public.tickets` | 15 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| `public.tickets` | 16 | `order_participant_id` | `uuid` | YES | `—` |
| `public.tickets` | 17 | `status` | `text` | NO | `'active'::text` |
| `public.tickets` | 18 | `qr_token` | `text` | YES | `—` |
| `public.tickets` | 19 | `transferred_from_ticket_id` | `uuid` | YES | `—` |
| `public.tickets` | 20 | `cancelled_at` | `timestamp with time zone` | YES | `—` |
| `public.tickets` | 21 | `cancellation_reason` | `text` | YES | `—` |
| `public.tickets` | 22 | `physical_vouchers_delivered_at` | `timestamp with time zone` | YES | `—` |
| `public.tickets` | 23 | `physical_vouchers_delivered_by` | `uuid` | YES | `—` |

## Constraints

| Tabela | Nome | Tipo | Definição |
|---|---|---|---|
| `public.admin_users` | `admin_users_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.admin_users` | `admin_users_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` |
| `public.admin_users` | `admin_users_user_id_key` | `UNIQUE` | `UNIQUE (user_id)` |
| `public.audit_logs` | `audit_logs_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.audit_logs` | `audit_logs_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.checkin_events` | `checkin_events_action_check` | `CHECK` | `CHECK (action = ANY (ARRAY['check_in'::text, 'undo_check_in'::text, 'deliver_vouchers'::text, 'undo_vouchers'::text]))` |
| `public.checkin_events` | `checkin_events_operator_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (operator_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT` |
| `public.checkin_events` | `checkin_events_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.checkin_events` | `checkin_events_ticket_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE` |
| `public.cms_assets` | `cms_assets_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.cms_assets` | `cms_assets_key_format` | `CHECK` | `CHECK (asset_key ~ '^[a-z0-9][a-z0-9_:-]*$'::text)` |
| `public.cms_assets` | `cms_assets_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.cms_assets` | `cms_assets_unique_key` | `UNIQUE` | `UNIQUE (event_id, asset_key)` |
| `public.cms_assets` | `cms_assets_updated_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (updated_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.content_moderation_events` | `content_moderation_events_actor_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.content_moderation_events` | `content_moderation_events_entity_type_check` | `CHECK` | `CHECK (entity_type = ANY (ARRAY['photo'::text, 'photo_tag'::text, 'photo_comment'::text, 'memory'::text, 'photo_removal_request'::text]))` |
| `public.content_moderation_events` | `content_moderation_events_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.content_moderation_events` | `content_moderation_events_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.content_moderation_settings` | `content_moderation_settings_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.content_moderation_settings` | `content_moderation_settings_pkey` | `PRIMARY KEY` | `PRIMARY KEY (event_id)` |
| `public.event_archive_settings` | `event_archive_settings_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.event_archive_settings` | `event_archive_settings_pkey` | `PRIMARY KEY` | `PRIMARY KEY (event_id)` |
| `public.event_page_content` | `event_page_content_attractions_array` | `CHECK` | `CHECK (jsonb_typeof(attractions_json) = 'array'::text)` |
| `public.event_page_content` | `event_page_content_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.event_page_content` | `event_page_content_extra_info_array` | `CHECK` | `CHECK (jsonb_typeof(extra_info_json) = 'array'::text)` |
| `public.event_page_content` | `event_page_content_gallery_array` | `CHECK` | `CHECK (jsonb_typeof(gallery_json) = 'array'::text)` |
| `public.event_page_content` | `event_page_content_pkey` | `PRIMARY KEY` | `PRIMARY KEY (event_id)` |
| `public.event_page_content` | `event_page_content_schedule_array` | `CHECK` | `CHECK (jsonb_typeof(schedule_json) = 'array'::text)` |
| `public.event_page_content` | `event_page_content_structure_cards_array` | `CHECK` | `CHECK (jsonb_typeof(structure_cards_json) = 'array'::text)` |
| `public.event_page_content` | `event_page_content_updated_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (updated_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.events` | `events_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.events` | `events_slug_key` | `UNIQUE` | `UNIQUE (slug)` |
| `public.faq_categories` | `faq_categories_created_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (created_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.faq_categories` | `faq_categories_deleted_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (deleted_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.faq_categories` | `faq_categories_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.faq_categories` | `faq_categories_event_key_key` | `UNIQUE` | `UNIQUE (event_id, key)` |
| `public.faq_categories` | `faq_categories_icon_key_check` | `CHECK` | `CHECK (icon_key IS NULL OR (icon_key = ANY (ARRAY['user-key'::text, 'layout-grid'::text, 'shield-lock'::text, 'calendar-days'::text, 'ticket'::text, 'credit-card'::text, 'refresh-cw'::text])))` |
| `public.faq_categories` | `faq_categories_key_format_check` | `CHECK` | `CHECK (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)` |
| `public.faq_categories` | `faq_categories_label_check` | `CHECK` | `CHECK (length(btrim(label)) > 0)` |
| `public.faq_categories` | `faq_categories_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.faq_categories` | `faq_categories_sort_order_check` | `CHECK` | `CHECK (sort_order >= 0)` |
| `public.faq_categories` | `faq_categories_updated_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (updated_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.faq_items` | `faq_items_answer_check` | `CHECK` | `CHECK (length(btrim(answer)) > 0)` |
| `public.faq_items` | `faq_items_category_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE RESTRICT` |
| `public.faq_items` | `faq_items_created_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (created_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.faq_items` | `faq_items_deleted_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (deleted_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.faq_items` | `faq_items_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.faq_items` | `faq_items_event_slug_key` | `UNIQUE` | `UNIQUE (event_id, slug)` |
| `public.faq_items` | `faq_items_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.faq_items` | `faq_items_question_check` | `CHECK` | `CHECK (length(btrim(question)) > 0)` |
| `public.faq_items` | `faq_items_slug_format_check` | `CHECK` | `CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)` |
| `public.faq_items` | `faq_items_sort_order_check` | `CHECK` | `CHECK (sort_order >= 0)` |
| `public.faq_items` | `faq_items_updated_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (updated_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.guest_approval_requests` | `guest_approval_requests_decided_by_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (decided_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.guest_approval_requests` | `guest_approval_requests_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.guest_approval_requests` | `guest_approval_requests_guest_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (guest_user_id) REFERENCES auth.users(id) ON DELETE CASCADE` |
| `public.guest_approval_requests` | `guest_approval_requests_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.guest_approval_requests` | `guest_approval_requests_sponsor_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (sponsor_person_id) REFERENCES people(id) ON DELETE RESTRICT` |
| `public.guest_approval_requests` | `guest_approval_requests_sponsor_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (sponsor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.guest_approval_requests` | `guest_approval_requests_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text, 'expired'::text, 'archived'::text]))` |
| `public.home_page_content` | `home_page_content_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.home_page_content` | `home_page_content_faq_initial_mode_check` | `CHECK` | `CHECK (faq_initial_mode IS NULL OR (faq_initial_mode = ANY (ARRAY['featured'::text, 'all'::text])))` |
| `public.home_page_content` | `home_page_content_pkey` | `PRIMARY KEY` | `PRIMARY KEY (event_id)` |
| `public.memories` | `memories_approved_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (approved_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.memories` | `memories_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.memories` | `memories_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL` |
| `public.memories` | `memories_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.memories` | `memories_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'hidden'::text]))` |
| `public.memories` | `memories_text_length` | `CHECK` | `CHECK (char_length(memory_text) >= 10 AND char_length(memory_text) <= 420)` |
| `public.memories` | `memories_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.notification_jobs` | `notification_jobs_attempts_check` | `CHECK` | `CHECK (attempts >= 0)` |
| `public.notification_jobs` | `notification_jobs_channel_check` | `CHECK` | `CHECK (channel = ANY (ARRAY['email'::text, 'whatsapp'::text]))` |
| `public.notification_jobs` | `notification_jobs_idempotency_key_key` | `UNIQUE` | `UNIQUE (idempotency_key)` |
| `public.notification_jobs` | `notification_jobs_order_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE` |
| `public.notification_jobs` | `notification_jobs_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.notification_jobs` | `notification_jobs_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'sent'::text, 'failed'::text, 'cancelled'::text]))` |
| `public.notification_jobs` | `notification_jobs_ticket_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE` |
| `public.order_participants` | `order_participants_check` | `CHECK` | `CHECK (participant_type <> 'child'::text OR birth_date IS NOT NULL)` |
| `public.order_participants` | `order_participants_external_guest_contact_check` | `CHECK` | `CHECK (participant_type <> 'external_guest'::text OR email IS NOT NULL AND phone IS NOT NULL AND birth_date IS NOT NULL)` |
| `public.order_participants` | `order_participants_guest_approval_request_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (guest_approval_request_id) REFERENCES guest_approval_requests(id) ON DELETE SET NULL` |
| `public.order_participants` | `order_participants_order_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE` |
| `public.order_participants` | `order_participants_participant_type_check` | `CHECK` | `CHECK (participant_type = ANY (ARRAY['alumni'::text, 'spouse'::text, 'child'::text, 'external_guest'::text]))` |
| `public.order_participants` | `order_participants_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL` |
| `public.order_participants` | `order_participants_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.order_participants` | `order_participants_sponsor_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (sponsor_person_id) REFERENCES people(id) ON DELETE SET NULL` |
| `public.order_participants` | `order_participants_sponsor_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (sponsor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.order_participants` | `order_participants_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['reserved'::text, 'active'::text, 'expired'::text, 'cancelled'::text, 'refunded'::text, 'transferred'::text]))` |
| `public.order_participants` | `order_participants_unit_price_cents_check` | `CHECK` | `CHECK (unit_price_cents >= 0)` |
| `public.order_participants` | `order_participants_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.orders` | `orders_buyer_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (buyer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.orders` | `orders_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id)` |
| `public.orders` | `orders_lot_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (lot_id) REFERENCES ticket_lots(id) ON DELETE SET NULL` |
| `public.orders` | `orders_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL` |
| `public.orders` | `orders_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.orders` | `orders_quantity_check` | `CHECK` | `CHECK (quantity > 0)` |
| `public.orders` | `orders_ticket_type_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id)` |
| `public.orders` | `orders_total_amount_cents_check` | `CHECK` | `CHECK (total_amount_cents >= 0)` |
| `public.participant_extras` | `participant_extras_extra_type_check` | `CHECK` | `CHECK (extra_type = ANY (ARRAY['drinks'::text, 'barbecue'::text]))` |
| `public.participant_extras` | `participant_extras_order_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE` |
| `public.participant_extras` | `participant_extras_order_participant_id_extra_type_key` | `UNIQUE` | `UNIQUE (order_participant_id, extra_type)` |
| `public.participant_extras` | `participant_extras_order_participant_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_participant_id) REFERENCES order_participants(id) ON DELETE CASCADE` |
| `public.participant_extras` | `participant_extras_physical_vouchers_delivered_by_fkey` | `FOREIGN KEY` | `FOREIGN KEY (physical_vouchers_delivered_by) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.participant_extras` | `participant_extras_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.participant_extras` | `participant_extras_quantity_check` | `CHECK` | `CHECK (quantity > 0)` |
| `public.participant_extras` | `participant_extras_unit_price_cents_check` | `CHECK` | `CHECK (unit_price_cents >= 0)` |
| `public.participant_extras` | `participant_extras_units_per_package_check` | `CHECK` | `CHECK (units_per_package > 0)` |
| `public.payment_events` | `payment_events_order_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL` |
| `public.payment_events` | `payment_events_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.payment_preferences` | `payment_preferences_environment_check` | `CHECK` | `CHECK (environment = ANY (ARRAY['test'::text, 'production'::text]))` |
| `public.payment_preferences` | `payment_preferences_order_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE` |
| `public.payment_preferences` | `payment_preferences_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.payment_preferences` | `payment_preferences_provider_provider_preference_id_key` | `UNIQUE` | `UNIQUE (provider, provider_preference_id)` |
| `public.payment_preferences` | `payment_preferences_replaced_by_preference_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (replaced_by_preference_id) REFERENCES payment_preferences(id) ON DELETE SET NULL` |
| `public.payment_preferences` | `payment_preferences_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'replaced'::text]))` |
| `public.people` | `people_birth_year_check` | `CHECK` | `CHECK (birth_year IS NULL OR birth_year >= 1900 AND birth_year <= EXTRACT(year FROM now())::integer)` |
| `public.people` | `people_claimed_by_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (claimed_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.people` | `people_gender_check` | `CHECK` | `CHECK (gender IS NULL OR (gender = ANY (ARRAY['male'::text, 'female'::text])))` |
| `public.people` | `people_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.people` | `people_verification_status_check` | `CHECK` | `CHECK (verification_status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'verified'::text, 'failed'::text, 'manual_review'::text]))` |
| `public.photo_comments` | `photo_comments_approved_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (approved_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photo_comments` | `photo_comments_photo_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE` |
| `public.photo_comments` | `photo_comments_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.photo_comments` | `photo_comments_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'hidden'::text]))` |
| `public.photo_comments` | `photo_comments_text_length` | `CHECK` | `CHECK (char_length(comment_text) >= 1 AND char_length(comment_text) <= 500)` |
| `public.photo_comments` | `photo_comments_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photo_likes` | `photo_likes_photo_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE` |
| `public.photo_likes` | `photo_likes_photo_id_user_id_key` | `UNIQUE` | `UNIQUE (photo_id, user_id)` |
| `public.photo_likes` | `photo_likes_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.photo_likes` | `photo_likes_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` |
| `public.photo_removal_requests` | `photo_removal_reason_length` | `CHECK` | `CHECK (char_length(reason) >= 10 AND char_length(reason) <= 1000)` |
| `public.photo_removal_requests` | `photo_removal_requests_photo_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE` |
| `public.photo_removal_requests` | `photo_removal_requests_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.photo_removal_requests` | `photo_removal_requests_requester_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photo_removal_requests` | `photo_removal_requests_reviewed_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (reviewed_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photo_tags` | `photo_tags_approved_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (approved_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photo_tags` | `photo_tags_created_by_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photo_tags` | `photo_tags_name_length` | `CHECK` | `CHECK (char_length(tagged_name_snapshot) >= 1 AND char_length(tagged_name_snapshot) <= 120)` |
| `public.photo_tags` | `photo_tags_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE` |
| `public.photo_tags` | `photo_tags_photo_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE` |
| `public.photo_tags` | `photo_tags_photo_id_person_id_key` | `UNIQUE` | `UNIQUE (photo_id, person_id)` |
| `public.photo_tags` | `photo_tags_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.photos` | `photos_approved_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (approved_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photos` | `photos_authorization_required` | `CHECK` | `CHECK (storage_path IS NULL OR authorization_given = true)` |
| `public.photos` | `photos_caption_length` | `CHECK` | `CHECK (caption IS NULL OR char_length(caption) <= 240)` |
| `public.photos` | `photos_content_type_valid` | `CHECK` | `CHECK (content_type IS NULL OR (content_type = ANY (ARRAY['image/jpeg'::text, 'image/png'::text, 'image/webp'::text])))` |
| `public.photos` | `photos_dimensions_valid` | `CHECK` | `CHECK (image_width IS NULL AND image_height IS NULL OR image_width >= 1 AND image_width <= 12000 AND image_height >= 1 AND image_height <= 12000 AND (image_width::bigint * image_height::bigint) <= 40000000)` |
| `public.photos` | `photos_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.photos` | `photos_featured_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (featured_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.photos` | `photos_file_size_valid` | `CHECK` | `CHECK (file_size_bytes IS NULL OR file_size_bytes >= 32 AND file_size_bytes <= 10485760)` |
| `public.photos` | `photos_location_length` | `CHECK` | `CHECK (location_text IS NULL OR char_length(location_text) <= 160)` |
| `public.photos` | `photos_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.photos` | `photos_removed_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (removed_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.photos` | `photos_storage_owner_path` | `CHECK` | `CHECK (storage_path IS NULL OR uploaded_by_user_id IS NULL OR storage_path ~~ (uploaded_by_user_id::text \|\| '/%'::text))` |
| `public.photos` | `photos_uploaded_by_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.poll_options` | `poll_options_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.poll_options` | `poll_options_poll_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE` |
| `public.poll_votes` | `poll_votes_option_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE` |
| `public.poll_votes` | `poll_votes_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.poll_votes` | `poll_votes_poll_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE` |
| `public.poll_votes` | `poll_votes_poll_id_option_id_user_id_key` | `UNIQUE` | `UNIQUE (poll_id, option_id, user_id)` |
| `public.poll_votes` | `poll_votes_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` |
| `public.polls` | `polls_created_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (created_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.polls` | `polls_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.polls` | `polls_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.polls` | `polls_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'closed'::text, 'archived'::text]))` |
| `public.profile_claim_answers` | `profile_claim_answers_claim_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (claim_id) REFERENCES profile_claims(id) ON DELETE CASCADE` |
| `public.profile_claim_answers` | `profile_claim_answers_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.profile_claim_disputes` | `profile_claim_disputes_current_claimant_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (current_claimant_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.profile_claim_disputes` | `profile_claim_disputes_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE` |
| `public.profile_claim_disputes` | `profile_claim_disputes_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.profile_claim_disputes` | `profile_claim_disputes_requester_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.profile_claim_disputes` | `profile_claim_disputes_reviewed_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (reviewed_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.profile_claims` | `profile_claims_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE` |
| `public.profile_claims` | `profile_claims_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.profile_claims` | `profile_claims_requester_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.profile_claims` | `profile_claims_reviewed_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (reviewed_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.profile_identity_verifications` | `profile_identity_verifications_claimant_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (claimant_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT` |
| `public.profile_identity_verifications` | `profile_identity_verifications_person_id_claimant_user_id_key` | `UNIQUE` | `UNIQUE (person_id, claimant_user_id)` |
| `public.profile_identity_verifications` | `profile_identity_verifications_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE` |
| `public.profile_identity_verifications` | `profile_identity_verifications_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.profile_identity_verifications` | `profile_identity_verifications_profile_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_options_array` | `CHECK` | `CHECK (jsonb_typeof(selected_options_json) = 'array'::text)` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_profile_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_unique` | `UNIQUE` | `UNIQUE (profile_id, question_id)` |
| `public.profiles` | `profiles_children_consistency_check` | `CHECK` | `CHECK (has_children = true OR children_count IS NULL)` |
| `public.profiles` | `profiles_children_count_check` | `CHECK` | `CHECK (children_count IS NULL OR children_count >= 0)` |
| `public.profiles` | `profiles_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE` |
| `public.profiles` | `profiles_person_id_key` | `UNIQUE` | `UNIQUE (person_id)` |
| `public.profiles` | `profiles_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.profiles` | `profiles_relationship_status_check` | `CHECK` | `CHECK (relationship_status IS NULL OR (relationship_status = ANY (ARRAY['single'::text, 'dating'::text, 'married'::text])))` |
| `public.profiles` | `profiles_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` |
| `public.profiles` | `profiles_user_id_key` | `UNIQUE` | `UNIQUE (user_id)` |
| `public.public_page_content` | `public_page_content_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.public_page_content` | `public_page_content_json_object` | `CHECK` | `CHECK (jsonb_typeof(content_json) = 'object'::text)` |
| `public.public_page_content` | `public_page_content_pkey` | `PRIMARY KEY` | `PRIMARY KEY (event_id, page_slug)` |
| `public.public_page_content` | `public_page_content_updated_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (updated_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.rate_limit_buckets` | `rate_limit_buckets_actor_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE CASCADE` |
| `public.rate_limit_buckets` | `rate_limit_buckets_pkey` | `PRIMARY KEY` | `PRIMARY KEY (bucket_key)` |
| `public.rate_limit_buckets` | `rate_limit_buckets_request_count_check` | `CHECK` | `CHECK (request_count >= 0)` |
| `public.refund_policy` | `refund_policy_fixed_fee_cents_check` | `CHECK` | `CHECK (fixed_fee_cents >= 0)` |
| `public.refund_policy` | `refund_policy_id_check` | `CHECK` | `CHECK (id = true)` |
| `public.refund_policy` | `refund_policy_maximum_fee_cents_check` | `CHECK` | `CHECK (maximum_fee_cents IS NULL OR maximum_fee_cents >= 0)` |
| `public.refund_policy` | `refund_policy_percentage_basis_points_check` | `CHECK` | `CHECK (percentage_basis_points >= 0 AND percentage_basis_points <= 10000)` |
| `public.refund_policy` | `refund_policy_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.refund_policy` | `refund_policy_updated_by_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (updated_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.refund_requests` | `refund_requests_check` | `CHECK` | `CHECK ((refund_amount_cents + non_recoverable_fee_cents) <= gross_amount_cents)` |
| `public.refund_requests` | `refund_requests_gross_amount_cents_check` | `CHECK` | `CHECK (gross_amount_cents >= 0)` |
| `public.refund_requests` | `refund_requests_non_recoverable_fee_cents_check` | `CHECK` | `CHECK (non_recoverable_fee_cents >= 0)` |
| `public.refund_requests` | `refund_requests_order_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE` |
| `public.refund_requests` | `refund_requests_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.refund_requests` | `refund_requests_refund_amount_cents_check` | `CHECK` | `CHECK (refund_amount_cents >= 0)` |
| `public.refund_requests` | `refund_requests_requested_by_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (requested_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.refund_requests` | `refund_requests_reviewed_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (reviewed_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL` |
| `public.refund_requests` | `refund_requests_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['requested'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'processing'::text, 'refunded'::text, 'failed'::text, 'suspended'::text]))` |
| `public.refund_requests` | `refund_requests_ticket_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL` |
| `public.security_audit_log` | `security_audit_log_actor_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.security_audit_log` | `security_audit_log_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.ticket_lot_prices` | `ticket_lot_prices_lot_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (lot_id) REFERENCES ticket_lots(id) ON DELETE CASCADE` |
| `public.ticket_lot_prices` | `ticket_lot_prices_lot_id_ticket_type_id_key` | `UNIQUE` | `UNIQUE (lot_id, ticket_type_id)` |
| `public.ticket_lot_prices` | `ticket_lot_prices_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.ticket_lot_prices` | `ticket_lot_prices_price_cents_check` | `CHECK` | `CHECK (price_cents >= 0)` |
| `public.ticket_lot_prices` | `ticket_lot_prices_ticket_type_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE CASCADE` |
| `public.ticket_lots` | `ticket_lots_capacity_check` | `CHECK` | `CHECK (capacity IS NULL OR capacity >= 0)` |
| `public.ticket_lots` | `ticket_lots_check` | `CHECK` | `CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)` |
| `public.ticket_lots` | `ticket_lots_event_id_code_key` | `UNIQUE` | `UNIQUE (event_id, code)` |
| `public.ticket_lots` | `ticket_lots_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.ticket_lots` | `ticket_lots_event_id_sort_order_key` | `UNIQUE` | `UNIQUE (event_id, sort_order)` |
| `public.ticket_lots` | `ticket_lots_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.ticket_lots` | `ticket_lots_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['scheduled'::text, 'open'::text, 'closed'::text, 'archived'::text]))` |
| `public.ticket_transfers` | `ticket_transfers_accepted_by_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (accepted_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.ticket_transfers` | `ticket_transfers_from_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.ticket_transfers` | `ticket_transfers_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.ticket_transfers` | `ticket_transfers_replacement_ticket_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (replacement_ticket_id) REFERENCES tickets(id) ON DELETE SET NULL` |
| `public.ticket_transfers` | `ticket_transfers_status_check` | `CHECK` | `CHECK (status = ANY (ARRAY['requested'::text, 'accepted'::text, 'completed'::text, 'cancelled'::text, 'expired'::text, 'rejected'::text]))` |
| `public.ticket_transfers` | `ticket_transfers_ticket_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE` |
| `public.ticket_transfers` | `ticket_transfers_to_user_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.ticket_types` | `ticket_types_available_quantity_check` | `CHECK` | `CHECK (available_quantity >= 0)` |
| `public.ticket_types` | `ticket_types_event_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE` |
| `public.ticket_types` | `ticket_types_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.ticket_types` | `ticket_types_price_cents_check` | `CHECK` | `CHECK (price_cents >= 0)` |
| `public.ticket_types` | `ticket_types_sold_quantity_check` | `CHECK` | `CHECK (sold_quantity >= 0)` |
| `public.tickets` | `tickets_checked_in_by_admin_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (checked_in_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.tickets` | `tickets_order_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE` |
| `public.tickets` | `tickets_order_participant_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (order_participant_id) REFERENCES order_participants(id) ON DELETE SET NULL` |
| `public.tickets` | `tickets_person_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL` |
| `public.tickets` | `tickets_physical_vouchers_delivered_by_fkey` | `FOREIGN KEY` | `FOREIGN KEY (physical_vouchers_delivered_by) REFERENCES auth.users(id) ON DELETE SET NULL` |
| `public.tickets` | `tickets_pkey` | `PRIMARY KEY` | `PRIMARY KEY (id)` |
| `public.tickets` | `tickets_qr_code_key` | `UNIQUE` | `UNIQUE (qr_code)` |
| `public.tickets` | `tickets_qr_token_hash_key` | `UNIQUE` | `UNIQUE (qr_token_hash)` |
| `public.tickets` | `tickets_ticket_type_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id)` |
| `public.tickets` | `tickets_transferred_from_ticket_id_fkey` | `FOREIGN KEY` | `FOREIGN KEY (transferred_from_ticket_id) REFERENCES tickets(id) ON DELETE SET NULL` |

## Índices

| Tabela | Índice | Definição |
|---|---|---|
| `public.admin_users` | `admin_users_pkey` | `CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id)` |
| `public.admin_users` | `admin_users_user_id_key` | `CREATE UNIQUE INDEX admin_users_user_id_key ON public.admin_users USING btree (user_id)` |
| `public.audit_logs` | `audit_logs_pkey` | `CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)` |
| `public.audit_logs` | `idx_audit_logs_created_at` | `CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC)` |
| `public.audit_logs` | `idx_audit_logs_entity` | `CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id)` |
| `public.audit_logs` | `idx_audit_logs_user_id` | `CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id)` |
| `public.checkin_events` | `checkin_events_pkey` | `CREATE UNIQUE INDEX checkin_events_pkey ON public.checkin_events USING btree (id)` |
| `public.checkin_events` | `checkin_events_ticket_created_idx` | `CREATE INDEX checkin_events_ticket_created_idx ON public.checkin_events USING btree (ticket_id, created_at DESC)` |
| `public.cms_assets` | `cms_assets_event_active_idx` | `CREATE INDEX cms_assets_event_active_idx ON public.cms_assets USING btree (event_id, is_active, sort_order, asset_key)` |
| `public.cms_assets` | `cms_assets_pkey` | `CREATE UNIQUE INDEX cms_assets_pkey ON public.cms_assets USING btree (id)` |
| `public.cms_assets` | `cms_assets_unique_key` | `CREATE UNIQUE INDEX cms_assets_unique_key ON public.cms_assets USING btree (event_id, asset_key)` |
| `public.content_moderation_events` | `content_moderation_events_entity_idx` | `CREATE INDEX content_moderation_events_entity_idx ON public.content_moderation_events USING btree (entity_type, entity_id, created_at DESC)` |
| `public.content_moderation_events` | `content_moderation_events_event_idx` | `CREATE INDEX content_moderation_events_event_idx ON public.content_moderation_events USING btree (event_id, created_at DESC)` |
| `public.content_moderation_events` | `content_moderation_events_pkey` | `CREATE UNIQUE INDEX content_moderation_events_pkey ON public.content_moderation_events USING btree (id)` |
| `public.content_moderation_settings` | `content_moderation_settings_pkey` | `CREATE UNIQUE INDEX content_moderation_settings_pkey ON public.content_moderation_settings USING btree (event_id)` |
| `public.event_archive_settings` | `event_archive_settings_pkey` | `CREATE UNIQUE INDEX event_archive_settings_pkey ON public.event_archive_settings USING btree (event_id)` |
| `public.event_page_content` | `event_page_content_pkey` | `CREATE UNIQUE INDEX event_page_content_pkey ON public.event_page_content USING btree (event_id)` |
| `public.events` | `events_pkey` | `CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id)` |
| `public.events` | `events_slug_key` | `CREATE UNIQUE INDEX events_slug_key ON public.events USING btree (slug)` |
| `public.faq_categories` | `faq_categories_event_key_key` | `CREATE UNIQUE INDEX faq_categories_event_key_key ON public.faq_categories USING btree (event_id, key)` |
| `public.faq_categories` | `faq_categories_pkey` | `CREATE UNIQUE INDEX faq_categories_pkey ON public.faq_categories USING btree (id)` |
| `public.faq_categories` | `idx_faq_categories_event_deleted` | `CREATE INDEX idx_faq_categories_event_deleted ON public.faq_categories USING btree (event_id, deleted_at)` |
| `public.faq_categories` | `idx_faq_categories_event_visible_order` | `CREATE INDEX idx_faq_categories_event_visible_order ON public.faq_categories USING btree (event_id, is_visible, sort_order)` |
| `public.faq_items` | `faq_items_event_slug_key` | `CREATE UNIQUE INDEX faq_items_event_slug_key ON public.faq_items USING btree (event_id, slug)` |
| `public.faq_items` | `faq_items_pkey` | `CREATE UNIQUE INDEX faq_items_pkey ON public.faq_items USING btree (id)` |
| `public.faq_items` | `idx_faq_items_event_category_visible_order` | `CREATE INDEX idx_faq_items_event_category_visible_order ON public.faq_items USING btree (event_id, category_id, is_visible, sort_order)` |
| `public.faq_items` | `idx_faq_items_event_deleted` | `CREATE INDEX idx_faq_items_event_deleted ON public.faq_items USING btree (event_id, deleted_at)` |
| `public.faq_items` | `idx_faq_items_event_featured_order` | `CREATE INDEX idx_faq_items_event_featured_order ON public.faq_items USING btree (event_id, is_featured, sort_order)` |
| `public.faq_items_backup_20260716` | `faq_items_backup_20260716_id_unique` | `CREATE UNIQUE INDEX faq_items_backup_20260716_id_unique ON public.faq_items_backup_20260716 USING btree (id)` |
| `public.guest_approval_requests` | `guest_approval_guest_status_idx` | `CREATE INDEX guest_approval_guest_status_idx ON public.guest_approval_requests USING btree (guest_user_id, status, created_at DESC)` |
| `public.guest_approval_requests` | `guest_approval_open_request_unique` | `CREATE UNIQUE INDEX guest_approval_open_request_unique ON public.guest_approval_requests USING btree (event_id, guest_user_id, sponsor_person_id) WHERE (status = 'pending'::text)` |
| `public.guest_approval_requests` | `guest_approval_requests_pkey` | `CREATE UNIQUE INDEX guest_approval_requests_pkey ON public.guest_approval_requests USING btree (id)` |
| `public.guest_approval_requests` | `guest_approval_sponsor_status_idx` | `CREATE INDEX guest_approval_sponsor_status_idx ON public.guest_approval_requests USING btree (sponsor_person_id, status, created_at DESC)` |
| `public.home_page_content` | `home_page_content_pkey` | `CREATE UNIQUE INDEX home_page_content_pkey ON public.home_page_content USING btree (event_id)` |
| `public.memories` | `idx_memories_created_at` | `CREATE INDEX idx_memories_created_at ON public.memories USING btree (created_at DESC)` |
| `public.memories` | `idx_memories_event_id` | `CREATE INDEX idx_memories_event_id ON public.memories USING btree (event_id)` |
| `public.memories` | `idx_memories_featured` | `CREATE INDEX idx_memories_featured ON public.memories USING btree (is_featured) WHERE (is_featured = true)` |
| `public.memories` | `idx_memories_person_id` | `CREATE INDEX idx_memories_person_id ON public.memories USING btree (person_id)` |
| `public.memories` | `idx_memories_status` | `CREATE INDEX idx_memories_status ON public.memories USING btree (status)` |
| `public.memories` | `idx_memories_user_id` | `CREATE INDEX idx_memories_user_id ON public.memories USING btree (user_id)` |
| `public.memories` | `memories_pkey` | `CREATE UNIQUE INDEX memories_pkey ON public.memories USING btree (id)` |
| `public.notification_jobs` | `notification_jobs_idempotency_key_key` | `CREATE UNIQUE INDEX notification_jobs_idempotency_key_key ON public.notification_jobs USING btree (idempotency_key)` |
| `public.notification_jobs` | `notification_jobs_pending_idx` | `CREATE INDEX notification_jobs_pending_idx ON public.notification_jobs USING btree (status, next_attempt_at) WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]))` |
| `public.notification_jobs` | `notification_jobs_pkey` | `CREATE UNIQUE INDEX notification_jobs_pkey ON public.notification_jobs USING btree (id)` |
| `public.order_participants` | `order_participants_order_client_key_unique` | `CREATE UNIQUE INDEX order_participants_order_client_key_unique ON public.order_participants USING btree (order_id, client_key) WHERE (client_key IS NOT NULL)` |
| `public.order_participants` | `order_participants_order_idx` | `CREATE INDEX order_participants_order_idx ON public.order_participants USING btree (order_id, created_at)` |
| `public.order_participants` | `order_participants_pkey` | `CREATE UNIQUE INDEX order_participants_pkey ON public.order_participants USING btree (id)` |
| `public.order_participants` | `order_participants_sponsor_idx` | `CREATE INDEX order_participants_sponsor_idx ON public.order_participants USING btree (sponsor_person_id, participant_type, status)` |
| `public.order_participants` | `order_participants_user_idx` | `CREATE INDEX order_participants_user_idx ON public.order_participants USING btree (user_id, created_at DESC)` |
| `public.orders` | `idx_orders_buyer_email` | `CREATE INDEX idx_orders_buyer_email ON public.orders USING btree (buyer_email)` |
| `public.orders` | `idx_orders_mp_order_id` | `CREATE INDEX idx_orders_mp_order_id ON public.orders USING btree (payment_provider_order_id)` |
| `public.orders` | `idx_orders_mp_pref_id` | `CREATE INDEX idx_orders_mp_pref_id ON public.orders USING btree (payment_provider_preference_id)` |
| `public.orders` | `idx_orders_payment_status` | `CREATE INDEX idx_orders_payment_status ON public.orders USING btree (payment_status)` |
| `public.orders` | `idx_orders_person_id` | `CREATE INDEX idx_orders_person_id ON public.orders USING btree (person_id)` |
| `public.orders` | `orders_buyer_checkout_idempotency_unique` | `CREATE UNIQUE INDEX orders_buyer_checkout_idempotency_unique ON public.orders USING btree (buyer_user_id, checkout_idempotency_key) WHERE ((buyer_user_id IS NOT NULL) AND (checkout_idempotency_key IS NOT NULL))` |
| `public.orders` | `orders_buyer_user_created_idx` | `CREATE INDEX orders_buyer_user_created_idx ON public.orders USING btree (buyer_user_id, created_at DESC)` |
| `public.orders` | `orders_payment_provider_order_unique` | `CREATE UNIQUE INDEX orders_payment_provider_order_unique ON public.orders USING btree (payment_provider, payment_provider_order_id) WHERE (payment_provider_order_id IS NOT NULL)` |
| `public.orders` | `orders_payment_status_expires_idx` | `CREATE INDEX orders_payment_status_expires_idx ON public.orders USING btree (payment_status, expires_at)` |
| `public.orders` | `orders_pkey` | `CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id)` |
| `public.orders` | `orders_public_token_unique` | `CREATE UNIQUE INDEX orders_public_token_unique ON public.orders USING btree (public_token)` |
| `public.participant_extras` | `participant_extras_order_idx` | `CREATE INDEX participant_extras_order_idx ON public.participant_extras USING btree (order_id, extra_type)` |
| `public.participant_extras` | `participant_extras_order_participant_id_extra_type_key` | `CREATE UNIQUE INDEX participant_extras_order_participant_id_extra_type_key ON public.participant_extras USING btree (order_participant_id, extra_type)` |
| `public.participant_extras` | `participant_extras_pkey` | `CREATE UNIQUE INDEX participant_extras_pkey ON public.participant_extras USING btree (id)` |
| `public.payment_events` | `idx_payment_events_order_id` | `CREATE INDEX idx_payment_events_order_id ON public.payment_events USING btree (order_id)` |
| `public.payment_events` | `idx_payment_events_provider_event` | `CREATE INDEX idx_payment_events_provider_event ON public.payment_events USING btree (provider_event_id)` |
| `public.payment_events` | `payment_events_pkey` | `CREATE UNIQUE INDEX payment_events_pkey ON public.payment_events USING btree (id)` |
| `public.payment_events` | `payment_events_provider_event_unique` | `CREATE UNIQUE INDEX payment_events_provider_event_unique ON public.payment_events USING btree (provider, provider_event_id) WHERE ((provider_event_id IS NOT NULL) AND (provider_event_id <> ''::text))` |
| `public.payment_preferences` | `payment_preferences_one_active_per_order` | `CREATE UNIQUE INDEX payment_preferences_one_active_per_order ON public.payment_preferences USING btree (order_id) WHERE (status = 'active'::text)` |
| `public.payment_preferences` | `payment_preferences_pkey` | `CREATE UNIQUE INDEX payment_preferences_pkey ON public.payment_preferences USING btree (id)` |
| `public.payment_preferences` | `payment_preferences_provider_provider_preference_id_key` | `CREATE UNIQUE INDEX payment_preferences_provider_provider_preference_id_key ON public.payment_preferences USING btree (provider, provider_preference_id)` |
| `public.people` | `idx_people_claimed_user` | `CREATE INDEX idx_people_claimed_user ON public.people USING btree (claimed_by_user_id)` |
| `public.people` | `idx_people_class_group` | `CREATE INDEX idx_people_class_group ON public.people USING btree (class_group)` |
| `public.people` | `idx_people_full_name_trgm` | `CREATE INDEX idx_people_full_name_trgm ON public.people USING gin (full_name gin_trgm_ops)` |
| `public.people` | `idx_people_profile_status` | `CREATE INDEX idx_people_profile_status ON public.people USING btree (profile_status)` |
| `public.people` | `people_pkey` | `CREATE UNIQUE INDEX people_pkey ON public.people USING btree (id)` |
| `public.photo_comments` | `idx_photo_comments_created_at` | `CREATE INDEX idx_photo_comments_created_at ON public.photo_comments USING btree (created_at DESC)` |
| `public.photo_comments` | `idx_photo_comments_photo_id` | `CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments USING btree (photo_id)` |
| `public.photo_comments` | `idx_photo_comments_status` | `CREATE INDEX idx_photo_comments_status ON public.photo_comments USING btree (status)` |
| `public.photo_comments` | `idx_photo_comments_user_id` | `CREATE INDEX idx_photo_comments_user_id ON public.photo_comments USING btree (user_id)` |
| `public.photo_comments` | `photo_comments_pkey` | `CREATE UNIQUE INDEX photo_comments_pkey ON public.photo_comments USING btree (id)` |
| `public.photo_likes` | `idx_photo_likes_photo_id` | `CREATE INDEX idx_photo_likes_photo_id ON public.photo_likes USING btree (photo_id)` |
| `public.photo_likes` | `idx_photo_likes_user_id` | `CREATE INDEX idx_photo_likes_user_id ON public.photo_likes USING btree (user_id)` |
| `public.photo_likes` | `photo_likes_photo_id_user_id_key` | `CREATE UNIQUE INDEX photo_likes_photo_id_user_id_key ON public.photo_likes USING btree (photo_id, user_id)` |
| `public.photo_likes` | `photo_likes_pkey` | `CREATE UNIQUE INDEX photo_likes_pkey ON public.photo_likes USING btree (id)` |
| `public.photo_removal_requests` | `idx_removal_requests_photo_id` | `CREATE INDEX idx_removal_requests_photo_id ON public.photo_removal_requests USING btree (photo_id)` |
| `public.photo_removal_requests` | `idx_removal_requests_status` | `CREATE INDEX idx_removal_requests_status ON public.photo_removal_requests USING btree (status)` |
| `public.photo_removal_requests` | `photo_removal_one_open_request_per_user` | `CREATE UNIQUE INDEX photo_removal_one_open_request_per_user ON public.photo_removal_requests USING btree (photo_id, requester_user_id) WHERE (status = ANY (ARRAY['pending'::removal_request_status, 'hidden_preventively'::removal_request_status]))` |
| `public.photo_removal_requests` | `photo_removal_requests_pkey` | `CREATE UNIQUE INDEX photo_removal_requests_pkey ON public.photo_removal_requests USING btree (id)` |
| `public.photo_tags` | `idx_photo_tags_person_id` | `CREATE INDEX idx_photo_tags_person_id ON public.photo_tags USING btree (person_id)` |
| `public.photo_tags` | `idx_photo_tags_photo_id` | `CREATE INDEX idx_photo_tags_photo_id ON public.photo_tags USING btree (photo_id)` |
| `public.photo_tags` | `idx_photo_tags_status` | `CREATE INDEX idx_photo_tags_status ON public.photo_tags USING btree (status)` |
| `public.photo_tags` | `photo_tags_photo_id_person_id_key` | `CREATE UNIQUE INDEX photo_tags_photo_id_person_id_key ON public.photo_tags USING btree (photo_id, person_id)` |
| `public.photo_tags` | `photo_tags_pkey` | `CREATE UNIQUE INDEX photo_tags_pkey ON public.photo_tags USING btree (id)` |
| `public.photos` | `idx_photos_event_id` | `CREATE INDEX idx_photos_event_id ON public.photos USING btree (event_id)` |
| `public.photos` | `idx_photos_status` | `CREATE INDEX idx_photos_status ON public.photos USING btree (status)` |
| `public.photos` | `idx_photos_uploaded_by` | `CREATE INDEX idx_photos_uploaded_by ON public.photos USING btree (uploaded_by_user_id)` |
| `public.photos` | `photos_active_content_hash_unique` | `CREATE UNIQUE INDEX photos_active_content_hash_unique ON public.photos USING btree (event_id, uploaded_by_user_id, content_sha256) WHERE ((content_sha256 IS NOT NULL) AND (status <> 'removed'::photo_status))` |
| `public.photos` | `photos_pkey` | `CREATE UNIQUE INDEX photos_pkey ON public.photos USING btree (id)` |
| `public.poll_options` | `idx_poll_options_poll_sort` | `CREATE INDEX idx_poll_options_poll_sort ON public.poll_options USING btree (poll_id, sort_order)` |
| `public.poll_options` | `poll_options_pkey` | `CREATE UNIQUE INDEX poll_options_pkey ON public.poll_options USING btree (id)` |
| `public.poll_votes` | `idx_poll_votes_option_id` | `CREATE INDEX idx_poll_votes_option_id ON public.poll_votes USING btree (option_id)` |
| `public.poll_votes` | `idx_poll_votes_poll_id` | `CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes USING btree (poll_id)` |
| `public.poll_votes` | `idx_poll_votes_user_id` | `CREATE INDEX idx_poll_votes_user_id ON public.poll_votes USING btree (user_id)` |
| `public.poll_votes` | `poll_votes_pkey` | `CREATE UNIQUE INDEX poll_votes_pkey ON public.poll_votes USING btree (id)` |
| `public.poll_votes` | `poll_votes_poll_id_option_id_user_id_key` | `CREATE UNIQUE INDEX poll_votes_poll_id_option_id_user_id_key ON public.poll_votes USING btree (poll_id, option_id, user_id)` |
| `public.polls` | `idx_polls_created_at` | `CREATE INDEX idx_polls_created_at ON public.polls USING btree (created_at DESC)` |
| `public.polls` | `idx_polls_event_status` | `CREATE INDEX idx_polls_event_status ON public.polls USING btree (event_id, status)` |
| `public.polls` | `polls_pkey` | `CREATE UNIQUE INDEX polls_pkey ON public.polls USING btree (id)` |
| `public.profile_claim_answers` | `idx_claim_answers_claim_id` | `CREATE INDEX idx_claim_answers_claim_id ON public.profile_claim_answers USING btree (claim_id)` |
| `public.profile_claim_answers` | `profile_claim_answers_pkey` | `CREATE UNIQUE INDEX profile_claim_answers_pkey ON public.profile_claim_answers USING btree (id)` |
| `public.profile_claim_disputes` | `idx_disputes_person_id` | `CREATE INDEX idx_disputes_person_id ON public.profile_claim_disputes USING btree (person_id)` |
| `public.profile_claim_disputes` | `idx_disputes_requester` | `CREATE INDEX idx_disputes_requester ON public.profile_claim_disputes USING btree (requester_user_id)` |
| `public.profile_claim_disputes` | `idx_disputes_status` | `CREATE INDEX idx_disputes_status ON public.profile_claim_disputes USING btree (status)` |
| `public.profile_claim_disputes` | `profile_claim_disputes_pkey` | `CREATE UNIQUE INDEX profile_claim_disputes_pkey ON public.profile_claim_disputes USING btree (id)` |
| `public.profile_claims` | `idx_profile_claims_person_id` | `CREATE INDEX idx_profile_claims_person_id ON public.profile_claims USING btree (person_id)` |
| `public.profile_claims` | `idx_profile_claims_requester_user_id` | `CREATE INDEX idx_profile_claims_requester_user_id ON public.profile_claims USING btree (requester_user_id)` |
| `public.profile_claims` | `idx_profile_claims_status` | `CREATE INDEX idx_profile_claims_status ON public.profile_claims USING btree (status)` |
| `public.profile_claims` | `profile_claims_pkey` | `CREATE UNIQUE INDEX profile_claims_pkey ON public.profile_claims USING btree (id)` |
| `public.profile_identity_verifications` | `profile_identity_verifications_person_created_idx` | `CREATE INDEX profile_identity_verifications_person_created_idx ON public.profile_identity_verifications USING btree (person_id, created_at DESC)` |
| `public.profile_identity_verifications` | `profile_identity_verifications_person_id_claimant_user_id_key` | `CREATE UNIQUE INDEX profile_identity_verifications_person_id_claimant_user_id_key ON public.profile_identity_verifications USING btree (person_id, claimant_user_id)` |
| `public.profile_identity_verifications` | `profile_identity_verifications_pkey` | `CREATE UNIQUE INDEX profile_identity_verifications_pkey ON public.profile_identity_verifications USING btree (id)` |
| `public.profile_school_questionnaire_answers` | `idx_profile_school_questionnaire_answers_event` | `CREATE INDEX idx_profile_school_questionnaire_answers_event ON public.profile_school_questionnaire_answers USING btree (event_id)` |
| `public.profile_school_questionnaire_answers` | `idx_profile_school_questionnaire_answers_person` | `CREATE INDEX idx_profile_school_questionnaire_answers_person ON public.profile_school_questionnaire_answers USING btree (person_id)` |
| `public.profile_school_questionnaire_answers` | `idx_profile_school_questionnaire_answers_question` | `CREATE INDEX idx_profile_school_questionnaire_answers_question ON public.profile_school_questionnaire_answers USING btree (question_id)` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_pkey` | `CREATE UNIQUE INDEX profile_school_questionnaire_answers_pkey ON public.profile_school_questionnaire_answers USING btree (id)` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_unique` | `CREATE UNIQUE INDEX profile_school_questionnaire_answers_unique ON public.profile_school_questionnaire_answers USING btree (profile_id, question_id)` |
| `public.profiles` | `idx_profiles_person_id` | `CREATE INDEX idx_profiles_person_id ON public.profiles USING btree (person_id)` |
| `public.profiles` | `idx_profiles_user_id` | `CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id)` |
| `public.profiles` | `profiles_person_id_key` | `CREATE UNIQUE INDEX profiles_person_id_key ON public.profiles USING btree (person_id)` |
| `public.profiles` | `profiles_pkey` | `CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)` |
| `public.profiles` | `profiles_user_id_key` | `CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id)` |
| `public.public_page_content` | `public_page_content_pkey` | `CREATE UNIQUE INDEX public_page_content_pkey ON public.public_page_content USING btree (event_id, page_slug)` |
| `public.rate_limit_buckets` | `rate_limit_buckets_expires_idx` | `CREATE INDEX rate_limit_buckets_expires_idx ON public.rate_limit_buckets USING btree (expires_at)` |
| `public.rate_limit_buckets` | `rate_limit_buckets_pkey` | `CREATE UNIQUE INDEX rate_limit_buckets_pkey ON public.rate_limit_buckets USING btree (bucket_key)` |
| `public.refund_policy` | `refund_policy_pkey` | `CREATE UNIQUE INDEX refund_policy_pkey ON public.refund_policy USING btree (id)` |
| `public.refund_requests` | `refund_requests_order_status_idx` | `CREATE INDEX refund_requests_order_status_idx ON public.refund_requests USING btree (order_id, status, requested_at DESC)` |
| `public.refund_requests` | `refund_requests_pkey` | `CREATE UNIQUE INDEX refund_requests_pkey ON public.refund_requests USING btree (id)` |
| `public.security_audit_log` | `security_audit_log_actor_idx` | `CREATE INDEX security_audit_log_actor_idx ON public.security_audit_log USING btree (actor_user_id, created_at DESC)` |
| `public.security_audit_log` | `security_audit_log_created_idx` | `CREATE INDEX security_audit_log_created_idx ON public.security_audit_log USING btree (created_at DESC)` |
| `public.security_audit_log` | `security_audit_log_entity_idx` | `CREATE INDEX security_audit_log_entity_idx ON public.security_audit_log USING btree (entity_type, entity_id, created_at DESC)` |
| `public.security_audit_log` | `security_audit_log_pkey` | `CREATE UNIQUE INDEX security_audit_log_pkey ON public.security_audit_log USING btree (id)` |
| `public.ticket_lot_prices` | `ticket_lot_prices_lot_id_ticket_type_id_key` | `CREATE UNIQUE INDEX ticket_lot_prices_lot_id_ticket_type_id_key ON public.ticket_lot_prices USING btree (lot_id, ticket_type_id)` |
| `public.ticket_lot_prices` | `ticket_lot_prices_pkey` | `CREATE UNIQUE INDEX ticket_lot_prices_pkey ON public.ticket_lot_prices USING btree (id)` |
| `public.ticket_lot_prices` | `ticket_lot_prices_type_idx` | `CREATE INDEX ticket_lot_prices_type_idx ON public.ticket_lot_prices USING btree (ticket_type_id, lot_id)` |
| `public.ticket_lots` | `ticket_lots_event_dates_idx` | `CREATE INDEX ticket_lots_event_dates_idx ON public.ticket_lots USING btree (event_id, starts_at, ends_at)` |
| `public.ticket_lots` | `ticket_lots_event_id_code_key` | `CREATE UNIQUE INDEX ticket_lots_event_id_code_key ON public.ticket_lots USING btree (event_id, code)` |
| `public.ticket_lots` | `ticket_lots_event_id_sort_order_key` | `CREATE UNIQUE INDEX ticket_lots_event_id_sort_order_key ON public.ticket_lots USING btree (event_id, sort_order)` |
| `public.ticket_lots` | `ticket_lots_pkey` | `CREATE UNIQUE INDEX ticket_lots_pkey ON public.ticket_lots USING btree (id)` |
| `public.ticket_transfers` | `ticket_transfers_open_unique` | `CREATE UNIQUE INDEX ticket_transfers_open_unique ON public.ticket_transfers USING btree (ticket_id) WHERE (status = ANY (ARRAY['requested'::text, 'accepted'::text]))` |
| `public.ticket_transfers` | `ticket_transfers_pkey` | `CREATE UNIQUE INDEX ticket_transfers_pkey ON public.ticket_transfers USING btree (id)` |
| `public.ticket_types` | `idx_ticket_types_event_id` | `CREATE INDEX idx_ticket_types_event_id ON public.ticket_types USING btree (event_id)` |
| `public.ticket_types` | `idx_ticket_types_status` | `CREATE INDEX idx_ticket_types_status ON public.ticket_types USING btree (status)` |
| `public.ticket_types` | `ticket_types_event_product_code_unique` | `CREATE UNIQUE INDEX ticket_types_event_product_code_unique ON public.ticket_types USING btree (event_id, product_code) WHERE (product_code IS NOT NULL)` |
| `public.ticket_types` | `ticket_types_pkey` | `CREATE UNIQUE INDEX ticket_types_pkey ON public.ticket_types USING btree (id)` |
| `public.tickets` | `idx_tickets_attendee_email` | `CREATE INDEX idx_tickets_attendee_email ON public.tickets USING btree (attendee_email)` |
| `public.tickets` | `idx_tickets_attendee_name` | `CREATE INDEX idx_tickets_attendee_name ON public.tickets USING gin (attendee_name gin_trgm_ops)` |
| `public.tickets` | `idx_tickets_checked_in` | `CREATE INDEX idx_tickets_checked_in ON public.tickets USING btree (checked_in)` |
| `public.tickets` | `idx_tickets_order_id` | `CREATE INDEX idx_tickets_order_id ON public.tickets USING btree (order_id)` |
| `public.tickets` | `idx_tickets_person_id` | `CREATE INDEX idx_tickets_person_id ON public.tickets USING btree (person_id)` |
| `public.tickets` | `idx_tickets_qr_code` | `CREATE INDEX idx_tickets_qr_code ON public.tickets USING btree (qr_code)` |
| `public.tickets` | `tickets_order_participant_unique` | `CREATE UNIQUE INDEX tickets_order_participant_unique ON public.tickets USING btree (order_participant_id) WHERE (order_participant_id IS NOT NULL)` |
| `public.tickets` | `tickets_pkey` | `CREATE UNIQUE INDEX tickets_pkey ON public.tickets USING btree (id)` |
| `public.tickets` | `tickets_qr_code_key` | `CREATE UNIQUE INDEX tickets_qr_code_key ON public.tickets USING btree (qr_code)` |
| `public.tickets` | `tickets_qr_token_hash_key` | `CREATE UNIQUE INDEX tickets_qr_token_hash_key ON public.tickets USING btree (qr_token_hash)` |
| `public.tickets` | `tickets_qr_token_unique` | `CREATE UNIQUE INDEX tickets_qr_token_unique ON public.tickets USING btree (qr_token) WHERE (qr_token IS NOT NULL)` |

## Views

| Tipo | View | Definição |
|---|---|---|
| view | `public.poll_results` | ` SELECT po.poll_id,<br>    po.id AS option_id,<br>    po.option_text,<br>    po.sort_order,<br>    (count(pv.id))::integer AS votes_count<br>   FROM (poll_options po<br>     LEFT JOIN poll_votes pv ON ((pv.option_id = po.id)))<br>  GROUP BY po.poll_id, po.id, po.option_text, po.sort_order;` |
| view | `public.public_alumni_directory_status` | ` SELECT '00000000-0000-0000-0000-000000000001'::uuid AS event_id,<br>    pe.id AS person_id,<br>    pe.full_name,<br>    pe.class_group,<br>    pe.profile_status,<br>    (EXISTS ( SELECT 1<br>           FROM (tickets t<br>             JOIN orders o ON ((o.id = t.order_id)))<br>          WHERE ((t.person_id = pe.id) AND (o.event_id = '00000000-0000-0000-0000-000000000001'::uuid) AND (o.payment_status = 'approved'::payment_status)))) AS has_approved_ticket,<br>    (EXISTS ( SELECT 1<br>           FROM profiles p_exists<br>          WHERE (p_exists.person_id = pe.id))) AS has_completed_registration,<br>    COALESCE(p.intends_to_attend, false) AS intends_to_attend,<br>    COALESCE(p.display_name, pe.display_name) AS display_name,<br>    COALESCE(p.current_photo_url, pe.avatar_url) AS avatar_url,<br>        CASE<br>            WHEN (p.show_city = true) THEN p.current_city<br>            ELSE NULL::text<br>        END AS current_city,<br>        CASE<br>            WHEN (p.show_city = true) THEN p.current_state<br>            ELSE NULL::text<br>        END AS current_state,<br>        CASE<br>            WHEN (p.show_city = true) THEN p.current_country<br>            ELSE NULL::text<br>        END AS current_country,<br>        CASE<br>            WHEN (p.show_profession = true) THEN p.profession<br>            ELSE NULL::text<br>        END AS profession<br>   FROM (people pe<br>     LEFT JOIN LATERAL ( SELECT pr.id,<br>            pr.person_id,<br>            pr.user_id,<br>            pr.display_name,<br>            pr.current_photo_url,<br>            pr.current_city,<br>            pr.current_state,<br>            pr.current_country,<br>            pr.profession,<br>            pr.bio,<br>            pr.memory_text,<br>            pr.instagram_url,<br>            pr.linkedin_url,<br>            pr.show_current_photo,<br>            pr.show_city,<br>            pr.show_profession,<br>            pr.show_social_links,<br>            pr.allow_photo_tags,<br>            pr.show_confirmed_status,<br>            pr.created_at,<br>            pr.updated_at,<br>            pr.contact_email,<br>            pr.contact_whatsapp,<br>            pr.relationship_status,<br>            pr.has_children,<br>            pr.children_count,<br>            pr.intends_to_attend<br>           FROM profiles pr<br>          WHERE (pr.person_id = pe.id)<br>          ORDER BY pr.updated_at DESC NULLS LAST, pr.created_at DESC NULLS LAST<br>         LIMIT 1) p ON (true))<br>  WHERE (pe.is_visible = true);` |
| view | `public.public_curiosity_profile_stats` | ` WITH constants AS (<br>         SELECT '00000000-0000-0000-0000-000000000001'::uuid AS event_id<br>        ), visible_people AS (<br>         SELECT people.id,<br>            people.full_name,<br>            people.class_year,<br>            people.class_group,<br>            people.nickname_at_school,<br>            people.profile_status,<br>            people.claimed_by_user_id,<br>            people.claimed_at,<br>            people.is_visible,<br>            people.private_notes,<br>            people.created_at,<br>            people.updated_at,<br>            people.avatar_url,<br>            people.birth_year,<br>            people.verification_status,<br>            people.contact_email,<br>            people.contact_whatsapp<br>           FROM people<br>          WHERE (people.is_visible IS NOT FALSE)<br>        ), registered_profiles AS (<br>         SELECT p.id,<br>            p.person_id,<br>            p.user_id,<br>            p.display_name,<br>            p.current_photo_url,<br>            p.current_city,<br>            p.current_state,<br>            p.current_country,<br>            p.profession,<br>            p.bio,<br>            p.memory_text,<br>            p.instagram_url,<br>            p.linkedin_url,<br>            p.show_current_photo,<br>            p.show_city,<br>            p.show_profession,<br>            p.show_social_links,<br>            p.allow_photo_tags,<br>            p.show_confirmed_status,<br>            p.created_at,<br>            p.updated_at,<br>            p.contact_email,<br>            p.contact_whatsapp,<br>            p.relationship_status,<br>            p.has_children,<br>            p.children_count,<br>            p.intends_to_attend,<br>            pe.class_group<br>           FROM (profiles p<br>             JOIN people pe ON ((pe.id = p.person_id)))<br>          WHERE (pe.is_visible IS NOT FALSE)<br>        ), confirmed_people AS (<br>         SELECT DISTINCT o.person_id<br>           FROM orders o<br>          WHERE ((o.person_id IS NOT NULL) AND (o.payment_status = 'approved'::payment_status))<br>        ), relationship_counts AS (<br>         SELECT<br>                CASE p.relationship_status<br>                    WHEN 'single'::text THEN 'Solteiro(a)'::text<br>                    WHEN 'dating'::text THEN 'Namorando'::text<br>                    WHEN 'married'::text THEN 'Casado(a)'::text<br>                    ELSE 'Não informado'::text<br>                END AS label,<br>            (count(*))::integer AS count<br>           FROM registered_profiles p<br>          GROUP BY<br>                CASE p.relationship_status<br>                    WHEN 'single'::text THEN 'Solteiro(a)'::text<br>                    WHEN 'dating'::text THEN 'Namorando'::text<br>                    WHEN 'married'::text THEN 'Casado(a)'::text<br>                    ELSE 'Não informado'::text<br>                END<br>        ), children_counts AS (<br>         SELECT<br>                CASE<br>                    WHEN (p.has_children IS TRUE) THEN 'Com filhos'::text<br>                    ELSE 'Sem filhos'::text<br>                END AS label,<br>            (count(*))::integer AS count<br>           FROM registered_profiles p<br>          GROUP BY<br>                CASE<br>                    WHEN (p.has_children IS TRUE) THEN 'Com filhos'::text<br>                    ELSE 'Sem filhos'::text<br>                END<br>        ), children_distribution AS (<br>         SELECT<br>                CASE<br>                    WHEN (p.has_children IS NOT TRUE) THEN '0 filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) >= 4) THEN '4+ filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) = 3) THEN '3 filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) = 2) THEN '2 filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) = 1) THEN '1 filho'::text<br>                    ELSE 'Tem filhos'::text<br>                END AS label,<br>            (count(*))::integer AS count<br>           FROM registered_profiles p<br>          GROUP BY<br>                CASE<br>                    WHEN (p.has_children IS NOT TRUE) THEN '0 filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) >= 4) THEN '4+ filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) = 3) THEN '3 filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) = 2) THEN '2 filhos'::text<br>                    WHEN (COALESCE(p.children_count, 0) = 1) THEN '1 filho'::text<br>                    ELSE 'Tem filhos'::text<br>                END<br>        ), profession_counts AS (<br>         SELECT<br>                CASE<br>                    WHEN ((p.profession IS NULL) OR (btrim(p.profession) = ''::text) OR (p.show_profession IS FALSE)) THEN 'Não informado'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%médic%'::text, '%medic%'::text, '%saúde%'::text, '%saude%'::text, '%dent%'::text, '%psic%'::text, '%fisio%'::text, '%nutri%'::text, '%enferm%'::text, '%farm%'::text])) THEN 'Saúde'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%adv%'::text, '%direito%'::text, '%jur%'::text, '%promotor%'::text, '%defensor%'::text])) THEN 'Direito'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%prof%'::text, '%educ%'::text, '%pedagog%'::text, '%docente%'::text])) THEN 'Educação'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%comunica%'::text, '%jornal%'::text, '%marketing%'::text, '%public%'::text, '%social media%'::text, '%relações públicas%'::text, '%relacoes publicas%'::text])) THEN 'Comunicação e Marketing'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%tech%'::text, '%tecnologia%'::text, '%desenvolv%'::text, '%program%'::text, '%software%'::text, '%dados%'::text, '%data%'::text, '%sistema%'::text, '%ti%'::text])) THEN 'Tecnologia'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%engenh%'::text, '%arquit%'::text, '%urban%'::text])) THEN 'Engenharia e Arquitetura'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%admin%'::text, '%gest%'::text, '%negócio%'::text, '%negocio%'::text, '%empreend%'::text, '%empres%'::text, '%comercial%'::text])) THEN 'Negócios e Gestão'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%servidor%'::text, '%públic%'::text, '%public%'::text, '%governo%'::text, '%estado%'::text, '%prefeitura%'::text])) THEN 'Serviço Público'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%finan%'::text, '%banc%'::text, '%conta%'::text, '%econom%'::text, '%invest%'::text])) THEN 'Finanças'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%arte%'::text, '%design%'::text, '%cria%'::text, '%músic%'::text, '%music%'::text, '%fot%'::text, '%vídeo%'::text, '%video%'::text])) THEN 'Artes e Criação'::text<br>                    ELSE 'Outras áreas'::text<br>                END AS label,<br>            (count(*))::integer AS count<br>           FROM registered_profiles p<br>          GROUP BY<br>                CASE<br>                    WHEN ((p.profession IS NULL) OR (btrim(p.profession) = ''::text) OR (p.show_profession IS FALSE)) THEN 'Não informado'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%médic%'::text, '%medic%'::text, '%saúde%'::text, '%saude%'::text, '%dent%'::text, '%psic%'::text, '%fisio%'::text, '%nutri%'::text, '%enferm%'::text, '%farm%'::text])) THEN 'Saúde'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%adv%'::text, '%direito%'::text, '%jur%'::text, '%promotor%'::text, '%defensor%'::text])) THEN 'Direito'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%prof%'::text, '%educ%'::text, '%pedagog%'::text, '%docente%'::text])) THEN 'Educação'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%comunica%'::text, '%jornal%'::text, '%marketing%'::text, '%public%'::text, '%social media%'::text, '%relações públicas%'::text, '%relacoes publicas%'::text])) THEN 'Comunicação e Marketing'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%tech%'::text, '%tecnologia%'::text, '%desenvolv%'::text, '%program%'::text, '%software%'::text, '%dados%'::text, '%data%'::text, '%sistema%'::text, '%ti%'::text])) THEN 'Tecnologia'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%engenh%'::text, '%arquit%'::text, '%urban%'::text])) THEN 'Engenharia e Arquitetura'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%admin%'::text, '%gest%'::text, '%negócio%'::text, '%negocio%'::text, '%empreend%'::text, '%empres%'::text, '%comercial%'::text])) THEN 'Negócios e Gestão'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%servidor%'::text, '%públic%'::text, '%public%'::text, '%governo%'::text, '%estado%'::text, '%prefeitura%'::text])) THEN 'Serviço Público'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%finan%'::text, '%banc%'::text, '%conta%'::text, '%econom%'::text, '%invest%'::text])) THEN 'Finanças'::text<br>                    WHEN (p.profession ~~* ANY (ARRAY['%arte%'::text, '%design%'::text, '%cria%'::text, '%músic%'::text, '%music%'::text, '%fot%'::text, '%vídeo%'::text, '%video%'::text])) THEN 'Artes e Criação'::text<br>                    ELSE 'Outras áreas'::text<br>                END<br>        )<br> SELECT event_id,<br>    ( SELECT (count(*))::integer AS count<br>           FROM visible_people) AS total_people,<br>    ( SELECT (count(*))::integer AS count<br>           FROM registered_profiles) AS total_registered,<br>    ( SELECT (count(*))::integer AS count<br>           FROM registered_profiles p<br>          WHERE (p.intends_to_attend IS TRUE)) AS total_preconfirmed,<br>    ( SELECT (count(*))::integer AS count<br>           FROM confirmed_people) AS total_confirmed,<br>    ( SELECT (count(*))::integer AS count<br>           FROM registered_profiles p<br>          WHERE (p.relationship_status IS NOT NULL)) AS total_with_relationship,<br>    ( SELECT (count(*))::integer AS count<br>           FROM registered_profiles p<br>          WHERE (p.has_children IS TRUE)) AS total_with_children,<br>    ( SELECT (COALESCE(sum(COALESCE(p.children_count, 0)), (0)::bigint))::integer AS "coalesce"<br>           FROM registered_profiles p<br>          WHERE (p.has_children IS TRUE)) AS total_children_declared,<br>    COALESCE(( SELECT jsonb_agg(jsonb_build_object('label', relationship_counts.label, 'count', relationship_counts.count) ORDER BY relationship_counts.count DESC, relationship_counts.label) AS jsonb_agg<br>           FROM relationship_counts), '[]'::jsonb) AS relationship_status_counts,<br>    COALESCE(( SELECT jsonb_agg(jsonb_build_object('label', children_counts.label, 'count', children_counts.count) ORDER BY children_counts.count DESC, children_counts.label) AS jsonb_agg<br>           FROM children_counts), '[]'::jsonb) AS children_status_counts,<br>    COALESCE(( SELECT jsonb_agg(jsonb_build_object('label', children_distribution.label, 'count', children_distribution.count) ORDER BY children_distribution.count DESC, children_distribution.label) AS jsonb_agg<br>           FROM children_distribution), '[]'::jsonb) AS children_count_distribution,<br>    COALESCE(( SELECT jsonb_agg(jsonb_build_object('label', profession_counts.label, 'count', profession_counts.count) ORDER BY profession_counts.count DESC, profession_counts.label) AS jsonb_agg<br>           FROM profession_counts), '[]'::jsonb) AS profession_area_counts<br>   FROM constants c;` |
| view | `public.public_profile_cards` | ` SELECT p.id AS profile_id,<br>    p.person_id,<br>    COALESCE(p.display_name, pe.display_name) AS display_name,<br>    pe.full_name,<br>    COALESCE(p.current_photo_url, pe.avatar_url) AS avatar_url,<br>        CASE<br>            WHEN (p.show_city = true) THEN p.current_city<br>            ELSE NULL::text<br>        END AS current_city,<br>        CASE<br>            WHEN (p.show_city = true) THEN p.current_state<br>            ELSE NULL::text<br>        END AS current_state,<br>        CASE<br>            WHEN (p.show_city = true) THEN p.current_country<br>            ELSE NULL::text<br>        END AS current_country,<br>        CASE<br>            WHEN (p.show_profession = true) THEN p.profession<br>            ELSE NULL::text<br>        END AS profession,<br>        CASE<br>            WHEN (p.show_social_links = true) THEN p.instagram_url<br>            ELSE NULL::text<br>        END AS instagram_url,<br>        CASE<br>            WHEN (p.show_social_links = true) THEN p.linkedin_url<br>            ELSE NULL::text<br>        END AS linkedin_url,<br>        CASE<br>            WHEN (p.show_social_links = true) THEN p.contact_whatsapp<br>            ELSE NULL::text<br>        END AS contact_whatsapp,<br>    p.relationship_status,<br>    p.has_children,<br>    p.children_count,<br>    p.intends_to_attend<br>   FROM (profiles p<br>     JOIN people pe ON ((pe.id = p.person_id)))<br>  WHERE (pe.is_visible = true);` |
| view | `public.public_profile_locations` | ` SELECT p.id AS profile_id,<br>    p.person_id,<br>    p.display_name,<br>    pe.full_name,<br>    pe.avatar_url,<br>    p.current_city,<br>    p.current_state,<br>    p.current_country,<br>    p.profession,<br>    p.show_profession<br>   FROM (profiles p<br>     JOIN people pe ON ((pe.id = p.person_id)))<br>  WHERE ((p.show_city = true) AND (p.current_city IS NOT NULL) AND (length(TRIM(BOTH FROM p.current_city)) > 0) AND (pe.is_visible = true));` |
| view | `public.public_school_questionnaire_option_stats` | ` SELECT a.event_id,<br>    a.question_id,<br>    option_value.value AS option_label,<br>    (count(*))::integer AS answer_count<br>   FROM (profile_school_questionnaire_answers a<br>     CROSS JOIN LATERAL jsonb_array_elements_text(a.selected_options_json) option_value(value))<br>  WHERE ((option_value.value IS NOT NULL) AND (btrim(option_value.value) <> ''::text))<br>  GROUP BY a.event_id, a.question_id, option_value.value;` |

## Triggers

| Tabela | Trigger | Definição |
|---|---|---|
| `public.admin_users` | `trg_admin_users_updated_at` | `CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.cms_assets` | `trg_cms_assets_updated_at` | `CREATE TRIGGER trg_cms_assets_updated_at BEFORE UPDATE ON cms_assets FOR EACH ROW EXECUTE FUNCTION set_cms_assets_updated_at()` |
| `public.event_archive_settings` | `trg_event_archive_settings_updated_at` | `CREATE TRIGGER trg_event_archive_settings_updated_at BEFORE UPDATE ON event_archive_settings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.event_page_content` | `trg_event_page_content_updated_at` | `CREATE TRIGGER trg_event_page_content_updated_at BEFORE UPDATE ON event_page_content FOR EACH ROW EXECUTE FUNCTION set_event_page_content_updated_at()` |
| `public.events` | `trg_events_updated_at` | `CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.faq_categories` | `trg_faq_categories_updated_at` | `CREATE TRIGGER trg_faq_categories_updated_at BEFORE UPDATE ON faq_categories FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.faq_categories` | `trg_prevent_faq_category_delete` | `CREATE TRIGGER trg_prevent_faq_category_delete BEFORE DELETE OR UPDATE OF deleted_at ON faq_categories FOR EACH ROW EXECUTE FUNCTION prevent_faq_category_delete_with_active_items()` |
| `public.faq_items` | `trg_faq_items_updated_at` | `CREATE TRIGGER trg_faq_items_updated_at BEFORE UPDATE ON faq_items FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.guest_approval_requests` | `audit_guest_approval_requests_change` | `CREATE TRIGGER audit_guest_approval_requests_change AFTER INSERT OR DELETE OR UPDATE ON guest_approval_requests FOR EACH ROW EXECUTE FUNCTION audit_sensitive_row_change()` |
| `public.home_page_content` | `trg_touch_home_page_content` | `CREATE TRIGGER trg_touch_home_page_content BEFORE UPDATE ON home_page_content FOR EACH ROW EXECUTE FUNCTION fn_touch_home_page_content()` |
| `public.memories` | `trg_auto_approve_memories` | `CREATE TRIGGER trg_auto_approve_memories AFTER INSERT ON memories FOR EACH ROW EXECUTE FUNCTION apply_automatic_content_approval()` |
| `public.memories` | `trg_memories_sanitize` | `CREATE TRIGGER trg_memories_sanitize BEFORE INSERT OR UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION sanitize_content_row()` |
| `public.memories` | `trg_memories_updated_at` | `CREATE TRIGGER trg_memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.notification_jobs` | `enqueue_guest_approval_whatsapp_job` | `CREATE TRIGGER enqueue_guest_approval_whatsapp_job AFTER INSERT ON notification_jobs FOR EACH ROW EXECUTE FUNCTION enqueue_guest_approval_whatsapp_job()` |
| `public.orders` | `orders_enqueue_status_notifications` | `CREATE TRIGGER orders_enqueue_status_notifications AFTER INSERT OR UPDATE OF payment_status ON orders FOR EACH ROW EXECUTE FUNCTION enqueue_order_status_notifications()` |
| `public.orders` | `orders_ensure_pending_expiry` | `CREATE TRIGGER orders_ensure_pending_expiry BEFORE INSERT OR UPDATE OF payment_status, reservation_status, expires_at ON orders FOR EACH ROW EXECUTE FUNCTION ensure_pending_order_expiry()` |
| `public.orders` | `orders_sync_ticket_type_sales` | `CREATE TRIGGER orders_sync_ticket_type_sales AFTER UPDATE OF payment_status ON orders FOR EACH ROW EXECUTE FUNCTION sync_order_payment_sales_trigger()` |
| `public.orders` | `trg_orders_updated_at` | `CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.payment_preferences` | `payment_preferences_ensure_active_expiry` | `CREATE TRIGGER payment_preferences_ensure_active_expiry BEFORE INSERT OR UPDATE OF status, expires_at, order_id ON payment_preferences FOR EACH ROW EXECUTE FUNCTION ensure_active_preference_expiry()` |
| `public.people` | `trg_people_updated_at` | `CREATE TRIGGER trg_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.photo_comments` | `trg_auto_approve_photo_comments` | `CREATE TRIGGER trg_auto_approve_photo_comments AFTER INSERT ON photo_comments FOR EACH ROW EXECUTE FUNCTION apply_automatic_content_approval()` |
| `public.photo_comments` | `trg_photo_comments_sanitize` | `CREATE TRIGGER trg_photo_comments_sanitize BEFORE INSERT OR UPDATE ON photo_comments FOR EACH ROW EXECUTE FUNCTION sanitize_content_row()` |
| `public.photo_comments` | `trg_photo_comments_updated_at` | `CREATE TRIGGER trg_photo_comments_updated_at BEFORE UPDATE ON photo_comments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.photo_removal_requests` | `trg_photo_removal_requests_sanitize` | `CREATE TRIGGER trg_photo_removal_requests_sanitize BEFORE INSERT OR UPDATE ON photo_removal_requests FOR EACH ROW EXECUTE FUNCTION sanitize_content_row()` |
| `public.photo_removal_requests` | `trg_removal_requests_updated_at` | `CREATE TRIGGER trg_removal_requests_updated_at BEFORE UPDATE ON photo_removal_requests FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.photo_tags` | `trg_photo_tags_sanitize` | `CREATE TRIGGER trg_photo_tags_sanitize BEFORE INSERT OR UPDATE ON photo_tags FOR EACH ROW EXECUTE FUNCTION sanitize_content_row()` |
| `public.photo_tags` | `trg_photo_tags_updated_at` | `CREATE TRIGGER trg_photo_tags_updated_at BEFORE UPDATE ON photo_tags FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.photos` | `trg_auto_approve_photos` | `CREATE TRIGGER trg_auto_approve_photos AFTER INSERT ON photos FOR EACH ROW EXECUTE FUNCTION apply_automatic_content_approval()` |
| `public.photos` | `trg_photos_sanitize` | `CREATE TRIGGER trg_photos_sanitize BEFORE INSERT OR UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION sanitize_content_row()` |
| `public.photos` | `trg_photos_updated_at` | `CREATE TRIGGER trg_photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.poll_votes` | `trg_validate_poll_vote` | `CREATE TRIGGER trg_validate_poll_vote BEFORE INSERT ON poll_votes FOR EACH ROW EXECUTE FUNCTION fn_validate_poll_vote()` |
| `public.polls` | `trg_polls_updated_at` | `CREATE TRIGGER trg_polls_updated_at BEFORE UPDATE ON polls FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.profile_claim_disputes` | `trg_disputes_updated_at` | `CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON profile_claim_disputes FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.profile_claims` | `trg_profile_claims_updated_at` | `CREATE TRIGGER trg_profile_claims_updated_at BEFORE UPDATE ON profile_claims FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.profiles` | `trg_profiles_updated_at` | `CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.public_page_content` | `trg_public_page_content_updated_at` | `CREATE TRIGGER trg_public_page_content_updated_at BEFORE UPDATE ON public_page_content FOR EACH ROW EXECUTE FUNCTION set_public_page_content_updated_at()` |
| `public.refund_requests` | `audit_refund_requests_change` | `CREATE TRIGGER audit_refund_requests_change AFTER INSERT OR DELETE OR UPDATE ON refund_requests FOR EACH ROW EXECUTE FUNCTION audit_sensitive_row_change()` |
| `public.ticket_lots` | `a_ticket_lots_normalize_capacity` | `CREATE TRIGGER a_ticket_lots_normalize_capacity BEFORE INSERT OR UPDATE OF capacity ON ticket_lots FOR EACH ROW EXECUTE FUNCTION normalize_ticket_lot_capacity()` |
| `public.ticket_lots` | `ticket_lots_enforce_hc20_capacity` | `CREATE TRIGGER ticket_lots_enforce_hc20_capacity BEFORE INSERT OR UPDATE OF event_id, capacity ON ticket_lots FOR EACH ROW EXECUTE FUNCTION enforce_hc20_commerce_capacity()` |
| `public.ticket_transfers` | `audit_ticket_transfers_change` | `CREATE TRIGGER audit_ticket_transfers_change AFTER INSERT OR DELETE OR UPDATE ON ticket_transfers FOR EACH ROW EXECUTE FUNCTION audit_sensitive_row_change()` |
| `public.ticket_types` | `ticket_types_enforce_hc20_capacity` | `CREATE TRIGGER ticket_types_enforce_hc20_capacity BEFORE INSERT OR UPDATE OF event_id, available_quantity, sold_quantity ON ticket_types FOR EACH ROW EXECUTE FUNCTION enforce_hc20_commerce_capacity()` |
| `public.ticket_types` | `trg_ticket_types_updated_at` | `CREATE TRIGGER trg_ticket_types_updated_at BEFORE UPDATE ON ticket_types FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
| `public.tickets` | `tickets_enqueue_whatsapp_notification` | `CREATE TRIGGER tickets_enqueue_whatsapp_notification AFTER INSERT ON tickets FOR EACH ROW EXECUTE FUNCTION enqueue_ticket_whatsapp_notification()` |
| `public.tickets` | `tickets_sync_ticket_type_sales` | `CREATE TRIGGER tickets_sync_ticket_type_sales AFTER INSERT OR DELETE OR UPDATE OF order_id, ticket_type_id ON tickets FOR EACH ROW EXECUTE FUNCTION sync_ticket_type_sold_quantity_trigger()` |
| `public.tickets` | `trg_tickets_qr` | `CREATE TRIGGER trg_tickets_qr BEFORE INSERT ON tickets FOR EACH ROW EXECUTE FUNCTION fn_generate_qr_code()` |
| `public.tickets` | `trg_tickets_updated_at` | `CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()` |
