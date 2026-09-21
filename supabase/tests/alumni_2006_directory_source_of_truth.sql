-- Ex-alunos 2006: o diretório público é dinâmico e não deve ser derivado do
-- snapshot histórico de contact_research_roster.

with expected_current as (
  select count(*)::int as total
  from public.people
  where is_visible = true
    and person_type = 'alumni'
    and class_year = 2006
),
directory as (
  select count(*)::int as total
  from public.public_alumni_directory_status
),
curiosity as (
  select total_people::int as total
  from public.public_curiosity_profile_stats
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid
),
checks as (
  select
    'alumni_directory_matches_current_visible_hc2006' as check_name,
    d.total = e.total as passed
  from directory d cross join expected_current e

  union all

  select
    'curiosity_total_matches_alumni_directory',
    c.total = d.total
  from curiosity c cross join directory d

  union all

  select
    'alumni_directory_contains_only_hc2006_alumni',
    not exists (
      select 1
      from public.public_alumni_directory_status d
      join public.people p on p.id = d.person_id
      where p.is_visible is distinct from true
         or p.person_type <> 'alumni'
         or p.class_year <> 2006
    )
)
select
  check_name,
  case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
