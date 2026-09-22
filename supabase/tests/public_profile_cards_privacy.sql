-- Contrato da ETAPA 3 para o modal público de perfil.
-- Garante que as preferências de privacidade sejam aplicadas na fonte,
-- sem depender de mascaramento no React.

with latest_profile as (
  select distinct on (person_id)
    person_id,
    show_current_photo,
    show_city,
    show_profession,
    show_social_links,
    show_confirmed_status
  from public.profiles
  order by person_id, updated_at desc nulls last, created_at desc nulls last
),
checks as (
  select
    'profile_cards_avatar_privacy' as check_name,
    not exists (
      select 1
      from public.public_profile_cards c
      join latest_profile p on p.person_id = c.person_id
      where p.show_current_photo is false
        and c.avatar_url is not null
    ) as passed

  union all

  select
    'profile_cards_city_privacy',
    not exists (
      select 1
      from public.public_profile_cards c
      join latest_profile p on p.person_id = c.person_id
      where p.show_city is false
        and (c.current_city is not null or c.current_state is not null or c.current_country is not null)
    )

  union all

  select
    'profile_cards_profession_privacy',
    not exists (
      select 1
      from public.public_profile_cards c
      join latest_profile p on p.person_id = c.person_id
      where p.show_profession is false
        and c.profession is not null
    )

  union all

  select
    'profile_cards_social_privacy',
    not exists (
      select 1
      from public.public_profile_cards c
      join latest_profile p on p.person_id = c.person_id
      where p.show_social_links is false
        and (c.instagram_url is not null or c.linkedin_url is not null or c.contact_whatsapp is not null)
    )

  union all

  select
    'profile_cards_presence_privacy',
    not exists (
      select 1
      from public.public_profile_cards c
      join latest_profile p on p.person_id = c.person_id
      where p.show_confirmed_status is false
        and c.intends_to_attend is true
    )

  union all

  select
    'profile_cards_anon_select',
    has_table_privilege('anon', 'public.public_profile_cards', 'SELECT')

  union all

  select
    'profile_cards_authenticated_select',
    has_table_privilege('authenticated', 'public.public_profile_cards', 'SELECT')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
