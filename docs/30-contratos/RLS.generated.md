---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 249361f9a6e88a1a1d9d7c526cc308826d03b4f9
generation_command: npm run docs:generate-db-contracts
source_files:
  - supabase/config.toml
  - supabase/migrations/
  - scripts/generate-database-contracts.mjs
---

# RLS, grants e revokes

> Arquivo gerado a partir de um banco Supabase local reconstruído por todas as migrations. Não editar manualmente.

## Estado de RLS por tabela

| Tabela | RLS habilitada | RLS forçada |
|---|---|---|
| `public.admin_users` | sim | não |
| `public.audit_logs` | sim | não |
| `public.checkin_events` | sim | não |
| `public.cms_assets` | sim | não |
| `public.content_moderation_events` | sim | não |
| `public.content_moderation_settings` | sim | não |
| `public.event_archive_settings` | sim | não |
| `public.event_page_content` | sim | não |
| `public.events` | sim | não |
| `public.faq_categories` | sim | não |
| `public.faq_items` | sim | não |
| `public.faq_items_backup_20260716` | não | não |
| `public.guest_approval_requests` | sim | não |
| `public.home_page_content` | sim | não |
| `public.memories` | sim | não |
| `public.notification_jobs` | sim | não |
| `public.order_participants` | sim | não |
| `public.orders` | sim | não |
| `public.participant_extras` | sim | não |
| `public.payment_events` | sim | não |
| `public.payment_preferences` | sim | não |
| `public.people` | sim | não |
| `public.photo_comments` | sim | não |
| `public.photo_likes` | sim | não |
| `public.photo_removal_requests` | sim | não |
| `public.photo_tags` | sim | não |
| `public.photos` | sim | não |
| `public.poll_options` | sim | não |
| `public.poll_votes` | sim | não |
| `public.polls` | sim | não |
| `public.profile_claim_answers` | sim | não |
| `public.profile_claim_disputes` | sim | não |
| `public.profile_claims` | sim | não |
| `public.profile_identity_verifications` | sim | não |
| `public.profile_school_questionnaire_answers` | sim | não |
| `public.profiles` | sim | não |
| `public.public_page_content` | sim | não |
| `public.rate_limit_buckets` | sim | não |
| `public.refund_policy` | não | não |
| `public.refund_requests` | sim | não |
| `public.security_audit_log` | sim | não |
| `public.ticket_lot_prices` | sim | não |
| `public.ticket_lots` | sim | não |
| `public.ticket_transfers` | sim | não |
| `public.ticket_types` | sim | não |
| `public.tickets` | sim | não |

## Policies

| Tabela | Policy | Modo | Roles | Comando | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| `public.admin_users` | `admin_users_admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.admin_users` | `admin_users_self_read` | PERMISSIVE | `public` | `SELECT` | `(user_id = auth.uid())` | `—` |
| `public.admin_users` | `admin_users_superadmin_all` | PERMISSIVE | `public` | `ALL` | `has_admin_role('superadmin'::admin_role)` | `—` |
| `public.admin_users` | `admin_users_superadmin_write` | PERMISSIVE | `authenticated` | `ALL` | `is_superadmin()` | `is_superadmin()` |
| `public.audit_logs` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.audit_logs` | `audit_logs_admin_panel_insert` | PERMISSIVE | `authenticated` | `INSERT` | `—` | `is_admin_panel_user()` |
| `public.audit_logs` | `audit_logs_admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.audit_logs` | `audit_logs_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.audit_logs` | `audit_logs_service_insert` | PERMISSIVE | `public` | `INSERT` | `—` | `true` |
| `public.cms_assets` | `cms_assets_manage_admins` | PERMISSIVE | `authenticated` | `ALL` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` |
| `public.cms_assets` | `cms_assets_select_active` | PERMISSIVE | `public` | `SELECT` | `(is_active = true)` | `—` |
| `public.content_moderation_events` | `content_moderation_events_admin_read` | PERMISSIVE | `authenticated` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['moderator'::admin_role, 'admin'::admin_role, 'superadmin'::admin_role])))))` | `—` |
| `public.content_moderation_settings` | `content_moderation_settings_admin_read` | PERMISSIVE | `authenticated` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE (au.user_id = auth.uid())))` | `—` |
| `public.content_moderation_settings` | `content_moderation_settings_admin_write` | PERMISSIVE | `authenticated` | `ALL` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['admin'::admin_role, 'superadmin'::admin_role])))))` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['admin'::admin_role, 'superadmin'::admin_role])))))` |
| `public.event_archive_settings` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.event_archive_settings` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.event_archive_settings` | `event_archive_settings_admin_all` | PERMISSIVE | `public` | `ALL` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.event_archive_settings` | `event_archive_settings_public_read` | PERMISSIVE | `public` | `SELECT` | `true` | `—` |
| `public.event_page_content` | `event_page_content_manage_admins` | PERMISSIVE | `authenticated` | `ALL` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` |
| `public.event_page_content` | `event_page_content_select_public` | PERMISSIVE | `public` | `SELECT` | `true` | `—` |
| `public.events` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.events` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.events` | `events_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.events` | `events_admin_write` | PERMISSIVE | `public` | `ALL` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.events` | `events_public_read` | PERMISSIVE | `public` | `SELECT` | `(event_status = 'published'::event_status)` | `—` |
| `public.faq_categories` | `faq_categories_admin_insert` | PERMISSIVE | `authenticated` | `INSERT` | `—` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.faq_categories` | `faq_categories_admin_read` | PERMISSIVE | `authenticated` | `SELECT` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `—` |
| `public.faq_categories` | `faq_categories_admin_update` | PERMISSIVE | `authenticated` | `UPDATE` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.faq_categories` | `faq_categories_public_read` | PERMISSIVE | `anon,authenticated` | `SELECT` | `((is_visible = true) AND (deleted_at IS NULL))` | `—` |
| `public.faq_categories` | `faq_categories_superadmin_delete` | PERMISSIVE | `authenticated` | `DELETE` | `has_admin_role('superadmin'::admin_role)` | `—` |
| `public.faq_items` | `faq_items_admin_insert` | PERMISSIVE | `authenticated` | `INSERT` | `—` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.faq_items` | `faq_items_admin_read` | PERMISSIVE | `authenticated` | `SELECT` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `—` |
| `public.faq_items` | `faq_items_admin_update` | PERMISSIVE | `authenticated` | `UPDATE` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.faq_items` | `faq_items_public_read` | PERMISSIVE | `anon,authenticated` | `SELECT` | `((is_visible = true) AND (deleted_at IS NULL) AND (EXISTS ( SELECT 1<br>   FROM faq_categories fc<br>  WHERE ((fc.id = faq_items.category_id) AND (fc.event_id = faq_items.event_id) AND (fc.is_visible = true) AND (fc.deleted_at IS NULL)))))` | `—` |
| `public.faq_items` | `faq_items_superadmin_delete` | PERMISSIVE | `authenticated` | `DELETE` | `has_admin_role('superadmin'::admin_role)` | `—` |
| `public.guest_approval_requests` | `guest_requests_guest_insert` | PERMISSIVE | `authenticated` | `INSERT` | `—` | `((guest_user_id = auth.uid()) AND (status = 'pending'::text) AND (decided_at IS NULL) AND (decided_by_user_id IS NULL))` |
| `public.guest_approval_requests` | `guest_requests_parties_read` | PERMISSIVE | `authenticated` | `SELECT` | `((guest_user_id = auth.uid()) OR (EXISTS ( SELECT 1<br>   FROM people p<br>  WHERE ((p.id = guest_approval_requests.sponsor_person_id) AND (p.claimed_by_user_id = auth.uid())))))` | `—` |
| `public.home_page_content` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.home_page_content` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.home_page_content` | `home_page_content_admin_write` | PERMISSIVE | `authenticated` | `ALL` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['admin'::admin_role, 'superadmin'::admin_role])))))` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['admin'::admin_role, 'superadmin'::admin_role])))))` |
| `public.home_page_content` | `home_page_content_public_read` | PERMISSIVE | `public` | `SELECT` | `true` | `—` |
| `public.memories` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.memories` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.memories` | `memories_admin_delete` | PERMISSIVE | `public` | `DELETE` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `—` |
| `public.memories` | `memories_moderator_read` | PERMISSIVE | `public` | `SELECT` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `—` |
| `public.memories` | `memories_moderator_update` | PERMISSIVE | `public` | `UPDATE` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.memories` | `memories_owner_read` | PERMISSIVE | `public` | `SELECT` | `(user_id = auth.uid())` | `—` |
| `public.order_participants` | `order_participants_owner_read` | PERMISSIVE | `authenticated` | `SELECT` | `((user_id = auth.uid()) OR (sponsor_user_id = auth.uid()) OR (EXISTS ( SELECT 1<br>   FROM orders o<br>  WHERE ((o.id = order_participants.order_id) AND (o.buyer_user_id = auth.uid())))))` | `—` |
| `public.orders` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.orders` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.orders` | `orders_admin_all` | PERMISSIVE | `public` | `ALL` | `is_admin()` | `—` |
| `public.orders` | `orders_owner_read` | PERMISSIVE | `public` | `SELECT` | `((buyer_email = (( SELECT users.email<br>   FROM auth.users<br>  WHERE (users.id = auth.uid())))::text) OR (person_id IN ( SELECT people.id<br>   FROM people<br>  WHERE (people.claimed_by_user_id = auth.uid()))))` | `—` |
| `public.participant_extras` | `participant_extras_owner_read` | PERMISSIVE | `authenticated` | `SELECT` | `((EXISTS ( SELECT 1<br>   FROM orders o<br>  WHERE ((o.id = participant_extras.order_id) AND (o.buyer_user_id = auth.uid())))) OR (EXISTS ( SELECT 1<br>   FROM order_participants op<br>  WHERE ((op.id = participant_extras.order_participant_id) AND ((op.user_id = auth.uid()) OR (op.sponsor_user_id = auth.uid()))))))` | `—` |
| `public.payment_events` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.payment_events` | `payment_events_admin_all` | PERMISSIVE | `public` | `ALL` | `is_admin()` | `—` |
| `public.payment_preferences` | `payment_preferences_owner_read` | PERMISSIVE | `authenticated` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM orders o<br>  WHERE ((o.id = payment_preferences.order_id) AND (o.buyer_user_id = auth.uid()))))` | `—` |
| `public.people` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.people` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.people` | `people_admin_all` | PERMISSIVE | `public` | `ALL` | `is_admin()` | `—` |
| `public.people` | `people_owner_read` | PERMISSIVE | `public` | `SELECT` | `(claimed_by_user_id = auth.uid())` | `—` |
| `public.people` | `people_public_read` | PERMISSIVE | `public` | `SELECT` | `(is_visible = true)` | `—` |
| `public.photo_comments` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.photo_comments` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.photo_comments` | `photo_comments_admin_delete` | PERMISSIVE | `public` | `DELETE` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `—` |
| `public.photo_comments` | `photo_comments_moderator_read` | PERMISSIVE | `public` | `SELECT` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `—` |
| `public.photo_comments` | `photo_comments_moderator_update` | PERMISSIVE | `public` | `UPDATE` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.photo_comments` | `photo_comments_owner_read` | PERMISSIVE | `public` | `SELECT` | `(user_id = auth.uid())` | `—` |
| `public.photo_comments` | `photo_comments_public_read` | PERMISSIVE | `public` | `SELECT` | `(status = 'approved'::text)` | `—` |
| `public.photo_likes` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.photo_likes` | `photo_likes_admin_all` | PERMISSIVE | `public` | `ALL` | `is_admin()` | `is_admin()` |
| `public.photo_likes` | `photo_likes_auth_insert` | PERMISSIVE | `public` | `INSERT` | `—` | `((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))` |
| `public.photo_likes` | `photo_likes_owner_delete` | PERMISSIVE | `public` | `DELETE` | `(user_id = auth.uid())` | `—` |
| `public.photo_likes` | `photo_likes_public_read` | PERMISSIVE | `public` | `SELECT` | `true` | `—` |
| `public.photo_removal_requests` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.photo_removal_requests` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.photo_removal_requests` | `removal_requests_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.photo_removal_requests` | `removal_requests_moderator_read` | PERMISSIVE | `authenticated` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['moderator'::admin_role, 'admin'::admin_role, 'superadmin'::admin_role])))))` | `—` |
| `public.photo_removal_requests` | `removal_requests_moderator_write` | PERMISSIVE | `public` | `UPDATE` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.photo_removal_requests` | `removal_requests_owner_read` | PERMISSIVE | `public` | `SELECT` | `(requester_user_id = auth.uid())` | `—` |
| `public.photo_tags` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.photo_tags` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.photo_tags` | `photo_tags_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.photo_tags` | `photo_tags_moderator_read` | PERMISSIVE | `authenticated` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['moderator'::admin_role, 'admin'::admin_role, 'superadmin'::admin_role])))))` | `—` |
| `public.photo_tags` | `photo_tags_moderator_write` | PERMISSIVE | `public` | `UPDATE` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.photo_tags` | `photo_tags_owner_read` | PERMISSIVE | `public` | `SELECT` | `(created_by_user_id = auth.uid())` | `—` |
| `public.photo_tags` | `photo_tags_public_read` | PERMISSIVE | `public` | `SELECT` | `((status = 'approved'::tag_status) AND (EXISTS ( SELECT 1<br>   FROM photos<br>  WHERE ((photos.id = photo_tags.photo_id) AND (photos.status = 'approved'::photo_status)))))` | `—` |
| `public.photos` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.photos` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.photos` | `photos_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.photos` | `photos_moderator_read` | PERMISSIVE | `authenticated` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['moderator'::admin_role, 'admin'::admin_role, 'superadmin'::admin_role])))))` | `—` |
| `public.photos` | `photos_moderator_write` | PERMISSIVE | `public` | `UPDATE` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.photos` | `photos_owner_read` | PERMISSIVE | `public` | `SELECT` | `(uploaded_by_user_id = auth.uid())` | `—` |
| `public.photos` | `photos_public_read` | PERMISSIVE | `public` | `SELECT` | `(status = 'approved'::photo_status)` | `—` |
| `public.poll_options` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.poll_options` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.poll_options` | `poll_options_admin_all` | PERMISSIVE | `public` | `ALL` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.poll_options` | `poll_options_public_read` | PERMISSIVE | `public` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM polls<br>  WHERE ((polls.id = poll_options.poll_id) AND (polls.status = ANY (ARRAY['open'::text, 'closed'::text])))))` | `—` |
| `public.poll_votes` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.poll_votes` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.poll_votes` | `poll_votes_admin_read` | PERMISSIVE | `public` | `SELECT` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `—` |
| `public.poll_votes` | `poll_votes_auth_insert` | PERMISSIVE | `public` | `INSERT` | `—` | `((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))` |
| `public.poll_votes` | `poll_votes_owner_read` | PERMISSIVE | `public` | `SELECT` | `(user_id = auth.uid())` | `—` |
| `public.polls` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.polls` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.polls` | `polls_admin_all` | PERMISSIVE | `public` | `ALL` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.polls` | `polls_public_read` | PERMISSIVE | `public` | `SELECT` | `(status = ANY (ARRAY['open'::text, 'closed'::text]))` | `—` |
| `public.profile_claim_answers` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.profile_claim_answers` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.profile_claim_answers` | `claim_answers_admin_all` | PERMISSIVE | `public` | `ALL` | `is_admin()` | `—` |
| `public.profile_claim_answers` | `claim_answers_auth_insert` | PERMISSIVE | `public` | `INSERT` | `—` | `(EXISTS ( SELECT 1<br>   FROM profile_claims<br>  WHERE ((profile_claims.id = profile_claim_answers.claim_id) AND (profile_claims.requester_user_id = auth.uid()))))` |
| `public.profile_claim_answers` | `claim_answers_owner_read` | PERMISSIVE | `public` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM profile_claims<br>  WHERE ((profile_claims.id = profile_claim_answers.claim_id) AND (profile_claims.requester_user_id = auth.uid()))))` | `—` |
| `public.profile_claim_disputes` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.profile_claim_disputes` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.profile_claim_disputes` | `disputes_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.profile_claim_disputes` | `disputes_auth_insert` | PERMISSIVE | `public` | `INSERT` | `—` | `((auth.uid() IS NOT NULL) AND (requester_user_id = auth.uid()))` |
| `public.profile_claim_disputes` | `disputes_moderator_write` | PERMISSIVE | `public` | `UPDATE` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.profile_claim_disputes` | `disputes_owner_read` | PERMISSIVE | `public` | `SELECT` | `(requester_user_id = auth.uid())` | `—` |
| `public.profile_claims` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.profile_claims` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.profile_claims` | `claims_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.profile_claims` | `claims_auth_insert` | PERMISSIVE | `public` | `INSERT` | `—` | `((auth.uid() IS NOT NULL) AND (requester_user_id = auth.uid()))` |
| `public.profile_claims` | `claims_moderator_write` | PERMISSIVE | `public` | `UPDATE` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('moderator'::admin_role) OR has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.profile_claims` | `claims_owner_read` | PERMISSIVE | `public` | `SELECT` | `(requester_user_id = auth.uid())` | `—` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_admin_manage` | PERMISSIVE | `authenticated` | `ALL` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_insert_own` | PERMISSIVE | `authenticated` | `INSERT` | `—` | `(EXISTS ( SELECT 1<br>   FROM profiles p<br>  WHERE ((p.id = profile_school_questionnaire_answers.profile_id) AND (p.user_id = auth.uid()) AND (p.person_id = profile_school_questionnaire_answers.person_id))))` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_select_own` | PERMISSIVE | `authenticated` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM profiles p<br>  WHERE ((p.id = profile_school_questionnaire_answers.profile_id) AND (p.user_id = auth.uid()))))` | `—` |
| `public.profile_school_questionnaire_answers` | `profile_school_questionnaire_answers_update_own` | PERMISSIVE | `authenticated` | `UPDATE` | `(EXISTS ( SELECT 1<br>   FROM profiles p<br>  WHERE ((p.id = profile_school_questionnaire_answers.profile_id) AND (p.user_id = auth.uid()))))` | `(EXISTS ( SELECT 1<br>   FROM profiles p<br>  WHERE ((p.id = profile_school_questionnaire_answers.profile_id) AND (p.user_id = auth.uid()) AND (p.person_id = profile_school_questionnaire_answers.person_id))))` |
| `public.profiles` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.profiles` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.profiles` | `profiles_admin_all` | PERMISSIVE | `public` | `ALL` | `is_admin()` | `—` |
| `public.profiles` | `profiles_owner_insert` | PERMISSIVE | `public` | `INSERT` | `—` | `(user_id = auth.uid())` |
| `public.profiles` | `profiles_owner_select` | PERMISSIVE | `public` | `SELECT` | `(user_id = auth.uid())` | `—` |
| `public.profiles` | `profiles_owner_update` | PERMISSIVE | `public` | `UPDATE` | `(user_id = auth.uid())` | `—` |
| `public.profiles` | `profiles_public_read` | PERMISSIVE | `public` | `SELECT` | `(EXISTS ( SELECT 1<br>   FROM people p<br>  WHERE ((p.id = profiles.person_id) AND (p.is_visible = true) AND (profiles.show_confirmed_status = true))))` | `—` |
| `public.public_page_content` | `public_page_content_manage_admins` | PERMISSIVE | `authenticated` | `ALL` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` | `(EXISTS ( SELECT 1<br>   FROM admin_users au<br>  WHERE ((au.user_id = auth.uid()) AND (au.role = ANY (ARRAY['superadmin'::admin_role, 'admin'::admin_role])))))` |
| `public.public_page_content` | `public_page_content_select_public` | PERMISSIVE | `public` | `SELECT` | `true` | `—` |
| `public.refund_requests` | `refund_requests_owner_insert` | PERMISSIVE | `authenticated` | `INSERT` | `—` | `((requested_by_user_id = auth.uid()) AND (status = 'requested'::text) AND (EXISTS ( SELECT 1<br>   FROM orders o<br>  WHERE ((o.id = refund_requests.order_id) AND (o.buyer_user_id = auth.uid())))))` |
| `public.refund_requests` | `refund_requests_owner_read` | PERMISSIVE | `authenticated` | `SELECT` | `((requested_by_user_id = auth.uid()) OR (EXISTS ( SELECT 1<br>   FROM orders o<br>  WHERE ((o.id = refund_requests.order_id) AND (o.buyer_user_id = auth.uid())))))` | `—` |
| `public.ticket_lot_prices` | `ticket_lot_prices_public_read` | PERMISSIVE | `anon,authenticated` | `SELECT` | `(is_active = true)` | `—` |
| `public.ticket_lots` | `ticket_lots_public_read` | PERMISSIVE | `anon,authenticated` | `SELECT` | `(status <> 'archived'::text)` | `—` |
| `public.ticket_transfers` | `ticket_transfers_parties_read` | PERMISSIVE | `authenticated` | `SELECT` | `((from_user_id = auth.uid()) OR (to_user_id = auth.uid()) OR (lower(to_email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))))` | `—` |
| `public.ticket_types` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.ticket_types` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.ticket_types` | `ticket_types_admin_read` | PERMISSIVE | `public` | `SELECT` | `is_admin()` | `—` |
| `public.ticket_types` | `ticket_types_admin_write` | PERMISSIVE | `public` | `ALL` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` | `(has_admin_role('admin'::admin_role) OR has_admin_role('superadmin'::admin_role))` |
| `public.ticket_types` | `ticket_types_public_read` | PERMISSIVE | `public` | `SELECT` | `(status = ANY (ARRAY['open'::ticket_status, 'sold_out'::ticket_status]))` | `—` |
| `public.tickets` | `admin_panel_select` | PERMISSIVE | `authenticated` | `SELECT` | `is_admin_panel_user()` | `—` |
| `public.tickets` | `admin_panel_write` | PERMISSIVE | `authenticated` | `ALL` | `is_admin_panel_user()` | `is_admin_panel_user()` |
| `public.tickets` | `tickets_admin_all` | PERMISSIVE | `public` | `ALL` | `is_admin()` | `—` |
| `public.tickets` | `tickets_checkin_read` | PERMISSIVE | `public` | `SELECT` | `has_admin_role('checkin_staff'::admin_role)` | `—` |
| `public.tickets` | `tickets_checkin_update` | PERMISSIVE | `public` | `UPDATE` | `has_admin_role('checkin_staff'::admin_role)` | `has_admin_role('checkin_staff'::admin_role)` |
| `public.tickets` | `tickets_owner_read` | PERMISSIVE | `public` | `SELECT` | `((attendee_email = (( SELECT users.email<br>   FROM auth.users<br>  WHERE (users.id = auth.uid())))::text) OR (person_id IN ( SELECT people.id<br>   FROM people<br>  WHERE (people.claimed_by_user_id = auth.uid()))))` | `—` |

