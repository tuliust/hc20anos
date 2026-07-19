-- Completa a experiência de transferência para comprador e destinatário.

create or replace function public.get_my_ticket_transfers()
returns table (
  id uuid,
  perspective text,
  ticket_id uuid,
  replacement_ticket_id uuid,
  attendee_name text,
  to_name text,
  to_email text,
  to_phone text,
  status text,
  requested_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  old_qr_invalidated_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    tr.id,
    case when tr.from_user_id = auth.uid() then 'sent' else 'received' end,
    tr.ticket_id,
    tr.replacement_ticket_id,
    t.attendee_name,
    tr.to_name,
    tr.to_email,
    tr.to_phone,
    tr.status,
    tr.requested_at,
    tr.expires_at,
    tr.accepted_at,
    tr.completed_at,
    tr.cancelled_at,
    tr.old_qr_invalidated_at
  from public.ticket_transfers tr
  join public.tickets t on t.id = tr.ticket_id
  where tr.from_user_id = auth.uid()
     or lower(tr.to_email) = lower(coalesce(auth.jwt()->>'email',''))
  order by tr.requested_at desc;
$$;

create or replace function public.reject_ticket_transfer(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.ticket_transfers
  set status='rejected', updated_at=now()
  where id=p_transfer_id
    and status='requested'
    and lower(to_email)=lower(coalesce(auth.jwt()->>'email',''));
  if not found then raise exception 'transfer_not_rejectable'; end if;
end;
$$;

create or replace function public.expire_ticket_transfers(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  with expired as (
    update public.ticket_transfers
    set status='expired', updated_at=p_now
    where status='requested' and expires_at is not null and expires_at <= p_now
    returning id
  ) select count(*)::integer into v_count from expired;
  return v_count;
end;
$$;

create or replace function public.retry_order_payment(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_order public.orders; v_url text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_order from public.orders where id=p_order_id;
  if not found then raise exception 'order_not_found'; end if;
  if not (v_order.buyer_user_id=auth.uid() or lower(v_order.buyer_email)=lower(coalesce(auth.jwt()->>'email',''))) then raise exception 'order_not_owned'; end if;
  if v_order.payment_status not in ('pending','in_process','rejected','expired') then raise exception 'order_not_retryable'; end if;
  select checkout_url into v_url from public.payment_preferences where order_id=p_order_id and status='active' order by created_at desc limit 1;
  if v_url is null then raise exception 'active_payment_preference_not_found'; end if;
  return v_url;
end;
$$;

revoke all on function public.get_my_ticket_transfers() from public, anon;
revoke all on function public.reject_ticket_transfer(uuid) from public, anon;
revoke all on function public.expire_ticket_transfers(timestamptz) from public, anon, authenticated;
revoke all on function public.retry_order_payment(uuid) from public, anon;
grant execute on function public.get_my_ticket_transfers() to authenticated;
grant execute on function public.reject_ticket_transfer(uuid) to authenticated;
grant execute on function public.retry_order_payment(uuid) to authenticated;

select cron.unschedule(jobid) from cron.job where jobname='hc20-ticket-transfer-expiration';
select cron.schedule('hc20-ticket-transfer-expiration','*/15 * * * *',$$select public.expire_ticket_transfers(now());$$);

notify pgrst, 'reload schema';