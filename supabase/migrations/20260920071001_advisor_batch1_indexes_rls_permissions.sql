-- HC 20 Anos — Advisors batch 1: high-traffic FK indexes + RLS initplan cleanup.
-- Preserve intentional anonymous access to /buscar.

-- High-traffic foreign keys identified by Performance Advisor and pg_stat_user_tables.
create index if not exists orders_event_id_idx
  on public.orders(event_id);

create index if not exists orders_lot_id_idx
  on public.orders(lot_id);

create index if not exists orders_ticket_type_id_idx
  on public.orders(ticket_type_id);

create index if not exists order_participants_person_id_idx
  on public.order_participants(person_id);

create index if not exists notification_jobs_order_id_idx
  on public.notification_jobs(order_id);

create index if not exists notification_jobs_ticket_id_idx
  on public.notification_jobs(ticket_id);

create index if not exists tickets_ticket_type_id_idx
  on public.tickets(ticket_type_id);

create index if not exists checkin_events_operator_user_id_idx
  on public.checkin_events(operator_user_id);

-- Avoid evaluating auth.uid() once per row and narrow owner policies that were
-- attached to PUBLIC even though anonymous sessions can never satisfy them.
alter policy admin_users_self_read
  on public.admin_users
  to authenticated
  using (user_id = (select auth.uid()));

alter policy guest_requests_guest_insert
  on public.guest_approval_requests
  to authenticated
  with check (
    guest_user_id = (select auth.uid())
    and status = 'pending'::text
    and decided_at is null
    and decided_by_user_id is null
  );

alter policy guest_requests_parties_read
  on public.guest_approval_requests
  to authenticated
  using (
    guest_user_id = (select auth.uid())
    or exists (
      select 1
      from public.people p
      where p.id = guest_approval_requests.sponsor_person_id
        and p.claimed_by_user_id = (select auth.uid())
    )
  );

alter policy order_participants_owner_read
  on public.order_participants
  to authenticated
  using (
    user_id = (select auth.uid())
    or sponsor_user_id = (select auth.uid())
    or exists (
      select 1
      from public.orders o
      where o.id = order_participants.order_id
        and o.buyer_user_id = (select auth.uid())
    )
  );

alter policy admin_panel_select
  on public.orders
  to authenticated
  using (public.is_admin_panel_user((select auth.uid())));

alter policy admin_panel_write
  on public.orders
  to authenticated
  using (public.is_admin_panel_user((select auth.uid())))
  with check (public.is_admin_panel_user((select auth.uid())));

alter policy orders_owner_select
  on public.orders
  to authenticated
  using (
    buyer_email = (
      select u.email::text
      from auth.users u
      where u.id = (select auth.uid())
    )
    or person_id in (
      select p.id
      from public.people p
      where p.claimed_by_user_id = (select auth.uid())
    )
  );

alter policy people_owner_read
  on public.people
  to authenticated
  using (claimed_by_user_id = (select auth.uid()));

alter policy profiles_owner_insert
  on public.profiles
  to authenticated
  with check (user_id = (select auth.uid()));

alter policy profiles_owner_select
  on public.profiles
  to authenticated
  using (user_id = (select auth.uid()));

alter policy profiles_owner_update
  on public.profiles
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy photos_owner_read
  on public.photos
  to authenticated
  using (uploaded_by_user_id = (select auth.uid()));

alter policy photo_tags_owner_read
  on public.photo_tags
  to authenticated
  using (created_by_user_id = (select auth.uid()));

alter policy photo_comments_owner_read
  on public.photo_comments
  to authenticated
  using (user_id = (select auth.uid()));

alter policy tickets_owner_read
  on public.tickets
  to authenticated
  using (
    attendee_email = (
      select u.email::text
      from auth.users u
      where u.id = (select auth.uid())
    )
    or person_id in (
      select p.id
      from public.people p
      where p.claimed_by_user_id = (select auth.uid())
    )
  );

alter policy home_page_content_admin_write
  on public.home_page_content
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (array['admin'::public.admin_role, 'superadmin'::public.admin_role])
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.role = any (array['admin'::public.admin_role, 'superadmin'::public.admin_role])
    )
  );

-- Internal helper. Public callers use get_current_ticket_catalog or
-- get_public_ticket_catalog; application code has no direct call to this RPC.
revoke execute on function public.get_current_ticket_lot(uuid,timestamptz)
  from public, anon, authenticated;
grant execute on function public.get_current_ticket_lot(uuid,timestamptz)
  to service_role;

comment on function public.get_current_ticket_lot(uuid,timestamptz) is
  'Internal ticket-lot helper. Public clients must use the catalog RPCs.';
