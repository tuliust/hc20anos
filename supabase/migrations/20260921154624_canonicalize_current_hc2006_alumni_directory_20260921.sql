-- Ex-alunos 2006: separa o diretório vivo do roster histórico de pesquisa.
--
-- contact_research_roster é um snapshot deliberadamente congelado dos 181
-- pré-cadastrados originais (created_at anterior a 2026-08-01).
-- O diretório público, por outro lado, é dinâmico e deve incluir qualquer
-- perfil posteriormente promovido a alumni HC 2006.
--
-- Não há contagem hardcoded: o total público passa a derivar exclusivamente
-- de pessoas visíveis, person_type='alumni' e class_year=2006.

create or replace view app_private.public_alumni_directory_status as
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
where pe.is_visible = true
  and pe.person_type = 'alumni'
  and pe.class_year = 2006;

create or replace view app_private.public_curiosity_profile_stats as
with constants as (
  select '00000000-0000-0000-0000-000000000001'::uuid as event_id
),
current_alumni as (
  select *
  from app_private.public_alumni_directory_status
),
registered_profiles as (
  select p.*, pe.class_group
  from public.profiles p
  join public.people pe on pe.id = p.person_id
  where pe.is_visible = true
    and pe.person_type = 'alumni'
    and pe.class_year = 2006
),
presence_status as (
  select
    has_approved_ticket,
    has_completed_registration,
    intends_to_attend
  from current_alumni
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
  (select count(*)::int from current_alumni) as total_people,
  (select count(*)::int from presence_status where has_completed_registration is true) as total_registered,
  (select count(*)::int from presence_status where intends_to_attend is true and has_approved_ticket is false) as total_preconfirmed,
  (select count(*)::int from presence_status where has_approved_ticket is true) as total_confirmed,
  (select count(*)::int from registered_profiles p where p.relationship_status is not null) as total_with_relationship,
  (select count(*)::int from registered_profiles p where p.has_children is true) as total_with_children,
  (select coalesce(sum(coalesce(p.children_count, 0)), 0)::int from registered_profiles p where p.has_children is true) as total_children_declared,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from relationship_counts), '[]'::jsonb) as relationship_status_counts,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from children_counts), '[]'::jsonb) as children_status_counts,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from children_distribution), '[]'::jsonb) as children_count_distribution,
  coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by count desc, label) from profession_counts), '[]'::jsonb) as profession_area_counts
from constants c;
