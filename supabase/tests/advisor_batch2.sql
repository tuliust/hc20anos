-- Advisor batch 2 regression checks.
with checks as (
  select 'buscar_read_remains_anonymous' as check_name,
    has_function_privilege('anon','public.get_contact_research_directory()','EXECUTE') as passed
  union all
  select 'buscar_write_remains_anonymous',
    has_function_privilege('anon','public.save_contact_research(uuid,text,text,text,text,text,boolean)','EXECUTE')
  union all
  select 'faq_legacy_broad_policy_removed',
    not exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='faq_items'
        and policyname='faq_items_public_read_visible'
    )
  union all
  select 'faq_canonical_public_policy_present',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='faq_items'
        and policyname='faq_items_public_read'
        and 'anon' = any(roles)
        and 'authenticated' = any(roles)
    )
  union all
  select 'claims_owner_authenticated_only',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='profile_claims'
        and policyname='claims_owner_read'
        and roles = array['authenticated'::name]
    )
  union all
  select 'memories_owner_authenticated_only',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='memories'
        and policyname='memories_owner_read'
        and roles = array['authenticated'::name]
    )
  union all
  select 'ticket_transfer_owner_policy_present',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='ticket_transfers'
        and policyname='ticket_transfers_parties_read'
        and roles = array['authenticated'::name]
    )
  union all
  select 'order_participant_guest_request_index',
    to_regclass('public.order_participants_guest_approval_request_id_idx') is not null
  union all
  select 'order_participant_sponsor_index',
    to_regclass('public.order_participants_sponsor_user_id_idx') is not null
  union all
  select 'identity_claimant_index',
    to_regclass('public.profile_identity_verifications_claimant_user_id_idx') is not null
  union all
  select 'identity_profile_index',
    to_regclass('public.profile_identity_verifications_profile_id_idx') is not null
  union all
  select 'tickets_checkin_operator_index',
    to_regclass('public.tickets_checked_in_by_admin_id_idx') is not null
  union all
  select 'tickets_transfer_origin_index',
    to_regclass('public.tickets_transferred_from_ticket_id_idx') is not null
  union all
  select 'refund_requester_index',
    to_regclass('public.refund_requests_requested_by_user_id_idx') is not null
  union all
  select 'ticket_transfer_from_user_index',
    to_regclass('public.ticket_transfers_from_user_id_idx') is not null
)
select check_name, case when passed then 'PASS' else 'FAIL' end result
from checks
order by check_name;
