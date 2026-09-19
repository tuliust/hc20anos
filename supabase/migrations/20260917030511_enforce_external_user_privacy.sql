-- HC 20 Anos — invariantes de privacidade para usuários externos.
-- Mantém perfis externos fora de qualquer superfície pública mesmo após
-- operações administrativas de limpeza do perfil.

-- Corrige preventivamente qualquer linha externa criada antes desta proteção.
update public.people
set is_visible = false,
    updated_at = now()
where person_type = 'external'
  and is_visible is distinct from false;

-- Defesa no banco: uma pessoa marcada como externa nunca pode ser pública.
alter table public.people
  drop constraint if exists people_external_visibility_check;

alter table public.people
  add constraint people_external_visibility_check
  check (person_type <> 'external' or is_visible = false);

-- Defesa adicional na leitura direta da tabela pública.
drop policy if exists people_public_read on public.people;
create policy people_public_read on public.people
  for select
  using (is_visible = true and person_type = 'alumni');

-- A limpeza administrativa continua preservando o registro da pessoa, mas
-- jamais torna um usuário externo visível no diretório da Turma 2006.
create or replace function public.admin_clear_person_profile(p_person_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_person public.people%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not public.admin_can_manage_people() then
    raise exception 'Sem permissão para limpar participantes.';
  end if;

  select *
  into v_person
  from public.people
  where id = p_person_id
  for update;

  if not found then
    raise exception 'Participante não encontrado.';
  end if;

  delete from public.profiles
  where person_id = p_person_id;

  delete from public.profile_claims
  where person_id = p_person_id;

  if to_regclass('public.profile_claim_disputes') is not null then
    execute 'delete from public.profile_claim_disputes where person_id = $1'
      using p_person_id;
  end if;

  if to_regclass('public.profile_school_questionnaire_answers') is not null then
    execute 'delete from public.profile_school_questionnaire_answers where person_id = $1'
      using p_person_id;
  end if;

  update public.people
  set
    display_name = null,
    gender = null,
    birth_year = null,
    verification_status = 'not_started',
    contact_email = null,
    contact_whatsapp = null,
    nickname_at_school = null,
    profile_status = 'unclaimed',
    claimed_by_user_id = null,
    claimed_at = null,
    is_visible = case
      when v_person.person_type = 'external' then false
      else true
    end,
    private_notes = null,
    avatar_url = null,
    updated_at = now()
  where id = p_person_id
  returning * into v_person;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata_json
  ) values (
    auth.uid(),
    'admin_clear_person_profile',
    'people',
    p_person_id,
    jsonb_build_object(
      'preserved_fields', jsonb_build_array('full_name', 'class_year', 'class_group', 'person_type'),
      'is_visible_after_clear', v_person.is_visible
    )
  );

  return jsonb_build_object(
    'person', to_jsonb(v_person),
    'profile', null
  );
end;
$$;

revoke all on function public.admin_clear_person_profile(uuid) from public;
grant execute on function public.admin_clear_person_profile(uuid) to authenticated;

comment on function public.admin_clear_person_profile(uuid) is
  'Clears participant/profile data while preserving identity fields and keeping external users private.';
