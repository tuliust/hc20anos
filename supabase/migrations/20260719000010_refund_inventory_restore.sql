create or replace function public.restore_refunded_order_inventory(p_order_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare v_order public.orders; v_qty integer;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if exists(select 1 from public.refund_requests where order_id=p_order_id and inventory_restored_at is not null) then return; end if;
  select count(*)::integer into v_qty from public.order_participants where order_id=p_order_id and status <> 'transferred';
  update public.ticket_types set sold_quantity=greatest(0,sold_quantity-greatest(v_qty,v_order.quantity)),updated_at=now() where id=v_order.ticket_type_id;
  if v_order.lot_id is not null then
    update public.ticket_lots set sold_quantity=greatest(0,coalesce(sold_quantity,0)-greatest(v_qty,v_order.quantity)),updated_at=now() where id=v_order.lot_id;
  end if;
end $$;
revoke all on function public.restore_refunded_order_inventory(uuid) from public,anon,authenticated;
notify pgrst,'reload schema';