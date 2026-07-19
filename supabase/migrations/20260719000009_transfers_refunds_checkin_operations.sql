-- Transferências, reembolsos e check-in operacional

alter table public.ticket_transfers add column if not exists to_name text;
alter table public.ticket_transfers add column if not exists to_phone text;
alter table public.ticket_transfers add column if not exists accepted_by_user_id uuid references auth.users(id) on delete set null;
alter table public.ticket_transfers add column if not exists replacement_ticket_id uuid references public.tickets(id) on delete set null;
alter table public.ticket_transfers add column if not exists expires_at timestamptz;
alter table public.ticket_transfers add column if not exists admin_notes text;

alter table public.refund_requests add column if not exists provider_payment_id text;
alter table public.refund_requests add column if not exists provider_response_json jsonb;
alter table public.refund_requests add column if not exists inventory_restored_at timestamptz;
alter table public.refund_requests add column if not exists failure_reason text;

create table if not exists public.checkin_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  action text not null check (action in ('check_in','undo_check_in','deliver_vouchers','undo_vouchers')),
  operator_user_id uuid not null references auth.users(id) on delete restrict,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists checkin_events_ticket_created_idx on public.checkin_events(ticket_id, created_at desc);

create or replace function public.request_ticket_transfer(
  p_ticket_id uuid,
  p_to_name text,
  p_to_email text,
  p_to_phone text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_ticket public.tickets;
  v_order public.orders;
  v_event public.events;
  v_id uuid;
  v_email text := lower(trim(p_to_email));
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if trim(coalesce(p_to_name,'')) = '' or v_email = '' then raise exception 'recipient_required'; end if;

  select * into v_ticket from public.tickets where id=p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;
  select * into v_order from public.orders where id=v_ticket.order_id;
  select * into v_event from public.events where id=v_order.event_id;

  if not (v_order.buyer_user_id=auth.uid() or lower(v_ticket.attendee_email)=lower(coalesce(auth.jwt()->>'email',''))) then
    raise exception 'ticket_not_owned';
  end if;
  if v_ticket.status <> 'active' or v_ticket.checked_in then raise exception 'ticket_not_transferable'; end if;
  if now() >= ((v_event.event_date::text || ' ' || coalesce(v_event.event_time::text,'00:00:00'))::timestamp at time zone coalesce(v_event.event_timezone,'America/Sao_Paulo')) - interval '24 hours' then
    raise exception 'transfer_window_closed';
  end if;

  insert into public.ticket_transfers(ticket_id,from_user_id,to_email,to_name,to_phone,status,expires_at)
  values(p_ticket_id,auth.uid(),v_email,trim(p_to_name),nullif(trim(coalesce(p_to_phone,'')),''),'requested',
    ((v_event.event_date::text || ' ' || coalesce(v_event.event_time::text,'00:00:00'))::timestamp at time zone coalesce(v_event.event_timezone,'America/Sao_Paulo')) - interval '24 hours')
  returning id into v_id;

  insert into public.notification_jobs(event_type,order_id,ticket_id,recipient_email,idempotency_key,payload_json)
  values('ticket_transfer_requested',v_ticket.order_id,v_ticket.id,v_email,'ticket-transfer-requested:'||v_id,
    jsonb_build_object('transfer_id',v_id,'participant_name',p_to_name,'ticket_code',v_ticket.qr_code))
  on conflict(idempotency_key) do nothing;
  return v_id;
end $$;

create or replace function public.accept_ticket_transfer(p_transfer_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_transfer public.ticket_transfers;
  v_old public.tickets;
  v_participant public.order_participants;
  v_new_id uuid;
  v_token text;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_transfer from public.ticket_transfers where id=p_transfer_id for update;
  if not found then raise exception 'transfer_not_found'; end if;
  if v_transfer.status <> 'requested' or now() >= coalesce(v_transfer.expires_at,now()-interval '1 second') then raise exception 'transfer_not_available'; end if;
  if lower(v_transfer.to_email) <> v_email then raise exception 'transfer_recipient_mismatch'; end if;

  select * into v_old from public.tickets where id=v_transfer.ticket_id for update;
  if v_old.status <> 'active' or v_old.checked_in then raise exception 'ticket_not_transferable'; end if;
  select * into v_participant from public.order_participants where id=v_old.order_participant_id for update;

  update public.tickets set status='transferred',cancelled_at=now(),cancellation_reason='ticket_transfer',order_participant_id=null,updated_at=now() where id=v_old.id;
  update public.order_participants set user_id=auth.uid(),full_name=v_transfer.to_name,email=v_transfer.to_email,phone=coalesce(v_transfer.to_phone,phone),status='active',updated_at=now() where id=v_participant.id;

  v_token := encode(gen_random_bytes(24),'hex');
  insert into public.tickets(order_id,ticket_type_id,person_id,order_participant_id,attendee_name,attendee_email,attendee_phone,qr_code,qr_token,qr_token_hash,status,checked_in,transferred_from_ticket_id)
  values(v_old.order_id,v_old.ticket_type_id,null,v_participant.id,v_transfer.to_name,v_transfer.to_email,coalesce(v_transfer.to_phone,v_old.attendee_phone),upper(substr(v_token,1,12)),v_token,encode(digest(v_token,'sha256'),'hex'),'active',false,v_old.id)
  returning id into v_new_id;

  update public.ticket_transfers set status='completed',to_user_id=auth.uid(),accepted_by_user_id=auth.uid(),accepted_at=now(),completed_at=now(),old_qr_invalidated_at=now(),replacement_ticket_id=v_new_id,updated_at=now() where id=p_transfer_id;

  insert into public.notification_jobs(event_type,order_id,ticket_id,recipient_email,idempotency_key,payload_json)
  values('ticket_transfer_completed',v_old.order_id,v_new_id,v_transfer.to_email,'ticket-transfer-completed:'||p_transfer_id,
    jsonb_build_object('transfer_id',p_transfer_id,'participant_name',v_transfer.to_name))
  on conflict(idempotency_key) do nothing;
  return v_new_id;
end $$;

create or replace function public.cancel_ticket_transfer(p_transfer_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  update public.ticket_transfers set status='cancelled',cancelled_at=now(),updated_at=now()
  where id=p_transfer_id and status='requested' and from_user_id=auth.uid();
  if not found then raise exception 'transfer_not_cancellable'; end if;
end $$;

create or replace function public.request_order_refund(p_order_id uuid,p_reason text) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_order public.orders; v_id uuid; v_fee integer:=0; v_deadline timestamptz;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if not (v_order.buyer_user_id=auth.uid() or lower(v_order.buyer_email)=lower(coalesce(auth.jwt()->>'email',''))) then raise exception 'order_not_owned'; end if;
  if v_order.payment_status <> 'approved' then raise exception 'order_not_refundable'; end if;
  v_deadline := least(coalesce(v_order.paid_at,v_order.created_at)+interval '7 days','2026-10-18 00:00:00-03'::timestamptz);
  if now() > v_deadline then raise exception 'refund_window_closed'; end if;
  if exists(select 1 from public.refund_requests where order_id=p_order_id and status in ('requested','under_review','approved','processing','refunded')) then raise exception 'refund_already_requested'; end if;

  insert into public.refund_requests(order_id,requested_by_user_id,reason,status,gross_amount_cents,non_recoverable_fee_cents,refund_amount_cents,provider_payment_id)
  values(p_order_id,auth.uid(),trim(p_reason),'requested',v_order.total_amount_cents,v_fee,greatest(v_order.total_amount_cents-v_fee,0),v_order.payment_provider_order_id)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.get_admin_refund_requests()
returns setof public.refund_requests language sql security definer set search_path=public as $$
  select r.* from public.refund_requests r
  where exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role in ('superadmin','admin'))
  order by requested_at desc;
$$;

create or replace function public.review_refund_request(p_request_id uuid,p_approve boolean,p_notes text default null) returns void
language plpgsql security definer set search_path=public as $$
declare v_admin public.admin_users;
begin
  select * into v_admin from public.admin_users where user_id=auth.uid() and role in ('superadmin','admin');
  if not found then raise exception 'admin_required'; end if;
  update public.refund_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now(),reviewed_by_admin_id=v_admin.id,notes=p_notes,updated_at=now()
  where id=p_request_id and status in ('requested','under_review');
  if not found then raise exception 'refund_not_reviewable'; end if;
end $$;

create or replace function public.get_checkin_dashboard(p_search text default null)
returns table(ticket_id uuid,attendee_name text,attendee_email text,qr_code text,ticket_status text,checked_in boolean,checked_in_at timestamptz,order_id uuid,extras jsonb)
language sql security definer set search_path=public as $$
  select t.id,t.attendee_name,t.attendee_email,t.qr_code,t.status,t.checked_in,t.checked_in_at,t.order_id,
    coalesce((select jsonb_agg(jsonb_build_object('id',pe.id,'type',pe.extra_type,'quantity',pe.quantity,'units',pe.units_per_package,'delivered_at',pe.physical_vouchers_delivered_at)) from public.participant_extras pe where pe.order_participant_id=t.order_participant_id),'[]'::jsonb)
  from public.tickets t
  where exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role in ('superadmin','admin','checkin_staff'))
    and (p_search is null or trim(p_search)='' or t.qr_code ilike '%'||p_search||'%' or t.attendee_name ilike '%'||p_search||'%' or t.attendee_email ilike '%'||p_search||'%')
  order by t.checked_in,t.attendee_name limit 100;
$$;

create or replace function public.perform_ticket_checkin(p_ticket_id uuid,p_undo boolean default false,p_notes text default null) returns public.tickets
language plpgsql security definer set search_path=public as $$
declare v_ticket public.tickets;
begin
  if not exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role in ('superadmin','admin','checkin_staff')) then raise exception 'checkin_permission_required'; end if;
  select * into v_ticket from public.tickets where id=p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;
  if not p_undo then
    if v_ticket.status <> 'active' then raise exception 'ticket_invalid'; end if;
    if v_ticket.checked_in then raise exception 'ticket_already_checked_in'; end if;
    update public.tickets set checked_in=true,checked_in_at=now(),checked_in_by_admin_id=(select id from public.admin_users where user_id=auth.uid() limit 1),status='used',updated_at=now() where id=p_ticket_id returning * into v_ticket;
    insert into public.checkin_events(ticket_id,action,operator_user_id,notes) values(p_ticket_id,'check_in',auth.uid(),p_notes);
  else
    if not v_ticket.checked_in then raise exception 'ticket_not_checked_in'; end if;
    update public.tickets set checked_in=false,checked_in_at=null,checked_in_by_admin_id=null,status='active',updated_at=now() where id=p_ticket_id returning * into v_ticket;
    insert into public.checkin_events(ticket_id,action,operator_user_id,notes) values(p_ticket_id,'undo_check_in',auth.uid(),p_notes);
  end if;
  return v_ticket;
