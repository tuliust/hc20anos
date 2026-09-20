-- HC 20 Anos — Advisors batch 3.
-- Eliminate remaining auth_rls_initplan findings, add targeted FK indexes,
-- and remove SELECT overlap from three write policies without changing read contracts.

create index if not exists faq_items_category_id_idx
  on public.faq_items(category_id);

create index if not exists photo_tags_created_by_user_id_idx
  on public.photo_tags(created_by_user_id);

create index if not exists photo_removal_requests_requester_user_id_idx
  on public.photo_removal_requests(requester_user_id);

create index if not exists guest_approval_requests_sponsor_user_id_idx
  on public.guest_approval_requests(sponsor_user_id);

create index if not exists refund_requests_ticket_id_idx
  on public.refund_requests(ticket_id);

create index if not exists ticket_transfers_to_user_id_idx
  on public.ticket_transfers(to_user_id);

create index if not exists tickets_physical_vouchers_delivered_by_idx
  on public.tickets(physical_vouchers_delivered_by);

create index if not exists content_moderation_events_actor_user_id_idx
  on public.content_moderation_events(actor_user_id);

alter policy photos_moderator_read
  on public.photos
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'moderator'::public.admin_role,
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  );

alter policy photo_tags_moderator_read
  on public.photo_tags
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'moderator'::public.admin_role,
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  );

alter policy removal_requests_moderator_read
  on public.photo_removal_requests
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'moderator'::public.admin_role,
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  );

alter policy removal_requests_owner_read
  on public.photo_removal_requests
  to authenticated
  using (requester_user_id = (select auth.uid()));

alter policy profile_school_questionnaire_answers_admin_manage
  on public.profile_school_questionnaire_answers
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

alter policy profile_school_questionnaire_answers_insert_own
  on public.profile_school_questionnaire_answers
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_school_questionnaire_answers.profile_id
        and p.user_id = (select auth.uid())
        and p.person_id = profile_school_questionnaire_answers.person_id
    )
  );

alter policy profile_school_questionnaire_answers_select_own
  on public.profile_school_questionnaire_answers
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_school_questionnaire_answers.profile_id
        and p.user_id = (select auth.uid())
    )
  );

alter policy profile_school_questionnaire_answers_update_own
  on public.profile_school_questionnaire_answers
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_school_questionnaire_answers.profile_id
        and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_school_questionnaire_answers.profile_id
        and p.user_id = (select auth.uid())
        and p.person_id = profile_school_questionnaire_answers.person_id
    )
  );

alter policy cms_assets_manage_admins
  on public.cms_assets
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

-- faq_items_manage_admins exists remotely but was historically absent from
-- the replayable migration chain. Reconstruct it when replaying from zero.
do $do$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'faq_items'
      and policyname = 'faq_items_manage_admins'
  ) then
    execute $sql$
      alter policy faq_items_manage_admins
        on public.faq_items
        to authenticated
        using (
          exists (
            select 1
            from public.admin_users au
            where au.user_id = (select auth.uid())
              and au.role = any (
                array[
                  'superadmin'::public.admin_role,
                  'admin'::public.admin_role
                ]
              )
          )
        )
        with check (
          exists (
            select 1
            from public.admin_users au
            where au.user_id = (select auth.uid())
              and au.role = any (
                array[
                  'superadmin'::public.admin_role,
                  'admin'::public.admin_role
                ]
              )
          )
        )
    $sql$;
  else
    execute $sql$
      create policy faq_items_manage_admins
        on public.faq_items
        for all
        to authenticated
        using (
          exists (
            select 1
            from public.admin_users au
            where au.user_id = (select auth.uid())
              and au.role = any (
                array[
                  'superadmin'::public.admin_role,
                  'admin'::public.admin_role
                ]
              )
          )
        )
        with check (
          exists (
            select 1
            from public.admin_users au
            where au.user_id = (select auth.uid())
              and au.role = any (
                array[
                  'superadmin'::public.admin_role,
                  'admin'::public.admin_role
                ]
              )
          )
        )
    $sql$;
  end if;
end
$do$;

alter policy content_moderation_events_admin_read
  on public.content_moderation_events
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'moderator'::public.admin_role,
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  );

alter policy contact_collectors_admin_write
  on public.contact_collectors
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = (select auth.uid())
        and a.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = (select auth.uid())
        and a.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

alter policy content_moderation_settings_admin_read
  on public.content_moderation_settings
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists content_moderation_settings_admin_write
  on public.content_moderation_settings;

create policy content_moderation_settings_admin_insert
  on public.content_moderation_settings
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  );

create policy content_moderation_settings_admin_update
  on public.content_moderation_settings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  );

create policy content_moderation_settings_admin_delete
  on public.content_moderation_settings
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'admin'::public.admin_role,
            'superadmin'::public.admin_role
          ]
        )
    )
  );

drop policy if exists event_page_content_manage_admins
  on public.event_page_content;

create policy event_page_content_admin_insert
  on public.event_page_content
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

create policy event_page_content_admin_update
  on public.event_page_content
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

create policy event_page_content_admin_delete
  on public.event_page_content
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

drop policy if exists public_page_content_manage_admins
  on public.public_page_content;

create policy public_page_content_admin_insert
  on public.public_page_content
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

create policy public_page_content_admin_update
  on public.public_page_content
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );

create policy public_page_content_admin_delete
  on public.public_page_content
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (
          array[
            'superadmin'::public.admin_role,
            'admin'::public.admin_role
          ]
        )
    )
  );
