-- ================================================================
-- Ticketing commerce RLS
-- Políticas mínimas para catálogo, compradores, participantes e convidados.
-- Operações financeiras críticas continuam restritas às Edge Functions.
-- ================================================================

alter table public.ticket_lots enable row level security;
alter table public.ticket_lot_prices enable row level security;
alter table public.guest_approval_requests enable row level security;
alter table public.order_participants enable row level security;
alter table public.participant_extras enable row level security;
alter table public.payment_preferences enable row level security;
alter table public.refund_requests enable row level security;
alter table public.ticket_transfers enable row level security;
alter table public.notification_jobs enable row level security;

-- Public commercial catalog -------------------------------------------------

drop policy if exists ticket_lots_public_read on public.ticket_lots;
create policy ticket_lots_public_read
on public.ticket_lots
for select
to anon, authenticated
using (status <> 'archived');

drop policy if exists ticket_lot_prices_public_read on public.ticket_lot_prices;
create policy ticket_lot_prices_public_read
on public.ticket_lot_prices
for select
to anon, authenticated
using (is_active = true);

-- Guest approval requests ---------------------------------------------------

-- A guest may create a request only for their own authenticated account.
drop policy if exists guest_requests_guest_insert on public.guest_approval_requests;
create policy guest_requests_guest_insert
on public.guest_approval_requests
for insert
to authenticated
with check (
  guest_user_id = auth.uid()
  and status = 'pending'
  and decided_at is null
  and decided_by_user_id is null
);

-- Guest reads their own requests. Sponsor reads requests directed to their
-- claimed people profile.
drop policy if exists guest_requests_parties_read on public.guest_approval_requests;
create policy guest_requests_parties_read
on public.guest_approval_requests
for select
to authenticated
using (
  guest_user_id = auth.uid()
  or exists (
    select 1
    from public.people p
    where p.id = sponsor_person_id
      and p.claimed_by_user_id = auth.uid()
  )
);

-- Direct updates are intentionally disabled. Decisions go through
-- decide_guest_approval_request(), which locks and validates the limit.

-- Order participants --------------------------------------------------------

drop policy if exists order_participants_owner_read on public.order_participants;
create policy order_participants_owner_read
on public.order_participants
for select
to authenticated
using (
  user_id = auth.uid()
  or sponsor_user_id = auth.uid()
  or exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.buyer_user_id = auth.uid()
  )
);

-- Inserts and updates are performed server-side to guarantee pricing and
-- package validation.

-- Participant extras --------------------------------------------------------

drop policy if exists participant_extras_owner_read on public.participant_extras;
create policy participant_extras_owner_read
on public.participant_extras
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.buyer_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.order_participants op
    where op.id = order_participant_id
      and (op.user_id = auth.uid() or op.sponsor_user_id = auth.uid())
  )
);

-- Payment preferences -------------------------------------------------------

-- Users may see only non-secret preference metadata for their own order.
drop policy if exists payment_preferences_owner_read on public.payment_preferences;
create policy payment_preferences_owner_read
on public.payment_preferences
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.buyer_user_id = auth.uid()
  )
);

-- Refund requests -----------------------------------------------------------

drop policy if exists refund_requests_owner_read on public.refund_requests;
create policy refund_requests_owner_read
on public.refund_requests
for select
to authenticated
using (
  requested_by_user_id = auth.uid()
  or exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.buyer_user_id = auth.uid()
  )
);

-- A user can open a request for their own order. Eligibility and monetary
-- values are revalidated by the server before operational processing.
drop policy if exists refund_requests_owner_insert on public.refund_requests;
create policy refund_requests_owner_insert
on public.refund_requests
for insert
to authenticated
with check (
  requested_by_user_id = auth.uid()
  and status = 'requested'
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.buyer_user_id = auth.uid()
  )
);

-- Ticket transfers ----------------------------------------------------------

drop policy if exists ticket_transfers_parties_read on public.ticket_transfers;
create policy ticket_transfers_parties_read
on public.ticket_transfers
for select
to authenticated
using (
  from_user_id = auth.uid()
  or to_user_id = auth.uid()
  or lower(to_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Transfer creation and completion are server-side because they invalidate
-- QR tokens and move extras atomically.

-- Notification queue --------------------------------------------------------

-- No user policies. Only service role/server processes may read or mutate it.
revoke all on public.notification_jobs from anon, authenticated;

-- Financial writes and preference creation remain server-side.
revoke insert, update, delete on public.payment_preferences from anon, authenticated;
revoke insert, update, delete on public.participant_extras from anon, authenticated;
revoke insert, update, delete on public.order_participants from anon, authenticated;
revoke update, delete on public.refund_requests from anon, authenticated;
revoke insert, update, delete on public.ticket_transfers from anon, authenticated;

grant select on public.ticket_lots, public.ticket_lot_prices to anon, authenticated;
grant select on public.guest_approval_requests, public.order_participants,
  public.participant_extras, public.payment_preferences, public.refund_requests,
  public.ticket_transfers to authenticated;
grant insert on public.guest_approval_requests, public.refund_requests to authenticated;

notify pgrst, 'reload schema';
