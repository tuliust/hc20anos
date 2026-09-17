-- HC-09 — usuários externos podem compor o pedido com um adulto adicional e filhos.
-- O RPC já calcula adulto pelo preço integral e filhos por idade; esta migration
-- remove somente a trava que limitava o perfil externo a um participante.

do $migration$
declare
  v_definition text;
  v_block text := E'\n  if v_person_type = ''external'' and (v_participant_count <> 1 or v_spouse_count <> 0 or v_child_count <> 0) then\n    raise exception ''external_single_ticket_required'' using errcode=''22023'';\n  end if;\n';
begin
  select pg_get_functiondef(
    'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure
  ) into v_definition;

  if position('external_single_ticket_required' in v_definition) = 0 then
    return;
  end if;

  v_definition := replace(
    v_definition,
    v_block,
    E'\n  -- HC-09: perfil externo usa o mesmo modelo de composição do pedido.\n  -- O participante principal continua identificado pelo perfil da conta;\n  -- adulto adicional usa participant_type=spouse por compatibilidade e filhos\n  -- preservam a precificação etária já existente no RPC.\n'
  );

  if position('external_single_ticket_required' in v_definition) > 0 then
    raise exception 'hc09_external_checkout_guard_not_replaced';
  end if;

  execute v_definition;
end;
$migration$;

-- Reforça explicitamente os privilégios esperados do RPC após o CREATE OR REPLACE.
revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public, anon;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to authenticated, service_role;
