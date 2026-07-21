with checks as (
  select 'identity_verification_table_exists'::text as check_name,
    to_regclass('public.profile_identity_verifications') is not null as passed
  union all
  select 'registration_v3_rpc_exists',
    to_regprocedure('public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)') is not null
  union all
  select 'admin_disputes_identity_rpc_exists',
    to_regprocedure('public.admin_get_profile_claim_disputes_with_identity(text)') is not null
  union all
  select 'particles_are_ignored',
    public.profile_claim_penultimate_surname('Allan Lidérzio Pessoa de Vasconcelos') = 'Pessoa'
  union all
  select 'accents_and_case_are_normalized',
    public.normalize_profile_identity_text('CABEÇÃO') = public.normalize_profile_identity_text('cabecao')
  union all
  select 'anon_cannot_read_identity_evidence',
    not has_table_privilege('anon', 'public.profile_identity_verifications', 'SELECT')
  union all
  select 'authenticated_cannot_read_identity_evidence',
    not has_table_privilege('authenticated', 'public.profile_identity_verifications', 'SELECT')
  union all
  select 'authenticated_can_execute_registration_v3',
    has_function_privilege(
      'authenticated',
      'public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)',
      'EXECUTE'
    )
  union all
  select 'anon_cannot_execute_registration_v3',
    not has_function_privilege(
      'anon',
      'public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)',
      'EXECUTE'
    )
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