end $$;

create or replace function public.set_participant_vouchers_delivered(p_ticket_id uuid,p_delivered boolean,p_notes text default null) returns void
language plpgsql security definer set search_path=public as $$
declare v_participant uuid;
begin
  if not exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role in ('superadmin','admin','checkin_staff')) then raise exception 'checkin_permission_required'; end if;
  select order_participant_id into v_participant from public.tickets where id=p_ticket_id;
  if v_participant is null then raise exception 'participant_not_found'; end if;
  update public.participant_extras set physical_vouchers_delivered_at=case when p_delivered then now() else null end,physical_vouchers_delivered_by=case when p_delivered then auth.uid() else null end,updated_at=now() where order_participant_id=v_participant;
  insert into public.checkin_events(ticket_id,action,operator_user_id,notes) values(p_ticket_id,case when p_delivered then 'deliver_vouchers' else 'undo_vouchers' end,auth.uid(),p_notes);
end $$;

revoke all on function public.request_ticket_transfer(uuid,text,text,text) from public,anon;
revoke all on function public.accept_ticket_transfer(uuid) from public,anon;
revoke all on function public.cancel_ticket_transfer(uuid) from public,anon;
revoke all on function public.request_order_refund(uuid,text) from public,anon;
grant execute on function public.request_ticket_transfer(uuid,text,text,text),public.accept_ticket_transfer(uuid),public.cancel_ticket_transfer(uuid),public.request_order_refund(uuid,text) to authenticated;
revoke all on function public.get_admin_refund_requests(),public.review_refund_request(uuid,boolean,text),public.get_checkin_dashboard(text),public.perform_ticket_checkin(uuid,boolean,text),public.set_participant_vouchers_delivered(uuid,boolean,text) from public,anon;
grant execute on function public.get_admin_refund_requests(),public.review_refund_request(uuid,boolean,text),public.get_checkin_dashboard(text),public.perform_ticket_checkin(uuid,boolean,text),public.set_participant_vouchers_delivered(uuid,boolean,text) to authenticated;

alter table public.checkin_events enable row level security;
revoke all on public.checkin_events from anon,authenticated;
notify pgrst,'reload schema';