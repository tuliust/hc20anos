-- HC-09 regression: o RPC não pode voltar a limitar usuário externo a ingresso individual.
do $$
begin
  if position(
    'external_single_ticket_required'
    in pg_get_functiondef('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'::regprocedure)
  ) > 0 then
    raise exception 'HC-09 regressão: checkout externo voltou a exigir ingresso individual';
  end if;
end;
$$;
