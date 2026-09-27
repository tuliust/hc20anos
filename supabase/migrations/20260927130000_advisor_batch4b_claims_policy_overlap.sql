-- 4B: remove only duplicate administrative paths already covered by admin ALL policies.
-- Owner, requester, and moderator paths remain unchanged.

drop policy if exists admin_panel_select on public.profile_claims;
drop policy if exists claims_admin_read on public.profile_claims;

drop policy if exists admin_panel_select on public.profile_claim_answers;
drop policy if exists claim_answers_admin_all on public.profile_claim_answers;

drop policy if exists admin_panel_select on public.profile_claim_disputes;
drop policy if exists disputes_admin_read on public.profile_claim_disputes;
