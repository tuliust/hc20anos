-- Regressão das métricas de presença compartilhadas por /ex-alunos e /curiosidades.
-- A view agregada deve usar exatamente a mesma semântica do diretório canônico.

with expected as (
  select
    count(*) filter (where has_completed_registration is true)::int as total_registered,
    count(*) filter (
      where intends_to_attend is true
        and has_approved_ticket is false
    )::int as total_preconfirmed,
    count(*) filter (where has_approved_ticket is true)::int as total_confirmed
  from public.public_alumni_directory_status
),
actual as (
  select
    total_registered,
    total_preconfirmed,
    total_confirmed
  from public.public_curiosity_profile_stats
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid
),
checks as (
  select
    'presence_registered_matches_directory' as check_name,
    a.total_registered = e.total_registered as passed
  from actual a cross join expected e

  union all

  select
    'presence_preconfirmed_excludes_approved_ticket',
    a.total_preconfirmed = e.total_preconfirmed
  from actual a cross join expected e

  union all

  select
    'presence_confirmed_matches_approved_ticket',
    a.total_confirmed = e.total_confirmed
  from actual a cross join expected e
)
select
  check_name,
  case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
