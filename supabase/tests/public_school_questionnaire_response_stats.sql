-- Contrato da amostra pública do questionário adicional.

with expected_columns as (
  select array_agg(column_name::text order by ordinal_position) as columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'public_school_questionnaire_response_stats'
),
checks as (
  select
    'questionnaire_response_stats_columns' as check_name,
    columns = array['event_id','respondent_count','answer_count']::text[] as passed
  from expected_columns

  union all
  select
    'questionnaire_response_stats_no_identifiers',
    not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'public_school_questionnaire_response_stats'
        and column_name in ('person_id','profile_id','user_id','answer','selected_options_json')
    )

  union all
  select
    'questionnaire_response_stats_anon_select',
    has_table_privilege('anon', 'public.public_school_questionnaire_response_stats', 'SELECT')

  union all
  select
    'questionnaire_response_stats_authenticated_select',
    has_table_privilege('authenticated', 'public.public_school_questionnaire_response_stats', 'SELECT')
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
