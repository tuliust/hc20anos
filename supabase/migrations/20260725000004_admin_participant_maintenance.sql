-- ================================================================
-- Admin participants: clear profile data or remove the participant
-- ================================================================

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

  -- Remove o perfil reivindicado e seus registros dependentes. A conta em
  -- auth.users não é excluída; apenas deixa de ficar vinculada à pessoa.
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
    is_visible = true,
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
      'preserved_fields', jsonb_build_array('full_name', 'class_year', 'class_group')
    )
  );

  return jsonb_build_object(
    'person', to_jsonb(v_person),
    'profile', null
  );
end;
$$;

create or replace function public.admin_delete_person_profile(p_person_id uuid)
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
    raise exception 'Sem permissão para remover participantes.';
  end if;

  select *
  into v_person
  from public.people
  where id = p_person_id
  for update;

  if not found then
    raise exception 'Participante não encontrado.';
  end if;

  -- As referências financeiras permanecem preservadas. Orders e tickets usam
  -- ON DELETE SET NULL para person_id; perfis, marcações e reivindicações usam
  -- ON DELETE CASCADE.
  delete from public.people
  where id = p_person_id;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata_json
  ) values (
    auth.uid(),
    'admin_delete_person_profile',
    'people',
    p_person_id,
    jsonb_build_object(
      'full_name', v_person.full_name,
      'class_year', v_person.class_year,
      'class_group', v_person.class_group
    )
  );

  return jsonb_build_object(
    'deleted', true,
    'person_id', p_person_id,
    'full_name', v_person.full_name
  );
end;
$$;

revoke all on function public.admin_clear_person_profile(uuid) from public;
revoke all on function public.admin_delete_person_profile(uuid) from public;

grant execute on function public.admin_clear_person_profile(uuid) to authenticated;
grant execute on function public.admin_delete_person_profile(uuid) to authenticated;

comment on function public.admin_clear_person_profile(uuid) is
  'Clears participant and claimed-profile data while preserving full name and class.';

comment on function public.admin_delete_person_profile(uuid) is
  'Deletes the participant/profile while retaining financial records with null person links.';
