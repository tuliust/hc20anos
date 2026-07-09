-- ================================================================
-- Ex-alunos/Admin: nome de exibição, edição completa de pessoas
-- e views públicas sem mapa duplicado em /ex-alunos.
-- ================================================================

alter table public.people
  add column if not exists display_name text;

-- Recria importação admin aceitando nome de exibição opcional.
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
  v_display_name text;
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
    v_birth_year := nullif(regexp_replace(coalesce(v_item->>'birth_year', ''), '\D', '', 'g'), '')::integer;
    v_class_group := upper(nullif(trim(coalesce(v_item->>'class_group', '')), ''));

    if v_full_name is null or v_birth_year is null or v_class_group is null then
      raise exception 'Cada pessoa precisa de nome completo, ano de nascimento e turma.';
    end if;

    insert into public.people (
      full_name,
      display_name,
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
      v_display_name,
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

create or replace function public.admin_can_manage_people()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.role in ('superadmin', 'admin')
  );
$$;

create or replace function public.admin_get_person_details(p_person_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_person public.people%rowtype;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not public.admin_can_manage_people() then
    raise exception 'Sem permissão para editar participantes.';
  end if;

  select * into v_person
  from public.people
  where id = p_person_id;

  if not found then
    raise exception 'Participante não encontrado.';
  end if;

  select * into v_profile
  from public.profiles
  where person_id = p_person_id
  order by updated_at desc nulls last, created_at desc nulls last
  limit 1;

  return jsonb_build_object(
    'person', to_jsonb(v_person),
    'profile', case when v_profile.id is null then null else to_jsonb(v_profile) end
  );
end;
$$;

create or replace function public.admin_update_person_and_profile(
  p_person_id uuid,
  p_person jsonb default '{}'::jsonb,
  p_profile jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
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
    birth_year = case when p_person ? 'birth_year' and nullif(regexp_replace(coalesce(p_person->>'birth_year', ''), '\D', '', 'g'), '') is not null then regexp_replace(p_person->>'birth_year', '\D', '', 'g')::integer else birth_year end,
    class_year = case when p_person ? 'class_year' and nullif(regexp_replace(coalesce(p_person->>'class_year', ''), '\D', '', 'g'), '') is not null then regexp_replace(p_person->>'class_year', '\D', '', 'g')::integer else class_year end,
    class_group = case when p_person ? 'class_group' then upper(nullif(trim(coalesce(p_person->>'class_group', '')), '')) else class_group end,
    avatar_url = case when p_person ? 'avatar_url' then nullif(trim(coalesce(p_person->>'avatar_url', '')), '') else avatar_url end,
    contact_email = case when p_person ? 'contact_email' then nullif(trim(coalesce(p_person->>'contact_email', '')), '') else contact_email end,
    contact_whatsapp = case when p_person ? 'contact_whatsapp' then nullif(trim(coalesce(p_person->>'contact_whatsapp', '')), '') else contact_whatsapp end,
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
      contact_whatsapp = case when p_profile ? 'contact_whatsapp' then nullif(trim(coalesce(p_profile->>'contact_whatsapp', '')), '') else contact_whatsapp end,
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
$$;

revoke all on function public.admin_can_manage_people() from public;
revoke all on function public.admin_get_person_details(uuid) from public;
revoke all on function public.admin_update_person_and_profile(uuid, jsonb, jsonb) from public;
grant execute on function public.admin_can_manage_people() to authenticated;
grant execute on function public.admin_get_person_details(uuid) to authenticated;
grant execute on function public.admin_update_person_and_profile(uuid, jsonb, jsonb) to authenticated;

create or replace view public.public_profile_cards as
select
  p.id as profile_id,
  p.person_id,
  coalesce(p.display_name, pe.display_name) as display_name,
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

create or replace view public.public_alumni_directory_status as
select
  '00000000-0000-0000-0000-000000000001'::uuid as event_id,
  pe.id as person_id,
  pe.full_name,
  pe.class_group,
  pe.profile_status,
  exists (
    select 1
    from public.tickets t
    join public.orders o on o.id = t.order_id
    where t.person_id = pe.id
      and o.event_id = '00000000-0000-0000-0000-000000000001'::uuid
      and o.payment_status = 'approved'
  ) as has_approved_ticket,
  exists (
    select 1
    from public.profiles p_exists
    where p_exists.person_id = pe.id
  ) as has_completed_registration,
  coalesce(p.intends_to_attend, false) as intends_to_attend,
  coalesce(p.display_name, pe.display_name) as display_name,
  coalesce(p.current_photo_url, pe.avatar_url) as avatar_url,
  case when p.show_city = true then p.current_city else null end as current_city,
  case when p.show_city = true then p.current_state else null end as current_state,
  case when p.show_city = true then p.current_country else null end as current_country,
  case when p.show_profession = true then p.profession else null end as profession
from public.people pe
left join lateral (
  select pr.*
  from public.profiles pr
  where pr.person_id = pe.id
  order by pr.updated_at desc nulls last, pr.created_at desc nulls last
  limit 1
) p on true
where pe.is_visible = true;

grant select on public.public_alumni_directory_status to anon, authenticated;

notify pgrst, 'reload schema';
