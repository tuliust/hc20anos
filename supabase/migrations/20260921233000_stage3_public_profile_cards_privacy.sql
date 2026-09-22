-- ETAPA 3 — endurecer a fonte pública usada pelo modal individual de perfil.
-- Mantém o mesmo contrato de colunas e apenas aplica preferências de privacidade
-- antes de qualquer dado chegar ao navegador.

create or replace view app_private.public_profile_cards as
select
  p.id as profile_id,
  p.person_id,
  coalesce(nullif(btrim(p.display_name), ''), nullif(btrim(pe.display_name), ''), pe.full_name) as display_name,
  pe.full_name,
  case
    when p.show_current_photo is true then coalesce(p.current_photo_url, pe.avatar_url)
    else null::text
  end as avatar_url,
  case when p.show_city is true then p.current_city else null::text end as current_city,
  case when p.show_city is true then p.current_state else null::text end as current_state,
  case when p.show_city is true then p.current_country else null::text end as current_country,
  case when p.show_profession is true then p.profession else null::text end as profession,
  case when p.show_social_links is true then p.instagram_url else null::text end as instagram_url,
  case when p.show_social_links is true then p.linkedin_url else null::text end as linkedin_url,
  null::text as contact_whatsapp,
  p.relationship_status,
  p.has_children,
  p.children_count,
  case when p.show_confirmed_status is true then p.intends_to_attend else false end as intends_to_attend
from public.profiles p
join public.people pe on pe.id = p.person_id
where pe.is_visible = true;

comment on view app_private.public_profile_cards is
  'Fonte interna do cartão público de perfil. Aplica preferências de foto, cidade, profissão, links e presença antes da projeção pública.';

notify pgrst, 'reload schema';
