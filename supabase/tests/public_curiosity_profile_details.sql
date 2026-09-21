-- Contrato de segurança e privacidade da fonte pública usada pelos drill-downs.
-- Mantém a projeção pública mínima sincronizada com as preferências de exibição.

with expected_columns(column_name) as (
  values
    ('person_id'),
    ('display_name'),
    ('avatar_url'),
    ('class_group'),
    ('current_city'),
    ('current_state'),
    ('current_country'),
    ('profession'),
    ('profession_area'),
    ('has_children'),
    ('children_count'),
    ('has_completed_registration'),
    ('has_approved_ticket'),
    ('intends_to_attend')
),
actual_columns as (
  select column_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'public_curiosity_profile_details'
),
latest_profile as (
  select distinct on (person_id)
    person_id,
    show_city,
    show_profession,
    show_current_photo,
    show_confirmed_status
  from public.profiles
  order by person_id, updated_at desc nulls last, created_at desc nulls last
),
checks as (
  select
    'curiosity_details_security_invoker' as check_name,
    coalesce(
      (
        select 'security_invoker=true' = any(c.reloptions)
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'public_curiosity_profile_details'
      ),
      false
    ) as passed

  union all

  select
    'curiosity_details_exact_public_columns',
    not exists (
      select column_name from expected_columns
      except
      select column_name from actual_columns
    )
    and not exists (
      select column_name from actual_columns
      except
      select column_name from expected_columns
    )

  union all

  select
    'curiosity_details_no_private_columns',
    not exists (
      select 1
      from actual_columns
      where column_name in (
        'email','contact_email','phone','contact_phone','contact_whatsapp',
        'whatsapp','private_notes','notes','user_id','claimed_by_user_id',
        'claimed_at','verification_status'
      )
    )

  union all

  select
    'curiosity_details_only_visible_hc2006_alumni',
    not exists (
      select 1
      from public.public_curiosity_profile_details d
      join public.people pe on pe.id = d.person_id
      where pe.is_visible is distinct from true
         or pe.person_type <> 'alumni'
         or pe.class_year <> 2006
    )

  union all

  select
    'curiosity_details_city_privacy',
    not exists (
      select 1
      from public.public_curiosity_profile_details d
      join latest_profile p on p.person_id = d.person_id
      where p.show_city is false
        and (d.current_city is not null or d.current_state is not null or d.current_country is not null)
    )

  union all

  select
    'curiosity_details_profession_privacy',
    not exists (
      select 1
      from public.public_curiosity_profile_details d
      join latest_profile p on p.person_id = d.person_id
      where p.show_profession is false
        and (d.profession is not null or d.profession_area is not null)
    )

  union all

  select
    'curiosity_details_avatar_privacy',
    not exists (
      select 1
      from public.public_curiosity_profile_details d
      join latest_profile p on p.person_id = d.person_id
      where p.show_current_photo is false
        and d.avatar_url is not null
    )

  union all

  select
    'curiosity_details_presence_privacy',
    not exists (
      select 1
      from public.public_curiosity_profile_details d
      join latest_profile p on p.person_id = d.person_id
      where p.show_confirmed_status is false
        and (d.has_approved_ticket or d.intends_to_attend)
    )

  union all

  select
    'curiosity_details_anon_select',
    has_table_privilege('anon', 'public.public_curiosity_profile_details', 'SELECT')

  union all

  select
    'curiosity_details_authenticated_select',
    has_table_privilege('authenticated', 'public.public_curiosity_profile_details', 'SELECT')
)
select
  check_name,
  case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
