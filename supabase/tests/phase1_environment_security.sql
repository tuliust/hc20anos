-- ================================================================
-- Phase 1 — local environment, roles and security contracts
-- ================================================================

with checks as (
  select 'admin_role_enum_complete' as check_name,
    (
      select array_agg(e.enumlabel::text order by e.enumsortorder)
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'admin_role'
    ) = array['superadmin','moderator','checkin_staff','admin','viewer']::text[] as passed

  union all
  select 'phase1_auth_users_seeded',
    (select count(*) from auth.users where email like '%-tests@local.invalid') = 6

  union all
  select 'phase1_admin_roles_seeded',
    (select count(*) from public.admin_users where email like '%-tests@local.invalid') = 5

  union all
  select 'required_tables_have_rls', not exists (
    select 1
    from unnest(array[
      'admin_users','audit_logs','checkin_events','cms_assets','content_moderation_settings',
      'events','faq_categories','faq_items','guest_approval_requests','home_page_content',
      'memories','notification_jobs','order_participants','orders','participant_extras',
      'payment_events','payment_preferences','people','photo_comments','photo_likes',
      'photo_removal_requests','photo_tags','photos','poll_options','poll_votes','polls',
      'profile_claim_disputes','profile_claims','profile_identity_verifications','profiles',
      'public_page_content','rate_limit_buckets','refund_requests','security_audit_log',
      'ticket_lot_prices','ticket_lots','ticket_transfers','ticket_types','tickets'
    ]) as required(table_name)
    left join pg_class c on c.relname = required.table_name
    left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    where c.oid is null or n.oid is null or not c.relrowsecurity
  )

  union all
  select 'critical_unique_constraints_present',
    to_regclass('public.orders_buyer_checkout_idempotency_unique') is not null
    and to_regclass('public.payment_events_provider_event_unique') is not null
    and to_regclass('public.photo_likes_photo_id_user_id_key') is not null
    and to_regclass('public.photo_tags_photo_id_person_id_key') is not null
    and to_regclass('public.tickets_qr_token_unique') is not null

  union all
  select 'critical_triggers_present',
    exists(select 1 from pg_trigger where tgname = 'trg_validate_poll_vote' and not tgisinternal)
    and exists(select 1 from pg_trigger where tgname = 'trg_tickets_qr' and not tgisinternal)
    and exists(select 1 from pg_trigger where tgname = 'audit_refund_requests_change' and not tgisinternal)
    and exists(select 1 from pg_trigger where tgname = 'tickets_sync_ticket_type_sales' and not tgisinternal)

  union all
  select 'critical_security_definers_have_search_path', not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'current_security_role','get_admin_commerce_report','get_admin_security_audit',
        'get_checkin_dashboard','get_checkin_operation_metrics','perform_ticket_checkin',
        'set_participant_vouchers_delivered','review_refund_request','write_security_audit'
      ])
      and p.prosecdef
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, array[]::text[])) setting
        where setting like 'search_path=%'
      )
  )

  union all
  select 'anon_cannot_execute_operational_rpcs',
    not has_function_privilege('anon','public.get_checkin_dashboard(text)','EXECUTE')
    and not has_function_privilege('anon','public.perform_ticket_checkin(uuid,boolean,text)','EXECUTE')
    and not has_function_privilege('anon','public.review_refund_request(uuid,boolean,text)','EXECUTE')

  union all
  select 'authenticated_can_execute_guarded_rpcs',
    has_function_privilege('authenticated','public.get_checkin_dashboard(text)','EXECUTE')
    and has_function_privilege('authenticated','public.perform_ticket_checkin(uuid,boolean,text)','EXECUTE')
    and has_function_privilege('authenticated','public.review_refund_request(uuid,boolean,text)','EXECUTE')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;

-- Ordinary authenticated user: no administrative row is visible.
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"authenticated-tests@local.invalid"}', true);
set local role authenticated;
select 'ordinary_role_resolves' as check_name,
  case when public.current_security_role() = 'authenticated' then 'PASS' else 'FAIL' end as result;
