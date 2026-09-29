-- Transactional ownership/state checks for ticket-transfer RPCs.
-- Self-contained local fixture: all synthetic orders, tickets, transfers,
-- notifications and audit rows are rolled back at the end.
begin;

create temporary table phase5b_results(check_name text, passed boolean) on commit drop;
create temporary table phase5b_transfer_ids(label text primary key, transfer_id uuid) on commit drop;
create temporary table phase5b_ticket_fixture(
  label text primary key,
  ticket_id uuid not null,
  order_id uuid not null,
  owner_id uuid not null
) on commit drop;

create temporary table phase5b_actor_fixture on commit drop as
select
  '22222222-2222-4222-8222-222222222222'::uuid as sender_id,
  '33333333-3333-4333-8333-333333333333'::uuid as recipient_id,
  (select email from auth.users where id='33333333-3333-4333-8333-333333333333'::uuid) as recipient_email,
  '44444444-4444-4444-8444-444444444444'::uuid as third_party_id,
  (select email from auth.users where id='44444444-4444-4444-8444-444444444444'::uuid) as third_party_email,
  '55555555-5555-4555-8555-555555555555'::uuid as observer_id,
  (select email from auth.users where id='55555555-5555-4555-8555-555555555555'::uuid) as observer_email,
  '00000000-0000-0000-0000-000000000001'::uuid as event_id,
  (select id from public.ticket_types
    where event_id='00000000-0000-0000-0000-000000000001'::uuid
    order by created_at,id
    limit 1) as ticket_type_id,
  null::uuid as sender_order_id,
  null::uuid as third_party_order_id,
  null::uuid as request_ticket_id,
  null::uuid as accept_ticket_id,
  null::uuid as reject_ticket_id,
  null::uuid as cancel_ticket_id,
  null::uuid as expired_ticket_id,
  null::uuid as unrelated_ticket_id;

do $$
begin
  if exists (
    select 1 from phase5b_actor_fixture
    where recipient_email is null
       or third_party_email is null
       or observer_email is null
       or ticket_type_id is null
  ) then
    raise exception 'phase5b_test_prerequisites_missing';
  end if;
end;
$$;

-- The event is cancelled in production. Reopen it only inside this transaction.
update public.events
set event_date=current_date+60,
    event_status='published',
    sales_status='open'
where id=(select event_id from phase5b_actor_fixture);

with inserted as (
  insert into public.orders(
    event_id,buyer_user_id,buyer_name,buyer_email,ticket_type_id,quantity,
    total_amount_cents,subtotal_amount_cents,extras_amount_cents,payment_status,
    paid_at,reservation_status,approved_inventory_applied_at
  )
  select event_id,sender_id,'Phase 5B sender',
         (select email from auth.users where id=sender_id),
         ticket_type_id,6,0,0,0,'approved',now(),'active',now()
  from phase5b_actor_fixture
  returning id
)
update phase5b_actor_fixture set sender_order_id=(select id from inserted);

with inserted as (
  insert into public.orders(
    event_id,buyer_user_id,buyer_name,buyer_email,ticket_type_id,quantity,
    total_amount_cents,subtotal_amount_cents,extras_amount_cents,payment_status,
    paid_at,reservation_status,approved_inventory_applied_at
  )
  select event_id,third_party_id,'Phase 5B third party',
         (select email from auth.users where id=third_party_id),
         ticket_type_id,1,0,0,0,'approved',now(),'active',now()
  from phase5b_actor_fixture
  returning id
)
update phase5b_actor_fixture set third_party_order_id=(select id from inserted);

with labels(label) as (
  values ('request'),('accept'),('reject'),('cancel'),('expired'),('spare')
),
participants as (
  insert into public.order_participants(
    order_id,user_id,participant_type,full_name,email,status,client_key
  )
  select a.sender_order_id,a.sender_id,'alumni',
         'Phase 5B '||l.label,
         (select email from auth.users where id=a.sender_id),
         'active','phase5b-'||l.label
  from phase5b_actor_fixture a
  cross join labels l
  returning id,client_key
),
inserted_tickets as (
  insert into public.tickets(
    order_id,ticket_type_id,order_participant_id,attendee_name,attendee_email,
    qr_code,qr_token,qr_token_hash,status,checked_in
  )
  select
    a.sender_order_id,a.ticket_type_id,p.id,'Phase 5B '||l.label,
    (select email from auth.users where id=a.sender_id),
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
    replace(gen_random_uuid()::text,'-',''),
    replace(gen_random_uuid()::text,'-',''),
    'active',false
  from phase5b_actor_fixture a
  cross join labels l
  join participants p on p.client_key='phase5b-'||l.label
  returning id,attendee_name,order_id
)
insert into phase5b_ticket_fixture(label,ticket_id,order_id,owner_id)
select lower(replace(attendee_name,'Phase 5B ','')),id,order_id,
       (select sender_id from phase5b_actor_fixture)
