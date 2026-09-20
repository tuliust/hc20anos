-- Corrige a classificação de tentativas de reutilização no check-in.
-- O estado checked_in deve prevalecer sobre o status 'used' para que
-- uma segunda leitura do mesmo QR retorne ticket_already_checked_in.

create or replace function public.perform_ticket_checkin(
  p_ticket_id uuid,
  p_undo boolean default false,
  p_notes text default null
)
returns public.tickets
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_ticket public.tickets;
begin
  if not exists(
    select 1
    from public.admin_users a
    where a.user_id=auth.uid()
      and a.role in ('superadmin','admin','checkin_staff')
  ) then
    raise exception 'checkin_permission_required';
  end if;

  select *
    into v_ticket
  from public.tickets
  where id=p_ticket_id
  for update;

  if not found then
    raise exception 'ticket_not_found';
  end if;

  if not p_undo then
    if v_ticket.checked_in then
      raise exception 'ticket_already_checked_in';
    end if;

    if v_ticket.status <> 'active' then
      raise exception 'ticket_invalid';
    end if;

    update public.tickets
       set checked_in=true,
           checked_in_at=now(),
           checked_in_by_admin_id=auth.uid(),
           status='used',
           updated_at=now()
     where id=p_ticket_id
     returning * into v_ticket;

    insert into public.checkin_events(ticket_id,action,operator_user_id,notes)
    values(p_ticket_id,'check_in',auth.uid(),p_notes);
  else
    if not v_ticket.checked_in then
      raise exception 'ticket_not_checked_in';
    end if;

    update public.tickets
       set checked_in=false,
           checked_in_at=null,
           checked_in_by_admin_id=null,
           status='active',
           updated_at=now()
     where id=p_ticket_id
     returning * into v_ticket;

    insert into public.checkin_events(ticket_id,action,operator_user_id,notes)
    values(p_ticket_id,'undo_check_in',auth.uid(),p_notes);
  end if;

  return v_ticket;
end;
$$;
