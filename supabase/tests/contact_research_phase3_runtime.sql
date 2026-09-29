-- Transactional runtime checks for Fase 3. Run as a database owner; final ROLLBACK
-- removes the sample contact, rate-limit bucket, and audit rows.
begin;
select set_config('request.headers', '{"x-forwarded-for":"203.0.113.89"}', true);
create temporary table phase3_fixture(person_id uuid) on commit drop;
insert into phase3_fixture
select roster.person_id
from public.contact_research_roster roster
order by roster.person_id
limit 2;

do $$
begin
  if (select count(*) from phase3_fixture) <> 2 then
    raise exception 'phase3_test_prerequisites_missing';
  end if;
end;
$$;

-- Keep the runtime fixture deterministic even when seeded data already contains
-- contact research for every roster entry. These deletes are transactional.
delete from public.alumni_contact_research
where person_id in (select person_id from phase3_fixture);

delete from public.rate_limit_buckets
where action='contact_research_save';

grant select on phase3_fixture to anon, authenticated;

-- The clean local fixture does not ship a contact collector. Create one
-- transactionally so the manager path is deterministic and disappears on rollback.
insert into public.contact_collectors(user_id, is_active)
values ('22222222-2222-4222-8222-222222222222'::uuid, true)
on conflict (user_id) do update
set is_active = true,
    updated_at = now();

create temporary table phase3_actor(user_id uuid) on commit drop;
insert into phase3_actor
select u.id from auth.users u
where not exists (select 1 from public.contact_collectors c where c.user_id=u.id and c.is_active)
  and not exists (select 1 from public.admin_users a where a.user_id=u.id and a.role in ('admin','superadmin'))
limit 1;
grant select on phase3_actor to authenticated;
create temporary table phase3_manager(user_id uuid) on commit drop;
insert into phase3_manager
select c.user_id
from public.contact_collectors c
where c.user_id = '22222222-2222-4222-8222-222222222222'::uuid
  and c.is_active
limit 1;
grant select on phase3_manager to authenticated;

set local role anon;

create temporary table phase3_first as
select public.save_contact_research((select person_id from phase3_fixture order by person_id limit 1), '+1 202 555 0147', null, null, null, 'ios_shortcut', false) as result;
create temporary table phase3_invalid as
select public.save_contact_research((select person_id from phase3_fixture order by person_id desc limit 1), null, null, 'not-an-email', null, 'manual', false) as result;
create temporary table phase3_duplicate as
select public.save_contact_research((select person_id from phase3_fixture order by person_id limit 1), '+1 202 555 0198', null, null, null, 'manual', false) as result;

select 'anonymous_first_contribution_succeeds' as check_name,
       result->>'ok' = 'true' and result->>'status' = 'located' as passed
from phase3_first;
select 'anonymous_duplicate_does_not_overwrite' as check_name,
       result->>'ok' = 'false' and result->>'code' = 'contact_already_recorded' as passed
from phase3_duplicate;
select 'invalid_email_is_rejected' as check_name,
       result->>'ok'='false' and result->>'code'='invalid_email' as passed
from phase3_invalid;
select 'anonymous_return_has_no_contact_values' as check_name,
       not (result ?| array['phone','instagram','email','notes','updated_by','source']) as passed
from phase3_first;
select 'anonymous_direct_table_access_revoked' as check_name,
       not has_table_privilege('anon','public.alumni_contact_research','SELECT')
       and not has_table_privilege('anon','public.alumni_contact_research','UPDATE') as passed;

-- Repeated requests with the same source address must eventually be throttled.
create temporary table phase3_abuse as
select public.save_contact_research((select person_id from phase3_fixture order by person_id limit 1), '+1 202 555 0147', null, null, null, 'manual', false) as result
from generate_series(1, 60);
select 'anonymous_repetition_is_rate_limited' as check_name,
       count(*) filter (where result->>'code' = 'rate_limited') > 0 as passed
from phase3_abuse;

reset role;
select 'anonymous_success_is_audited_without_pii' as check_name,
       exists (select 1 from public.security_audit_log l
         where l.action='contact_research_saved'
           and l.entity_id=(select person_id::text from phase3_fixture limit 1)
           and l.request_key like 'anonymous:%'
           and not (l.metadata_json ?| array['phone','instagram','email','notes'])) as passed;

