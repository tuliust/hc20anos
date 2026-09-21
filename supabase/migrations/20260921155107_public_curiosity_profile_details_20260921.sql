-- Fonte pública mínima e privacy-aware para drill-downs de /ex-alunos e /curiosidades.
-- Não expõe e-mail, telefone, WhatsApp, notas, IDs de usuário ou campos administrativos.

create or replace view app_private.public_curiosity_profile_details as
with latest_profile as (
  select distinct on (pr.person_id)
    pr.*
  from public.profiles pr
  order by pr.person_id, pr.updated_at desc nulls last, pr.created_at desc nulls last
)
select
  pe.id as person_id,
  coalesce(nullif(btrim(p.display_name), ''), nullif(btrim(pe.display_name), ''), pe.full_name) as display_name,
  case
    when p.id is null then pe.avatar_url
    when p.show_current_photo is true then coalesce(p.current_photo_url, pe.avatar_url)
    else null
  end as avatar_url,
  pe.class_group,
  case when p.show_city is true then p.current_city else null end as current_city,
  case when p.show_city is true then p.current_state else null end as current_state,
  case when p.show_city is true then p.current_country else null end as current_country,
  case when p.show_profession is true then p.profession else null end as profession,
  case
    when p.show_profession is not true
      or p.profession is null
      or btrim(p.profession) = ''
      then null
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
  end as profession_area,
  p.has_children,
  p.children_count,
  (p.id is not null) as has_completed_registration,
  case
    when p.show_confirmed_status is true then exists (
      select 1
      from public.tickets t
      join public.orders o on o.id = t.order_id
      where t.person_id = pe.id
        and o.event_id = '00000000-0000-0000-0000-000000000001'::uuid
        and o.payment_status = 'approved'
    )
    else false
  end as has_approved_ticket,
  case
    when p.show_confirmed_status is true then coalesce(p.intends_to_attend, false)
    else false
  end as intends_to_attend
from public.people pe
left join latest_profile p on p.person_id = pe.id
where pe.is_visible = true
  and pe.person_type = 'alumni'
  and pe.class_year = 2006;

create or replace view public.public_curiosity_profile_details
with (security_invoker = true) as
select
  person_id,
  display_name,
  avatar_url,
  class_group,
  current_city,
  current_state,
  current_country,
  profession,
  profession_area,
  has_children,
  children_count,
  has_completed_registration,
  has_approved_ticket,
  intends_to_attend
from app_private.public_curiosity_profile_details;

grant select on app_private.public_curiosity_profile_details to anon, authenticated;
grant select on public.public_curiosity_profile_details to anon, authenticated;

comment on view public.public_curiosity_profile_details is
  'Fonte pública mínima para drill-downs de ex-alunos e curiosidades. Respeita preferências de exibição e não expõe dados privados de contato ou campos administrativos.';

notify pgrst, 'reload schema';
