-- Resolve pgcrypto functions from the extension schema inside the SECURITY DEFINER RPC.
-- pgcrypto is installed in extensions, while this function intentionally keeps search_path=public.

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

  update public.tickets
  set status='transferred',
      cancelled_at=now(),
      cancellation_reason='ticket_transfer',
      order_participant_id=null,
      updated_at=now()
  where id=v_old.id;

  update public.order_participants
  set user_id=auth.uid(),
      full_name=v_transfer.to_name,
      email=v_transfer.to_email,
      phone=coalesce(v_transfer.to_phone,phone),
      status='active',
      updated_at=now()
  where id=v_participant.id;

  v_token := encode(extensions.gen_random_bytes(24),'hex');

  insert into public.tickets(
    order_id,ticket_type_id,person_id,order_participant_id,
    attendee_name,attendee_email,attendee_phone,
    qr_code,qr_token,qr_token_hash,status,checked_in,transferred_from_ticket_id
  )
  values(
    v_old.order_id,v_old.ticket_type_id,null,v_participant.id,
    v_transfer.to_name,v_transfer.to_email,coalesce(v_transfer.to_phone,v_old.attendee_phone),
    upper(substr(v_token,1,12)),
    v_token,
    encode(extensions.digest(v_token,'sha256'),'hex'),
    'active',false,v_old.id
  )
  returning id into v_new_id;

  update public.ticket_transfers
  set status='completed',
      to_user_id=auth.uid(),
      accepted_by_user_id=auth.uid(),
      accepted_at=now(),
      completed_at=now(),
      old_qr_invalidated_at=now(),
      replacement_ticket_id=v_new_id,
      updated_at=now()
  where id=p_transfer_id;

  insert into public.notification_jobs(
    event_type,order_id,ticket_id,recipient_email,idempotency_key,payload_json
  )
  values(
    'ticket_transfer_completed',v_old.order_id,v_new_id,v_transfer.to_email,
    'ticket-transfer-completed:'||p_transfer_id,
    jsonb_build_object('transfer_id',p_transfer_id,'participant_name',v_transfer.to_name)
  )
  on conflict(idempotency_key) do nothing;

  return v_new_id;
end $$;