select set_config('request.jwt.claim.sub', (select user_id::text from phase3_manager), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', jsonb_build_object('sub',(select user_id::text from phase3_manager),'role','authenticated')::text, true);
set local role authenticated;
select 'authorized_collector_can_read_private_details' as check_name,
       count(*) > 0 as passed
from public.get_contact_research_private_details();
create temporary table phase3_private_read as
select count(*) > 0 as passed from public.get_contact_research_private_details();
create temporary table phase3_manager_update as
select public.save_contact_research((select person_id from phase3_fixture order by person_id limit 1), '+1 202 555 0101', null, null, 'verified by collector', 'manual', false) as result;
select 'authorized_collector_can_update_contact' as check_name,
       result->>'ok'='true' and result->>'status'='located' as passed from phase3_manager_update;
reset role;
select 'manager_update_audit_has_actor' as check_name,
       exists (select 1 from public.security_audit_log l
         where l.action='contact_research_saved'
           and l.entity_id=(select person_id::text from phase3_fixture limit 1)
           and l.actor_user_id=(select user_id from phase3_manager)) as passed;

select set_config('request.jwt.claim.sub', (select user_id::text from phase3_actor), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', jsonb_build_object('sub',(select user_id::text from phase3_actor),'role','authenticated')::text, true);
set local role authenticated;
select 'authenticated_can_read_directory' as check_name,
       count(*) > 0 as passed
from public.get_contact_research_directory();
create temporary table phase3_directory_read as
select count(*) > 0 as passed from public.get_contact_research_directory();
select 'authenticated_regular_cannot_read_private_details' as check_name,
       not public.can_manage_contact_research() as passed;
create temporary table phase3_private_denied(passed boolean);
do $$
begin
  begin
    perform * from public.get_contact_research_private_details();
    raise exception 'private details unexpectedly returned to a regular user';
  exception when sqlstate '42501' then
    raise notice 'PASS: regular authenticated user denied private contact details';
  end;
  insert into phase3_private_denied values (true);
end;
$$;
create temporary table phase3_authenticated_save as
select public.save_contact_research((select person_id from phase3_fixture order by person_id desc limit 1), null, '@phase3test', null, null, 'manual', false) as result;
select 'authenticated_regular_first_contribution_succeeds' as check_name,
       result->>'ok'='true' and result->>'status'='located' as passed
from phase3_authenticated_save;
reset role;
select 'authenticated_success_audit_uses_auth_uid' as check_name,
       exists (select 1 from public.security_audit_log l
         where l.action='contact_research_saved'
           and l.entity_id=(select person_id::text from phase3_fixture order by person_id desc limit 1)
           and l.actor_user_id=(select user_id from phase3_actor)) as passed;

select check_name, passed
from (
  select 'anonymous_first_contribution_succeeds'::text as check_name,
    result->>'ok'='true' and result->>'status'='located' as passed from phase3_first
  union all select 'anonymous_duplicate_does_not_overwrite',
    result->>'ok'='false' and result->>'code'='contact_already_recorded' from phase3_duplicate
  union all select 'invalid_email_is_rejected',
    result->>'ok'='false' and result->>'code'='invalid_email' from phase3_invalid
  union all select 'anonymous_return_has_no_contact_values',
    not (result ?| array['phone','instagram','email','notes','updated_by','source']) from phase3_first
  union all select 'anonymous_direct_table_access_revoked',
    not has_table_privilege('anon','public.alumni_contact_research','SELECT')
    and not has_table_privilege('anon','public.alumni_contact_research','UPDATE')
  union all select 'anonymous_repetition_is_rate_limited',
    count(*) filter (where result->>'code'='rate_limited') > 0 from phase3_abuse
  union all select 'anonymous_success_is_audited_without_pii', exists (
    select 1 from public.security_audit_log l where l.action='contact_research_saved'
      and l.entity_id=(select person_id::text from phase3_fixture order by person_id limit 1)
      and l.request_key like 'anonymous:%'
      and not (l.metadata_json ?| array['phone','instagram','email','notes']))
  union all select 'authorized_collector_can_read_private_details', passed from phase3_private_read
  union all select 'authorized_collector_can_update_contact',
    result->>'ok'='true' and result->>'status'='located' from phase3_manager_update
  union all select 'manager_update_audit_has_actor', exists (
    select 1 from public.security_audit_log l where l.action='contact_research_saved'
      and l.entity_id=(select person_id::text from phase3_fixture order by person_id limit 1)
      and l.actor_user_id=(select user_id from phase3_manager))
  union all select 'authenticated_can_read_directory', passed from phase3_directory_read
  union all select 'authenticated_regular_cannot_read_private_details', passed from phase3_private_denied
  union all select 'authenticated_regular_first_contribution_succeeds',
    result->>'ok'='true' and result->>'status'='located' from phase3_authenticated_save
  union all select 'authenticated_success_audit_uses_auth_uid', exists (
    select 1 from public.security_audit_log l where l.action='contact_research_saved'
      and l.entity_id=(select person_id::text from phase3_fixture order by person_id desc limit 1)
      and l.actor_user_id=(select user_id from phase3_actor))
) assertions
order by check_name;

rollback;
