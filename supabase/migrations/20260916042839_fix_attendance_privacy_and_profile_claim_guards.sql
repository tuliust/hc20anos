-- HC 20 Anos: separar cadastro de presença, respeitar privacidade e endurecer reivindicação de perfil.

drop policy if exists profiles_public_read on public.profiles;
drop policy if exists profiles_anon_attendance_read on public.profiles;
create policy profiles_anon_attendance_read
  on public.profiles
  for select
  to anon
  using (
    show_confirmed_status = true
    and exists (
      select 1
      from public.people p
      where p.id = profiles.person_id
        and p.is_visible = true
    )
  );

revoke select on public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on public.profiles from anon;
grant select (person_id, intends_to_attend, show_confirmed_status) on public.profiles to anon;
revoke insert, update, delete, truncate, references, trigger on public.people from anon;

create or replace view public.public_profile_cards as
select
  p.id as profile_id,
  p.person_id,
  coalesce(p.display_name, pe.display_name) as display_name,
  pe.full_name,
  coalesce(p.current_photo_url, pe.avatar_url) as avatar_url,
  case when p.show_city = true then p.current_city else null::text end as current_city,
  case when p.show_city = true then p.current_state else null::text end as current_state,
  case when p.show_city = true then p.current_country else null::text end as current_country,
  case when p.show_profession = true then p.profession else null::text end as profession,
  case when p.show_social_links = true then p.instagram_url else null::text end as instagram_url,
  case when p.show_social_links = true then p.linkedin_url else null::text end as linkedin_url,
  null::text as contact_whatsapp,
  p.relationship_status,
  p.has_children,
  p.children_count,
  p.intends_to_attend
from public.profiles p
join public.people pe on pe.id = p.person_id
where pe.is_visible = true;

grant select on public.public_profile_cards to anon, authenticated;

create or replace function public.sync_people_attendance_status_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.people
  set profile_status = case
        when new.intends_to_attend is true and new.show_confirmed_status is true
          then 'confirmed'::public.profile_status
        else 'claimed'::public.profile_status
      end,
      updated_at = now()
  where id = new.person_id
    and claimed_by_user_id is not null;
  return new;
end;
$$;

revoke all on function public.sync_people_attendance_status_from_profile() from public, anon, authenticated;

drop trigger if exists trg_profiles_sync_attendance_status on public.profiles;
create trigger trg_profiles_sync_attendance_status
after insert or update of intends_to_attend, show_confirmed_status on public.profiles
for each row execute function public.sync_people_attendance_status_from_profile();

create or replace function public.complete_profile_registration_v3(
  p_person_id uuid,
  p_penultimate_surname text,
  p_class_group_confirmation text,
  p_declared_birth_date date,
  p_full_name text default null::text,
  p_display_name text default null::text,
  p_class_group text default null::text,
  p_current_photo_url text default null::text,
  p_current_city text default null::text,
  p_current_state text default null::text,
  p_current_country text default 'Brasil'::text,
  p_profession text default null::text,
  p_bio text default null::text,
  p_nickname_at_school text default null::text,
  p_instagram_url text default null::text,
  p_linkedin_url text default null::text,
  p_contact_email text default null::text,
  p_contact_whatsapp text default null::text,
  p_relationship_status text default null::text,
  p_has_children boolean default false,
  p_children_count integer default null::integer,
  p_intends_to_attend boolean default null::boolean,
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
set search_path to 'public', 'auth', 'extensions'
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

  if exists (
    select 1 from public.profiles pr
    where pr.user_id = v_uid and pr.person_id <> p_person_id
  ) or exists (
    select 1 from public.people pe
    where pe.claimed_by_user_id = v_uid and pe.id <> p_person_id
  ) then
    raise exception 'Esta conta já está vinculada a outro perfil.';
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

  if v_person.birth_year is not null
     and extract(year from p_declared_birth_date)::integer <> v_person.birth_year then
    raise exception 'Data de nascimento não confere.';
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
    person_id, user_id, display_name, current_photo_url, current_city, current_state,
    current_country, profession, bio, instagram_url, linkedin_url, contact_email,
    contact_whatsapp, relationship_status, has_children, children_count,
    intends_to_attend, show_current_photo, show_city, show_profession,
    show_social_links, allow_photo_tags, show_confirmed_status
  ) values (
    p_person_id, v_uid,
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
  set person_id = excluded.person_id,
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
  set full_name = coalesce(nullif(trim(coalesce(p_full_name, '')), ''), full_name),
      class_group = coalesce(upper(nullif(trim(coalesce(p_class_group, '')), '')), class_group),
      nickname_at_school = nullif(trim(coalesce(p_nickname_at_school, '')), ''),
      avatar_url = coalesce(nullif(trim(coalesce(p_current_photo_url, '')), ''), avatar_url),
      profile_status = case
        when p_intends_to_attend is true and coalesce(p_show_confirmed_status, true) is true
          then 'confirmed'::public.profile_status
        else 'claimed'::public.profile_status
      end,
      verification_status = 'verified',
      claimed_by_user_id = v_uid,
      claimed_at = coalesce(claimed_at, now()),
      updated_at = now()
  where id = p_person_id;

  insert into public.profile_identity_verifications (
    person_id, profile_id, claimant_user_id, declared_birth_date,
    penultimate_surname_answer, class_group_answer
  ) values (
    p_person_id, v_profile.id, v_uid, p_declared_birth_date,
    trim(p_penultimate_surname), trim(p_class_group_confirmation)
  )
  on conflict (person_id, claimant_user_id) do update
  set profile_id = excluded.profile_id,
      declared_birth_date = excluded.declared_birth_date,
      penultimate_surname_answer = excluded.penultimate_surname_answer,
      class_group_answer = excluded.class_group_answer,
      updated_at = now();

  return v_profile;
end;
$$;

update public.people pe
set profile_status = case
      when pr.intends_to_attend is true and pr.show_confirmed_status is true
        then 'confirmed'::public.profile_status
      else 'claimed'::public.profile_status
    end,
    updated_at = now()
from public.profiles pr
where pr.person_id = pe.id
  and pe.claimed_by_user_id is not null;
