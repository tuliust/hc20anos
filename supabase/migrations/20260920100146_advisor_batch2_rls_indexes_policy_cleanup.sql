-- HC 20 Anos — Advisors batch 2.
-- Incremental, low-risk cleanup: operational FK indexes, RLS initplan optimization,
-- authenticated role scoping, and removal of one legacy permissive FAQ policy.
-- Preserve intentional anonymous access to /buscar.

-- Operational foreign-key indexes.
create index if not exists order_participants_guest_approval_request_id_idx
  on public.order_participants(guest_approval_request_id);

create index if not exists order_participants_sponsor_user_id_idx
  on public.order_participants(sponsor_user_id);

create index if not exists profile_identity_verifications_claimant_user_id_idx
  on public.profile_identity_verifications(claimant_user_id);

create index if not exists profile_identity_verifications_profile_id_idx
  on public.profile_identity_verifications(profile_id);

create index if not exists tickets_checked_in_by_admin_id_idx
  on public.tickets(checked_in_by_admin_id);

create index if not exists tickets_transferred_from_ticket_id_idx
  on public.tickets(transferred_from_ticket_id);

create index if not exists refund_requests_requested_by_user_id_idx
  on public.refund_requests(requested_by_user_id);

create index if not exists ticket_transfers_from_user_id_idx
  on public.ticket_transfers(from_user_id);

-- Owner/self policies that were effectively authenticated-only already.
-- Wrapping auth helpers in SELECT avoids per-row re-evaluation.
alter policy memories_owner_read
  on public.memories
  to authenticated
  using (user_id = (select auth.uid()));

alter policy photo_likes_auth_insert
  on public.photo_likes
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

alter policy photo_likes_owner_delete
  on public.photo_likes
  to authenticated
  using (user_id = (select auth.uid()));

alter policy poll_votes_auth_insert
  on public.poll_votes
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

alter policy poll_votes_owner_read
  on public.poll_votes
  to authenticated
  using (user_id = (select auth.uid()));

alter policy claims_auth_insert
  on public.profile_claims
  to authenticated
  with check (
    (select auth.uid()) is not null
    and requester_user_id = (select auth.uid())
  );

alter policy claims_owner_read
  on public.profile_claims
  to authenticated
  using (requester_user_id = (select auth.uid()));

alter policy claim_answers_auth_insert
  on public.profile_claim_answers
  to authenticated
  with check (
    exists (
      select 1
      from public.profile_claims pc
      where pc.id = profile_claim_answers.claim_id
        and pc.requester_user_id = (select auth.uid())
    )
  );

alter policy claim_answers_owner_read
  on public.profile_claim_answers
  to authenticated
  using (
    exists (
      select 1
      from public.profile_claims pc
      where pc.id = profile_claim_answers.claim_id
        and pc.requester_user_id = (select auth.uid())
    )
  );

alter policy disputes_auth_insert
  on public.profile_claim_disputes
  to authenticated
  with check (
    (select auth.uid()) is not null
    and requester_user_id = (select auth.uid())
  );

alter policy disputes_owner_read
  on public.profile_claim_disputes
  to authenticated
  using (requester_user_id = (select auth.uid()));

alter policy participant_extras_owner_read
  on public.participant_extras
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = participant_extras.order_id
        and o.buyer_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.order_participants op
      where op.id = participant_extras.order_participant_id
        and (
          op.user_id = (select auth.uid())
          or op.sponsor_user_id = (select auth.uid())
        )
    )
  );

alter policy payment_preferences_owner_read
  on public.payment_preferences
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = payment_preferences.order_id
        and o.buyer_user_id = (select auth.uid())
    )
  );

alter policy refund_requests_owner_insert
  on public.refund_requests
  to authenticated
  with check (
    requested_by_user_id = (select auth.uid())
    and status = 'requested'::text
    and exists (
      select 1
      from public.orders o
      where o.id = refund_requests.order_id
        and o.buyer_user_id = (select auth.uid())
    )
  );

alter policy refund_requests_owner_read
  on public.refund_requests
  to authenticated
  using (
    requested_by_user_id = (select auth.uid())
    or exists (
      select 1
      from public.orders o
      where o.id = refund_requests.order_id
        and o.buyer_user_id = (select auth.uid())
    )
  );

alter policy ticket_transfers_parties_read
  on public.ticket_transfers
  to authenticated
  using (
    from_user_id = (select auth.uid())
    or to_user_id = (select auth.uid())
    or lower(to_email) = lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
  );

-- Legacy remote-only policy was broader than the canonical public FAQ policy:
-- it exposed every visible item without enforcing deleted/category visibility.
-- The canonical faq_items_public_read policy remains in place.
drop policy if exists faq_items_public_read_visible on public.faq_items;
