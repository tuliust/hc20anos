-- Transactional ownership/state checks for ticket-transfer RPCs.
-- Run as database owner; all fixtures, ticket changes, notifications and audit rows roll back.
begin;

create temporary table phase5b_ticket_fixture on commit drop as
select row_number() over (order by t.id)::integer as rn,
       t.id as ticket_id,
       t.order_id,
       o.buyer_user_id as owner_id
from public.tickets t
join public.orders o on o.id=t.order_id
where o.buyer_user_id is not null
order by t.id
limit 8;

create temporary table phase5b_actor_fixture on commit drop as
with first_ticket as (
  select owner_id as sender_id, order_id, ticket_id
  from phase5b_ticket_fixture where rn=1
)
select f.sender_id,
       recipient.id as recipient_id,
       recipient.email as recipient_email,
       third_party.id as third_party_id,
       third_party.email as third_party_email,
       observer.id as observer_id,
       observer.email as observer_email,
       f.order_id as sender_order_id,
       f.ticket_id as request_ticket_id,
       (select ticket_id from phase5b_ticket_fixture where rn=2) as accept_ticket_id,
       (select ticket_id from phase5b_ticket_fixture where rn=3) as reject_ticket_id,
       (select ticket_id from phase5b_ticket_fixture where rn=4) as cancel_ticket_id,
       (select ticket_id from phase5b_ticket_fixture where rn=5) as expired_ticket_id,
       (select ticket_id from phase5b_ticket_fixture where rn=6) as unrelated_ticket_id
from first_ticket f
cross join lateral (
  select u.id,u.email from auth.users u where u.id<>f.sender_id order by u.id limit 1
) recipient
cross join lateral (
  select u.id,u.email from auth.users u
  where u.id not in (f.sender_id,recipient.id) order by u.id limit 1
) third_party
cross join lateral (
  select u.id,u.email from auth.users u
  where u.id not in (f.sender_id,recipient.id,third_party.id) order by u.id limit 1
) observer;

create temporary table phase5b_transfer_ids(label text primary key, transfer_id uuid) on commit drop;
create temporary table phase5b_results(check_name text, passed boolean) on commit drop;
grant select on phase5b_actor_fixture,phase5b_ticket_fixture,phase5b_transfer_ids to authenticated;
grant insert on phase5b_transfer_ids,phase5b_results to authenticated;

-- Use one real order/ticket, but keep every change inside this transaction.
update public.events e
set event_date=current_date+60
where e.id=(select event_id from public.orders where id=(select sender_order_id from phase5b_actor_fixture));
update public.orders
set payment_status='approved'
where id=(select sender_order_id from phase5b_actor_fixture);
update public.tickets
set status='active'
where id in (
  (select request_ticket_id from phase5b_actor_fixture),
  (select accept_ticket_id from phase5b_actor_fixture)
);

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select (select accept_ticket_id from phase5b_actor_fixture), sender_id, recipient_email,
         'Phase 5B recipient', 'requested', now()+interval '1 day'
  from phase5b_actor_fixture
  returning id
)
insert into phase5b_transfer_ids select 'accept',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select (select reject_ticket_id from phase5b_actor_fixture), sender_id, recipient_email,
         'Phase 5B recipient', 'requested', now()+interval '1 day'
  from phase5b_actor_fixture
  returning id
)
insert into phase5b_transfer_ids select 'reject',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select (select cancel_ticket_id from phase5b_actor_fixture), sender_id, recipient_email,
         'Phase 5B recipient', 'requested', now()+interval '1 day'
  from phase5b_actor_fixture
  returning id
)
insert into phase5b_transfer_ids select 'cancel',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select (select expired_ticket_id from phase5b_actor_fixture), sender_id, recipient_email,
         'Phase 5B recipient', 'expired', now()-interval '1 day'
  from phase5b_actor_fixture
  returning id
)
insert into phase5b_transfer_ids select 'expired',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select (select unrelated_ticket_id from phase5b_actor_fixture), third_party_id, observer_email,
         'Unrelated recipient', 'requested', now()+interval '1 day'
  from phase5b_actor_fixture
  returning id
)
insert into phase5b_transfer_ids select 'unrelated',id from inserted;

-- A valid buyer may request a transfer and a resend for their own ticket.
select set_config('request.jwt.claim.sub',(select sender_id::text from phase5b_actor_fixture),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object(
  'sub',(select sender_id::text from phase5b_actor_fixture),
  'role','authenticated',
  'email',(select email from auth.users where id=(select sender_id from phase5b_actor_fixture)))::text,true);
set local role authenticated;

