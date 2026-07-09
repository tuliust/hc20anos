-- ================================================================
-- Curiosidades: questionário de mini bio, infográficos e slug
-- Turma 2006 — Colégio Henrique Castriciano
-- ================================================================

create table if not exists public.profile_school_questionnaire_answers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null default '00000000-0000-0000-0000-000000000001',
  profile_id uuid not null references public.profiles(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  question_id text not null,
  selected_options_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_school_questionnaire_answers_unique unique (profile_id, question_id),
  constraint profile_school_questionnaire_answers_options_array check (jsonb_typeof(selected_options_json) = 'array')
);

alter table public.profile_school_questionnaire_answers enable row level security;

drop policy if exists profile_school_questionnaire_answers_select_own on public.profile_school_questionnaire_answers;
drop policy if exists profile_school_questionnaire_answers_insert_own on public.profile_school_questionnaire_answers;
drop policy if exists profile_school_questionnaire_answers_update_own on public.profile_school_questionnaire_answers;
drop policy if exists profile_school_questionnaire_answers_admin_manage on public.profile_school_questionnaire_answers;

create policy profile_school_questionnaire_answers_select_own
on public.profile_school_questionnaire_answers
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_school_questionnaire_answers.profile_id
      and p.user_id = auth.uid()
  )
);

create policy profile_school_questionnaire_answers_insert_own
on public.profile_school_questionnaire_answers
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = profile_school_questionnaire_answers.profile_id
      and p.user_id = auth.uid()
      and p.person_id = profile_school_questionnaire_answers.person_id
  )
);

create policy profile_school_questionnaire_answers_update_own
on public.profile_school_questionnaire_answers
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_school_questionnaire_answers.profile_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = profile_school_questionnaire_answers.profile_id
      and p.user_id = auth.uid()
      and p.person_id = profile_school_questionnaire_answers.person_id
  )
);

create policy profile_school_questionnaire_answers_admin_manage
on public.profile_school_questionnaire_answers
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.role in ('superadmin', 'admin')
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.role in ('superadmin', 'admin')
  )
);

create index if not exists idx_profile_school_questionnaire_answers_event on public.profile_school_questionnaire_answers(event_id);
create index if not exists idx_profile_school_questionnaire_answers_person on public.profile_school_questionnaire_answers(person_id);
create index if not exists idx_profile_school_questionnaire_answers_question on public.profile_school_questionnaire_answers(question_id);

create or replace view public.public_school_questionnaire_option_stats as
select
  a.event_id,
  a.question_id,
  option_value as option_label,
  count(*)::int as answer_count
from public.profile_school_questionnaire_answers a
cross join lateral jsonb_array_elements_text(a.selected_options_json) option_value
where option_value is not null
  and btrim(option_value) <> ''
group by a.event_id, a.question_id, option_value;

