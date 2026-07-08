-- Contact fields for public user profiles and updated profile RPC.

alter table public.profiles
  add column if not exists contact_email text,
  add column if not exists contact_whatsapp text;

drop function if exists public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text);

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
  p_contact_whatsapp text default null
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

revoke all on function public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.update_my_public_profile(text, text, text, text, text, text, text, text, text, text, text, text, text, text) to authenticated;
