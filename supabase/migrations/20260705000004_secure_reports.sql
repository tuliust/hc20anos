-- ================================================================
-- Turma 2006 — Migration 005: secure admin reports RPC
-- ================================================================

create or replace function get_event_reports(p_event_id uuid)
returns jsonb language plpgsql security definer stable as $$
declare
  result jsonb;
begin
  if not is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'tickets_sold',      coalesce((select sum(sold_quantity) from ticket_types where event_id = p_event_id), 0),
    'revenue_cents',     coalesce((select sum(total_amount_cents) from orders where event_id = p_event_id and payment_status = 'approved'), 0),
    'orders_pending',    coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'pending'), 0),
    'orders_approved',   coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'approved'), 0),
    'orders_rejected',   coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'rejected'), 0),
    'orders_cancelled',  coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'cancelled'), 0),
    'orders_expired',    coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'expired'), 0),
    'orders_refunded',   coalesce((select count(*) from orders where event_id = p_event_id and payment_status = 'refunded'), 0),
    'checkins_done',     coalesce((select count(*) from tickets t join orders o on o.id = t.order_id where o.event_id = p_event_id and t.checked_in = true), 0),
    'checkins_pending',  coalesce((select count(*) from tickets t join orders o on o.id = t.order_id where o.event_id = p_event_id and t.checked_in = false), 0),
    'people_confirmed',  coalesce((select count(*) from people where profile_status = 'confirmed'), 0),
    'people_claimed',    coalesce((select count(*) from people where profile_status = 'claimed'), 0),
    'people_unclaimed',  coalesce((select count(*) from people where profile_status = 'unclaimed'), 0),
    'photos_total',      coalesce((select count(*) from photos where event_id = p_event_id), 0),
    'photos_approved',   coalesce((select count(*) from photos where event_id = p_event_id and status = 'approved'), 0),
    'photos_pending',    coalesce((select count(*) from photos where event_id = p_event_id and status = 'pending'), 0),
    'photos_rejected',   coalesce((select count(*) from photos where event_id = p_event_id and status = 'rejected'), 0),
    'claims_pending',    coalesce((select count(*) from profile_claims where status = 'pending'), 0),
    'disputes_pending',  coalesce((select count(*) from profile_claim_disputes where status = 'pending'), 0),
    'removals_pending',  coalesce((select count(*) from photo_removal_requests where status = 'pending'), 0)
  ) into result;
  return result;
end;
$$;

-- Tighten broad admin policies from earlier migrations.
drop policy if exists "events_admin_all" on events;
create policy "events_admin_read" on events
  for select using (is_admin());
create policy "events_admin_write" on events
  for all using (has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "ticket_types_admin_all" on ticket_types;
create policy "ticket_types_admin_read" on ticket_types
  for select using (is_admin());
create policy "ticket_types_admin_write" on ticket_types
  for all using (has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "photos_admin_all" on photos;
create policy "photos_admin_read" on photos
  for select using (is_admin());
create policy "photos_moderator_write" on photos
  for update using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "photo_tags_admin_all" on photo_tags;
create policy "photo_tags_admin_read" on photo_tags
  for select using (is_admin());
create policy "photo_tags_moderator_write" on photo_tags
  for update using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "claims_admin_all" on profile_claims;
create policy "claims_admin_read" on profile_claims
  for select using (is_admin());
create policy "claims_moderator_write" on profile_claims
  for update using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "removal_requests_admin_all" on photo_removal_requests;
create policy "removal_requests_admin_read" on photo_removal_requests
  for select using (is_admin());
create policy "removal_requests_moderator_write" on photo_removal_requests
  for update using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "disputes_admin_all" on profile_claim_disputes;
create policy "disputes_admin_read" on profile_claim_disputes
  for select using (is_admin());
create policy "disputes_moderator_write" on profile_claim_disputes
  for update using (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('moderator') or has_admin_role('admin') or has_admin_role('superadmin'));