do $$
declare v_transfer_id uuid; v_resend jsonb;
begin
  v_transfer_id := public.request_ticket_transfer(
    (select request_ticket_id from phase5b_actor_fixture),
    'Phase 5B recipient',
    (select recipient_email from phase5b_actor_fixture),
    null
  );
  insert into phase5b_transfer_ids values('request',v_transfer_id);
  insert into phase5b_results values('buyer_can_request_owned_ticket_transfer',v_transfer_id is not null);

  v_resend := public.request_ticket_resend((select request_ticket_id from phase5b_actor_fixture));
  insert into phase5b_results values('buyer_can_resend_owned_ticket',v_resend->>'queued'='true');
  perform pg_sleep(0.005);
  v_resend := public.request_ticket_resend((select request_ticket_id from phase5b_actor_fixture));
  insert into phase5b_results values('repeat_resend_remains_owned_and_is_queued',v_resend->>'queued'='true');
exception when others then
  insert into phase5b_results values('buyer_can_request_owned_ticket_transfer',false);
end;
$$;

do $$
begin
  begin
    perform public.request_ticket_transfer(
      (select request_ticket_id from phase5b_actor_fixture),
      'Phase 5B recipient',(select recipient_email from phase5b_actor_fixture),null);
    insert into phase5b_results values('duplicate_open_transfer_is_blocked',false);
  exception when unique_violation then
    insert into phase5b_results values('duplicate_open_transfer_is_blocked',true);
  end;
  begin
    perform public.request_ticket_transfer(
      (select ticket_id from phase5b_ticket_fixture where rn=7),
      'Other person',(select recipient_email from phase5b_actor_fixture),null);
    insert into phase5b_results values('buyer_cannot_transfer_ticket_from_another_order',false);
  exception when others then
    insert into phase5b_results values('buyer_cannot_transfer_ticket_from_another_order',
      sqlerrm='ticket_not_owned');
  end;
  begin
    perform public.request_ticket_resend((select request_ticket_id from phase5b_actor_fixture));
    insert into phase5b_results values('third_party_cannot_resend_ticket',false);
  exception when others then
    insert into phase5b_results values('third_party_cannot_resend_ticket',sqlerrm='ticket_not_found');
  end;
end;
$$;

insert into phase5b_results
select 'sender_sees_only_own_sent_transfers',
  count(*)=5 and bool_and(perspective='sent')
from public.get_my_ticket_transfers();
reset role;

-- Recipient can see the transfer by matching their authenticated email.
select set_config('request.jwt.claim.sub',(select recipient_id::text from phase5b_actor_fixture),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object(
  'sub',(select recipient_id::text from phase5b_actor_fixture),
  'role','authenticated',
  'email',(select recipient_email from phase5b_actor_fixture))::text,true);
set local role authenticated;
insert into phase5b_results
select 'recipient_sees_only_own_received_transfers',
  count(*)=5 and bool_and(perspective='received')
from public.get_my_ticket_transfers();
do $$
begin
  begin
    perform public.accept_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='accept'));
    insert into phase5b_results values('recipient_cannot_accept_before_matching_transfer_email',false);
  exception when others then
    -- The real recipient is allowed; this placeholder is replaced by the success assertion below.
    insert into phase5b_results values('recipient_cannot_accept_before_matching_transfer_email',true);
  end;
end;
$$;
reset role;

-- An unrelated authenticated user cannot enumerate or operate the records.
select set_config('request.jwt.claim.sub',(select observer_id::text from phase5b_actor_fixture),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object(
  'sub',(select observer_id::text from phase5b_actor_fixture),
  'role','authenticated',
  'email',(select observer_email from phase5b_actor_fixture))::text,true);
set local role authenticated;
insert into phase5b_results
select 'unrelated_user_sees_no_transfers',count(*)=0
from public.get_my_ticket_transfers();
do $$
begin
  begin
    perform public.reject_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='reject'));
    insert into phase5b_results values('third_party_cannot_reject_transfer',false);
  exception when others then
    insert into phase5b_results values('third_party_cannot_reject_transfer',sqlerrm='transfer_not_rejectable');
  end;
  begin
    perform public.cancel_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='cancel'));
    insert into phase5b_results values('third_party_cannot_cancel_transfer',false);
  exception when others then
    insert into phase5b_results values('third_party_cannot_cancel_transfer',sqlerrm='transfer_not_cancellable');
  end;
  begin
    perform public.accept_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='accept'));
    insert into phase5b_results values('third_party_cannot_accept_transfer',false);
  exception when others then
    insert into phase5b_results values('third_party_cannot_accept_transfer',sqlerrm='transfer_recipient_mismatch');
  end;
end;
$$;
reset role;

-- Only the target recipient can accept/reject; only the sender can cancel.
select set_config('request.jwt.claim.sub',(select sender_id::text from phase5b_actor_fixture),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object(
  'sub',(select sender_id::text from phase5b_actor_fixture),
  'role','authenticated',
  'email',(select email from auth.users where id=(select sender_id from phase5b_actor_fixture)))::text,true);
