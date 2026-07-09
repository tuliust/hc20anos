-- Fluxo de pré-cadastro de pessoas e conclusão de cadastro pelo usuário.
-- Adiciona dados mínimos de validação, importação em massa por admin e preferência de ida à festa.

alter table public.people
  add column if not exists birth_year integer,
  add column if not exists verification_status text default 'not_started',
  add column if not exists contact_email text,
  add column if not exists contact_whatsapp text;

do $$ begin
  alter table public.people
    add constraint people_verification_status_check
    check (verification_status in ('not_started', 'in_progress', 'verified', 'failed', 'manual_review'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.people
    add constraint people_birth_year_check
    check (birth_year is null or birth_year between 1900 and extract(year from now())::integer);
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists intends_to_attend boolean;

create or replace function public.normalize_profile_answer(value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(value, '')));
$$;

create or replace view public.public_profile_cards as
select
  p.id as profile_id,
  p.person_id,
  p.display_name,
  pe.full_name,
  coalesce(p.current_photo_url, pe.avatar_url) as avatar_url,
  case when p.show_city = true then p.current_city else null end as current_city,
  case when p.show_city = true then p.current_state else null end as current_state,
  case when p.show_city = true then p.current_country else null end as current_country,
  case when p.show_profession = true then p.profession else null end as profession,
  case when p.show_social_links = true then p.instagram_url else null end as instagram_url,
  case when p.show_social_links = true then p.linkedin_url else null end as linkedin_url,
  case when p.show_social_links = true then p.contact_whatsapp else null end as contact_whatsapp,
  p.relationship_status,
  p.has_children,
  p.children_count,
  p.intends_to_attend
from public.profiles p
join public.people pe on pe.id = p.person_id
where pe.is_visible = true;

grant select on public.public_profile_cards to anon, authenticated;

create or replace function public.admin_import_people(p_people jsonb)
returns setof public.people
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_row public.people%rowtype;
  v_full_name text;
  v_birth_year integer;
  v_class_group text;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not exists (
    select 1
    from public.admin_users au
    where au.user_id = v_uid
      and au.role in ('superadmin', 'admin')
  ) then
    raise exception 'Sem permissão para cadastrar pessoas.';
  end if;

  if p_people is null or jsonb_typeof(p_people) <> 'array' then
    raise exception 'Payload inválido para importação.';
  end if;

  for v_item in select * from jsonb_array_elements(p_people)
  loop
    v_full_name := nullif(trim(coalesce(v_item->>'full_name', '')), '');
    v_birth_year := nullif(regexp_replace(coalesce(v_item->>'birth_year', ''), '\D', '', 'g'), '')::integer;
    v_class_group := upper(nullif(trim(coalesce(v_item->>'class_group', '')), ''));

    if v_full_name is null or v_birth_year is null or v_class_group is null then
      raise exception 'Cada pessoa precisa de nome completo, ano de nascimento e turma.';
    end if;

    insert into public.people (
      full_name,
      class_year,
      class_group,
      birth_year,
      nickname_at_school,
      profile_status,
      claimed_by_user_id,
      claimed_at,
      is_visible,
      private_notes,
      avatar_url,
      contact_email,
      contact_whatsapp,
      verification_status
    ) values (
      v_full_name,
      2006,
      v_class_group,
      v_birth_year,
      null,
      'unclaimed',
      null,
      null,
      true,
      null,
      nullif(trim(coalesce(v_item->>'avatar_url', '')), ''),
      nullif(trim(coalesce(v_item->>'contact_email', '')), ''),
      nullif(trim(coalesce(v_item->>'contact_whatsapp', '')), ''),
      'not_started'
    )
    returning * into v_row;

    return next v_row;
  end loop;

  return;
end;
$$;

revoke all on function public.admin_import_people(jsonb) from public;
grant execute on function public.admin_import_people(jsonb) to authenticated;

create or replace function public.complete_profile_registration_v2(
  p_person_id uuid,
  p_penultimate_surname text,
  p_class_group_confirmation text,
  p_birth_year integer,
  p_full_name text default null,
  p_display_name text default null,
  p_class_group text default null,
  p_current_photo_url text default null,
  p_current_city text default null,
  p_current_state text default null,
  p_current_country text default 'Brasil',
  p_profession text default null,
  p_bio text default null,
  p_nickname_at_school text default null,
  p_instagram_url text default null,
  p_linkedin_url text default null,
  p_contact_email text default null,
  p_contact_whatsapp text default null,
  p_relationship_status text default null,
  p_has_children boolean default false,
  p_children_count integer default null,
  p_intends_to_attend boolean default null,
  p_show_current_photo boolean default true,
  p_show_city boolean default true,
  p_show_profession boolean default true,
  p_show_social_links boolean default false,
  p_allow_photo_tags boolean default true,
  p_show_confirmed_status boolean default true
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
  v_relationship_status text;
  v_children_count integer;
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_person
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

  if public.normalize_profile_answer(coalesce(v_person.class_group, '')) <> public.normalize_profile_answer(p_class_group_confirmation) then
    raise exception 'Turma não confere.';
  end if;

  if v_person.birth_year is null or v_person.birth_year <> p_birth_year then
    raise exception 'Ano de nascimento não confere.';
  end if;

  v_relationship_status := nullif(trim(coalesce(p_relationship_status, '')), '');
  if v_relationship_status is not null and v_relationship_status not in ('single', 'dating', 'married') then
    raise exception 'Estado civil inválido.';
  end if;

  v_children_count := case
    when p_has_children = true then greatest(coalesce(p_children_count, 0), 0)
    else null
  end;

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
    instagram_url,
    linkedin_url,
    contact_email,
    contact_whatsapp,
    relationship_status,
    has_children,
    children_count,
    intends_to_attend,
    show_current_photo,
    show_city,
    show_profession,
    show_social_links,
    allow_photo_tags,
    show_confirmed_status
  ) values (
    p_person_id,
    v_uid,
    nullif(trim(coalesce(p_display_name, p_full_name, v_person.full_name)), ''),
    nullif(trim(coalesce(p_current_photo_url, '')), ''),
    nullif(trim(coalesce(p_current_city, '')), ''),
    nullif(trim(coalesce(p_current_state, '')), ''),
    coalesce(nullif(trim(coalesce(p_current_country, '')), ''), 'Brasil'),
    nullif(trim(coalesce(p_profession, '')), ''),
    nullif(trim(coalesce(p_bio, '')), ''),
    nullif(trim(coalesce(p_instagram_url, '')), ''),
    nullif(trim(coalesce(p_linkedin_url, '')), ''),
    nullif(trim(coalesce(p_contact_email, '')), ''),
    nullif(trim(coalesce(p_contact_whatsapp, '')), ''),
    v_relationship_status,
    coalesce(p_has_children, false),
    v_children_count,
    p_intends_to_attend,
    coalesce(p_show_current_photo, true),
    coalesce(p_show_city, true),
    coalesce(p_show_profession, true),
    coalesce(p_show_social_links, false),
    coalesce(p_allow_photo_tags, true),
    coalesce(p_show_confirmed_status, true)
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
    instagram_url = excluded.instagram_url,
    linkedin_url = excluded.linkedin_url,
    contact_email = excluded.contact_email,
    contact_whatsapp = excluded.contact_whatsapp,
    relationship_status = excluded.relationship_status,
    has_children = excluded.has_children,
    children_count = excluded.children_count,
    intends_to_attend = excluded.intends_to_attend,
    show_current_photo = excluded.show_current_photo,
    show_city = excluded.show_city,
    show_profession = excluded.show_profession,
    show_social_links = excluded.show_social_links,
    allow_photo_tags = excluded.allow_photo_tags,
    show_confirmed_status = excluded.show_confirmed_status,
    updated_at = now()
  returning * into v_profile;

  update public.people
  set
    full_name = coalesce(nullif(trim(coalesce(p_full_name, '')), ''), full_name),
    class_group = coalesce(upper(nullif(trim(coalesce(p_class_group, '')), '')), class_group),
    nickname_at_school = nullif(trim(coalesce(p_nickname_at_school, '')), ''),
    avatar_url = coalesce(nullif(trim(coalesce(p_current_photo_url, '')), ''), avatar_url),
    contact_email = coalesce(nullif(trim(coalesce(p_contact_email, '')), ''), contact_email),
    contact_whatsapp = coalesce(nullif(trim(coalesce(p_contact_whatsapp, '')), ''), contact_whatsapp),
    profile_status = 'confirmed',
    verification_status = 'verified',
    claimed_by_user_id = v_uid,
    claimed_at = coalesce(claimed_at, now()),
    updated_at = now()
  where id = p_person_id;

  return v_profile;
end;
$$;

revoke all on function public.complete_profile_registration_v2(
  uuid, text, text, integer, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, integer, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) from public;

grant execute on function public.complete_profile_registration_v2(
  uuid, text, text, integer, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, integer, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) to authenticated;
