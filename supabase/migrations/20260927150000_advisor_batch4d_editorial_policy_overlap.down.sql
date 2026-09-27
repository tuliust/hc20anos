-- Rollback for 20260927150000_advisor_batch4d_editorial_policy_overlap.sql.
-- Restores the exact original policies; retained canonical and public policies
-- are not changed.

create policy faq_items_admin_insert
  on public.faq_items for insert to authenticated
  with check (
    has_admin_role('admin'::public.admin_role)
    or has_admin_role('superadmin'::public.admin_role)
  );
create policy faq_items_admin_read
  on public.faq_items for select to authenticated
  using (
    has_admin_role('admin'::public.admin_role)
    or has_admin_role('superadmin'::public.admin_role)
  );
create policy faq_items_admin_update
  on public.faq_items for update to authenticated
  using (
    has_admin_role('admin'::public.admin_role)
    or has_admin_role('superadmin'::public.admin_role)
  )
  with check (
    has_admin_role('admin'::public.admin_role)
    or has_admin_role('superadmin'::public.admin_role)
  );
create policy faq_items_superadmin_delete
  on public.faq_items for delete to authenticated
  using (has_admin_role('superadmin'::public.admin_role));

create policy admin_panel_select
  on public.home_page_content for select to authenticated
  using (is_admin_panel_user());
create policy home_page_content_admin_write
  on public.home_page_content for all to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (array['admin'::public.admin_role, 'superadmin'::public.admin_role])
    )
  )
  with check (
    exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (array['admin'::public.admin_role, 'superadmin'::public.admin_role])
    )
  );

create policy admin_panel_select
  on public.event_archive_settings for select to authenticated
  using (is_admin_panel_user());
create policy event_archive_settings_admin_all
  on public.event_archive_settings for all to authenticated
  using (
    has_admin_role('admin'::public.admin_role)
    or has_admin_role('superadmin'::public.admin_role)
  )
  with check (
    has_admin_role('admin'::public.admin_role)
    or has_admin_role('superadmin'::public.admin_role)
  );
