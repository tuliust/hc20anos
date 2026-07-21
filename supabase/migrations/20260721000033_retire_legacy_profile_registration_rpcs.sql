-- Retira definitivamente os fluxos legados que validavam birth_year.
-- A única RPC pública de conclusão de reivindicação deve ser a versão v3,
-- que recebe uma data declarada apenas para registro privado de evidência.

do $$
begin
  if to_regprocedure(
    'public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)'
  ) is null then
    raise exception 'complete_profile_registration_v3 deve existir antes da retirada das RPCs legadas.';
  end if;
end
$$;

do $$
declare
  legacy_function record;
begin
  for legacy_function in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'complete_profile_registration',
        'complete_profile_registration_v2'
      )
  loop
    execute format('drop function %s', legacy_function.signature);
  end loop;
end
$$;

-- Defesa adicional: nenhuma função legada pode permanecer após a migration.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'complete_profile_registration',
        'complete_profile_registration_v2'
      )
  ) then
    raise exception 'Uma RPC legada de reivindicação ainda está presente.';
  end if;
end
$$;