select 'ordinary_cannot_list_admin_users' as check_name,
  case when (select count(*) from public.admin_users) = 0 then 'PASS' else 'FAIL' end as result;
rollback;

-- Viewer: can read only its own role row and cannot promote itself.
begin;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","email":"viewer-tests@local.invalid"}', true);
set local role authenticated;
select 'viewer_role_resolves' as check_name,
  case when public.current_security_role() = 'viewer' then 'PASS' else 'FAIL' end as result;
select 'viewer_reads_only_self_role' as check_name,
  case when (select count(*) from public.admin_users) = 1 then 'PASS' else 'FAIL' end as result;
with changed as (
  update public.admin_users set role = 'admin' where user_id = '33333333-3333-4333-8333-333333333333' returning 1
)
select 'viewer_cannot_promote_self' as check_name,
  case when (select count(*) from changed) = 0 then 'PASS' else 'FAIL' end as result;
select 'viewer_has_no_checkin_results' as check_name,
  case when (select count(*) from public.get_checkin_dashboard(null)) = 0 then 'PASS' else 'FAIL' end as result;
rollback;

-- Check-in operator: operational reads work, financial report remains denied.
begin;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","email":"checkin-tests@local.invalid"}', true);
set local role authenticated;
select 'checkin_role_resolves' as check_name,
  case when public.current_security_role() = 'checkin_staff' then 'PASS' else 'FAIL' end as result;
select 'checkin_dashboard_allowed' as check_name,
  case when (select count(*) from public.get_checkin_dashboard(null)) >= 0 then 'PASS' else 'FAIL' end as result;
do $$
declare denied boolean := false;
begin
  begin
    perform public.get_admin_commerce_report();
  exception when others then
    denied := position('admin_required' in sqlerrm) > 0;
  end;
  if not denied then raise exception 'FAIL checkin_financial_report_denied'; end if;
  raise notice 'PASS checkin_financial_report_denied';
end $$;
rollback;

-- Moderator: content role is recognized and financial reporting is denied.
begin;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","email":"moderator-tests@local.invalid"}', true);
set local role authenticated;
select 'moderator_role_resolves' as check_name,
  case when public.current_security_role() = 'moderator' then 'PASS' else 'FAIL' end as result;
do $$
declare denied boolean := false;
begin
  begin
    perform public.get_admin_commerce_report();
  exception when others then
    denied := position('admin_required' in sqlerrm) > 0;
  end;
  if not denied then raise exception 'FAIL moderator_financial_report_denied'; end if;
  raise notice 'PASS moderator_financial_report_denied';
end $$;
rollback;

-- Admin and superadmin: administrative reporting and role management follow the effective policies.
begin;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","email":"admin-tests@local.invalid"}', true);
set local role authenticated;
select 'admin_role_resolves' as check_name,
  case when public.current_security_role() = 'admin' then 'PASS' else 'FAIL' end as result;
select 'admin_reads_all_role_rows' as check_name,
  case when (select count(*) from public.admin_users) = 5 then 'PASS' else 'FAIL' end as result;
select 'admin_financial_report_allowed' as check_name,
  case when jsonb_typeof(public.get_admin_commerce_report()) = 'object' then 'PASS' else 'FAIL' end as result;
with changed as (
  update public.admin_users set role = 'admin' where user_id = '33333333-3333-4333-8333-333333333333' returning 1
)
select 'admin_cannot_change_roles' as check_name,
  case when (select count(*) from changed) = 0 then 'PASS' else 'FAIL' end as result;
rollback;

begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"superadmin-tests@local.invalid"}', true);
set local role authenticated;
select 'superadmin_role_resolves' as check_name,
  case when public.current_security_role() = 'superadmin' then 'PASS' else 'FAIL' end as result;
with changed as (
  update public.admin_users set role = 'viewer' where user_id = '33333333-3333-4333-8333-333333333333' returning 1
)
select 'superadmin_can_manage_roles' as check_name,
  case when (select count(*) from changed) = 1 then 'PASS' else 'FAIL' end as result;
rollback;