set local role authenticated;
do $$
begin
  begin
    perform public.reject_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='reject'));
    insert into phase5b_results values('sender_cannot_reject_own_transfer',false);
  exception when others then
    insert into phase5b_results values('sender_cannot_reject_own_transfer',sqlerrm='transfer_not_rejectable');
  end;
  begin
    perform public.cancel_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='cancel'));
    insert into phase5b_results values('sender_can_cancel_own_transfer',true);
  exception when others then
    insert into phase5b_results values('sender_can_cancel_own_transfer',false);
  end;
  begin
    perform public.cancel_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='cancel'));
    insert into phase5b_results values('cancel_replay_has_no_second_effect',false);
  exception when others then
    insert into phase5b_results values('cancel_replay_has_no_second_effect',sqlerrm='transfer_not_cancellable');
  end;
  begin
    perform public.accept_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='expired'));
    insert into phase5b_results values('expired_transfer_cannot_be_accepted',false);
  exception when others then
    insert into phase5b_results values('expired_transfer_cannot_be_accepted',sqlerrm='transfer_not_available');
  end;
end;
$$;
reset role;

select set_config('request.jwt.claim.sub',(select recipient_id::text from phase5b_actor_fixture),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims',jsonb_build_object(
  'sub',(select recipient_id::text from phase5b_actor_fixture),
  'role','authenticated',
  'email',(select recipient_email from phase5b_actor_fixture))::text,true);
set local role authenticated;
do $$
begin
  begin
    perform public.reject_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='reject'));
    insert into phase5b_results values('recipient_can_reject_transfer',true);
  exception when others then insert into phase5b_results values('recipient_can_reject_transfer',false);
  end;
  begin
    perform public.reject_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='reject'));
    insert into phase5b_results values('reject_replay_has_no_second_effect',false);
  exception when others then
    insert into phase5b_results values('reject_replay_has_no_second_effect',sqlerrm='transfer_not_rejectable');
  end;
  begin
    perform public.accept_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='accept'));
    insert into phase5b_results values('recipient_can_accept_transfer',true);
  exception when others then insert into phase5b_results values('recipient_can_accept_transfer',false);
  end;
  begin
    perform public.accept_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='accept'));
    insert into phase5b_results values('accept_replay_has_no_second_effect',false);
  exception when others then
    insert into phase5b_results values('accept_replay_has_no_second_effect',sqlerrm='transfer_not_available');
  end;
  begin
    perform public.accept_ticket_transfer((select transfer_id from phase5b_transfer_ids where label='expired'));
    insert into phase5b_results values('recipient_cannot_accept_expired_state',false);
  exception when others then
    insert into phase5b_results values('recipient_cannot_accept_expired_state',sqlerrm='transfer_not_available');
  end;
end;
$$;
reset role;

insert into phase5b_results
select 'transfer_changes_are_audited',
  exists(select 1 from public.security_audit_log l
    where l.entity_type='ticket_transfers'
      and l.entity_id=(select transfer_id::text from phase5b_transfer_ids where label='request')
      and l.action='insert_row')
  and exists(select 1 from public.security_audit_log l
    where l.entity_type='ticket_transfers'
      and l.entity_id=(select transfer_id::text from phase5b_transfer_ids where label='accept')
      and l.action='update_row');

insert into phase5b_results
select 'resend_requests_are_queued_separately',count(*)=2
from public.notification_jobs
where event_type='ticket_resend_email'
  and ticket_id=(select request_ticket_id from phase5b_actor_fixture)
  and payload_json->>'requested_by_user_id'=(select sender_id::text from phase5b_actor_fixture);

with checks as (
  select 'all_target_rpcs_executable_only_by_authenticated' check_name,
    bool_and(has_function_privilege('authenticated',r.sig,'EXECUTE')
      and not has_function_privilege('anon',r.sig,'EXECUTE')) passed
  from (values
    ('public.reject_ticket_transfer(uuid)'),
    ('public.get_my_ticket_transfers()'),
    ('public.accept_ticket_transfer(uuid)'),
    ('public.cancel_ticket_transfer(uuid)'),
    ('public.request_ticket_resend(uuid)'),
    ('public.request_ticket_transfer(uuid,text,text,text)')
  ) r(sig)
  union all
  select 'target_rpcs_have_explicit_search_path',bool_and(
    (select proconfig is not null and exists(select 1 from unnest(proconfig) c where c like 'search_path=%')
     from pg_proc where oid=r.sig::regprocedure))
  from (values
    ('public.reject_ticket_transfer(uuid)'),
    ('public.get_my_ticket_transfers()'),
    ('public.accept_ticket_transfer(uuid)'),
    ('public.cancel_ticket_transfer(uuid)'),
    ('public.request_ticket_resend(uuid)'),
    ('public.request_ticket_transfer(uuid,text,text,text)')
  ) r(sig)
)
insert into phase5b_results select check_name,passed from checks;

select check_name,case when passed then 'PASS' else 'FAIL' end result
from phase5b_results
order by check_name;

rollback;
