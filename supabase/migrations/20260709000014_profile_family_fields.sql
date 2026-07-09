-- ================================================================
-- Perfil público: estado civil, filhos e cartão público do modal
-- Turma 2006 — Colégio Henrique Castriciano
-- ================================================================

alter table public.profiles
  add column if not exists relationship_status text,
  add column if not exists has_children boolean not null default false,
  add column if not exists children_count integer;

do $$ begin
  alter table public.profiles
    add constraint profiles_relationship_status_check
    check (
      relationship_status is null
      or relationship_status in ('single', 'dating', 'married')
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_children_count_check
    check (
      children_count is null
      or children_count >= 0
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_children_consistency_check
    check (
      has_children = true
      or children_count is null
    );
exception
  when duplicate_object then null;
end $$;

update public.profiles
set
  has_children = coalesce(has_children, false),
  children_count = case
    when coalesce(has_children, false) = true then children_count
    else null
  end;

-- View pública para alimentar o modal de perfil sem expor dados privados.
drop view if exists public.public_profile_cards;

create view public.public_profile_cards as
select
  p.id as profile_id,
  p.person_id,
  p.display_name,
  pe.full_name,
  case
    when p.show_current_photo = true then coalesce(p.current_photo_url, pe.avatar_url)
    else pe.avatar_url
  end as avatar_url,
  case when p.show_city = true then p.current_city else null end as current_city,
  case when p.show_city = true then p.current_state else null end as current_state,
  case when p.show_city = true then p.current_country else null end as current_country,
  case when p.show_profession = true then p.profession else null end as profession,
  case when p.show_social_links = true then p.instagram_url else null end as instagram_url,
  case when p.show_social_links = true then p.linkedin_url else null end as linkedin_url,
  case when p.show_social_links = true then p.contact_whatsapp else null end as contact_whatsapp,
  p.relationship_status,
  p.has_children,
  p.children_count
from public.profiles p
join public.people pe on pe.id = p.person_id
where pe.is_visible = true;

grant select on public.public_profile_cards to anon, authenticated;

-- Atualiza RPC usada pela edição de perfil público.
drop function if exists public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text);
drop function if exists public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text, text, text);
drop function if exists public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, integer);

create or replace function public.update_my_public_profile(
  p_display_name text default null,
  p_current_photo_url text default null,
  p_current_city text default null,
  p_current_state text default null,
  p_current_country text default null,
  p_profession text default null,
  p_bio text default null,
  p_memory_text text default null,
  p_instagram_url text default null,
  p_linkedin_url text default null,
  p_nickname_at_school text default null,
  p_avatar_url text default null,
  p_contact_email text default null,
  p_contact_whatsapp text default null,
  p_relationship_status text default null,
  p_has_children boolean default null,
  p_children_count integer default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_state text;
  v_relationship_status text;
  v_children_count integer;
  v_updated public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into v_profile
  from public.profiles
  where user_id = v_uid
  for update;

  if not found then
    raise exception 'Perfil ainda não reivindicado.';
  end if;

  v_state := nullif(upper(regexp_replace(coalesce(p_current_state, ''), '[^A-Za-z]', '', 'g')), '');

  if v_state is not null and v_state !~ '^[A-Z]{2}$' then
    raise exception 'Estado deve ser informado no formato UF, com duas letras.';
  end if;

  v_relationship_status := nullif(trim(coalesce(p_relationship_status, '')), '');

  if v_relationship_status is not null
     and v_relationship_status not in ('single', 'dating', 'married') then
    raise exception 'Estado civil inválido.';
  end if;

  if p_has_children = true then
    v_children_count := greatest(coalesce(p_children_count, 0), 0);
  elsif p_has_children = false then
    v_children_count := null;
  else
    v_children_count := v_profile.children_count;
  end if;

  update public.profiles
  set
    display_name = case when p_display_name is null then display_name else nullif(trim(p_display_name), '') end,
    current_photo_url = case when p_current_photo_url is null then current_photo_url else nullif(trim(p_current_photo_url), '') end,
    current_city = case when p_current_city is null then current_city else nullif(trim(p_current_city), '') end,
    current_state = case when p_current_state is null then current_state else v_state end,
    current_country = case when p_current_country is null then current_country else nullif(trim(p_current_country), '') end,
    profession = case when p_profession is null then profession else nullif(trim(p_profession), '') end,
    bio = case when p_bio is null then bio else nullif(trim(p_bio), '') end,
    memory_text = case when p_memory_text is null then memory_text else nullif(trim(p_memory_text), '') end,
    instagram_url = case when p_instagram_url is null then instagram_url else nullif(trim(p_instagram_url), '') end,
    linkedin_url = case when p_linkedin_url is null then linkedin_url else nullif(trim(p_linkedin_url), '') end,
    contact_email = case when p_contact_email is null then contact_email else nullif(trim(p_contact_email), '') end,
    contact_whatsapp = case when p_contact_whatsapp is null then contact_whatsapp else nullif(trim(p_contact_whatsapp), '') end,
    relationship_status = case when p_relationship_status is null then relationship_status else v_relationship_status end,
    has_children = case when p_has_children is null then has_children else p_has_children end,
    children_count = v_children_count,
    updated_at = now()
  where id = v_profile.id
  returning * into v_updated;

  update public.people
  set
    nickname_at_school = case when p_nickname_at_school is null then nickname_at_school else nullif(trim(p_nickname_at_school), '') end,
    avatar_url = case
      when p_avatar_url is not null then nullif(trim(p_avatar_url), '')
      when p_current_photo_url is not null then nullif(trim(p_current_photo_url), '')
      else avatar_url
    end,
    updated_at = now()
  where id = v_profile.person_id;

  return v_updated;
end;
$$;

revoke all on function public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, integer) from public;
grant execute on function public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, integer) to authenticated;

-- Atualiza RPC transacional do fluxo completo de cadastro, mantendo compatibilidade
-- com os campos antigos e aceitando os novos campos opcionais.
drop function if exists public.complete_profile_registration(uuid, text, text, integer, text, text, text, text, text, text, text, text);
drop function if exists public.complete_profile_registration(uuid, text, text, integer, text, text, text, text, text, text, text, text, text, boolean, integer);

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
  p_nickname_at_school text default null,
  p_relationship_status text default null,
  p_has_children boolean default false,
  p_children_count integer default null
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
  v_relationship_status text;
  v_children_count integer;
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

  v_relationship_status := nullif(trim(coalesce(p_relationship_status, '')), '');

  if v_relationship_status is not null
     and v_relationship_status not in ('single', 'dating', 'married') then
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
    relationship_status,
    has_children,
    children_count,
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
    v_relationship_status,
    coalesce(p_has_children, false),
    v_children_count,
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
    relationship_status = excluded.relationship_status,
    has_children = excluded.has_children,
    children_count = excluded.children_count,
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

revoke all on function public.complete_profile_registration(uuid, text, text, integer, text, text, text, text, text, text, text, text, text, boolean, integer) from public;
grant execute on function public.complete_profile_registration(uuid, text, text, integer, text, text, text, text, text, text, text, text, text, boolean, integer) to authenticated;
