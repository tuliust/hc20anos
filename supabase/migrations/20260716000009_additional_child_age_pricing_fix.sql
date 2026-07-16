-- ================================================================
-- Additional-child age pricing fix
-- HC 20 Anos — children older than 12 remain valid participants and
-- are charged as additional_child instead of being rejected.
-- ================================================================

do $$
declare
  v_definition text;
  v_signature regprocedure := 'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure;
  v_old_declaration text := '  v_child_count integer;
  v_external_count integer;';
  v_new_declaration text := '  v_child_count integer;
  v_eligible_child_count integer := 0;
  v_chargeable_child_count integer := 0;
  v_external_count integer;';
  v_old_child_validation text := '    if v_participant->>''participant_type'' = ''child'' then
      if nullif(v_participant->>''birth_date'', '''') is null then
        raise exception ''child_birth_date_required'' using errcode = ''P0001'';
      end if;
      if public.age_on_event_date((v_participant->>''birth_date'')::date, v_event_id) > 12 then
        raise exception ''child_age_limit_exceeded'' using errcode = ''P0001'';
      end if;
    elsif v_participant->>''participant_type'' = ''external_guest'' then';
  v_new_child_validation text := '    if v_participant->>''participant_type'' = ''child'' then
      if nullif(v_participant->>''birth_date'', '''') is null then
        raise exception ''child_birth_date_required'' using errcode = ''P0001'';
      end if;
      if public.age_on_event_date((v_participant->>''birth_date'')::date, v_event_id) <= 12 then
        v_eligible_child_count := v_eligible_child_count + 1;
      else
        v_chargeable_child_count := v_chargeable_child_count + 1;
      end if;
    elsif v_participant->>''participant_type'' = ''external_guest'' then';
  v_old_pricing text := '  v_subtotal := v_product.current_price_cents;
  if v_child_count > v_included_children then
    v_subtotal := v_subtotal + ((v_child_count - v_included_children) * v_additional_child.current_price_cents);
  end if;';
  v_new_pricing text := '  v_subtotal := v_product.current_price_cents;
  -- One eligible child (age <= 12 on the event date) is included in
  -- family packages. Every other child, including all children aged
  -- 13 or older, is charged using additional_child.
  v_chargeable_child_count := v_chargeable_child_count
    + greatest(v_eligible_child_count - v_included_children, 0);
  if v_chargeable_child_count > 0 then
    v_subtotal := v_subtotal + (v_chargeable_child_count * v_additional_child.current_price_cents);
  end if;';
begin
  select pg_get_functiondef(v_signature) into v_definition;

  if position(v_old_declaration in v_definition) = 0 then
    raise exception 'create_checkout_order declaration block not found';
  end if;
  if position(v_old_child_validation in v_definition) = 0 then
    raise exception 'create_checkout_order child validation block not found';
  end if;
  if position(v_old_pricing in v_definition) = 0 then
    raise exception 'create_checkout_order child pricing block not found';
  end if;

  v_definition := replace(v_definition, v_old_declaration, v_new_declaration);
  v_definition := replace(v_definition, v_old_child_validation, v_new_child_validation);
  v_definition := replace(v_definition, v_old_pricing, v_new_pricing);

  execute v_definition;
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to service_role;

notify pgrst, 'reload schema';
