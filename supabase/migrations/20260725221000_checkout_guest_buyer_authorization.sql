-- ================================================================
-- Vincula o convidado aprovado ao comprador autorizado.
--
-- Compra direta: o comprador deve ser o guest_user_id da aprovação.
-- Pedido de ex-aluno: o comprador deve ser o sponsor_user_id.
-- ================================================================

create or replace function public.enforce_checkout_guest_buyer_authorization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_user_id uuid;
  v_primary_product_code text;
  v_guest_user_id uuid;
  v_sponsor_user_id uuid;
begin
  if new.participant_type <> 'external_guest' then
    return new;
  end if;

  if new.guest_approval_request_id is null then
    raise exception 'external_guest_not_approved' using errcode = 'P0001';
  end if;

  select o.buyer_user_id, tt.product_code
    into v_buyer_user_id, v_primary_product_code
  from public.orders o
  join public.ticket_types tt on tt.id = o.ticket_type_id
  where o.id = new.order_id;

  if v_buyer_user_id is null or v_primary_product_code is null then
    raise exception 'external_guest_not_approved' using errcode = 'P0001';
  end if;

  select gar.guest_user_id, gar.sponsor_user_id
    into v_guest_user_id, v_sponsor_user_id
  from public.guest_approval_requests gar
  where gar.id = new.guest_approval_request_id
    and gar.status = 'approved';

  if v_primary_product_code = 'external_guest' then
    if v_guest_user_id is distinct from v_buyer_user_id then
      raise exception 'external_guest_not_approved' using errcode = 'P0001';
    end if;
  elsif v_sponsor_user_id is distinct from v_buyer_user_id then
    raise exception 'external_guest_not_approved' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists order_participants_guest_buyer_authorization
  on public.order_participants;

create trigger order_participants_guest_buyer_authorization
before insert or update of order_id, participant_type, guest_approval_request_id
on public.order_participants
for each row
execute function public.enforce_checkout_guest_buyer_authorization();

revoke all on function public.enforce_checkout_guest_buyer_authorization() from public, anon, authenticated;
grant execute on function public.enforce_checkout_guest_buyer_authorization() to service_role;

notify pgrst, 'reload schema';