## Grants de tabelas

| Objeto | Grantee | Privilégio | Grantable |
|---|---|---|---|
| `public.admin_users` | `anon` | `REFERENCES` | NO |
| `public.admin_users` | `anon` | `TRIGGER` | NO |
| `public.admin_users` | `anon` | `TRUNCATE` | NO |
| `public.admin_users` | `authenticated` | `DELETE` | NO |
| `public.admin_users` | `authenticated` | `INSERT` | NO |
| `public.admin_users` | `authenticated` | `REFERENCES` | NO |
| `public.admin_users` | `authenticated` | `SELECT` | NO |
| `public.admin_users` | `authenticated` | `TRIGGER` | NO |
| `public.admin_users` | `authenticated` | `TRUNCATE` | NO |
| `public.admin_users` | `authenticated` | `UPDATE` | NO |
| `public.admin_users` | `postgres` | `DELETE` | YES |
| `public.admin_users` | `postgres` | `INSERT` | YES |
| `public.admin_users` | `postgres` | `REFERENCES` | YES |
| `public.admin_users` | `postgres` | `SELECT` | YES |
| `public.admin_users` | `postgres` | `TRIGGER` | YES |
| `public.admin_users` | `postgres` | `TRUNCATE` | YES |
| `public.admin_users` | `postgres` | `UPDATE` | YES |
| `public.admin_users` | `service_role` | `DELETE` | NO |
| `public.admin_users` | `service_role` | `INSERT` | NO |
| `public.admin_users` | `service_role` | `REFERENCES` | NO |
| `public.admin_users` | `service_role` | `SELECT` | NO |
| `public.admin_users` | `service_role` | `TRIGGER` | NO |
| `public.admin_users` | `service_role` | `TRUNCATE` | NO |
| `public.admin_users` | `service_role` | `UPDATE` | NO |
| `public.audit_logs` | `anon` | `REFERENCES` | NO |
| `public.audit_logs` | `anon` | `TRIGGER` | NO |
| `public.audit_logs` | `anon` | `TRUNCATE` | NO |
| `public.audit_logs` | `authenticated` | `INSERT` | NO |
| `public.audit_logs` | `authenticated` | `REFERENCES` | NO |
| `public.audit_logs` | `authenticated` | `SELECT` | NO |
| `public.audit_logs` | `authenticated` | `TRIGGER` | NO |
| `public.audit_logs` | `authenticated` | `TRUNCATE` | NO |
| `public.audit_logs` | `postgres` | `DELETE` | YES |
| `public.audit_logs` | `postgres` | `INSERT` | YES |
| `public.audit_logs` | `postgres` | `REFERENCES` | YES |
| `public.audit_logs` | `postgres` | `SELECT` | YES |
| `public.audit_logs` | `postgres` | `TRIGGER` | YES |
| `public.audit_logs` | `postgres` | `TRUNCATE` | YES |
| `public.audit_logs` | `postgres` | `UPDATE` | YES |
| `public.audit_logs` | `service_role` | `REFERENCES` | NO |
| `public.audit_logs` | `service_role` | `TRIGGER` | NO |
| `public.audit_logs` | `service_role` | `TRUNCATE` | NO |
| `public.checkin_events` | `postgres` | `DELETE` | YES |
| `public.checkin_events` | `postgres` | `INSERT` | YES |
| `public.checkin_events` | `postgres` | `REFERENCES` | YES |
| `public.checkin_events` | `postgres` | `SELECT` | YES |
| `public.checkin_events` | `postgres` | `TRIGGER` | YES |
| `public.checkin_events` | `postgres` | `TRUNCATE` | YES |
| `public.checkin_events` | `postgres` | `UPDATE` | YES |
| `public.checkin_events` | `service_role` | `REFERENCES` | NO |
| `public.checkin_events` | `service_role` | `TRIGGER` | NO |
| `public.checkin_events` | `service_role` | `TRUNCATE` | NO |
| `public.cms_assets` | `anon` | `REFERENCES` | NO |
| `public.cms_assets` | `anon` | `TRIGGER` | NO |
| `public.cms_assets` | `anon` | `TRUNCATE` | NO |
| `public.cms_assets` | `authenticated` | `REFERENCES` | NO |
| `public.cms_assets` | `authenticated` | `TRIGGER` | NO |
| `public.cms_assets` | `authenticated` | `TRUNCATE` | NO |
| `public.cms_assets` | `postgres` | `DELETE` | YES |
| `public.cms_assets` | `postgres` | `INSERT` | YES |
| `public.cms_assets` | `postgres` | `REFERENCES` | YES |
| `public.cms_assets` | `postgres` | `SELECT` | YES |
| `public.cms_assets` | `postgres` | `TRIGGER` | YES |
| `public.cms_assets` | `postgres` | `TRUNCATE` | YES |
| `public.cms_assets` | `postgres` | `UPDATE` | YES |
| `public.cms_assets` | `service_role` | `REFERENCES` | NO |
| `public.cms_assets` | `service_role` | `TRIGGER` | NO |
| `public.cms_assets` | `service_role` | `TRUNCATE` | NO |
| `public.content_moderation_events` | `authenticated` | `SELECT` | NO |
| `public.content_moderation_events` | `postgres` | `DELETE` | YES |
| `public.content_moderation_events` | `postgres` | `INSERT` | YES |
| `public.content_moderation_events` | `postgres` | `REFERENCES` | YES |
| `public.content_moderation_events` | `postgres` | `SELECT` | YES |
| `public.content_moderation_events` | `postgres` | `TRIGGER` | YES |
| `public.content_moderation_events` | `postgres` | `TRUNCATE` | YES |
| `public.content_moderation_events` | `postgres` | `UPDATE` | YES |
| `public.content_moderation_events` | `service_role` | `REFERENCES` | NO |
| `public.content_moderation_events` | `service_role` | `SELECT` | NO |
| `public.content_moderation_events` | `service_role` | `TRIGGER` | NO |
| `public.content_moderation_events` | `service_role` | `TRUNCATE` | NO |
| `public.content_moderation_settings` | `anon` | `REFERENCES` | NO |
| `public.content_moderation_settings` | `anon` | `TRIGGER` | NO |
| `public.content_moderation_settings` | `anon` | `TRUNCATE` | NO |
| `public.content_moderation_settings` | `authenticated` | `INSERT` | NO |
| `public.content_moderation_settings` | `authenticated` | `REFERENCES` | NO |
| `public.content_moderation_settings` | `authenticated` | `SELECT` | NO |
| `public.content_moderation_settings` | `authenticated` | `TRIGGER` | NO |
| `public.content_moderation_settings` | `authenticated` | `TRUNCATE` | NO |
| `public.content_moderation_settings` | `authenticated` | `UPDATE` | NO |
| `public.content_moderation_settings` | `postgres` | `DELETE` | YES |
| `public.content_moderation_settings` | `postgres` | `INSERT` | YES |
| `public.content_moderation_settings` | `postgres` | `REFERENCES` | YES |
| `public.content_moderation_settings` | `postgres` | `SELECT` | YES |
| `public.content_moderation_settings` | `postgres` | `TRIGGER` | YES |
| `public.content_moderation_settings` | `postgres` | `TRUNCATE` | YES |
| `public.content_moderation_settings` | `postgres` | `UPDATE` | YES |
| `public.content_moderation_settings` | `service_role` | `REFERENCES` | NO |
| `public.content_moderation_settings` | `service_role` | `TRIGGER` | NO |
| `public.content_moderation_settings` | `service_role` | `TRUNCATE` | NO |
| `public.event_archive_settings` | `anon` | `REFERENCES` | NO |
| `public.event_archive_settings` | `anon` | `TRIGGER` | NO |
| `public.event_archive_settings` | `anon` | `TRUNCATE` | NO |
| `public.event_archive_settings` | `authenticated` | `DELETE` | NO |
| `public.event_archive_settings` | `authenticated` | `INSERT` | NO |
| `public.event_archive_settings` | `authenticated` | `REFERENCES` | NO |
| `public.event_archive_settings` | `authenticated` | `SELECT` | NO |
| `public.event_archive_settings` | `authenticated` | `TRIGGER` | NO |
| `public.event_archive_settings` | `authenticated` | `TRUNCATE` | NO |
| `public.event_archive_settings` | `authenticated` | `UPDATE` | NO |
| `public.event_archive_settings` | `postgres` | `DELETE` | YES |
| `public.event_archive_settings` | `postgres` | `INSERT` | YES |
| `public.event_archive_settings` | `postgres` | `REFERENCES` | YES |
| `public.event_archive_settings` | `postgres` | `SELECT` | YES |
| `public.event_archive_settings` | `postgres` | `TRIGGER` | YES |
| `public.event_archive_settings` | `postgres` | `TRUNCATE` | YES |
| `public.event_archive_settings` | `postgres` | `UPDATE` | YES |
| `public.event_archive_settings` | `service_role` | `REFERENCES` | NO |
| `public.event_archive_settings` | `service_role` | `TRIGGER` | NO |
| `public.event_archive_settings` | `service_role` | `TRUNCATE` | NO |
| `public.event_page_content` | `anon` | `REFERENCES` | NO |
| `public.event_page_content` | `anon` | `SELECT` | NO |
| `public.event_page_content` | `anon` | `TRIGGER` | NO |
| `public.event_page_content` | `anon` | `TRUNCATE` | NO |
| `public.event_page_content` | `authenticated` | `DELETE` | NO |
| `public.event_page_content` | `authenticated` | `INSERT` | NO |
| `public.event_page_content` | `authenticated` | `REFERENCES` | NO |
| `public.event_page_content` | `authenticated` | `SELECT` | NO |
| `public.event_page_content` | `authenticated` | `TRIGGER` | NO |
| `public.event_page_content` | `authenticated` | `TRUNCATE` | NO |
| `public.event_page_content` | `authenticated` | `UPDATE` | NO |
| `public.event_page_content` | `postgres` | `DELETE` | YES |
| `public.event_page_content` | `postgres` | `INSERT` | YES |
| `public.event_page_content` | `postgres` | `REFERENCES` | YES |
| `public.event_page_content` | `postgres` | `SELECT` | YES |
| `public.event_page_content` | `postgres` | `TRIGGER` | YES |
| `public.event_page_content` | `postgres` | `TRUNCATE` | YES |
| `public.event_page_content` | `postgres` | `UPDATE` | YES |
| `public.event_page_content` | `service_role` | `REFERENCES` | NO |
| `public.event_page_content` | `service_role` | `TRIGGER` | NO |
| `public.event_page_content` | `service_role` | `TRUNCATE` | NO |
| `public.events` | `anon` | `REFERENCES` | NO |
| `public.events` | `anon` | `TRIGGER` | NO |
| `public.events` | `anon` | `TRUNCATE` | NO |
| `public.events` | `authenticated` | `DELETE` | NO |
| `public.events` | `authenticated` | `INSERT` | NO |
| `public.events` | `authenticated` | `REFERENCES` | NO |
| `public.events` | `authenticated` | `SELECT` | NO |
| `public.events` | `authenticated` | `TRIGGER` | NO |
| `public.events` | `authenticated` | `TRUNCATE` | NO |
| `public.events` | `authenticated` | `UPDATE` | NO |
| `public.events` | `postgres` | `DELETE` | YES |
| `public.events` | `postgres` | `INSERT` | YES |
| `public.events` | `postgres` | `REFERENCES` | YES |
| `public.events` | `postgres` | `SELECT` | YES |
| `public.events` | `postgres` | `TRIGGER` | YES |
| `public.events` | `postgres` | `TRUNCATE` | YES |
| `public.events` | `postgres` | `UPDATE` | YES |
| `public.events` | `service_role` | `REFERENCES` | NO |
| `public.events` | `service_role` | `TRIGGER` | NO |
| `public.events` | `service_role` | `TRUNCATE` | NO |
| `public.faq_categories` | `anon` | `REFERENCES` | NO |
| `public.faq_categories` | `anon` | `SELECT` | NO |
| `public.faq_categories` | `anon` | `TRIGGER` | NO |
| `public.faq_categories` | `anon` | `TRUNCATE` | NO |
| `public.faq_categories` | `authenticated` | `DELETE` | NO |
| `public.faq_categories` | `authenticated` | `INSERT` | NO |
| `public.faq_categories` | `authenticated` | `REFERENCES` | NO |
| `public.faq_categories` | `authenticated` | `SELECT` | NO |
| `public.faq_categories` | `authenticated` | `TRIGGER` | NO |
| `public.faq_categories` | `authenticated` | `TRUNCATE` | NO |
| `public.faq_categories` | `authenticated` | `UPDATE` | NO |
| `public.faq_categories` | `postgres` | `DELETE` | YES |
| `public.faq_categories` | `postgres` | `INSERT` | YES |
| `public.faq_categories` | `postgres` | `REFERENCES` | YES |
| `public.faq_categories` | `postgres` | `SELECT` | YES |
| `public.faq_categories` | `postgres` | `TRIGGER` | YES |
| `public.faq_categories` | `postgres` | `TRUNCATE` | YES |
| `public.faq_categories` | `postgres` | `UPDATE` | YES |
| `public.faq_categories` | `service_role` | `REFERENCES` | NO |
| `public.faq_categories` | `service_role` | `TRIGGER` | NO |
| `public.faq_categories` | `service_role` | `TRUNCATE` | NO |
| `public.faq_items` | `anon` | `REFERENCES` | NO |
| `public.faq_items` | `anon` | `SELECT` | NO |
| `public.faq_items` | `anon` | `TRIGGER` | NO |
| `public.faq_items` | `anon` | `TRUNCATE` | NO |
| `public.faq_items` | `authenticated` | `DELETE` | NO |
| `public.faq_items` | `authenticated` | `INSERT` | NO |
| `public.faq_items` | `authenticated` | `REFERENCES` | NO |
| `public.faq_items` | `authenticated` | `SELECT` | NO |
| `public.faq_items` | `authenticated` | `TRIGGER` | NO |
| `public.faq_items` | `authenticated` | `TRUNCATE` | NO |
| `public.faq_items` | `authenticated` | `UPDATE` | NO |
| `public.faq_items` | `postgres` | `DELETE` | YES |
| `public.faq_items` | `postgres` | `INSERT` | YES |
| `public.faq_items` | `postgres` | `REFERENCES` | YES |
| `public.faq_items` | `postgres` | `SELECT` | YES |
| `public.faq_items` | `postgres` | `TRIGGER` | YES |
| `public.faq_items` | `postgres` | `TRUNCATE` | YES |
| `public.faq_items` | `postgres` | `UPDATE` | YES |
| `public.faq_items` | `service_role` | `REFERENCES` | NO |
| `public.faq_items` | `service_role` | `TRIGGER` | NO |
| `public.faq_items` | `service_role` | `TRUNCATE` | NO |
| `public.faq_items_backup_20260716` | `anon` | `REFERENCES` | NO |
| `public.faq_items_backup_20260716` | `anon` | `TRIGGER` | NO |
| `public.faq_items_backup_20260716` | `anon` | `TRUNCATE` | NO |
| `public.faq_items_backup_20260716` | `authenticated` | `REFERENCES` | NO |
| `public.faq_items_backup_20260716` | `authenticated` | `TRIGGER` | NO |
| `public.faq_items_backup_20260716` | `authenticated` | `TRUNCATE` | NO |
| `public.faq_items_backup_20260716` | `postgres` | `DELETE` | YES |
| `public.faq_items_backup_20260716` | `postgres` | `INSERT` | YES |
| `public.faq_items_backup_20260716` | `postgres` | `REFERENCES` | YES |
| `public.faq_items_backup_20260716` | `postgres` | `SELECT` | YES |
| `public.faq_items_backup_20260716` | `postgres` | `TRIGGER` | YES |
| `public.faq_items_backup_20260716` | `postgres` | `TRUNCATE` | YES |
| `public.faq_items_backup_20260716` | `postgres` | `UPDATE` | YES |
| `public.faq_items_backup_20260716` | `service_role` | `REFERENCES` | NO |
| `public.faq_items_backup_20260716` | `service_role` | `TRIGGER` | NO |
| `public.faq_items_backup_20260716` | `service_role` | `TRUNCATE` | NO |
| `public.guest_approval_requests` | `anon` | `REFERENCES` | NO |
| `public.guest_approval_requests` | `anon` | `TRIGGER` | NO |
| `public.guest_approval_requests` | `anon` | `TRUNCATE` | NO |
| `public.guest_approval_requests` | `authenticated` | `INSERT` | NO |
| `public.guest_approval_requests` | `authenticated` | `REFERENCES` | NO |
| `public.guest_approval_requests` | `authenticated` | `SELECT` | NO |
| `public.guest_approval_requests` | `authenticated` | `TRIGGER` | NO |
| `public.guest_approval_requests` | `authenticated` | `TRUNCATE` | NO |
| `public.guest_approval_requests` | `postgres` | `DELETE` | YES |
| `public.guest_approval_requests` | `postgres` | `INSERT` | YES |
| `public.guest_approval_requests` | `postgres` | `REFERENCES` | YES |
| `public.guest_approval_requests` | `postgres` | `SELECT` | YES |
| `public.guest_approval_requests` | `postgres` | `TRIGGER` | YES |
| `public.guest_approval_requests` | `postgres` | `TRUNCATE` | YES |
| `public.guest_approval_requests` | `postgres` | `UPDATE` | YES |
| `public.guest_approval_requests` | `service_role` | `REFERENCES` | NO |
| `public.guest_approval_requests` | `service_role` | `TRIGGER` | NO |
| `public.guest_approval_requests` | `service_role` | `TRUNCATE` | NO |
| `public.home_page_content` | `anon` | `REFERENCES` | NO |
| `public.home_page_content` | `anon` | `SELECT` | NO |
| `public.home_page_content` | `anon` | `TRIGGER` | NO |
| `public.home_page_content` | `anon` | `TRUNCATE` | NO |
| `public.home_page_content` | `authenticated` | `DELETE` | NO |
| `public.home_page_content` | `authenticated` | `INSERT` | NO |
| `public.home_page_content` | `authenticated` | `REFERENCES` | NO |
| `public.home_page_content` | `authenticated` | `SELECT` | NO |
| `public.home_page_content` | `authenticated` | `TRIGGER` | NO |
| `public.home_page_content` | `authenticated` | `TRUNCATE` | NO |
| `public.home_page_content` | `authenticated` | `UPDATE` | NO |
| `public.home_page_content` | `postgres` | `DELETE` | YES |
| `public.home_page_content` | `postgres` | `INSERT` | YES |
| `public.home_page_content` | `postgres` | `REFERENCES` | YES |
| `public.home_page_content` | `postgres` | `SELECT` | YES |
| `public.home_page_content` | `postgres` | `TRIGGER` | YES |
| `public.home_page_content` | `postgres` | `TRUNCATE` | YES |
| `public.home_page_content` | `postgres` | `UPDATE` | YES |
| `public.home_page_content` | `service_role` | `REFERENCES` | NO |
| `public.home_page_content` | `service_role` | `TRIGGER` | NO |
| `public.home_page_content` | `service_role` | `TRUNCATE` | NO |
| `public.memories` | `anon` | `REFERENCES` | NO |
| `public.memories` | `anon` | `TRIGGER` | NO |
| `public.memories` | `anon` | `TRUNCATE` | NO |
| `public.memories` | `authenticated` | `DELETE` | NO |
| `public.memories` | `authenticated` | `INSERT` | NO |
| `public.memories` | `authenticated` | `REFERENCES` | NO |
| `public.memories` | `authenticated` | `SELECT` | NO |
| `public.memories` | `authenticated` | `TRIGGER` | NO |
| `public.memories` | `authenticated` | `TRUNCATE` | NO |
| `public.memories` | `authenticated` | `UPDATE` | NO |
| `public.memories` | `postgres` | `DELETE` | YES |
| `public.memories` | `postgres` | `INSERT` | YES |
| `public.memories` | `postgres` | `REFERENCES` | YES |
| `public.memories` | `postgres` | `SELECT` | YES |
| `public.memories` | `postgres` | `TRIGGER` | YES |
| `public.memories` | `postgres` | `TRUNCATE` | YES |
| `public.memories` | `postgres` | `UPDATE` | YES |
| `public.memories` | `service_role` | `REFERENCES` | NO |
| `public.memories` | `service_role` | `SELECT` | NO |
| `public.memories` | `service_role` | `TRIGGER` | NO |
| `public.memories` | `service_role` | `TRUNCATE` | NO |
| `public.notification_jobs` | `postgres` | `DELETE` | YES |
| `public.notification_jobs` | `postgres` | `INSERT` | YES |
| `public.notification_jobs` | `postgres` | `REFERENCES` | YES |
| `public.notification_jobs` | `postgres` | `SELECT` | YES |
| `public.notification_jobs` | `postgres` | `TRIGGER` | YES |
| `public.notification_jobs` | `postgres` | `TRUNCATE` | YES |
| `public.notification_jobs` | `postgres` | `UPDATE` | YES |
| `public.notification_jobs` | `service_role` | `REFERENCES` | NO |
| `public.notification_jobs` | `service_role` | `TRIGGER` | NO |
| `public.notification_jobs` | `service_role` | `TRUNCATE` | NO |
| `public.order_participants` | `anon` | `REFERENCES` | NO |
| `public.order_participants` | `anon` | `TRIGGER` | NO |
| `public.order_participants` | `anon` | `TRUNCATE` | NO |
| `public.order_participants` | `authenticated` | `REFERENCES` | NO |
| `public.order_participants` | `authenticated` | `SELECT` | NO |
| `public.order_participants` | `authenticated` | `TRIGGER` | NO |
| `public.order_participants` | `authenticated` | `TRUNCATE` | NO |
| `public.order_participants` | `postgres` | `DELETE` | YES |
| `public.order_participants` | `postgres` | `INSERT` | YES |
| `public.order_participants` | `postgres` | `REFERENCES` | YES |
| `public.order_participants` | `postgres` | `SELECT` | YES |
| `public.order_participants` | `postgres` | `TRIGGER` | YES |
| `public.order_participants` | `postgres` | `TRUNCATE` | YES |
| `public.order_participants` | `postgres` | `UPDATE` | YES |
| `public.order_participants` | `service_role` | `REFERENCES` | NO |
| `public.order_participants` | `service_role` | `TRIGGER` | NO |
| `public.order_participants` | `service_role` | `TRUNCATE` | NO |
| `public.orders` | `anon` | `REFERENCES` | NO |
| `public.orders` | `anon` | `TRIGGER` | NO |
| `public.orders` | `anon` | `TRUNCATE` | NO |
| `public.orders` | `authenticated` | `DELETE` | NO |
| `public.orders` | `authenticated` | `INSERT` | NO |
| `public.orders` | `authenticated` | `REFERENCES` | NO |
| `public.orders` | `authenticated` | `SELECT` | NO |
| `public.orders` | `authenticated` | `TRIGGER` | NO |
| `public.orders` | `authenticated` | `TRUNCATE` | NO |
| `public.orders` | `authenticated` | `UPDATE` | NO |
| `public.orders` | `postgres` | `DELETE` | YES |
| `public.orders` | `postgres` | `INSERT` | YES |
| `public.orders` | `postgres` | `REFERENCES` | YES |
| `public.orders` | `postgres` | `SELECT` | YES |
| `public.orders` | `postgres` | `TRIGGER` | YES |
| `public.orders` | `postgres` | `TRUNCATE` | YES |
| `public.orders` | `postgres` | `UPDATE` | YES |
| `public.orders` | `service_role` | `REFERENCES` | NO |
| `public.orders` | `service_role` | `TRIGGER` | NO |
| `public.orders` | `service_role` | `TRUNCATE` | NO |
| `public.participant_extras` | `anon` | `REFERENCES` | NO |
| `public.participant_extras` | `anon` | `TRIGGER` | NO |
| `public.participant_extras` | `anon` | `TRUNCATE` | NO |
| `public.participant_extras` | `authenticated` | `REFERENCES` | NO |
| `public.participant_extras` | `authenticated` | `SELECT` | NO |
| `public.participant_extras` | `authenticated` | `TRIGGER` | NO |
| `public.participant_extras` | `authenticated` | `TRUNCATE` | NO |
| `public.participant_extras` | `postgres` | `DELETE` | YES |
| `public.participant_extras` | `postgres` | `INSERT` | YES |
| `public.participant_extras` | `postgres` | `REFERENCES` | YES |
| `public.participant_extras` | `postgres` | `SELECT` | YES |
| `public.participant_extras` | `postgres` | `TRIGGER` | YES |
| `public.participant_extras` | `postgres` | `TRUNCATE` | YES |
| `public.participant_extras` | `postgres` | `UPDATE` | YES |
| `public.participant_extras` | `service_role` | `REFERENCES` | NO |
| `public.participant_extras` | `service_role` | `TRIGGER` | NO |
| `public.participant_extras` | `service_role` | `TRUNCATE` | NO |
| `public.payment_events` | `anon` | `REFERENCES` | NO |
| `public.payment_events` | `anon` | `TRIGGER` | NO |
| `public.payment_events` | `anon` | `TRUNCATE` | NO |
| `public.payment_events` | `authenticated` | `REFERENCES` | NO |
| `public.payment_events` | `authenticated` | `SELECT` | NO |
| `public.payment_events` | `authenticated` | `TRIGGER` | NO |
| `public.payment_events` | `authenticated` | `TRUNCATE` | NO |
| `public.payment_events` | `postgres` | `DELETE` | YES |
| `public.payment_events` | `postgres` | `INSERT` | YES |
| `public.payment_events` | `postgres` | `REFERENCES` | YES |
| `public.payment_events` | `postgres` | `SELECT` | YES |
| `public.payment_events` | `postgres` | `TRIGGER` | YES |
| `public.payment_events` | `postgres` | `TRUNCATE` | YES |
| `public.payment_events` | `postgres` | `UPDATE` | YES |
| `public.payment_events` | `service_role` | `REFERENCES` | NO |
| `public.payment_events` | `service_role` | `TRIGGER` | NO |
| `public.payment_events` | `service_role` | `TRUNCATE` | NO |
| `public.payment_preferences` | `anon` | `REFERENCES` | NO |
| `public.payment_preferences` | `anon` | `TRIGGER` | NO |
| `public.payment_preferences` | `anon` | `TRUNCATE` | NO |
| `public.payment_preferences` | `authenticated` | `REFERENCES` | NO |
| `public.payment_preferences` | `authenticated` | `SELECT` | NO |
| `public.payment_preferences` | `authenticated` | `TRIGGER` | NO |
| `public.payment_preferences` | `authenticated` | `TRUNCATE` | NO |
| `public.payment_preferences` | `postgres` | `DELETE` | YES |
| `public.payment_preferences` | `postgres` | `INSERT` | YES |
| `public.payment_preferences` | `postgres` | `REFERENCES` | YES |
| `public.payment_preferences` | `postgres` | `SELECT` | YES |
| `public.payment_preferences` | `postgres` | `TRIGGER` | YES |
| `public.payment_preferences` | `postgres` | `TRUNCATE` | YES |
| `public.payment_preferences` | `postgres` | `UPDATE` | YES |
| `public.payment_preferences` | `service_role` | `REFERENCES` | NO |
| `public.payment_preferences` | `service_role` | `TRIGGER` | NO |
| `public.payment_preferences` | `service_role` | `TRUNCATE` | NO |
| `public.people` | `anon` | `REFERENCES` | NO |
| `public.people` | `anon` | `TRIGGER` | NO |
| `public.people` | `anon` | `TRUNCATE` | NO |
| `public.people` | `authenticated` | `DELETE` | NO |
| `public.people` | `authenticated` | `INSERT` | NO |
| `public.people` | `authenticated` | `REFERENCES` | NO |
| `public.people` | `authenticated` | `SELECT` | NO |
| `public.people` | `authenticated` | `TRIGGER` | NO |
| `public.people` | `authenticated` | `TRUNCATE` | NO |
| `public.people` | `authenticated` | `UPDATE` | NO |
| `public.people` | `postgres` | `DELETE` | YES |
| `public.people` | `postgres` | `INSERT` | YES |
| `public.people` | `postgres` | `REFERENCES` | YES |
| `public.people` | `postgres` | `SELECT` | YES |
| `public.people` | `postgres` | `TRIGGER` | YES |
| `public.people` | `postgres` | `TRUNCATE` | YES |
| `public.people` | `postgres` | `UPDATE` | YES |
| `public.people` | `service_role` | `REFERENCES` | NO |
| `public.people` | `service_role` | `SELECT` | NO |
| `public.people` | `service_role` | `TRIGGER` | NO |
| `public.people` | `service_role` | `TRUNCATE` | NO |
| `public.photo_comments` | `anon` | `REFERENCES` | NO |
| `public.photo_comments` | `anon` | `TRIGGER` | NO |
| `public.photo_comments` | `anon` | `TRUNCATE` | NO |
| `public.photo_comments` | `authenticated` | `DELETE` | NO |
| `public.photo_comments` | `authenticated` | `INSERT` | NO |
| `public.photo_comments` | `authenticated` | `REFERENCES` | NO |
| `public.photo_comments` | `authenticated` | `SELECT` | NO |
| `public.photo_comments` | `authenticated` | `TRIGGER` | NO |
| `public.photo_comments` | `authenticated` | `TRUNCATE` | NO |
| `public.photo_comments` | `authenticated` | `UPDATE` | NO |
| `public.photo_comments` | `postgres` | `DELETE` | YES |
| `public.photo_comments` | `postgres` | `INSERT` | YES |
| `public.photo_comments` | `postgres` | `REFERENCES` | YES |
| `public.photo_comments` | `postgres` | `SELECT` | YES |
| `public.photo_comments` | `postgres` | `TRIGGER` | YES |
| `public.photo_comments` | `postgres` | `TRUNCATE` | YES |
| `public.photo_comments` | `postgres` | `UPDATE` | YES |
| `public.photo_comments` | `service_role` | `REFERENCES` | NO |
| `public.photo_comments` | `service_role` | `SELECT` | NO |
| `public.photo_comments` | `service_role` | `TRIGGER` | NO |
| `public.photo_comments` | `service_role` | `TRUNCATE` | NO |
| `public.photo_likes` | `anon` | `REFERENCES` | NO |
| `public.photo_likes` | `anon` | `TRIGGER` | NO |
| `public.photo_likes` | `anon` | `TRUNCATE` | NO |
| `public.photo_likes` | `authenticated` | `REFERENCES` | NO |
| `public.photo_likes` | `authenticated` | `SELECT` | NO |
| `public.photo_likes` | `authenticated` | `TRIGGER` | NO |
| `public.photo_likes` | `authenticated` | `TRUNCATE` | NO |
| `public.photo_likes` | `postgres` | `DELETE` | YES |
| `public.photo_likes` | `postgres` | `INSERT` | YES |
| `public.photo_likes` | `postgres` | `REFERENCES` | YES |
| `public.photo_likes` | `postgres` | `SELECT` | YES |
| `public.photo_likes` | `postgres` | `TRIGGER` | YES |
| `public.photo_likes` | `postgres` | `TRUNCATE` | YES |
| `public.photo_likes` | `postgres` | `UPDATE` | YES |
| `public.photo_likes` | `service_role` | `REFERENCES` | NO |
| `public.photo_likes` | `service_role` | `TRIGGER` | NO |
| `public.photo_likes` | `service_role` | `TRUNCATE` | NO |
| `public.photo_removal_requests` | `anon` | `REFERENCES` | NO |
| `public.photo_removal_requests` | `anon` | `TRIGGER` | NO |
| `public.photo_removal_requests` | `anon` | `TRUNCATE` | NO |
| `public.photo_removal_requests` | `authenticated` | `DELETE` | NO |
| `public.photo_removal_requests` | `authenticated` | `INSERT` | NO |
| `public.photo_removal_requests` | `authenticated` | `REFERENCES` | NO |
| `public.photo_removal_requests` | `authenticated` | `SELECT` | NO |
| `public.photo_removal_requests` | `authenticated` | `TRIGGER` | NO |
| `public.photo_removal_requests` | `authenticated` | `TRUNCATE` | NO |
| `public.photo_removal_requests` | `authenticated` | `UPDATE` | NO |
| `public.photo_removal_requests` | `postgres` | `DELETE` | YES |
| `public.photo_removal_requests` | `postgres` | `INSERT` | YES |
| `public.photo_removal_requests` | `postgres` | `REFERENCES` | YES |
| `public.photo_removal_requests` | `postgres` | `SELECT` | YES |
| `public.photo_removal_requests` | `postgres` | `TRIGGER` | YES |
| `public.photo_removal_requests` | `postgres` | `TRUNCATE` | YES |
| `public.photo_removal_requests` | `postgres` | `UPDATE` | YES |
| `public.photo_removal_requests` | `service_role` | `REFERENCES` | NO |
| `public.photo_removal_requests` | `service_role` | `SELECT` | NO |
| `public.photo_removal_requests` | `service_role` | `TRIGGER` | NO |
| `public.photo_removal_requests` | `service_role` | `TRUNCATE` | NO |
| `public.photo_tags` | `anon` | `REFERENCES` | NO |
| `public.photo_tags` | `anon` | `TRIGGER` | NO |
| `public.photo_tags` | `anon` | `TRUNCATE` | NO |
| `public.photo_tags` | `authenticated` | `DELETE` | NO |
| `public.photo_tags` | `authenticated` | `INSERT` | NO |
| `public.photo_tags` | `authenticated` | `REFERENCES` | NO |
| `public.photo_tags` | `authenticated` | `SELECT` | NO |
| `public.photo_tags` | `authenticated` | `TRIGGER` | NO |
| `public.photo_tags` | `authenticated` | `TRUNCATE` | NO |
| `public.photo_tags` | `authenticated` | `UPDATE` | NO |
| `public.photo_tags` | `postgres` | `DELETE` | YES |
| `public.photo_tags` | `postgres` | `INSERT` | YES |
| `public.photo_tags` | `postgres` | `REFERENCES` | YES |
| `public.photo_tags` | `postgres` | `SELECT` | YES |
| `public.photo_tags` | `postgres` | `TRIGGER` | YES |
| `public.photo_tags` | `postgres` | `TRUNCATE` | YES |
| `public.photo_tags` | `postgres` | `UPDATE` | YES |
| `public.photo_tags` | `service_role` | `REFERENCES` | NO |
| `public.photo_tags` | `service_role` | `SELECT` | NO |
| `public.photo_tags` | `service_role` | `TRIGGER` | NO |
| `public.photo_tags` | `service_role` | `TRUNCATE` | NO |
| `public.photos` | `anon` | `REFERENCES` | NO |
| `public.photos` | `anon` | `TRIGGER` | NO |
| `public.photos` | `anon` | `TRUNCATE` | NO |
| `public.photos` | `authenticated` | `DELETE` | NO |
| `public.photos` | `authenticated` | `INSERT` | NO |
| `public.photos` | `authenticated` | `REFERENCES` | NO |
| `public.photos` | `authenticated` | `SELECT` | NO |
| `public.photos` | `authenticated` | `TRIGGER` | NO |
| `public.photos` | `authenticated` | `TRUNCATE` | NO |
| `public.photos` | `authenticated` | `UPDATE` | NO |
| `public.photos` | `postgres` | `DELETE` | YES |
| `public.photos` | `postgres` | `INSERT` | YES |
| `public.photos` | `postgres` | `REFERENCES` | YES |
| `public.photos` | `postgres` | `SELECT` | YES |
| `public.photos` | `postgres` | `TRIGGER` | YES |
| `public.photos` | `postgres` | `TRUNCATE` | YES |
| `public.photos` | `postgres` | `UPDATE` | YES |
| `public.photos` | `service_role` | `REFERENCES` | NO |
| `public.photos` | `service_role` | `SELECT` | NO |
| `public.photos` | `service_role` | `TRIGGER` | NO |
| `public.photos` | `service_role` | `TRUNCATE` | NO |
| `public.poll_options` | `anon` | `REFERENCES` | NO |
| `public.poll_options` | `anon` | `TRIGGER` | NO |
| `public.poll_options` | `anon` | `TRUNCATE` | NO |
| `public.poll_options` | `authenticated` | `DELETE` | NO |
| `public.poll_options` | `authenticated` | `INSERT` | NO |
| `public.poll_options` | `authenticated` | `REFERENCES` | NO |
| `public.poll_options` | `authenticated` | `SELECT` | NO |
| `public.poll_options` | `authenticated` | `TRIGGER` | NO |
| `public.poll_options` | `authenticated` | `TRUNCATE` | NO |
| `public.poll_options` | `authenticated` | `UPDATE` | NO |
| `public.poll_options` | `postgres` | `DELETE` | YES |
| `public.poll_options` | `postgres` | `INSERT` | YES |
| `public.poll_options` | `postgres` | `REFERENCES` | YES |
| `public.poll_options` | `postgres` | `SELECT` | YES |
| `public.poll_options` | `postgres` | `TRIGGER` | YES |
| `public.poll_options` | `postgres` | `TRUNCATE` | YES |
| `public.poll_options` | `postgres` | `UPDATE` | YES |
| `public.poll_options` | `service_role` | `REFERENCES` | NO |
| `public.poll_options` | `service_role` | `TRIGGER` | NO |
| `public.poll_options` | `service_role` | `TRUNCATE` | NO |
| `public.poll_results` | `anon` | `REFERENCES` | NO |
| `public.poll_results` | `anon` | `SELECT` | NO |
| `public.poll_results` | `anon` | `TRIGGER` | NO |
| `public.poll_results` | `anon` | `TRUNCATE` | NO |
| `public.poll_results` | `authenticated` | `REFERENCES` | NO |
| `public.poll_results` | `authenticated` | `SELECT` | NO |
| `public.poll_results` | `authenticated` | `TRIGGER` | NO |
| `public.poll_results` | `authenticated` | `TRUNCATE` | NO |
| `public.poll_results` | `postgres` | `DELETE` | YES |
| `public.poll_results` | `postgres` | `INSERT` | YES |
| `public.poll_results` | `postgres` | `REFERENCES` | YES |
| `public.poll_results` | `postgres` | `SELECT` | YES |
| `public.poll_results` | `postgres` | `TRIGGER` | YES |
| `public.poll_results` | `postgres` | `TRUNCATE` | YES |
| `public.poll_results` | `postgres` | `UPDATE` | YES |
| `public.poll_results` | `service_role` | `REFERENCES` | NO |
| `public.poll_results` | `service_role` | `TRIGGER` | NO |
| `public.poll_results` | `service_role` | `TRUNCATE` | NO |
| `public.poll_votes` | `anon` | `REFERENCES` | NO |
| `public.poll_votes` | `anon` | `TRIGGER` | NO |
| `public.poll_votes` | `anon` | `TRUNCATE` | NO |
| `public.poll_votes` | `authenticated` | `DELETE` | NO |
| `public.poll_votes` | `authenticated` | `INSERT` | NO |
| `public.poll_votes` | `authenticated` | `REFERENCES` | NO |
| `public.poll_votes` | `authenticated` | `SELECT` | NO |
| `public.poll_votes` | `authenticated` | `TRIGGER` | NO |
| `public.poll_votes` | `authenticated` | `TRUNCATE` | NO |
| `public.poll_votes` | `authenticated` | `UPDATE` | NO |
| `public.poll_votes` | `postgres` | `DELETE` | YES |
| `public.poll_votes` | `postgres` | `INSERT` | YES |
| `public.poll_votes` | `postgres` | `REFERENCES` | YES |
| `public.poll_votes` | `postgres` | `SELECT` | YES |
| `public.poll_votes` | `postgres` | `TRIGGER` | YES |
| `public.poll_votes` | `postgres` | `TRUNCATE` | YES |
| `public.poll_votes` | `postgres` | `UPDATE` | YES |
| `public.poll_votes` | `service_role` | `REFERENCES` | NO |
| `public.poll_votes` | `service_role` | `TRIGGER` | NO |
| `public.poll_votes` | `service_role` | `TRUNCATE` | NO |
| `public.polls` | `anon` | `REFERENCES` | NO |
| `public.polls` | `anon` | `TRIGGER` | NO |
| `public.polls` | `anon` | `TRUNCATE` | NO |
| `public.polls` | `authenticated` | `DELETE` | NO |
| `public.polls` | `authenticated` | `INSERT` | NO |
| `public.polls` | `authenticated` | `REFERENCES` | NO |
| `public.polls` | `authenticated` | `SELECT` | NO |
| `public.polls` | `authenticated` | `TRIGGER` | NO |
| `public.polls` | `authenticated` | `TRUNCATE` | NO |
| `public.polls` | `authenticated` | `UPDATE` | NO |
| `public.polls` | `postgres` | `DELETE` | YES |
| `public.polls` | `postgres` | `INSERT` | YES |
| `public.polls` | `postgres` | `REFERENCES` | YES |
| `public.polls` | `postgres` | `SELECT` | YES |
| `public.polls` | `postgres` | `TRIGGER` | YES |
| `public.polls` | `postgres` | `TRUNCATE` | YES |
| `public.polls` | `postgres` | `UPDATE` | YES |
| `public.polls` | `service_role` | `REFERENCES` | NO |
| `public.polls` | `service_role` | `TRIGGER` | NO |
| `public.polls` | `service_role` | `TRUNCATE` | NO |
| `public.profile_claim_answers` | `anon` | `REFERENCES` | NO |
| `public.profile_claim_answers` | `anon` | `TRIGGER` | NO |
| `public.profile_claim_answers` | `anon` | `TRUNCATE` | NO |
| `public.profile_claim_answers` | `authenticated` | `DELETE` | NO |
| `public.profile_claim_answers` | `authenticated` | `INSERT` | NO |
| `public.profile_claim_answers` | `authenticated` | `REFERENCES` | NO |
| `public.profile_claim_answers` | `authenticated` | `SELECT` | NO |
| `public.profile_claim_answers` | `authenticated` | `TRIGGER` | NO |
| `public.profile_claim_answers` | `authenticated` | `TRUNCATE` | NO |
| `public.profile_claim_answers` | `authenticated` | `UPDATE` | NO |
| `public.profile_claim_answers` | `postgres` | `DELETE` | YES |
| `public.profile_claim_answers` | `postgres` | `INSERT` | YES |
| `public.profile_claim_answers` | `postgres` | `REFERENCES` | YES |
| `public.profile_claim_answers` | `postgres` | `SELECT` | YES |
| `public.profile_claim_answers` | `postgres` | `TRIGGER` | YES |
| `public.profile_claim_answers` | `postgres` | `TRUNCATE` | YES |
| `public.profile_claim_answers` | `postgres` | `UPDATE` | YES |
| `public.profile_claim_answers` | `service_role` | `REFERENCES` | NO |
| `public.profile_claim_answers` | `service_role` | `TRIGGER` | NO |
| `public.profile_claim_answers` | `service_role` | `TRUNCATE` | NO |
| `public.profile_claim_disputes` | `anon` | `REFERENCES` | NO |
| `public.profile_claim_disputes` | `anon` | `TRIGGER` | NO |
| `public.profile_claim_disputes` | `anon` | `TRUNCATE` | NO |
| `public.profile_claim_disputes` | `authenticated` | `DELETE` | NO |
| `public.profile_claim_disputes` | `authenticated` | `INSERT` | NO |
| `public.profile_claim_disputes` | `authenticated` | `REFERENCES` | NO |
| `public.profile_claim_disputes` | `authenticated` | `SELECT` | NO |
| `public.profile_claim_disputes` | `authenticated` | `TRIGGER` | NO |
| `public.profile_claim_disputes` | `authenticated` | `TRUNCATE` | NO |
| `public.profile_claim_disputes` | `authenticated` | `UPDATE` | NO |
| `public.profile_claim_disputes` | `postgres` | `DELETE` | YES |
| `public.profile_claim_disputes` | `postgres` | `INSERT` | YES |
| `public.profile_claim_disputes` | `postgres` | `REFERENCES` | YES |
| `public.profile_claim_disputes` | `postgres` | `SELECT` | YES |
| `public.profile_claim_disputes` | `postgres` | `TRIGGER` | YES |
| `public.profile_claim_disputes` | `postgres` | `TRUNCATE` | YES |
| `public.profile_claim_disputes` | `postgres` | `UPDATE` | YES |
| `public.profile_claim_disputes` | `service_role` | `REFERENCES` | NO |
| `public.profile_claim_disputes` | `service_role` | `TRIGGER` | NO |
| `public.profile_claim_disputes` | `service_role` | `TRUNCATE` | NO |
| `public.profile_claims` | `anon` | `REFERENCES` | NO |
| `public.profile_claims` | `anon` | `TRIGGER` | NO |
| `public.profile_claims` | `anon` | `TRUNCATE` | NO |
| `public.profile_claims` | `authenticated` | `DELETE` | NO |
| `public.profile_claims` | `authenticated` | `INSERT` | NO |
| `public.profile_claims` | `authenticated` | `REFERENCES` | NO |
| `public.profile_claims` | `authenticated` | `SELECT` | NO |
| `public.profile_claims` | `authenticated` | `TRIGGER` | NO |
| `public.profile_claims` | `authenticated` | `TRUNCATE` | NO |
| `public.profile_claims` | `authenticated` | `UPDATE` | NO |
| `public.profile_claims` | `postgres` | `DELETE` | YES |
| `public.profile_claims` | `postgres` | `INSERT` | YES |
| `public.profile_claims` | `postgres` | `REFERENCES` | YES |
| `public.profile_claims` | `postgres` | `SELECT` | YES |
| `public.profile_claims` | `postgres` | `TRIGGER` | YES |
| `public.profile_claims` | `postgres` | `TRUNCATE` | YES |
| `public.profile_claims` | `postgres` | `UPDATE` | YES |
| `public.profile_claims` | `service_role` | `REFERENCES` | NO |
| `public.profile_claims` | `service_role` | `TRIGGER` | NO |
| `public.profile_claims` | `service_role` | `TRUNCATE` | NO |
| `public.profile_identity_verifications` | `postgres` | `DELETE` | YES |
| `public.profile_identity_verifications` | `postgres` | `INSERT` | YES |
| `public.profile_identity_verifications` | `postgres` | `REFERENCES` | YES |
| `public.profile_identity_verifications` | `postgres` | `SELECT` | YES |
| `public.profile_identity_verifications` | `postgres` | `TRIGGER` | YES |
| `public.profile_identity_verifications` | `postgres` | `TRUNCATE` | YES |
| `public.profile_identity_verifications` | `postgres` | `UPDATE` | YES |
| `public.profile_identity_verifications` | `service_role` | `REFERENCES` | NO |
| `public.profile_identity_verifications` | `service_role` | `TRIGGER` | NO |
| `public.profile_identity_verifications` | `service_role` | `TRUNCATE` | NO |
| `public.profile_school_questionnaire_answers` | `anon` | `REFERENCES` | NO |
| `public.profile_school_questionnaire_answers` | `anon` | `TRIGGER` | NO |
| `public.profile_school_questionnaire_answers` | `anon` | `TRUNCATE` | NO |
| `public.profile_school_questionnaire_answers` | `authenticated` | `DELETE` | NO |
| `public.profile_school_questionnaire_answers` | `authenticated` | `INSERT` | NO |
| `public.profile_school_questionnaire_answers` | `authenticated` | `REFERENCES` | NO |
| `public.profile_school_questionnaire_answers` | `authenticated` | `SELECT` | NO |
| `public.profile_school_questionnaire_answers` | `authenticated` | `TRIGGER` | NO |
| `public.profile_school_questionnaire_answers` | `authenticated` | `TRUNCATE` | NO |
| `public.profile_school_questionnaire_answers` | `authenticated` | `UPDATE` | NO |
| `public.profile_school_questionnaire_answers` | `postgres` | `DELETE` | YES |
| `public.profile_school_questionnaire_answers` | `postgres` | `INSERT` | YES |
| `public.profile_school_questionnaire_answers` | `postgres` | `REFERENCES` | YES |
| `public.profile_school_questionnaire_answers` | `postgres` | `SELECT` | YES |
| `public.profile_school_questionnaire_answers` | `postgres` | `TRIGGER` | YES |
| `public.profile_school_questionnaire_answers` | `postgres` | `TRUNCATE` | YES |
| `public.profile_school_questionnaire_answers` | `postgres` | `UPDATE` | YES |
| `public.profile_school_questionnaire_answers` | `service_role` | `REFERENCES` | NO |
| `public.profile_school_questionnaire_answers` | `service_role` | `TRIGGER` | NO |
| `public.profile_school_questionnaire_answers` | `service_role` | `TRUNCATE` | NO |
| `public.profiles` | `anon` | `REFERENCES` | NO |
| `public.profiles` | `anon` | `TRIGGER` | NO |
| `public.profiles` | `anon` | `TRUNCATE` | NO |
| `public.profiles` | `authenticated` | `DELETE` | NO |
| `public.profiles` | `authenticated` | `INSERT` | NO |
| `public.profiles` | `authenticated` | `REFERENCES` | NO |
| `public.profiles` | `authenticated` | `SELECT` | NO |
| `public.profiles` | `authenticated` | `TRIGGER` | NO |
| `public.profiles` | `authenticated` | `TRUNCATE` | NO |
| `public.profiles` | `authenticated` | `UPDATE` | NO |
| `public.profiles` | `postgres` | `DELETE` | YES |
| `public.profiles` | `postgres` | `INSERT` | YES |
| `public.profiles` | `postgres` | `REFERENCES` | YES |
| `public.profiles` | `postgres` | `SELECT` | YES |
| `public.profiles` | `postgres` | `TRIGGER` | YES |
| `public.profiles` | `postgres` | `TRUNCATE` | YES |
| `public.profiles` | `postgres` | `UPDATE` | YES |
| `public.profiles` | `service_role` | `REFERENCES` | NO |
| `public.profiles` | `service_role` | `TRIGGER` | NO |
| `public.profiles` | `service_role` | `TRUNCATE` | NO |
| `public.public_alumni_directory_status` | `anon` | `REFERENCES` | NO |
| `public.public_alumni_directory_status` | `anon` | `SELECT` | NO |
| `public.public_alumni_directory_status` | `anon` | `TRIGGER` | NO |
| `public.public_alumni_directory_status` | `anon` | `TRUNCATE` | NO |
| `public.public_alumni_directory_status` | `authenticated` | `REFERENCES` | NO |
| `public.public_alumni_directory_status` | `authenticated` | `SELECT` | NO |
| `public.public_alumni_directory_status` | `authenticated` | `TRIGGER` | NO |
| `public.public_alumni_directory_status` | `authenticated` | `TRUNCATE` | NO |
| `public.public_alumni_directory_status` | `postgres` | `DELETE` | YES |
| `public.public_alumni_directory_status` | `postgres` | `INSERT` | YES |
| `public.public_alumni_directory_status` | `postgres` | `REFERENCES` | YES |
| `public.public_alumni_directory_status` | `postgres` | `SELECT` | YES |
| `public.public_alumni_directory_status` | `postgres` | `TRIGGER` | YES |
| `public.public_alumni_directory_status` | `postgres` | `TRUNCATE` | YES |
| `public.public_alumni_directory_status` | `postgres` | `UPDATE` | YES |
| `public.public_alumni_directory_status` | `service_role` | `REFERENCES` | NO |
| `public.public_alumni_directory_status` | `service_role` | `TRIGGER` | NO |
| `public.public_alumni_directory_status` | `service_role` | `TRUNCATE` | NO |
| `public.public_curiosity_profile_stats` | `anon` | `REFERENCES` | NO |
| `public.public_curiosity_profile_stats` | `anon` | `SELECT` | NO |
| `public.public_curiosity_profile_stats` | `anon` | `TRIGGER` | NO |
| `public.public_curiosity_profile_stats` | `anon` | `TRUNCATE` | NO |
| `public.public_curiosity_profile_stats` | `authenticated` | `REFERENCES` | NO |
| `public.public_curiosity_profile_stats` | `authenticated` | `SELECT` | NO |
| `public.public_curiosity_profile_stats` | `authenticated` | `TRIGGER` | NO |
| `public.public_curiosity_profile_stats` | `authenticated` | `TRUNCATE` | NO |
| `public.public_curiosity_profile_stats` | `postgres` | `DELETE` | YES |
| `public.public_curiosity_profile_stats` | `postgres` | `INSERT` | YES |
| `public.public_curiosity_profile_stats` | `postgres` | `REFERENCES` | YES |
| `public.public_curiosity_profile_stats` | `postgres` | `SELECT` | YES |
| `public.public_curiosity_profile_stats` | `postgres` | `TRIGGER` | YES |
| `public.public_curiosity_profile_stats` | `postgres` | `TRUNCATE` | YES |
| `public.public_curiosity_profile_stats` | `postgres` | `UPDATE` | YES |
| `public.public_curiosity_profile_stats` | `service_role` | `REFERENCES` | NO |
| `public.public_curiosity_profile_stats` | `service_role` | `TRIGGER` | NO |
| `public.public_curiosity_profile_stats` | `service_role` | `TRUNCATE` | NO |
| `public.public_page_content` | `anon` | `REFERENCES` | NO |
| `public.public_page_content` | `anon` | `SELECT` | NO |
| `public.public_page_content` | `anon` | `TRIGGER` | NO |
| `public.public_page_content` | `anon` | `TRUNCATE` | NO |
| `public.public_page_content` | `authenticated` | `DELETE` | NO |
| `public.public_page_content` | `authenticated` | `INSERT` | NO |
| `public.public_page_content` | `authenticated` | `REFERENCES` | NO |
| `public.public_page_content` | `authenticated` | `SELECT` | NO |
| `public.public_page_content` | `authenticated` | `TRIGGER` | NO |
| `public.public_page_content` | `authenticated` | `TRUNCATE` | NO |
| `public.public_page_content` | `authenticated` | `UPDATE` | NO |
| `public.public_page_content` | `postgres` | `DELETE` | YES |
| `public.public_page_content` | `postgres` | `INSERT` | YES |
| `public.public_page_content` | `postgres` | `REFERENCES` | YES |
| `public.public_page_content` | `postgres` | `SELECT` | YES |
| `public.public_page_content` | `postgres` | `TRIGGER` | YES |
| `public.public_page_content` | `postgres` | `TRUNCATE` | YES |
| `public.public_page_content` | `postgres` | `UPDATE` | YES |
| `public.public_page_content` | `service_role` | `REFERENCES` | NO |
| `public.public_page_content` | `service_role` | `TRIGGER` | NO |
| `public.public_page_content` | `service_role` | `TRUNCATE` | NO |
| `public.public_profile_cards` | `anon` | `REFERENCES` | NO |
| `public.public_profile_cards` | `anon` | `SELECT` | NO |
| `public.public_profile_cards` | `anon` | `TRIGGER` | NO |
| `public.public_profile_cards` | `anon` | `TRUNCATE` | NO |
| `public.public_profile_cards` | `authenticated` | `REFERENCES` | NO |
| `public.public_profile_cards` | `authenticated` | `SELECT` | NO |
| `public.public_profile_cards` | `authenticated` | `TRIGGER` | NO |
| `public.public_profile_cards` | `authenticated` | `TRUNCATE` | NO |
| `public.public_profile_cards` | `postgres` | `DELETE` | YES |
| `public.public_profile_cards` | `postgres` | `INSERT` | YES |
| `public.public_profile_cards` | `postgres` | `REFERENCES` | YES |
| `public.public_profile_cards` | `postgres` | `SELECT` | YES |
| `public.public_profile_cards` | `postgres` | `TRIGGER` | YES |
| `public.public_profile_cards` | `postgres` | `TRUNCATE` | YES |
| `public.public_profile_cards` | `postgres` | `UPDATE` | YES |
| `public.public_profile_cards` | `service_role` | `REFERENCES` | NO |
| `public.public_profile_cards` | `service_role` | `TRIGGER` | NO |
| `public.public_profile_cards` | `service_role` | `TRUNCATE` | NO |
| `public.public_profile_locations` | `anon` | `REFERENCES` | NO |
| `public.public_profile_locations` | `anon` | `SELECT` | NO |
| `public.public_profile_locations` | `anon` | `TRIGGER` | NO |
| `public.public_profile_locations` | `anon` | `TRUNCATE` | NO |
| `public.public_profile_locations` | `authenticated` | `REFERENCES` | NO |
| `public.public_profile_locations` | `authenticated` | `SELECT` | NO |
| `public.public_profile_locations` | `authenticated` | `TRIGGER` | NO |
| `public.public_profile_locations` | `authenticated` | `TRUNCATE` | NO |
| `public.public_profile_locations` | `postgres` | `DELETE` | YES |
| `public.public_profile_locations` | `postgres` | `INSERT` | YES |
| `public.public_profile_locations` | `postgres` | `REFERENCES` | YES |
| `public.public_profile_locations` | `postgres` | `SELECT` | YES |
| `public.public_profile_locations` | `postgres` | `TRIGGER` | YES |
| `public.public_profile_locations` | `postgres` | `TRUNCATE` | YES |
| `public.public_profile_locations` | `postgres` | `UPDATE` | YES |
| `public.public_profile_locations` | `service_role` | `REFERENCES` | NO |
| `public.public_profile_locations` | `service_role` | `TRIGGER` | NO |
| `public.public_profile_locations` | `service_role` | `TRUNCATE` | NO |
| `public.public_school_questionnaire_option_stats` | `anon` | `REFERENCES` | NO |
| `public.public_school_questionnaire_option_stats` | `anon` | `SELECT` | NO |
| `public.public_school_questionnaire_option_stats` | `anon` | `TRIGGER` | NO |
| `public.public_school_questionnaire_option_stats` | `anon` | `TRUNCATE` | NO |
| `public.public_school_questionnaire_option_stats` | `authenticated` | `REFERENCES` | NO |
| `public.public_school_questionnaire_option_stats` | `authenticated` | `SELECT` | NO |
| `public.public_school_questionnaire_option_stats` | `authenticated` | `TRIGGER` | NO |
| `public.public_school_questionnaire_option_stats` | `authenticated` | `TRUNCATE` | NO |
| `public.public_school_questionnaire_option_stats` | `postgres` | `DELETE` | YES |
| `public.public_school_questionnaire_option_stats` | `postgres` | `INSERT` | YES |
| `public.public_school_questionnaire_option_stats` | `postgres` | `REFERENCES` | YES |
| `public.public_school_questionnaire_option_stats` | `postgres` | `SELECT` | YES |
| `public.public_school_questionnaire_option_stats` | `postgres` | `TRIGGER` | YES |
| `public.public_school_questionnaire_option_stats` | `postgres` | `TRUNCATE` | YES |
| `public.public_school_questionnaire_option_stats` | `postgres` | `UPDATE` | YES |
| `public.public_school_questionnaire_option_stats` | `service_role` | `REFERENCES` | NO |
| `public.public_school_questionnaire_option_stats` | `service_role` | `TRIGGER` | NO |
| `public.public_school_questionnaire_option_stats` | `service_role` | `TRUNCATE` | NO |
| `public.rate_limit_buckets` | `postgres` | `DELETE` | YES |
| `public.rate_limit_buckets` | `postgres` | `INSERT` | YES |
| `public.rate_limit_buckets` | `postgres` | `REFERENCES` | YES |
| `public.rate_limit_buckets` | `postgres` | `SELECT` | YES |
| `public.rate_limit_buckets` | `postgres` | `TRIGGER` | YES |
| `public.rate_limit_buckets` | `postgres` | `TRUNCATE` | YES |
| `public.rate_limit_buckets` | `postgres` | `UPDATE` | YES |
| `public.rate_limit_buckets` | `service_role` | `REFERENCES` | NO |
| `public.rate_limit_buckets` | `service_role` | `SELECT` | NO |
| `public.rate_limit_buckets` | `service_role` | `TRIGGER` | NO |
| `public.rate_limit_buckets` | `service_role` | `TRUNCATE` | NO |
| `public.refund_policy` | `anon` | `REFERENCES` | NO |
| `public.refund_policy` | `anon` | `TRIGGER` | NO |
| `public.refund_policy` | `anon` | `TRUNCATE` | NO |
| `public.refund_policy` | `authenticated` | `REFERENCES` | NO |
| `public.refund_policy` | `authenticated` | `TRIGGER` | NO |
| `public.refund_policy` | `authenticated` | `TRUNCATE` | NO |
| `public.refund_policy` | `postgres` | `DELETE` | YES |
| `public.refund_policy` | `postgres` | `INSERT` | YES |
| `public.refund_policy` | `postgres` | `REFERENCES` | YES |
| `public.refund_policy` | `postgres` | `SELECT` | YES |
| `public.refund_policy` | `postgres` | `TRIGGER` | YES |
| `public.refund_policy` | `postgres` | `TRUNCATE` | YES |
| `public.refund_policy` | `postgres` | `UPDATE` | YES |
| `public.refund_policy` | `service_role` | `REFERENCES` | NO |
| `public.refund_policy` | `service_role` | `TRIGGER` | NO |
| `public.refund_policy` | `service_role` | `TRUNCATE` | NO |
| `public.refund_requests` | `anon` | `REFERENCES` | NO |
| `public.refund_requests` | `anon` | `TRIGGER` | NO |
| `public.refund_requests` | `anon` | `TRUNCATE` | NO |
| `public.refund_requests` | `authenticated` | `INSERT` | NO |
| `public.refund_requests` | `authenticated` | `REFERENCES` | NO |
| `public.refund_requests` | `authenticated` | `SELECT` | NO |
| `public.refund_requests` | `authenticated` | `TRIGGER` | NO |
| `public.refund_requests` | `authenticated` | `TRUNCATE` | NO |
| `public.refund_requests` | `postgres` | `DELETE` | YES |
| `public.refund_requests` | `postgres` | `INSERT` | YES |
| `public.refund_requests` | `postgres` | `REFERENCES` | YES |
| `public.refund_requests` | `postgres` | `SELECT` | YES |
| `public.refund_requests` | `postgres` | `TRIGGER` | YES |
| `public.refund_requests` | `postgres` | `TRUNCATE` | YES |
| `public.refund_requests` | `postgres` | `UPDATE` | YES |
| `public.refund_requests` | `service_role` | `REFERENCES` | NO |
| `public.refund_requests` | `service_role` | `TRIGGER` | NO |
| `public.refund_requests` | `service_role` | `TRUNCATE` | NO |
| `public.security_audit_log` | `postgres` | `DELETE` | YES |
| `public.security_audit_log` | `postgres` | `INSERT` | YES |
| `public.security_audit_log` | `postgres` | `REFERENCES` | YES |
| `public.security_audit_log` | `postgres` | `SELECT` | YES |
| `public.security_audit_log` | `postgres` | `TRIGGER` | YES |
| `public.security_audit_log` | `postgres` | `TRUNCATE` | YES |
| `public.security_audit_log` | `postgres` | `UPDATE` | YES |
| `public.security_audit_log` | `service_role` | `REFERENCES` | NO |
| `public.security_audit_log` | `service_role` | `TRIGGER` | NO |
| `public.security_audit_log` | `service_role` | `TRUNCATE` | NO |
| `public.ticket_lot_prices` | `anon` | `REFERENCES` | NO |
| `public.ticket_lot_prices` | `anon` | `SELECT` | NO |
| `public.ticket_lot_prices` | `anon` | `TRIGGER` | NO |
| `public.ticket_lot_prices` | `anon` | `TRUNCATE` | NO |
| `public.ticket_lot_prices` | `authenticated` | `REFERENCES` | NO |
| `public.ticket_lot_prices` | `authenticated` | `SELECT` | NO |
| `public.ticket_lot_prices` | `authenticated` | `TRIGGER` | NO |
| `public.ticket_lot_prices` | `authenticated` | `TRUNCATE` | NO |
| `public.ticket_lot_prices` | `postgres` | `DELETE` | YES |
| `public.ticket_lot_prices` | `postgres` | `INSERT` | YES |
| `public.ticket_lot_prices` | `postgres` | `REFERENCES` | YES |
| `public.ticket_lot_prices` | `postgres` | `SELECT` | YES |
| `public.ticket_lot_prices` | `postgres` | `TRIGGER` | YES |
| `public.ticket_lot_prices` | `postgres` | `TRUNCATE` | YES |
| `public.ticket_lot_prices` | `postgres` | `UPDATE` | YES |
| `public.ticket_lot_prices` | `service_role` | `REFERENCES` | NO |
| `public.ticket_lot_prices` | `service_role` | `TRIGGER` | NO |
| `public.ticket_lot_prices` | `service_role` | `TRUNCATE` | NO |
| `public.ticket_lots` | `anon` | `REFERENCES` | NO |
| `public.ticket_lots` | `anon` | `SELECT` | NO |
| `public.ticket_lots` | `anon` | `TRIGGER` | NO |
| `public.ticket_lots` | `anon` | `TRUNCATE` | NO |
| `public.ticket_lots` | `authenticated` | `REFERENCES` | NO |
| `public.ticket_lots` | `authenticated` | `SELECT` | NO |
| `public.ticket_lots` | `authenticated` | `TRIGGER` | NO |
| `public.ticket_lots` | `authenticated` | `TRUNCATE` | NO |
| `public.ticket_lots` | `postgres` | `DELETE` | YES |
| `public.ticket_lots` | `postgres` | `INSERT` | YES |
| `public.ticket_lots` | `postgres` | `REFERENCES` | YES |
| `public.ticket_lots` | `postgres` | `SELECT` | YES |
| `public.ticket_lots` | `postgres` | `TRIGGER` | YES |
| `public.ticket_lots` | `postgres` | `TRUNCATE` | YES |
| `public.ticket_lots` | `postgres` | `UPDATE` | YES |
| `public.ticket_lots` | `service_role` | `REFERENCES` | NO |
| `public.ticket_lots` | `service_role` | `TRIGGER` | NO |
| `public.ticket_lots` | `service_role` | `TRUNCATE` | NO |
| `public.ticket_transfers` | `anon` | `REFERENCES` | NO |
| `public.ticket_transfers` | `anon` | `TRIGGER` | NO |
| `public.ticket_transfers` | `anon` | `TRUNCATE` | NO |
| `public.ticket_transfers` | `authenticated` | `REFERENCES` | NO |
| `public.ticket_transfers` | `authenticated` | `SELECT` | NO |
| `public.ticket_transfers` | `authenticated` | `TRIGGER` | NO |
| `public.ticket_transfers` | `authenticated` | `TRUNCATE` | NO |
| `public.ticket_transfers` | `postgres` | `DELETE` | YES |
| `public.ticket_transfers` | `postgres` | `INSERT` | YES |
| `public.ticket_transfers` | `postgres` | `REFERENCES` | YES |
| `public.ticket_transfers` | `postgres` | `SELECT` | YES |
| `public.ticket_transfers` | `postgres` | `TRIGGER` | YES |
| `public.ticket_transfers` | `postgres` | `TRUNCATE` | YES |
| `public.ticket_transfers` | `postgres` | `UPDATE` | YES |
| `public.ticket_transfers` | `service_role` | `REFERENCES` | NO |
| `public.ticket_transfers` | `service_role` | `TRIGGER` | NO |
| `public.ticket_transfers` | `service_role` | `TRUNCATE` | NO |
| `public.ticket_types` | `anon` | `REFERENCES` | NO |
| `public.ticket_types` | `anon` | `TRIGGER` | NO |
| `public.ticket_types` | `anon` | `TRUNCATE` | NO |
| `public.ticket_types` | `authenticated` | `DELETE` | NO |
| `public.ticket_types` | `authenticated` | `INSERT` | NO |
| `public.ticket_types` | `authenticated` | `REFERENCES` | NO |
| `public.ticket_types` | `authenticated` | `SELECT` | NO |
| `public.ticket_types` | `authenticated` | `TRIGGER` | NO |
| `public.ticket_types` | `authenticated` | `TRUNCATE` | NO |
| `public.ticket_types` | `authenticated` | `UPDATE` | NO |
| `public.ticket_types` | `postgres` | `DELETE` | YES |
| `public.ticket_types` | `postgres` | `INSERT` | YES |
| `public.ticket_types` | `postgres` | `REFERENCES` | YES |
| `public.ticket_types` | `postgres` | `SELECT` | YES |
| `public.ticket_types` | `postgres` | `TRIGGER` | YES |
| `public.ticket_types` | `postgres` | `TRUNCATE` | YES |
| `public.ticket_types` | `postgres` | `UPDATE` | YES |
| `public.ticket_types` | `service_role` | `REFERENCES` | NO |
| `public.ticket_types` | `service_role` | `TRIGGER` | NO |
| `public.ticket_types` | `service_role` | `TRUNCATE` | NO |
| `public.tickets` | `anon` | `REFERENCES` | NO |
| `public.tickets` | `anon` | `TRIGGER` | NO |
| `public.tickets` | `anon` | `TRUNCATE` | NO |
| `public.tickets` | `authenticated` | `DELETE` | NO |
| `public.tickets` | `authenticated` | `INSERT` | NO |
| `public.tickets` | `authenticated` | `REFERENCES` | NO |
| `public.tickets` | `authenticated` | `SELECT` | NO |
| `public.tickets` | `authenticated` | `TRIGGER` | NO |
| `public.tickets` | `authenticated` | `TRUNCATE` | NO |
| `public.tickets` | `authenticated` | `UPDATE` | NO |
| `public.tickets` | `postgres` | `DELETE` | YES |
| `public.tickets` | `postgres` | `INSERT` | YES |
| `public.tickets` | `postgres` | `REFERENCES` | YES |
| `public.tickets` | `postgres` | `SELECT` | YES |
| `public.tickets` | `postgres` | `TRIGGER` | YES |
| `public.tickets` | `postgres` | `TRUNCATE` | YES |
| `public.tickets` | `postgres` | `UPDATE` | YES |
| `public.tickets` | `service_role` | `REFERENCES` | NO |
| `public.tickets` | `service_role` | `TRIGGER` | NO |
| `public.tickets` | `service_role` | `TRUNCATE` | NO |

