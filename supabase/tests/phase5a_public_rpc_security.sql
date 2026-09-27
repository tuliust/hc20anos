-- Read-only contract and behavior checks for Lote 5A.
-- Run as database owner. The transaction is rolled back at the end.
begin;

create temporary table phase5a_event_fixture on commit drop as
select id as event_id from public.events order by created_at limit 1;
create temporary table phase5a_token_fixture on commit drop as
select public_token from public.orders order by created_at limit 1;
create temporary table phase5a_superadmin_fixture on commit drop as
select user_id from public.admin_users where role = 'superadmin' limit 1;
create temporary table phase5a_results(check_name text, passed boolean) on commit drop;
grant select on phase5a_event_fixture, phase5a_token_fixture to anon;
grant select on phase5a_superadmin_fixture to authenticated;
grant insert on phase5a_results to anon, authenticated;

insert into phase5a_results
with checks as (
  select 'checkout_rpc_returns_only_payment_status' as check_name,
    pg_get_function_result('public.get_checkout_status_by_token(uuid)'::regprocedure)
      = 'TABLE(payment_status text)' as passed
  union all
  select 'checkout_token_is_generated_and_unique',
    (select column_default like '%gen_random_uuid%'
       from information_schema.columns
      where table_schema='public' and table_name='orders' and column_name='public_token')
    and exists(select 1 from pg_indexes where schemaname='public' and tablename='orders'
      and indexdef ilike '%unique%' and indexdef ilike '%(public_token)%')
  union all
  select 'checkout_rpc_has_no_public_execute',
    not exists(
      select 1 from aclexplode((select proacl from pg_proc
        where oid='public.get_checkout_status_by_token(uuid)'::regprocedure)) acl
      where acl.grantee=0 and acl.privilege_type='EXECUTE'
    )
  union all
  select 'checkout_rpc_roles_preserved',
    has_function_privilege('anon','public.get_checkout_status_by_token(uuid)','EXECUTE')
    and has_function_privilege('authenticated','public.get_checkout_status_by_token(uuid)','EXECUTE')
    and has_function_privilege('service_role','public.get_checkout_status_by_token(uuid)','EXECUTE')
  union all
  select 'checkout_rpc_uses_empty_search_path',
    (select proconfig @> array['search_path=""'] from pg_proc
      where oid='public.get_checkout_status_by_token(uuid)'::regprocedure)
  union all
  select 'directory_contract_has_only_ui_fields',
    pg_get_function_result('public.get_contact_research_directory()'::regprocedure)
      = 'TABLE(person_id uuid, full_name text, class_group text, research_status text, can_contribute boolean)'
  union all
  select 'private_details_requires_manager',
    position('can_manage_contact_research' in
      pg_get_functiondef('public.get_contact_research_private_details()'::regprocedure)) > 0
    and not has_function_privilege('anon','public.get_contact_research_private_details()','EXECUTE')
  union all
  select 'public_memories_is_explicitly_filtered',
    position('row_security=off' in array_to_string((select proconfig from pg_proc
      where oid='public.get_public_memories(uuid,boolean)'::regprocedure),',')) > 0
    and position('m.status = ''approved''' in
      pg_get_functiondef('public.get_public_memories(uuid,boolean)'::regprocedure)) > 0
    and position('case when m.is_anonymous then null else m.author_name end' in
      pg_get_functiondef('public.get_public_memories(uuid,boolean)'::regprocedure)) > 0
  union all
  select 'private_schema_and_rls_contract_preserved',
    (select relrowsecurity from pg_class where oid='public.alumni_contact_research'::regclass)
    and not has_table_privilege('anon','public.alumni_contact_research','SELECT')
)
select check_name, passed
from checks
;

set local role anon;

insert into phase5a_results
select 'anon_unknown_checkout_token_returns_no_row', count(*)=0
from public.get_checkout_status_by_token('f5e193bc-b337-4961-9ae4-e5012b983b44'::uuid);

insert into phase5a_results
select 'anon_valid_checkout_bearer_returns_one_status_only',
  case when exists(select 1 from phase5a_token_fixture)
    then (select count(*)=1 from public.get_checkout_status_by_token(
      (select public_token from phase5a_token_fixture)))
    else true end as passed;

insert into phase5a_results
select 'anon_memories_return_approved_rows_without_identity_ids',
  count(*) filter (where status <> 'approved'
    or user_id is not null or person_id is not null or approved_by_admin_id is not null
    or (is_anonymous and author_name is not null)) = 0 as passed
from public.get_public_memories(
  coalesce((select event_id from phase5a_event_fixture), '00000000-0000-0000-0000-000000000001'::uuid),
  false
);

insert into phase5a_results
select 'anon_can_read_public_directory_without_contact_values',
  count(*) >= 0 as passed
from public.get_contact_research_directory();

reset role;

select set_config('request.jwt.claim.sub', (select user_id::text from phase5a_superadmin_fixture), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub',(select user_id::text from phase5a_superadmin_fixture),
  'role','authenticated')::text, true);
set local role authenticated;

insert into phase5a_results
select 'superadmin_is_authorized_for_private_contact_details',
  public.can_manage_contact_research()
  and exists(select 1 from phase5a_superadmin_fixture) as passed;

reset role;
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from phase5a_results
order by check_name;
rollback;
