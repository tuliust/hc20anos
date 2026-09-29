-- Temporary role simulation for public.admin_users. All writes roll back.
begin;
create temporary table phase4_ctx as
with actor as (
  select user_id as actor_id
  from public.admin_users
  where role='superadmin'::public.admin_role
  order by user_id
  limit 1
),
candidates as (
  select u.id,
         row_number() over (order by u.id) as rn
  from auth.users u
  cross join actor a
  where u.id <> a.actor_id
)
select
  a.actor_id,
  (select c.id from candidates c where c.rn=1) as candidate_id,
  (select c.id from candidates c where c.rn=2) as third_id,
  (select c.id from candidates c where c.rn=3) as ordinary_id
from actor a;

-- The shared local fixture now seeds viewer/check-in/moderator/admin roles too.
-- Isolate this matrix to exactly one pre-existing superadmin; all deletes roll back.
delete from public.admin_users
where user_id <> (select actor_id from phase4_ctx);

grant select on phase4_ctx to anon,authenticated;

do $$ begin
  if (select actor_id is null or candidate_id is null or third_id is null or ordinary_id is null from phase4_ctx) then
    raise exception 'phase4a1_test_prerequisites_missing';
  end if;
end $$;

-- Seed a second role row under the owner, then test through the actual RLS policies.
insert into public.admin_users(user_id,role)
select candidate_id,'viewer'::public.admin_role from phase4_ctx;

create function pg_temp.assert_non_superadmin(expected_rows integer) returns boolean
language plpgsql as $$
declare n integer; affected integer; denied boolean:=false; target uuid;
begin
  select candidate_id into target from phase4_ctx;
  if public.is_admin() or public.is_admin_panel_user() or public.is_superadmin() then
    raise exception 'non_superadmin_helper_matrix_changed';
  end if;
  select count(*) into n from public.admin_users;
  if n <> expected_rows then raise exception 'admin_users_select_expected_%,_got_%',expected_rows,n; end if;
  begin
    insert into public.admin_users(user_id,role) values((select third_id from phase4_ctx),'viewer'::public.admin_role);
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'admin_users_insert_not_denied'; end if;
  update public.admin_users set role='admin'::public.admin_role where user_id=(select actor_id from phase4_ctx);
  get diagnostics affected=row_count;
  if affected <> 0 then raise exception 'admin_users_update_not_denied'; end if;
  delete from public.admin_users where user_id=(select actor_id from phase4_ctx);
  get diagnostics affected=row_count;
  if affected <> 0 then raise exception 'admin_users_delete_not_denied'; end if;
  return true;
end $$;
grant execute on function pg_temp.assert_non_superadmin(integer) to anon,authenticated;

-- anon: no visible rows and no DML. Denial may happen either at the
-- table-privilege layer or through RLS; both are valid security outcomes.
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','anon',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $
declare
  n integer := 0;
  affected integer := 0;
  denied boolean := false;
begin
  begin
    select count(*) into n from public.admin_users;
    if n<>0 then raise exception 'anon_admin_users_select_changed'; end if;
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.admin_users(user_id,role)
    values((select third_id from phase4_ctx),'viewer'::public.admin_role);
  exception when insufficient_privilege then
    denied:=true;
  end;
  if not denied then raise exception 'anon_admin_users_insert_not_denied'; end if;

  begin
    update public.admin_users set role='admin'::public.admin_role
      where user_id=(select actor_id from phase4_ctx);
    get diagnostics affected=row_count;
    if affected<>0 then raise exception 'anon_admin_users_update_changed'; end if;
  exception when insufficient_privilege then
    null;
  end;

  begin
    delete from public.admin_users where user_id=(select actor_id from phase4_ctx);
    get diagnostics affected=row_count;
    if affected<>0 then raise exception 'anon_admin_users_delete_changed'; end if;
  exception when insufficient_privilege then
    null;
  end;
end $;
reset role;

