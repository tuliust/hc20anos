-- ETAPA 3 — amostra pública do questionário adicional.
-- Expõe somente contagens agregadas; nenhum profile_id/person_id/resposta individual.

create or replace view app_private.public_school_questionnaire_response_stats as
select
  a.event_id,
  count(distinct p.person_id)::integer as respondent_count,
  count(*)::integer as answer_count
from public.profile_school_questionnaire_answers a
join public.profiles p on p.id = a.profile_id
group by a.event_id;

grant select on app_private.public_school_questionnaire_response_stats to anon, authenticated;

create or replace view public.public_school_questionnaire_response_stats
with (security_invoker = true) as
select event_id, respondent_count, answer_count
from app_private.public_school_questionnaire_response_stats;

grant select on public.public_school_questionnaire_response_stats to anon, authenticated;

comment on view public.public_school_questionnaire_response_stats is
  'Contagens públicas agregadas do questionário adicional; não expõe identificadores nem respostas individuais.';

notify pgrst, 'reload schema';
