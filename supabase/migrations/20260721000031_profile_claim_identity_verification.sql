-- Evidência privada para auditoria de reivindicações de perfil.
-- A data declarada não é comparada ao pré-cadastro e não é exposta em views públicas.

create extension if not exists unaccent with schema extensions;

create or replace function public.normalize_profile_identity_text(value text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select lower(regexp_replace(unaccent(trim(coalesce(value, ''))), '\s+', ' ', 'g'));
$$;

create or replace function public.profile_claim_penultimate_surname(value text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  with significant_parts as (
    select part, ordinal
    from unnest(regexp_split_to_array(trim(coalesce(value, '')), '\s+')) with ordinality as tokens(part, ordinal)
    where part <> ''
      and public.normalize_profile_identity_text(part) not in ('de', 'da', 'do', 'dos', 'das')
  )
  select part
  from significant_parts
  order by ordinal desc
  offset 1
  limit 1;
$$;

create table if not exists public.profile_identity_verifications (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  claimant_user_id uuid not null references auth.users(id) on delete restrict,
  declared_birth_date date not null,
  penultimate_surname_answer text not null,
  class_group_answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person_id, claimant_user_id)
);

create index if not exists profile_identity_verifications_person_created_idx
  on public.profile_identity_verifications(person_id, created_at desc);

alter table public.profile_identity_verifications enable row level security;
revoke all on table public.profile_identity_verifications from anon, authenticated;

create or replace function public.complete_profile_registration_v3(
  p_person_id uuid,
  p_penultimate_surname text,
  p_class_group_confirmation text,
  p_declared_birth_date date,
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
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_person public.people%rowtype;
  v_expected_surname text;
  v_relationship_status text;
  v_children_count integer;
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_declared_birth_date is null then
    raise exception 'Informe sua data de nascimento.';
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

  v_expected_surname := public.profile_claim_penultimate_surname(v_person.full_name);
  if v_expected_surname is null then
    raise exception 'Nome completo inválido para validação.';
  end if;

  if public.normalize_profile_identity_text(v_expected_surname) <> public.normalize_profile_identity_text(p_penultimate_surname) then
    raise exception 'Penúltimo sobrenome não confere.';
  end if;

  if public.normalize_profile_identity_text(coalesce(v_person.class_group, '')) <> public.normalize_profile_identity_text(p_class_group_confirmation) then
    raise exception 'Turma não confere.';
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

  insert into public.profile_identity_verifications (
    person_id,
    profile_id,
    claimant_user_id,
    declared_birth_date,
    penultimate_surname_answer,
    class_group_answer
  ) values (
    p_person_id,
    v_profile.id,
    v_uid,
    p_declared_birth_date,
    trim(p_penultimate_surname),
    trim(p_class_group_confirmation)
  )
  on conflict (person_id, claimant_user_id) do update
  set
    profile_id = excluded.profile_id,
    declared_birth_date = excluded.declared_birth_date,
    penultimate_surname_answer = excluded.penultimate_surname_answer,
    class_group_answer = excluded.class_group_answer,
    updated_at = now();

  return v_profile;
end;
$$;

revoke all on function public.complete_profile_registration_v3(
  uuid, text, text, date, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, boolean, integer, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean
) from public;

grant execute on function public.complete_profile_registration_v3(
  uuid, text, text, date, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, boolean, integer, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean
) to authenticated;

create or replace function public.admin_get_profile_claim_disputes_with_identity(p_status text default null)
returns table (
  id uuid,
  person_id uuid,
  current_claimant_user_id uuid,
  requester_user_id uuid,
  requester_name text,
  requester_email text,
  requester_phone text,
  reason text,
  evidence_text text,
  status text,
  reviewed_by_admin_id uuid,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz,
  people jsonb,
  identity_verification jsonb
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.role in ('superadmin', 'admin', 'moderator')
  ) then
    raise exception 'Sem permissão para consultar evidências de disputas.';
  end if;

  return query
  select
    d.id,
    d.person_id,
    d.current_claimant_user_id,
    d.requester_user_id,
    d.requester_name,
    d.requester_email,
    d.requester_phone,
    d.reason,
    d.evidence_text,
    d.status::text,
    d.reviewed_by_admin_id,
    d.reviewed_at,
    d.admin_notes,
    d.created_at,
    d.updated_at,
    jsonb_build_object(
      'full_name', pe.full_name,
      'nickname_at_school', pe.nickname_at_school,
      'class_group', pe.class_group
    ) as people,
    case when verification.id is null then null else jsonb_build_object(
      'id', verification.id,
      'declared_birth_date', verification.declared_birth_date,
      'created_at', verification.created_at,
      'claimant_user_id', verification.claimant_user_id,
      'claimant_email', claimant_profile.contact_email,
      'penultimate_surname_answer', verification.penultimate_surname_answer,
      'class_group_answer', verification.class_group_answer
    ) end as identity_verification
  from public.profile_claim_disputes d
  left join public.people pe on pe.id = d.person_id
  left join lateral (
    select piv.*
    from public.profile_identity_verifications piv
    where piv.person_id = d.person_id
    order by
      (piv.claimant_user_id = d.current_claimant_user_id) desc,
      piv.created_at desc
    limit 1
  ) verification on true
  left join public.profiles claimant_profile
    on claimant_profile.person_id = d.person_id
   and claimant_profile.user_id = verification.claimant_user_id
  where p_status is null or d.status::text = p_status
  order by d.created_at desc;
end;
$$;

revoke all on function public.admin_get_profile_claim_disputes_with_identity(text) from public;
grant execute on function public.admin_get_profile_claim_disputes_with_identity(text) to authenticated;