-- ordinary authenticated user has no admin_users row.
select set_config('request.jwt.claim.sub',(select ordinary_id::text from phase4_ctx),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select ordinary_id::text from phase4_ctx),'role','authenticated')::text,true);
set local role authenticated;
select pg_temp.assert_non_superadmin(0);
reset role;

-- viewer: only the authenticated member's self-read row.
update public.admin_users set role='viewer'::public.admin_role where user_id=(select actor_id from phase4_ctx);
select set_config('request.jwt.claim.sub',(select actor_id::text from phase4_ctx),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select actor_id::text from phase4_ctx),'role','authenticated')::text,true);
set local role authenticated;
select pg_temp.assert_non_superadmin(1);
reset role;

-- checkin_staff: still only self-read on the role directory.
update public.admin_users set role='checkin_staff'::public.admin_role where user_id=(select actor_id from phase4_ctx);
select set_config('request.jwt.claim.sub',(select actor_id::text from phase4_ctx),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select actor_id::text from phase4_ctx),'role','authenticated')::text,true);
set local role authenticated;
select pg_temp.assert_non_superadmin(1);
reset role;

-- moderator: still only self-read on the role directory.
update public.admin_users set role='moderator'::public.admin_role where user_id=(select actor_id from phase4_ctx);
select set_config('request.jwt.claim.sub',(select actor_id::text from phase4_ctx),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select actor_id::text from phase4_ctx),'role','authenticated')::text,true);
set local role authenticated;
select pg_temp.assert_non_superadmin(1);
reset role;

-- admin: can read the panel roster, but cannot change role assignments.
update public.admin_users set role='admin'::public.admin_role
where user_id=(select actor_id from phase4_ctx);
select set_config('request.jwt.claim.sub',(select actor_id::text from phase4_ctx),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select actor_id::text from phase4_ctx),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare n integer; affected integer; denied boolean:=false;
begin
  if not public.is_admin() or not public.is_admin_panel_user() or public.is_superadmin() then raise exception 'admin_helper_matrix_changed'; end if;
  select count(*) into n from public.admin_users;
  if n<>2 then raise exception 'admin_panel_select_changed'; end if;
  begin insert into public.admin_users(user_id,role)
    values((select third_id from phase4_ctx),'viewer'::public.admin_role);
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'admin_insert_not_denied'; end if;
  update public.admin_users set role='moderator'::public.admin_role where user_id=(select candidate_id from phase4_ctx);
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'admin_update_not_denied'; end if;
  delete from public.admin_users where user_id=(select candidate_id from phase4_ctx);
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'admin_delete_not_denied'; end if;
end $$;
reset role;

-- superadmin: USING and WITH CHECK permit role assignment and removal.
update public.admin_users set role='superadmin'::public.admin_role
where user_id=(select actor_id from phase4_ctx);
select set_config('request.jwt.claim.sub',(select actor_id::text from phase4_ctx),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select actor_id::text from phase4_ctx),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare n integer; affected integer; candidate uuid; target uuid;
begin
  select candidate_id,third_id into candidate,target from phase4_ctx;
  if not public.is_admin() or not public.is_admin_panel_user() or not public.is_superadmin() then
    raise exception 'superadmin_helper_matrix_changed';
  end if;
  select count(*) into n from public.admin_users;
  if n<>2 then raise exception 'superadmin_select_changed'; end if;
  insert into public.admin_users(user_id,role) values(target,'viewer'::public.admin_role);
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'superadmin_insert_with_check_failed'; end if;
  update public.admin_users set role='moderator'::public.admin_role where user_id=candidate;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'superadmin_update_using_or_with_check_failed'; end if;
  delete from public.admin_users where user_id=candidate;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'superadmin_delete_using_failed'; end if;
end $$;
reset role;

rollback;
select 'PASS: anon, authenticated, viewer, checkin_staff, moderator, admin, superadmin; SELECT/INSERT/UPDATE/DELETE; USING/WITH CHECK' as result;