create or replace view public.public_curiosity_profile_stats as
with constants as (
  select '00000000-0000-0000-0000-000000000001'::uuid as event_id
),
visible_people as (
  select * from public.people where is_visible is not false
),
registered_profiles as (
  select p.*, pe.class_group
  from public.profiles p
  join public.people pe on pe.id = p.person_id
  where pe.is_visible is not false
),
confirmed_people as (
  select distinct o.person_id
  from public.orders o
  where o.person_id is not null
    and o.payment_status = 'approved'
),
relationship_counts as (
  select
    case p.relationship_status
      when 'single' then 'Solteiro(a)'
      when 'dating' then 'Namorando'
      when 'married' then 'Casado(a)'
      else 'Não informado'
    end as label,
    count(*)::int as count
  from registered_profiles p
  group by 1
),
children_counts as (
  select
    case when p.has_children is true then 'Com filhos' else 'Sem filhos' end as label,
    count(*)::int as count
  from registered_profiles p
  group by 1
),
children_distribution as (
  select
    case
      when p.has_children is not true then '0 filhos'
      when coalesce(p.children_count, 0) >= 4 then '4+ filhos'
      when coalesce(p.children_count, 0) = 3 then '3 filhos'
      when coalesce(p.children_count, 0) = 2 then '2 filhos'
      when coalesce(p.children_count, 0) = 1 then '1 filho'
      else 'Tem filhos'
    end as label,
    count(*)::int as count
  from registered_profiles p
  group by 1
),
profession_counts as (
  select
    case
      when p.profession is null or btrim(p.profession) = '' or p.show_profession is false then 'Não informado'
      when p.profession ilike any (array['%médic%','%medic%','%saúde%','%saude%','%dent%','%psic%','%fisio%','%nutri%','%enferm%','%farm%']) then 'Saúde'
      when p.profession ilike any (array['%adv%','%direito%','%jur%','%promotor%','%defensor%']) then 'Direito'
      when p.profession ilike any (array['%prof%','%educ%','%pedagog%','%docente%']) then 'Educação'
      when p.profession ilike any (array['%comunica%','%jornal%','%marketing%','%public%','%social media%','%relações públicas%','%relacoes publicas%']) then 'Comunicação e Marketing'
      when p.profession ilike any (array['%tech%','%tecnologia%','%desenvolv%','%program%','%software%','%dados%','%data%','%sistema%','%ti%']) then 'Tecnologia'
      when p.profession ilike any (array['%engenh%','%arquit%','%urban%']) then 'Engenharia e Arquitetura'
      when p.profession ilike any (array['%admin%','%gest%','%negócio%','%negocio%','%empreend%','%empres%','%comercial%']) then 'Negócios e Gestão'
      when p.profession ilike any (array['%servidor%','%públic%','%public%','%governo%','%estado%','%prefeitura%']) then 'Serviço Público'
      when p.profession ilike any (array['%finan%','%banc%','%conta%','%econom%','%invest%']) then 'Finanças'
      when p.profession ilike any (array['%arte%','%design%','%cria%','%músic%','%music%','%fot%','%vídeo%','%video%']) then 'Artes e Criação'
      else 'Outras áreas'
    end as label,
    count(*)::int as count
  from registered_profiles p
  group by 1
)
select
  c.event_id,
  (select count(*)::int from visible_people) as total_people,
  (select count(*)::int from registered_profiles) as total_registered,
  (select count(*)::int from registered_profiles p where p.intends_to_attend is true) as total_preconfirmed,
  (select count(*)::int from confirmed_people) as total_confirmed,
  (select count(*)::int from registered_profiles p where p.relationship_status is not null) as total_with_relationship,
  (select count(*)::int from registered_profiles p where p.has_children is true) as total_with_children,
  (select coalesce(sum(coalesce(p.children_count, 0)), 0)::int from registered_profiles p where p.has_children is true) as total_children_declared,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from relationship_counts), '[]'::jsonb) as relationship_status_counts,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from children_counts), '[]'::jsonb) as children_status_counts,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from children_distribution), '[]'::jsonb) as children_count_distribution,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from profession_counts), '[]'::jsonb) as profession_area_counts
from constants c;

grant select on public.public_school_questionnaire_option_stats to anon, authenticated;
grant select on public.public_curiosity_profile_stats to anon, authenticated;
grant select, insert, update, delete on public.profile_school_questionnaire_answers to authenticated;

-- Atualiza a nomenclatura pública do item antigo de Enquetes.
-- Bloco defensivo: alguns ambientes ainda não têm footer_links_json.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'home_page_content'
      and column_name = 'nav_polls_label'
  ) then
    execute $sql$
      update public.home_page_content
      set
        nav_polls_label = 'Curiosidades',
        updated_at = now()
      where nav_polls_label is null
         or nav_polls_label in ('Enquetes', 'Enquetes nostálgicas')
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'home_page_content'
      and column_name = 'footer_links_json'
  ) then
    execute $sql$
      update public.home_page_content
      set
        footer_links_json = replace(footer_links_json::text, 'Enquetes', 'Curiosidades')::jsonb,
        updated_at = now()
      where footer_links_json is not null
        and footer_links_json::text like '%Enquetes%'
    $sql$;
  end if;
end $$;
