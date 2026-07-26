-- ================================================================
-- Contract checks for the three-ticket product model.
-- ================================================================

set role postgres;

do $$
declare
  v_event_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_codes text[];
  v_names text[];
  v_current_lot_id uuid;
  v_checkout_definition text;
  v_admin_definition text;
begin
  select array_agg(c.product_code order by c.product_code),
         array_agg(c.product_name order by c.product_code)
    into v_codes, v_names
  from public.get_public_ticket_catalog(v_event_id, now()) c;

  if v_codes is distinct from array['external_guest', 'family_full', 'simple']::text[] then
    raise exception 'Public catalog must contain exactly three products: %', v_codes;
  end if;

  if v_names is distinct from array['Convidado', 'Família', 'Individual']::text[] then
    raise exception 'Public ticket names do not match the approved copy: %', v_names;
  end if;

  if exists (
    select 1
    from public.ticket_types tt
    where tt.event_id = v_event_id
      and tt.product_code in ('family_single_parent', 'additional_child', 'extra_drinks', 'extra_barbecue')
      and tt.status <> 'closed'
  ) then
    raise exception 'Deprecated products remain open';
  end if;

  select l.id into v_current_lot_id
  from public.get_current_ticket_lot(v_event_id, now()) l
  limit 1;

  if v_current_lot_id is not null and exists (
    select 1
    from public.ticket_lot_prices lp
    join public.ticket_types tt on tt.id = lp.ticket_type_id
    where lp.lot_id = v_current_lot_id
      and lp.is_active
      and tt.product_code not in ('simple', 'family_full', 'external_guest')
  ) then
    raise exception 'Deprecated product price remains active in the current lot';
  end if;

  select pg_get_functiondef(
    'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure
  ) into v_checkout_definition;

  if position('p_product_code not in (''simple'', ''family_full'', ''external_guest'')' in v_checkout_definition) = 0 then
    raise exception 'Checkout does not enforce the three primary products';
  end if;
  if position('v_total := v_product.current_price_cents' in v_checkout_definition) = 0 then
    raise exception 'Checkout does not use a single configured product price';
  end if;

  select pg_get_functiondef(
    'public.admin_get_ticket_lots(uuid)'::regprocedure
  ) into v_admin_definition;

  if position('tt.product_code in (''simple'', ''family_full'', ''external_guest'')' in v_admin_definition) = 0 then
    raise exception 'Admin lot catalog is not restricted to the three products';
  end if;

  if exists (
    select 1
    from pg_trigger t
    where t.tgrelid = 'public.order_participants'::regclass
      and t.tgname = 'order_participants_guest_buyer_authorization'
      and not t.tgisinternal
  ) then
    raise exception 'Legacy guest approval trigger is still installed';
  end if;
end;
$$;

select 'PASS' as three_ticket_product_model;