from inserted_tickets;

with participant as (
  insert into public.order_participants(
    order_id,user_id,participant_type,full_name,email,status,client_key
  )
  select third_party_order_id,third_party_id,'alumni','Phase 5B unrelated',
         third_party_email,'active','phase5b-unrelated'
  from phase5b_actor_fixture
  returning id
),
ticket as (
  insert into public.tickets(
    order_id,ticket_type_id,order_participant_id,attendee_name,attendee_email,
    qr_code,qr_token,qr_token_hash,status,checked_in
  )
  select a.third_party_order_id,a.ticket_type_id,p.id,'Phase 5B unrelated',
         a.third_party_email,
         upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
         replace(gen_random_uuid()::text,'-',''),
         replace(gen_random_uuid()::text,'-',''),
         'active',false
  from phase5b_actor_fixture a
  cross join participant p
  returning id,order_id
)
insert into phase5b_ticket_fixture(label,ticket_id,order_id,owner_id)
select 'unrelated',id,order_id,(select third_party_id from phase5b_actor_fixture)
from ticket;

update phase5b_actor_fixture
set request_ticket_id=(select ticket_id from phase5b_ticket_fixture where label='request'),
    accept_ticket_id=(select ticket_id from phase5b_ticket_fixture where label='accept'),
    reject_ticket_id=(select ticket_id from phase5b_ticket_fixture where label='reject'),
    cancel_ticket_id=(select ticket_id from phase5b_ticket_fixture where label='cancel'),
    expired_ticket_id=(select ticket_id from phase5b_ticket_fixture where label='expired'),
    unrelated_ticket_id=(select ticket_id from phase5b_ticket_fixture where label='unrelated');

grant select on phase5b_actor_fixture,phase5b_ticket_fixture,phase5b_transfer_ids to authenticated;
grant insert on phase5b_transfer_ids,phase5b_results to authenticated;

-- Seed transfer states for ownership/state assertions.
with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select accept_ticket_id,sender_id,recipient_email,'Phase 5B recipient','requested',now()+interval '1 day'
  from phase5b_actor_fixture returning id
)
insert into phase5b_transfer_ids select 'accept',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select reject_ticket_id,sender_id,recipient_email,'Phase 5B recipient','requested',now()+interval '1 day'
  from phase5b_actor_fixture returning id
)
insert into phase5b_transfer_ids select 'reject',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select cancel_ticket_id,sender_id,recipient_email,'Phase 5B recipient','requested',now()+interval '1 day'
  from phase5b_actor_fixture returning id
)
insert into phase5b_transfer_ids select 'cancel',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select expired_ticket_id,sender_id,recipient_email,'Phase 5B recipient','expired',now()-interval '1 day'
  from phase5b_actor_fixture returning id
)
insert into phase5b_transfer_ids select 'expired',id from inserted;

with inserted as (
  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,status,expires_at)
  select unrelated_ticket_id,third_party_id,'unrelated-recipient@local.invalid',
         'Unrelated recipient','requested',now()+interval '1 day'
  from phase5b_actor_fixture returning id
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
      (select unrelated_ticket_id from phase5b_actor_fixture),
      'Other person',(select recipient_email from phase5b_actor_fixture),null);
    insert into phase5b_results values('buyer_cannot_transfer_ticket_from_another_order',false);
  exception when others then
    insert into phase5b_results values('buyer_cannot_transfer_ticket_from_another_order',
      sqlerrm='ticket_not_owned');
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
do $
begin
  begin
    perform public.request_ticket_resend((select request_ticket_id from phase5b_actor_fixture));
    insert into phase5b_results values('third_party_cannot_resend_ticket',false);
  exception when others then
    insert into phase5b_results values('third_party_cannot_resend_ticket',sqlerrm='ticket_not_found');
  end;
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
