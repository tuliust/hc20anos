-- Local-only role matrix and authorization-helper regression tests.
-- Requires supabase/tests/fixtures/local_test_context.sql.

do $$
begin
  if has_function_privilege('anon', 'public.has_admin_role(public.admin_role,uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.is_admin(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.is_admin_panel_user(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.is_superadmin(uuid)', 'EXECUTE') then
    raise exception 'FAIL anon_must_not_execute_admin_helpers';
  end if;
  if not has_function_privilege('authenticated', 'public.has_admin_role(public.admin_role,uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.is_admin(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.is_admin_panel_user(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.is_superadmin(uuid)', 'EXECUTE') then
    raise exception 'FAIL authenticated_must_execute_rls_helpers';
  end if;
end;
$$;

-- An ordinary authenticated user cannot infer another user's role, and remains
-- unable to see admin rows through the admin_users RLS policy.
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if public.is_admin() or public.is_admin_panel_user() or public.is_superadmin()
     or public.has_admin_role('admin'::public.admin_role) then
    raise exception 'FAIL ordinary_user_has_no_admin_role';
  end if;
  if public.is_admin('66666666-6666-4666-8666-666666666666'::uuid)
     or public.is_admin_panel_user('66666666-6666-4666-8666-666666666666'::uuid)
     or public.is_superadmin('11111111-1111-4111-8111-111111111111'::uuid)
     or public.has_admin_role('admin'::public.admin_role, '66666666-6666-4666-8666-666666666666'::uuid) then
    raise exception 'FAIL ordinary_user_can_probe_third_party_role';
  end if;
  if (select count(*) from public.admin_users) <> 0 then
    raise exception 'FAIL ordinary_user_admin_users_policy';
  end if;
end;
$$;
rollback;

-- Viewer is read-only and does not satisfy administrative, moderation, or
-- check-in role checks. It sees its own admin_users row only.
begin;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if not public.has_admin_role('viewer'::public.admin_role)
     or public.is_admin() or public.is_admin_panel_user() or public.is_superadmin()
     or public.has_admin_role('moderator'::public.admin_role)
     or public.has_admin_role('checkin_staff'::public.admin_role) then
    raise exception 'FAIL viewer_role_matrix';
  end if;
  if public.has_admin_role('viewer'::public.admin_role, '55555555-5555-4555-8555-555555555555'::uuid) then
    raise exception 'FAIL viewer_third_party_uid_probe';
  end if;
  if (select count(*) from public.admin_users) <> 1 then
    raise exception 'FAIL viewer_admin_users_policy';
  end if;
end;
$$;
do $$
declare visible_rows integer;
begin
  select count(*) into visible_rows from public.get_checkin_dashboard(null);
  if visible_rows <> 0 then raise exception 'FAIL viewer_checkin_rpc_has_no_results'; end if;
end;
$$;
rollback;

-- Check-in staff retains operational access but has no admin/report access.
begin;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if not public.has_admin_role('checkin_staff'::public.admin_role)
     or public.is_admin() or public.is_admin_panel_user() or public.is_superadmin() then
    raise exception 'FAIL checkin_role_matrix';
  end if;
  if public.is_admin('66666666-6666-4666-8666-666666666666'::uuid) then
    raise exception 'FAIL checkin_admin_third_party_probe';
  end if;
  if (select count(*) from public.get_checkin_dashboard(null)) < 0 then
    raise exception 'FAIL checkin_dashboard_rpc';
  end if;
end;
$$;
do $$
declare denied boolean := false;
begin
  begin perform public.get_admin_commerce_report();
  exception when others then denied := position('admin_required' in sqlerrm) > 0;
  end;
  if not denied then raise exception 'FAIL checkin_financial_report_denied'; end if;
end;
$$;
rollback;

-- Moderator keeps content moderation access but not general administration.
begin;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if not public.has_admin_role('moderator'::public.admin_role)
     or public.is_admin() or public.is_admin_panel_user() or public.is_superadmin() then
    raise exception 'FAIL moderator_role_matrix';
  end if;
  if public.has_admin_role('moderator'::public.admin_role, '66666666-6666-4666-8666-666666666666'::uuid) then
    raise exception 'FAIL moderator_third_party_probe';
  end if;
end;
$$;
do $$
declare denied boolean := false;
begin
  begin perform public.get_admin_commerce_report();
  exception when others then denied := position('admin_required' in sqlerrm) > 0;
  end;
  if not denied then raise exception 'FAIL moderator_financial_report_denied'; end if;
end;
$$;
rollback;

-- Admin may use administrative reports and panel policies, but cannot manage
-- role assignments reserved for superadmin.
begin;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if not public.is_admin() or not public.is_admin_panel_user()
     or public.is_superadmin() or not public.has_admin_role('admin'::public.admin_role) then
    raise exception 'FAIL admin_role_matrix';
  end if;
  if public.is_superadmin('11111111-1111-4111-8111-111111111111'::uuid) then
    raise exception 'FAIL admin_superadmin_third_party_probe';
  end if;
  if (select count(*) from public.admin_users) <> 5 then
    raise exception 'FAIL admin_panel_select_policy';
  end if;
  if jsonb_typeof(public.get_admin_commerce_report()) <> 'object' then
    raise exception 'FAIL admin_report_rpc';
  end if;
end;
$$;
do $$
declare affected integer;
begin
  update public.admin_users set role = 'viewer'
  where user_id = '33333333-3333-4333-8333-333333333333';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL admin_cannot_manage_roles'; end if;
end;
$$;
rollback;

-- Superadmin retains every role gate and role-management RLS access.
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if not public.is_admin() or not public.is_admin_panel_user() or not public.is_superadmin()
     or not public.has_admin_role('viewer'::public.admin_role)
     or not public.has_admin_role('moderator'::public.admin_role)
     or not public.has_admin_role('checkin_staff'::public.admin_role)
     or not public.has_admin_role('admin'::public.admin_role) then
    raise exception 'FAIL superadmin_role_matrix';
  end if;
  if public.is_admin('66666666-6666-4666-8666-666666666666'::uuid)
     or public.is_admin_panel_user('66666666-6666-4666-8666-666666666666'::uuid)
     or public.is_superadmin('66666666-6666-4666-8666-666666666666'::uuid)
     or public.has_admin_role('admin'::public.admin_role, '66666666-6666-4666-8666-666666666666'::uuid) then
    raise exception 'FAIL superadmin_third_party_probe';
  end if;
end;
$$;
do $$
declare affected integer;
begin
  update public.admin_users set role = 'viewer'
  where user_id = '33333333-3333-4333-8333-333333333333';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL superadmin_can_manage_roles'; end if;
end;
$$;
rollback;
