-- HC 20 Anos — Advisor batch 4D.
-- Remove only permissive policies whose role and row predicates are already
-- fully covered by the retained ALL policy. Public read policies are retained.

drop policy if exists faq_items_admin_insert on public.faq_items;
drop policy if exists faq_items_admin_read on public.faq_items;
drop policy if exists faq_items_admin_update on public.faq_items;
drop policy if exists faq_items_superadmin_delete on public.faq_items;

drop policy if exists admin_panel_select on public.home_page_content;
drop policy if exists home_page_content_admin_write on public.home_page_content;

drop policy if exists admin_panel_select on public.event_archive_settings;
drop policy if exists event_archive_settings_admin_all on public.event_archive_settings;
