-- RPC transacional para o novo fluxo de cadastro.
-- Valida penúltimo sobrenome, turma e ano de nascimento no banco antes de vincular conta/perfil.

create or replace function public.normalize_profile_answer(value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(value, '')));
$$;

create or replace function public.complete_profile_registration(
  p_person_id uuid,
  p_penultimate_surname text,
  p_class_group text,
  p_birth_year integer,
  p_display_name text,
  p_current_photo_url text default null,
  p_current_city text default null,
  p_current_state text default null,
  p_current_country text default 'Brasil',
  p_profession text default null,
  p_bio text default null,
  p_nickname_at_school text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_person public.people%rowtype;
  v_parts text[];
  v_expected_surname text;
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into v_person
  from public.people
  where id = p_person_id
  for update;

  if not found then
    raise exception 'Perfil não encontrado.';
  end if;

  if v_person.claimed_by_user_id is not null and v_person.claimed_by_user_id <> v_uid then
    raise exception 'Este perfil já está vinculado a outra conta.';
  end if;

  v_parts := regexp_split_to_array(trim(v_person.full_name), '\s+');
  if array_length(v_parts, 1) is null or array_length(v_parts, 1) < 2 then
    raise exception 'Nome completo inválido para validação.';
  end if;

  v_expected_surname := v_parts[array_length(v_parts, 1) - 1];

  if public.normalize_profile_answer(v_expected_surname) <> public.normalize_profile_answer(p_penultimate_surname) then
    raise exception 'Penúltimo sobrenome não confere.';
  end if;

  if public.normalize_profile_answer(coalesce(v_person.class_group, '')) <> public.normalize_profile_answer(p_class_group) then
    raise exception 'Turma não confere.';
  end if;

  if v_person.birth_year is null or v_person.birth_year <> p_birth_year then
    raise exception 'Ano de nascimento não confere.';
  end if;

  insert into public.profiles (
    person_id,
    user_id,
    display_name,
    current_photo_url,
    current_city,
    current_state,
    current_country,
    profession,
    bio,
    show_current_photo,
    show_city,
    show_profession,
    show_social_links,
    allow_photo_tags,
    show_confirmed_status
  )
  values (
    p_person_id,
    v_uid,
    nullif(trim(coalesce(p_display_name, '')), ''),
    nullif(trim(coalesce(p_current_photo_url, '')), ''),
    nullif(trim(coalesce(p_current_city, '')), ''),
    nullif(trim(coalesce(p_current_state, '')), ''),
    coalesce(nullif(trim(coalesce(p_current_country, '')), ''), 'Brasil'),
    nullif(trim(coalesce(p_profession, '')), ''),
    nullif(trim(coalesce(p_bio, '')), ''),
    true,
    true,
    true,
    false,
    true,
    true
  )
  on conflict (user_id) do update
  set
    person_id = excluded.person_id,
    display_name = excluded.display_name,
    current_photo_url = coalesce(excluded.current_photo_url, public.profiles.current_photo_url),
    current_city = excluded.current_city,
    current_state = excluded.current_state,
    current_country = excluded.current_country,
    profession = excluded.profession,
    bio = excluded.bio,
    updated_at = now()
  returning * into v_profile;

  update public.people
  set
    nickname_at_school = nullif(trim(coalesce(p_nickname_at_school, '')), ''),
    profile_status = 'confirmed',
    verification_status = 'verified',
    claimed_by_user_id = v_uid,
    claimed_at = coalesce(claimed_at, now())
  where id = p_person_id;

  return v_profile;
end;
$$;

revoke all on function public.complete_profile_registration(uuid, text, text, integer, text, text, text, text, text, text, text, text) from public;
grant execute on function public.complete_profile_registration(uuid, text, text, integer, text, text, text, text, text, text, text, text) to authenticated;
