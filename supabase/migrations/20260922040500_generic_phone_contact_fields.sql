-- Migra os campos de contato específicos de WhatsApp para telefone genérico.
-- Os valores existentes são preservados; apenas nomenclatura e contratos são alterados.
-- Migrations históricas permanecem imutáveis.

drop function if exists public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean);
drop function if exists public.get_contact_research_directory();
drop function if exists public.register_external_user_profile(text,text,text,text,text);
drop function if exists public.save_contact_research(uuid,text,text,text,text,text,boolean);
drop function if exists public.update_my_public_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer);

alter table public.events rename column contact_whatsapp to contact_phone;
alter table public.people rename column contact_whatsapp to contact_phone;
alter table public.profiles rename column contact_whatsapp to contact_phone;
alter table public.alumni_contact_research rename column whatsapp to phone;

alter table public.backup_people_before_cleanup_20260709 rename column contact_whatsapp to contact_phone;
alter table public.backup_profiles_before_cleanup_20260709 rename column contact_whatsapp to contact_phone;

alter view app_private.public_profile_cards rename column contact_whatsapp to contact_phone;
alter view public.public_profile_cards rename column contact_whatsapp to contact_phone;

CREATE OR REPLACE FUNCTION public.admin_clear_person_profile(p_person_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
    contact_phone = null,
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
$function$


CREATE OR REPLACE FUNCTION public.admin_import_people(p_people jsonb)
 RETURNS SETOF people
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_row public.people%rowtype;
  v_full_name text;
  v_display_name text;
  v_gender text;
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
    v_display_name := nullif(trim(coalesce(v_item->>'display_name', '')), '');
    v_gender := lower(trim(coalesce(v_item->>'gender', '')));
    v_gender := case
      when v_gender in ('male', 'masculino', 'm', 'homem') then 'male'
      when v_gender in ('female', 'feminino', 'f', 'mulher') then 'female'
      else null
    end;
    v_birth_year := nullif(regexp_replace(coalesce(v_item->>'birth_year', ''), '\D', '', 'g'), '')::integer;
    v_class_group := upper(nullif(trim(coalesce(v_item->>'class_group', '')), ''));

    if v_full_name is null or v_birth_year is null or v_class_group is null then
      raise exception 'Cada pessoa precisa de nome completo, ano de nascimento e turma.';
    end if;

    insert into public.people (
      full_name,
      display_name,
      gender,
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
      contact_phone,
      verification_status
    ) values (
      v_full_name,
      v_display_name,
      v_gender,
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
      nullif(trim(coalesce(v_item->>'contact_phone', '')), ''),
      'not_started'
    )
    returning * into v_row;

    return next v_row;
  end loop;

  return;
end;
$function$


CREATE OR REPLACE FUNCTION public.admin_update_person_and_profile(p_person_id uuid, p_person jsonb DEFAULT '{}'::jsonb, p_profile jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_person public.people%rowtype;
  v_profile public.profiles%rowtype;
  v_profile_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not public.admin_can_manage_people() then
    raise exception 'Sem permissão para editar participantes.';
  end if;

  update public.people
  set
    full_name = case when p_person ? 'full_name' then nullif(trim(coalesce(p_person->>'full_name', '')), '') else full_name end,
    display_name = case when p_person ? 'display_name' then nullif(trim(coalesce(p_person->>'display_name', '')), '') else display_name end,
    gender = case
      when p_person ? 'gender' then
        case lower(trim(coalesce(p_person->>'gender', '')))
          when 'male' then 'male'
          when 'masculino' then 'male'
          when 'm' then 'male'
          when 'homem' then 'male'
          when 'female' then 'female'
          when 'feminino' then 'female'
          when 'f' then 'female'
          when 'mulher' then 'female'
          else null
        end
      else gender
    end,
    birth_year = case when p_person ? 'birth_year' and nullif(regexp_replace(coalesce(p_person->>'birth_year', ''), '\D', '', 'g'), '') is not null then regexp_replace(p_person->>'birth_year', '\D', '', 'g')::integer else birth_year end,
    class_year = case when p_person ? 'class_year' and nullif(regexp_replace(coalesce(p_person->>'class_year', ''), '\D', '', 'g'), '') is not null then regexp_replace(p_person->>'class_year', '\D', '', 'g')::integer else class_year end,
    class_group = case when p_person ? 'class_group' then upper(nullif(trim(coalesce(p_person->>'class_group', '')), '')) else class_group end,
    avatar_url = case when p_person ? 'avatar_url' then nullif(trim(coalesce(p_person->>'avatar_url', '')), '') else avatar_url end,
    contact_email = case when p_person ? 'contact_email' then nullif(trim(coalesce(p_person->>'contact_email', '')), '') else contact_email end,
    contact_phone = case when p_person ? 'contact_phone' then nullif(trim(coalesce(p_person->>'contact_phone', '')), '') else contact_phone end,
    nickname_at_school = case when p_person ? 'nickname_at_school' then nullif(trim(coalesce(p_person->>'nickname_at_school', '')), '') else nickname_at_school end,
    profile_status = case when p_person ? 'profile_status' then coalesce(nullif(trim(p_person->>'profile_status'), ''), profile_status)::profile_status else profile_status end,
    is_visible = case when p_person ? 'is_visible' then coalesce((p_person->>'is_visible')::boolean, is_visible) else is_visible end,
    private_notes = case when p_person ? 'private_notes' then nullif(trim(coalesce(p_person->>'private_notes', '')), '') else private_notes end,
    updated_at = now()
  where id = p_person_id
  returning * into v_person;

  if not found then
    raise exception 'Participante não encontrado.';
  end if;

  select id into v_profile_id
  from public.profiles
  where person_id = p_person_id
  order by updated_at desc nulls last, created_at desc nulls last
  limit 1;

  if v_profile_id is not null and p_profile is not null and p_profile <> '{}'::jsonb then
    update public.profiles
    set
      display_name = case when p_profile ? 'display_name' then nullif(trim(coalesce(p_profile->>'display_name', '')), '') else display_name end,
      current_photo_url = case when p_profile ? 'current_photo_url' then nullif(trim(coalesce(p_profile->>'current_photo_url', '')), '') else current_photo_url end,
      current_city = case when p_profile ? 'current_city' then nullif(trim(coalesce(p_profile->>'current_city', '')), '') else current_city end,
      current_state = case when p_profile ? 'current_state' then nullif(trim(coalesce(p_profile->>'current_state', '')), '') else current_state end,
      current_country = case when p_profile ? 'current_country' then nullif(trim(coalesce(p_profile->>'current_country', '')), '') else current_country end,
      profession = case when p_profile ? 'profession' then nullif(trim(coalesce(p_profile->>'profession', '')), '') else profession end,
      bio = case when p_profile ? 'bio' then nullif(trim(coalesce(p_profile->>'bio', '')), '') else bio end,
      instagram_url = case when p_profile ? 'instagram_url' then nullif(trim(coalesce(p_profile->>'instagram_url', '')), '') else instagram_url end,
      linkedin_url = case when p_profile ? 'linkedin_url' then nullif(trim(coalesce(p_profile->>'linkedin_url', '')), '') else linkedin_url end,
      contact_email = case when p_profile ? 'contact_email' then nullif(trim(coalesce(p_profile->>'contact_email', '')), '') else contact_email end,
      contact_phone = case when p_profile ? 'contact_phone' then nullif(trim(coalesce(p_profile->>'contact_phone', '')), '') else contact_phone end,
      relationship_status = case when p_profile ? 'relationship_status' then nullif(trim(coalesce(p_profile->>'relationship_status', '')), '') else relationship_status end,
      has_children = case when p_profile ? 'has_children' then coalesce((p_profile->>'has_children')::boolean, false) else has_children end,
      children_count = case when p_profile ? 'children_count' and nullif(regexp_replace(coalesce(p_profile->>'children_count', ''), '\D', '', 'g'), '') is not null then regexp_replace(p_profile->>'children_count', '\D', '', 'g')::integer when p_profile ? 'children_count' then null else children_count end,
      intends_to_attend = case when p_profile ? 'intends_to_attend' and p_profile->>'intends_to_attend' <> '' then (p_profile->>'intends_to_attend')::boolean else intends_to_attend end,
      show_current_photo = case when p_profile ? 'show_current_photo' then coalesce((p_profile->>'show_current_photo')::boolean, true) else show_current_photo end,
      show_city = case when p_profile ? 'show_city' then coalesce((p_profile->>'show_city')::boolean, true) else show_city end,
      show_profession = case when p_profile ? 'show_profession' then coalesce((p_profile->>'show_profession')::boolean, true) else show_profession end,
      show_social_links = case when p_profile ? 'show_social_links' then coalesce((p_profile->>'show_social_links')::boolean, false) else show_social_links end,
      allow_photo_tags = case when p_profile ? 'allow_photo_tags' then coalesce((p_profile->>'allow_photo_tags')::boolean, true) else allow_photo_tags end,
      show_confirmed_status = case when p_profile ? 'show_confirmed_status' then coalesce((p_profile->>'show_confirmed_status')::boolean, true) else show_confirmed_status end,
      updated_at = now()
    where id = v_profile_id
    returning * into v_profile;
  else
    select * into v_profile
    from public.profiles
    where id = v_profile_id;
  end if;

  return jsonb_build_object(
    'person', to_jsonb(v_person),
    'profile', case when v_profile.id is null then null else to_jsonb(v_profile) end
  );
end;
$function$


CREATE OR REPLACE FUNCTION public.complete_profile_registration_v3(p_person_id uuid, p_penultimate_surname text, p_class_group_confirmation text, p_declared_birth_date date, p_full_name text DEFAULT NULL::text, p_display_name text DEFAULT NULL::text, p_class_group text DEFAULT NULL::text, p_current_photo_url text DEFAULT NULL::text, p_current_city text DEFAULT NULL::text, p_current_state text DEFAULT NULL::text, p_current_country text DEFAULT 'Brasil'::text, p_profession text DEFAULT NULL::text, p_bio text DEFAULT NULL::text, p_nickname_at_school text DEFAULT NULL::text, p_instagram_url text DEFAULT NULL::text, p_linkedin_url text DEFAULT NULL::text, p_contact_email text DEFAULT NULL::text, p_contact_phone text DEFAULT NULL::text, p_relationship_status text DEFAULT NULL::text, p_has_children boolean DEFAULT false, p_children_count integer DEFAULT NULL::integer, p_intends_to_attend boolean DEFAULT NULL::boolean, p_show_current_photo boolean DEFAULT true, p_show_city boolean DEFAULT true, p_show_profession boolean DEFAULT true, p_show_social_links boolean DEFAULT false, p_allow_photo_tags boolean DEFAULT true, p_show_confirmed_status boolean DEFAULT true)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
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
    contact_phone, relationship_status, has_children, children_count,
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
    nullif(trim(coalesce(p_contact_phone, '')), ''),
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
      contact_phone = excluded.contact_phone,
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
$function$


CREATE OR REPLACE FUNCTION public.get_contact_research_directory()
 RETURNS TABLE(person_id uuid, full_name text, class_group text, phone text, instagram text, email text, notes text, research_status text, source text, updated_by uuid, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    p.id,
    p.full_name,
    p.class_group,
    r.phone,
    r.instagram,
    r.email,
    r.notes,
    coalesce(r.status, 'pending') as research_status,
    coalesce(r.source, 'manual') as source,
    r.updated_by,
    r.updated_at
  from public.contact_research_roster roster
  join public.people p on p.id = roster.person_id
  left join public.alumni_contact_research r on r.person_id = p.id
  order by p.class_group, p.full_name;
$function$


CREATE OR REPLACE FUNCTION public.register_external_user_profile(p_full_name text, p_contact_email text, p_contact_phone text, p_current_city text DEFAULT NULL::text, p_profession text DEFAULT NULL::text)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_person_id uuid;
  v_existing_type text;
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if nullif(btrim(p_full_name), '') is null then
    raise exception 'external_name_required' using errcode = '22023';
  end if;
  if nullif(btrim(p_contact_email), '') is null or position('@' in p_contact_email) <= 1 then
    raise exception 'external_email_invalid' using errcode = '22023';
  end if;
  if nullif(regexp_replace(coalesce(p_contact_phone, ''), '\D', '', 'g'), '') is null then
    raise exception 'external_phone_required' using errcode = '22023';
  end if;

  select u.email into v_auth_email
  from auth.users u
  where u.id = v_uid;

  if v_auth_email is null or lower(btrim(v_auth_email)) <> lower(btrim(p_contact_email)) then
    raise exception 'external_email_mismatch' using errcode = '42501';
  end if;

  select pr.person_id, pe.person_type
    into v_person_id, v_existing_type
  from public.profiles pr
  join public.people pe on pe.id = pr.person_id
  where pr.user_id = v_uid
  limit 1;

  if v_person_id is not null then
    if coalesce(v_existing_type, 'alumni') <> 'external' then
      raise exception 'external_registration_conflicts_with_alumni_profile' using errcode = 'P0001';
    end if;

    update public.people
       set full_name = btrim(p_full_name),
           display_name = btrim(p_full_name),
           contact_email = lower(btrim(p_contact_email)),
           contact_phone = btrim(p_contact_phone),
           is_visible = false,
           person_type = 'external',
           updated_at = now()
     where id = v_person_id;

    update public.profiles
       set display_name = btrim(p_full_name),
           contact_email = lower(btrim(p_contact_email)),
           contact_phone = btrim(p_contact_phone),
           current_city = nullif(btrim(p_current_city), ''),
           profession = nullif(btrim(p_profession), ''),
           show_current_photo = false,
           show_city = false,
           show_profession = false,
           show_social_links = false,
           allow_photo_tags = false,
           show_confirmed_status = false,
           updated_at = now()
     where user_id = v_uid
     returning * into v_profile;

    return v_profile;
  end if;

  insert into public.people (
    full_name,
    class_year,
    profile_status,
    claimed_by_user_id,
    claimed_at,
    is_visible,
    verification_status,
    contact_email,
    contact_phone,
    display_name,
    person_type
  ) values (
    btrim(p_full_name),
    2006,
    'confirmed',
    v_uid,
    now(),
    false,
    'verified',
    lower(btrim(p_contact_email)),
    btrim(p_contact_phone),
    btrim(p_full_name),
    'external'
  )
  returning id into v_person_id;

  insert into public.profiles (
    person_id,
    user_id,
    display_name,
    current_city,
    current_country,
    profession,
    contact_email,
    contact_phone,
    show_current_photo,
    show_city,
    show_profession,
    show_social_links,
    allow_photo_tags,
    show_confirmed_status
  ) values (
    v_person_id,
    v_uid,
    btrim(p_full_name),
    nullif(btrim(p_current_city), ''),
    'Brasil',
    nullif(btrim(p_profession), ''),
    lower(btrim(p_contact_email)),
    btrim(p_contact_phone),
    false,
    false,
    false,
    false,
    false,
    false
  )
  returning * into v_profile;

  return v_profile;
end;
$function$


CREATE OR REPLACE FUNCTION public.save_contact_research(p_person_id uuid, p_phone text DEFAULT NULL::text, p_instagram text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_source text DEFAULT 'manual'::text, p_mark_no_contact boolean DEFAULT false)
 RETURNS alumni_contact_research
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_status text;
  v_source text;
  v_row public.alumni_contact_research;
begin
  if not exists (
    select 1
    from public.contact_research_roster roster
    where roster.person_id = p_person_id
  ) then
    raise exception 'invalid_contact_research_person';
  end if;

  v_source := case
    when p_source = 'device_contact_picker' then 'device_contact_picker'
    when p_source = 'ios_shortcut' then 'ios_shortcut'
    else 'manual'
  end;

  v_status := case
    when p_mark_no_contact then 'no_contact'
    when nullif(trim(coalesce(p_phone,'')), '') is not null
      or nullif(trim(coalesce(p_instagram,'')), '') is not null
      or nullif(trim(coalesce(p_email,'')), '') is not null
      then 'located'
    else 'pending'
  end;

  insert into public.alumni_contact_research (
    person_id, phone, instagram, email, notes, status, source, updated_by, updated_at
  ) values (
    p_person_id,
    nullif(trim(coalesce(p_phone,'')), ''),
    nullif(trim(coalesce(p_instagram,'')), ''),
    nullif(trim(coalesce(p_email,'')), ''),
    nullif(trim(coalesce(p_notes,'')), ''),
    v_status,
    v_source,
    auth.uid(),
    now()
  )
  on conflict (person_id) do update set
    phone = excluded.phone,
    instagram = excluded.instagram,
    email = excluded.email,
    notes = excluded.notes,
    status = excluded.status,
    source = excluded.source,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$function$


CREATE OR REPLACE FUNCTION public.update_my_public_profile(p_display_name text DEFAULT NULL::text, p_current_photo_url text DEFAULT NULL::text, p_current_city text DEFAULT NULL::text, p_current_state text DEFAULT NULL::text, p_current_country text DEFAULT NULL::text, p_profession text DEFAULT NULL::text, p_bio text DEFAULT NULL::text, p_memory_text text DEFAULT NULL::text, p_instagram_url text DEFAULT NULL::text, p_linkedin_url text DEFAULT NULL::text, p_nickname_at_school text DEFAULT NULL::text, p_avatar_url text DEFAULT NULL::text, p_contact_email text DEFAULT NULL::text, p_contact_phone text DEFAULT NULL::text, p_relationship_status text DEFAULT NULL::text, p_has_children boolean DEFAULT NULL::boolean, p_children_count integer DEFAULT NULL::integer)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
    contact_phone = case when p_contact_phone is null then contact_phone else nullif(trim(p_contact_phone), '') end,
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
$function$


revoke all on function public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean) from public;
grant execute on function public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean) to authenticated, service_role;

revoke all on function public.get_contact_research_directory() from public;
grant execute on function public.get_contact_research_directory() to anon, authenticated, service_role;

revoke all on function public.register_external_user_profile(text,text,text,text,text) from public;
grant execute on function public.register_external_user_profile(text,text,text,text,text) to authenticated, service_role;

revoke all on function public.save_contact_research(uuid,text,text,text,text,text,boolean) from public;
grant execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) to anon, authenticated, service_role;

revoke all on function public.update_my_public_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer) from public;
grant execute on function public.update_my_public_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer) to authenticated, service_role;

notify pgrst, 'reload schema';