## Grants de rotinas

| Rotina | Grantee | Privilégio | Grantable |
|---|---|---|---|
| `public.accept_ticket_transfer` | `authenticated` | `EXECUTE` | NO |
| `public.accept_ticket_transfer` | `postgres` | `EXECUTE` | YES |
| `public.admin_archive_ticket_lot` | `authenticated` | `EXECUTE` | NO |
| `public.admin_archive_ticket_lot` | `postgres` | `EXECUTE` | YES |
| `public.admin_can_manage_people` | `authenticated` | `EXECUTE` | NO |
| `public.admin_can_manage_people` | `postgres` | `EXECUTE` | YES |
| `public.admin_clear_person_profile` | `authenticated` | `EXECUTE` | NO |
| `public.admin_clear_person_profile` | `postgres` | `EXECUTE` | YES |
| `public.admin_delete_person_profile` | `authenticated` | `EXECUTE` | NO |
| `public.admin_delete_person_profile` | `postgres` | `EXECUTE` | YES |
| `public.admin_get_person_details` | `authenticated` | `EXECUTE` | NO |
| `public.admin_get_person_details` | `postgres` | `EXECUTE` | YES |
| `public.admin_get_profile_claim_disputes_with_identity` | `authenticated` | `EXECUTE` | NO |
| `public.admin_get_profile_claim_disputes_with_identity` | `postgres` | `EXECUTE` | YES |
| `public.admin_get_ticket_lots` | `authenticated` | `EXECUTE` | NO |
| `public.admin_get_ticket_lots` | `postgres` | `EXECUTE` | YES |
| `public.admin_import_people` | `authenticated` | `EXECUTE` | NO |
| `public.admin_import_people` | `postgres` | `EXECUTE` | YES |
| `public.admin_update_person_and_profile` | `authenticated` | `EXECUTE` | NO |
| `public.admin_update_person_and_profile` | `postgres` | `EXECUTE` | YES |
| `public.admin_update_refund_policy` | `authenticated` | `EXECUTE` | NO |
| `public.admin_update_refund_policy` | `postgres` | `EXECUTE` | YES |
| `public.admin_upsert_ticket_lot` | `authenticated` | `EXECUTE` | NO |
| `public.admin_upsert_ticket_lot` | `postgres` | `EXECUTE` | YES |
| `public.age_on_date` | `PUBLIC` | `EXECUTE` | NO |
| `public.age_on_date` | `anon` | `EXECUTE` | NO |
| `public.age_on_date` | `authenticated` | `EXECUTE` | NO |
| `public.age_on_date` | `postgres` | `EXECUTE` | YES |
| `public.age_on_event_date` | `postgres` | `EXECUTE` | YES |
| `public.age_on_event_date` | `service_role` | `EXECUTE` | NO |
| `public.apply_automatic_content_approval` | `PUBLIC` | `EXECUTE` | NO |
| `public.apply_automatic_content_approval` | `postgres` | `EXECUTE` | YES |
| `public.apply_mercado_pago_payment` | `postgres` | `EXECUTE` | YES |
| `public.apply_mercado_pago_payment` | `service_role` | `EXECUTE` | NO |
| `public.assert_content_moderation_transition` | `postgres` | `EXECUTE` | YES |
| `public.audit_sensitive_row_change` | `PUBLIC` | `EXECUTE` | NO |
| `public.audit_sensitive_row_change` | `postgres` | `EXECUTE` | YES |
| `public.calculate_refund_quote` | `authenticated` | `EXECUTE` | NO |
| `public.calculate_refund_quote` | `postgres` | `EXECUTE` | YES |
| `public.cancel_guest_approval_request` | `authenticated` | `EXECUTE` | NO |
| `public.cancel_guest_approval_request` | `postgres` | `EXECUTE` | YES |
| `public.cancel_ticket_transfer` | `authenticated` | `EXECUTE` | NO |
| `public.cancel_ticket_transfer` | `postgres` | `EXECUTE` | YES |
| `public.claim_notification_jobs` | `postgres` | `EXECUTE` | YES |
| `public.claim_notification_jobs` | `service_role` | `EXECUTE` | NO |
| `public.cleanup_security_operational_data` | `postgres` | `EXECUTE` | YES |
| `public.cleanup_security_operational_data` | `service_role` | `EXECUTE` | NO |
| `public.complete_notification_job` | `postgres` | `EXECUTE` | YES |
| `public.complete_notification_job` | `service_role` | `EXECUTE` | NO |
| `public.complete_photo_removal` | `postgres` | `EXECUTE` | YES |
| `public.complete_photo_removal` | `service_role` | `EXECUTE` | NO |
| `public.complete_profile_registration_v3` | `authenticated` | `EXECUTE` | NO |
| `public.complete_profile_registration_v3` | `postgres` | `EXECUTE` | YES |
| `public.content_actor_name` | `postgres` | `EXECUTE` | YES |
| `public.count_approved_external_guests` | `PUBLIC` | `EXECUTE` | NO |
| `public.count_approved_external_guests` | `authenticated` | `EXECUTE` | NO |
| `public.count_approved_external_guests` | `postgres` | `EXECUTE` | YES |
| `public.create_checkout_order` | `postgres` | `EXECUTE` | YES |
| `public.create_checkout_order` | `service_role` | `EXECUTE` | NO |
| `public.create_guest_approval_request` | `authenticated` | `EXECUTE` | NO |
| `public.create_guest_approval_request` | `postgres` | `EXECUTE` | YES |
| `public.create_uploaded_photo` | `authenticated` | `EXECUTE` | NO |
| `public.create_uploaded_photo` | `postgres` | `EXECUTE` | YES |
| `public.current_security_role` | `authenticated` | `EXECUTE` | NO |
| `public.current_security_role` | `postgres` | `EXECUTE` | YES |
| `public.decide_guest_approval_request` | `PUBLIC` | `EXECUTE` | NO |
| `public.decide_guest_approval_request` | `authenticated` | `EXECUTE` | NO |
| `public.decide_guest_approval_request` | `postgres` | `EXECUTE` | YES |
| `public.enforce_hc20_commerce_capacity` | `PUBLIC` | `EXECUTE` | NO |
| `public.enforce_hc20_commerce_capacity` | `postgres` | `EXECUTE` | YES |
| `public.enforce_rate_limit` | `authenticated` | `EXECUTE` | NO |
| `public.enforce_rate_limit` | `postgres` | `EXECUTE` | YES |
| `public.enqueue_guest_approval_whatsapp_job` | `postgres` | `EXECUTE` | YES |
| `public.enqueue_order_status_notifications` | `PUBLIC` | `EXECUTE` | NO |
| `public.enqueue_order_status_notifications` | `postgres` | `EXECUTE` | YES |
| `public.enqueue_ticket_whatsapp_notification` | `PUBLIC` | `EXECUTE` | NO |
| `public.enqueue_ticket_whatsapp_notification` | `postgres` | `EXECUTE` | YES |
| `public.expire_checkout_reservations` | `postgres` | `EXECUTE` | YES |
| `public.expire_checkout_reservations` | `service_role` | `EXECUTE` | NO |
| `public.expire_guest_approval_requests` | `postgres` | `EXECUTE` | YES |
| `public.expire_ticket_transfers` | `postgres` | `EXECUTE` | YES |
| `public.export_checkin_report` | `authenticated` | `EXECUTE` | NO |
| `public.export_checkin_report` | `postgres` | `EXECUTE` | YES |
| `public.fn_generate_qr_code` | `PUBLIC` | `EXECUTE` | NO |
| `public.fn_generate_qr_code` | `postgres` | `EXECUTE` | YES |
| `public.fn_increment_sold` | `PUBLIC` | `EXECUTE` | NO |
| `public.fn_increment_sold` | `postgres` | `EXECUTE` | YES |
| `public.fn_set_updated_at` | `PUBLIC` | `EXECUTE` | NO |
| `public.fn_set_updated_at` | `postgres` | `EXECUTE` | YES |
| `public.fn_touch_home_page_content` | `PUBLIC` | `EXECUTE` | NO |
| `public.fn_touch_home_page_content` | `postgres` | `EXECUTE` | YES |
| `public.fn_validate_poll_vote` | `PUBLIC` | `EXECUTE` | NO |
| `public.fn_validate_poll_vote` | `postgres` | `EXECUTE` | YES |
| `public.get_admin_commerce_report` | `authenticated` | `EXECUTE` | NO |
| `public.get_admin_commerce_report` | `postgres` | `EXECUTE` | YES |
| `public.get_admin_orders` | `authenticated` | `EXECUTE` | NO |
| `public.get_admin_orders` | `postgres` | `EXECUTE` | YES |
| `public.get_admin_orders` | `service_role` | `EXECUTE` | NO |
| `public.get_admin_orders_mercado_pago_base` | `authenticated` | `EXECUTE` | NO |
| `public.get_admin_orders_mercado_pago_base` | `postgres` | `EXECUTE` | YES |
| `public.get_admin_orders_mercado_pago_base` | `service_role` | `EXECUTE` | NO |
| `public.get_admin_refund_requests` | `authenticated` | `EXECUTE` | NO |
| `public.get_admin_refund_requests` | `postgres` | `EXECUTE` | YES |
| `public.get_admin_security_audit` | `authenticated` | `EXECUTE` | NO |
| `public.get_admin_security_audit` | `postgres` | `EXECUTE` | YES |
| `public.get_checkin_activity` | `authenticated` | `EXECUTE` | NO |
| `public.get_checkin_activity` | `postgres` | `EXECUTE` | YES |
| `public.get_checkin_dashboard` | `authenticated` | `EXECUTE` | NO |
| `public.get_checkin_dashboard` | `postgres` | `EXECUTE` | YES |
| `public.get_checkin_operation_metrics` | `authenticated` | `EXECUTE` | NO |
| `public.get_checkin_operation_metrics` | `postgres` | `EXECUTE` | YES |
| `public.get_checkout_status_by_token` | `PUBLIC` | `EXECUTE` | NO |
| `public.get_checkout_status_by_token` | `anon` | `EXECUTE` | NO |
| `public.get_checkout_status_by_token` | `authenticated` | `EXECUTE` | NO |
| `public.get_checkout_status_by_token` | `postgres` | `EXECUTE` | YES |
| `public.get_current_ticket_catalog` | `PUBLIC` | `EXECUTE` | NO |
| `public.get_current_ticket_catalog` | `anon` | `EXECUTE` | NO |
| `public.get_current_ticket_catalog` | `authenticated` | `EXECUTE` | NO |
| `public.get_current_ticket_catalog` | `postgres` | `EXECUTE` | YES |
| `public.get_current_ticket_lot` | `PUBLIC` | `EXECUTE` | NO |
| `public.get_current_ticket_lot` | `anon` | `EXECUTE` | NO |
| `public.get_current_ticket_lot` | `authenticated` | `EXECUTE` | NO |
| `public.get_current_ticket_lot` | `postgres` | `EXECUTE` | YES |
| `public.get_event_reports` | `authenticated` | `EXECUTE` | NO |
| `public.get_event_reports` | `postgres` | `EXECUTE` | YES |
| `public.get_event_reports` | `service_role` | `EXECUTE` | NO |
| `public.get_event_reports_mercado_pago_base` | `authenticated` | `EXECUTE` | NO |
| `public.get_event_reports_mercado_pago_base` | `postgres` | `EXECUTE` | YES |
| `public.get_event_reports_mercado_pago_base` | `service_role` | `EXECUTE` | NO |
| `public.get_my_commerce_orders` | `authenticated` | `EXECUTE` | NO |
| `public.get_my_commerce_orders` | `postgres` | `EXECUTE` | YES |
| `public.get_my_guest_approval_requests` | `authenticated` | `EXECUTE` | NO |
| `public.get_my_guest_approval_requests` | `postgres` | `EXECUTE` | YES |
| `public.get_my_ticket_transfers` | `authenticated` | `EXECUTE` | NO |
| `public.get_my_ticket_transfers` | `postgres` | `EXECUTE` | YES |
| `public.get_public_memories` | `anon` | `EXECUTE` | NO |
| `public.get_public_memories` | `authenticated` | `EXECUTE` | NO |
| `public.get_public_memories` | `postgres` | `EXECUTE` | YES |
| `public.get_public_ticket_catalog` | `anon` | `EXECUTE` | NO |
| `public.get_public_ticket_catalog` | `authenticated` | `EXECUTE` | NO |
| `public.get_public_ticket_catalog` | `postgres` | `EXECUTE` | YES |
| `public.gin_extract_query_trgm` | `anon` | `EXECUTE` | NO |
| `public.gin_extract_query_trgm` | `authenticated` | `EXECUTE` | NO |
| `public.gin_extract_query_trgm` | `postgres` | `EXECUTE` | NO |
| `public.gin_extract_query_trgm` | `service_role` | `EXECUTE` | NO |
| `public.gin_extract_value_trgm` | `anon` | `EXECUTE` | NO |
| `public.gin_extract_value_trgm` | `authenticated` | `EXECUTE` | NO |
| `public.gin_extract_value_trgm` | `postgres` | `EXECUTE` | NO |
| `public.gin_extract_value_trgm` | `service_role` | `EXECUTE` | NO |
| `public.gin_trgm_consistent` | `anon` | `EXECUTE` | NO |
| `public.gin_trgm_consistent` | `authenticated` | `EXECUTE` | NO |
| `public.gin_trgm_consistent` | `postgres` | `EXECUTE` | NO |
| `public.gin_trgm_consistent` | `service_role` | `EXECUTE` | NO |
| `public.gin_trgm_triconsistent` | `anon` | `EXECUTE` | NO |
| `public.gin_trgm_triconsistent` | `authenticated` | `EXECUTE` | NO |
| `public.gin_trgm_triconsistent` | `postgres` | `EXECUTE` | NO |
| `public.gin_trgm_triconsistent` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_compress` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_compress` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_compress` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_compress` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_consistent` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_consistent` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_consistent` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_consistent` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_decompress` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_decompress` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_decompress` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_decompress` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_distance` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_distance` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_distance` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_distance` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_in` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_in` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_in` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_in` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_options` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_options` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_options` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_options` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_out` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_out` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_out` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_out` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_penalty` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_penalty` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_penalty` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_penalty` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_picksplit` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_picksplit` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_picksplit` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_picksplit` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_same` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_same` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_same` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_same` | `service_role` | `EXECUTE` | NO |
| `public.gtrgm_union` | `anon` | `EXECUTE` | NO |
| `public.gtrgm_union` | `authenticated` | `EXECUTE` | NO |
| `public.gtrgm_union` | `postgres` | `EXECUTE` | NO |
| `public.gtrgm_union` | `service_role` | `EXECUTE` | NO |
| `public.has_admin_role` | `PUBLIC` | `EXECUTE` | NO |
| `public.has_admin_role` | `postgres` | `EXECUTE` | YES |
| `public.has_structured_faq_items` | `PUBLIC` | `EXECUTE` | NO |
| `public.has_structured_faq_items` | `anon` | `EXECUTE` | NO |
| `public.has_structured_faq_items` | `authenticated` | `EXECUTE` | NO |
| `public.has_structured_faq_items` | `postgres` | `EXECUTE` | YES |
| `public.is_admin` | `PUBLIC` | `EXECUTE` | NO |
| `public.is_admin` | `postgres` | `EXECUTE` | YES |
| `public.is_admin_panel_user` | `PUBLIC` | `EXECUTE` | NO |
| `public.is_admin_panel_user` | `anon` | `EXECUTE` | NO |
| `public.is_admin_panel_user` | `authenticated` | `EXECUTE` | NO |
| `public.is_admin_panel_user` | `postgres` | `EXECUTE` | YES |
| `public.is_superadmin` | `PUBLIC` | `EXECUTE` | NO |
| `public.is_superadmin` | `anon` | `EXECUTE` | NO |
| `public.is_superadmin` | `authenticated` | `EXECUTE` | NO |
| `public.is_superadmin` | `postgres` | `EXECUTE` | YES |
| `public.moderate_content_item` | `authenticated` | `EXECUTE` | NO |
| `public.moderate_content_item` | `postgres` | `EXECUTE` | YES |
| `public.move_faq_category_items` | `PUBLIC` | `EXECUTE` | NO |
| `public.move_faq_category_items` | `authenticated` | `EXECUTE` | NO |
| `public.move_faq_category_items` | `postgres` | `EXECUTE` | YES |
| `public.normalize_profile_answer` | `PUBLIC` | `EXECUTE` | NO |
| `public.normalize_profile_answer` | `postgres` | `EXECUTE` | YES |
| `public.normalize_profile_identity_text` | `PUBLIC` | `EXECUTE` | NO |
| `public.normalize_profile_identity_text` | `postgres` | `EXECUTE` | YES |
| `public.normalize_ticket_lot_capacity` | `PUBLIC` | `EXECUTE` | NO |
| `public.normalize_ticket_lot_capacity` | `postgres` | `EXECUTE` | YES |
| `public.perform_ticket_checkin` | `authenticated` | `EXECUTE` | NO |
| `public.perform_ticket_checkin` | `postgres` | `EXECUTE` | YES |
| `public.prepare_photo_removal` | `authenticated` | `EXECUTE` | NO |
| `public.prepare_photo_removal` | `postgres` | `EXECUTE` | YES |
| `public.prevent_faq_category_delete_with_active_items` | `PUBLIC` | `EXECUTE` | NO |
| `public.prevent_faq_category_delete_with_active_items` | `postgres` | `EXECUTE` | YES |
| `public.profile_claim_penultimate_surname` | `PUBLIC` | `EXECUTE` | NO |
| `public.profile_claim_penultimate_surname` | `postgres` | `EXECUTE` | YES |
| `public.record_content_moderation` | `postgres` | `EXECUTE` | YES |
| `public.refresh_ticket_type_sold_quantity` | `postgres` | `EXECUTE` | YES |
| `public.refresh_ticket_type_sold_quantity` | `service_role` | `EXECUTE` | NO |
| `public.reject_photo_removal_request` | `authenticated` | `EXECUTE` | NO |
| `public.reject_photo_removal_request` | `postgres` | `EXECUTE` | YES |
| `public.reject_ticket_transfer` | `authenticated` | `EXECUTE` | NO |
| `public.reject_ticket_transfer` | `postgres` | `EXECUTE` | YES |
| `public.release_expired_ticket_reservations` | `postgres` | `EXECUTE` | YES |
| `public.reorder_faq_categories` | `PUBLIC` | `EXECUTE` | NO |
| `public.reorder_faq_categories` | `authenticated` | `EXECUTE` | NO |
| `public.reorder_faq_categories` | `postgres` | `EXECUTE` | YES |
| `public.reorder_faq_items` | `PUBLIC` | `EXECUTE` | NO |
| `public.reorder_faq_items` | `authenticated` | `EXECUTE` | NO |
| `public.reorder_faq_items` | `postgres` | `EXECUTE` | YES |
| `public.request_order_refund` | `authenticated` | `EXECUTE` | NO |
| `public.request_order_refund` | `postgres` | `EXECUTE` | YES |
| `public.request_ticket_resend` | `authenticated` | `EXECUTE` | NO |
| `public.request_ticket_resend` | `postgres` | `EXECUTE` | YES |
| `public.request_ticket_transfer` | `authenticated` | `EXECUTE` | NO |
| `public.request_ticket_transfer` | `postgres` | `EXECUTE` | YES |
| `public.respond_guest_approval_request` | `authenticated` | `EXECUTE` | NO |
| `public.respond_guest_approval_request` | `postgres` | `EXECUTE` | YES |
| `public.restore_refunded_order_inventory` | `postgres` | `EXECUTE` | YES |
| `public.retry_order_payment` | `authenticated` | `EXECUTE` | NO |
| `public.retry_order_payment` | `postgres` | `EXECUTE` | YES |
| `public.review_refund_request` | `authenticated` | `EXECUTE` | NO |
| `public.review_refund_request` | `postgres` | `EXECUTE` | YES |
| `public.run_commerce_automation` | `postgres` | `EXECUTE` | YES |
| `public.sanitize_content_row` | `PUBLIC` | `EXECUTE` | NO |
| `public.sanitize_content_row` | `postgres` | `EXECUTE` | YES |
| `public.sanitize_plain_text` | `PUBLIC` | `EXECUTE` | NO |
| `public.sanitize_plain_text` | `postgres` | `EXECUTE` | YES |
| `public.search_external_guest_sponsors` | `authenticated` | `EXECUTE` | NO |
| `public.search_external_guest_sponsors` | `postgres` | `EXECUTE` | YES |
| `public.set_cms_assets_updated_at` | `PUBLIC` | `EXECUTE` | NO |
| `public.set_cms_assets_updated_at` | `postgres` | `EXECUTE` | YES |
| `public.set_content_featured` | `authenticated` | `EXECUTE` | NO |
| `public.set_content_featured` | `postgres` | `EXECUTE` | YES |
| `public.set_event_page_content_updated_at` | `PUBLIC` | `EXECUTE` | NO |
| `public.set_event_page_content_updated_at` | `postgres` | `EXECUTE` | YES |
| `public.set_limit` | `anon` | `EXECUTE` | NO |
| `public.set_limit` | `authenticated` | `EXECUTE` | NO |
| `public.set_limit` | `postgres` | `EXECUTE` | NO |
| `public.set_limit` | `service_role` | `EXECUTE` | NO |
| `public.set_participant_vouchers_delivered` | `authenticated` | `EXECUTE` | NO |
| `public.set_participant_vouchers_delivered` | `postgres` | `EXECUTE` | YES |
| `public.set_public_page_content_updated_at` | `PUBLIC` | `EXECUTE` | NO |
| `public.set_public_page_content_updated_at` | `postgres` | `EXECUTE` | YES |
| `public.show_limit` | `anon` | `EXECUTE` | NO |
| `public.show_limit` | `authenticated` | `EXECUTE` | NO |
| `public.show_limit` | `postgres` | `EXECUTE` | NO |
| `public.show_limit` | `service_role` | `EXECUTE` | NO |
| `public.show_trgm` | `anon` | `EXECUTE` | NO |
| `public.show_trgm` | `authenticated` | `EXECUTE` | NO |
| `public.show_trgm` | `postgres` | `EXECUTE` | NO |
| `public.show_trgm` | `service_role` | `EXECUTE` | NO |
| `public.similarity` | `anon` | `EXECUTE` | NO |
| `public.similarity` | `authenticated` | `EXECUTE` | NO |
| `public.similarity` | `postgres` | `EXECUTE` | NO |
| `public.similarity` | `service_role` | `EXECUTE` | NO |
| `public.similarity_dist` | `anon` | `EXECUTE` | NO |
| `public.similarity_dist` | `authenticated` | `EXECUTE` | NO |
| `public.similarity_dist` | `postgres` | `EXECUTE` | NO |
| `public.similarity_dist` | `service_role` | `EXECUTE` | NO |
| `public.similarity_op` | `anon` | `EXECUTE` | NO |
| `public.similarity_op` | `authenticated` | `EXECUTE` | NO |
| `public.similarity_op` | `postgres` | `EXECUTE` | NO |
| `public.similarity_op` | `service_role` | `EXECUTE` | NO |
| `public.strict_word_similarity` | `anon` | `EXECUTE` | NO |
| `public.strict_word_similarity` | `authenticated` | `EXECUTE` | NO |
| `public.strict_word_similarity` | `postgres` | `EXECUTE` | NO |
| `public.strict_word_similarity` | `service_role` | `EXECUTE` | NO |
| `public.strict_word_similarity_commutator_op` | `anon` | `EXECUTE` | NO |
| `public.strict_word_similarity_commutator_op` | `authenticated` | `EXECUTE` | NO |
| `public.strict_word_similarity_commutator_op` | `postgres` | `EXECUTE` | NO |
| `public.strict_word_similarity_commutator_op` | `service_role` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_commutator_op` | `anon` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_commutator_op` | `authenticated` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_commutator_op` | `postgres` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_commutator_op` | `service_role` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_op` | `anon` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_op` | `authenticated` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_op` | `postgres` | `EXECUTE` | NO |
| `public.strict_word_similarity_dist_op` | `service_role` | `EXECUTE` | NO |
| `public.strict_word_similarity_op` | `anon` | `EXECUTE` | NO |
| `public.strict_word_similarity_op` | `authenticated` | `EXECUTE` | NO |
| `public.strict_word_similarity_op` | `postgres` | `EXECUTE` | NO |
| `public.strict_word_similarity_op` | `service_role` | `EXECUTE` | NO |
| `public.submit_memory` | `authenticated` | `EXECUTE` | NO |
| `public.submit_memory` | `postgres` | `EXECUTE` | YES |
| `public.submit_photo_comment` | `authenticated` | `EXECUTE` | NO |
| `public.submit_photo_comment` | `postgres` | `EXECUTE` | YES |
| `public.submit_photo_removal_request` | `authenticated` | `EXECUTE` | NO |
| `public.submit_photo_removal_request` | `authenticated` | `EXECUTE` | NO |
| `public.submit_photo_removal_request` | `postgres` | `EXECUTE` | YES |
| `public.submit_photo_removal_request` | `postgres` | `EXECUTE` | YES |
| `public.submit_photo_tag` | `authenticated` | `EXECUTE` | NO |
| `public.submit_photo_tag` | `postgres` | `EXECUTE` | YES |
| `public.sync_order_payment_sales_trigger` | `PUBLIC` | `EXECUTE` | NO |
| `public.sync_order_payment_sales_trigger` | `postgres` | `EXECUTE` | YES |
| `public.sync_ticket_lot_statuses` | `postgres` | `EXECUTE` | YES |
| `public.sync_ticket_type_sold_quantity_trigger` | `PUBLIC` | `EXECUTE` | NO |
| `public.sync_ticket_type_sold_quantity_trigger` | `postgres` | `EXECUTE` | YES |
| `public.update_my_public_profile` | `authenticated` | `EXECUTE` | NO |
| `public.update_my_public_profile` | `postgres` | `EXECUTE` | YES |
| `public.word_similarity` | `anon` | `EXECUTE` | NO |
| `public.word_similarity` | `authenticated` | `EXECUTE` | NO |
| `public.word_similarity` | `postgres` | `EXECUTE` | NO |
| `public.word_similarity` | `service_role` | `EXECUTE` | NO |
| `public.word_similarity_commutator_op` | `anon` | `EXECUTE` | NO |
| `public.word_similarity_commutator_op` | `authenticated` | `EXECUTE` | NO |
| `public.word_similarity_commutator_op` | `postgres` | `EXECUTE` | NO |
| `public.word_similarity_commutator_op` | `service_role` | `EXECUTE` | NO |
| `public.word_similarity_dist_commutator_op` | `anon` | `EXECUTE` | NO |
| `public.word_similarity_dist_commutator_op` | `authenticated` | `EXECUTE` | NO |
| `public.word_similarity_dist_commutator_op` | `postgres` | `EXECUTE` | NO |
| `public.word_similarity_dist_commutator_op` | `service_role` | `EXECUTE` | NO |
| `public.word_similarity_dist_op` | `anon` | `EXECUTE` | NO |
| `public.word_similarity_dist_op` | `authenticated` | `EXECUTE` | NO |
| `public.word_similarity_dist_op` | `postgres` | `EXECUTE` | NO |
| `public.word_similarity_dist_op` | `service_role` | `EXECUTE` | NO |
| `public.word_similarity_op` | `anon` | `EXECUTE` | NO |
| `public.word_similarity_op` | `authenticated` | `EXECUTE` | NO |
| `public.word_similarity_op` | `postgres` | `EXECUTE` | NO |
| `public.word_similarity_op` | `service_role` | `EXECUTE` | NO |
| `public.write_security_audit` | `postgres` | `EXECUTE` | YES |
| `public.write_security_audit` | `service_role` | `EXECUTE` | NO |
