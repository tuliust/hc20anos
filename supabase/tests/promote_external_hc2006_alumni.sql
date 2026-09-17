-- Regressão: o gatilho de promoção precisa existir e permanecer restrito à turma 2006.
do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.promote_external_hc2006_alumni()'::regprocedure)
    into v_definition;

  if position('new.class_year = 2006' in v_definition) = 0 then
    raise exception 'Promoção externa não está restrita à turma HC 2006';
  end if;

  if position('person_type = ''alumni''' in v_definition) = 0
     or position('is_visible = true' in v_definition) = 0 then
    raise exception 'Promoção externa não integra o perfil à lista pública da turma';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'trg_promote_external_hc2006_alumni'
      and not tgisinternal
  ) then
    raise exception 'Trigger de promoção externa HC 2006 ausente';
  end if;
end;
$$;
