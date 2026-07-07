-- ================================================================
-- Evento Ex-Alunos HC
-- Add people.avatar_url and expose avatars in public location view
-- ================================================================

alter table public.people
add column if not exists avatar_url text;

update public.people
set avatar_url = case full_name
  when 'Ana Paula Oliveira' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/ana-paula-oliveira.jpg.jpg'
  when 'Bruno Cavalcanti' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/bruno-cavalcanti.jpg.jpg'
  when 'Carla Medeiros' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/carla-medeiros.jpg.jpg'
  when 'Diego Ferreira' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/diego-ferreira.jpg.jpg'
  when 'Eduarda Lima' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/eduarda-lima.jpg.jpg'
  when 'Felipe Araújo' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/felipe-araujo.jpg.jpg'
  when 'Gabriela Santos' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/gabriela-santos.jpg.jpg'
  when 'Henrique Costa' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/henrique-costa.jpg.jpg'
  when 'João Vitor Melo' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/joao-vitor-melo.jpg.jpg'
  when 'Lucas Nogueira' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/lucas-nogueira.jpg.jpg'
  when 'Nathan Alves' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/nathan-alves.jpg.jpg'
  when 'Sandro Vieira' then 'https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/avatars/people/sandro-vieira.jpg.jpg'
  else avatar_url
end
where full_name in (
  'Ana Paula Oliveira',
  'Bruno Cavalcanti',
  'Carla Medeiros',
  'Diego Ferreira',
  'Eduarda Lima',
  'Felipe Araújo',
  'Gabriela Santos',
  'Henrique Costa',
  'João Vitor Melo',
  'Lucas Nogueira',
  'Nathan Alves',
  'Sandro Vieira'
);

drop view if exists public.public_profile_locations;

create view public.public_profile_locations as
select
  p.id as profile_id,
  p.person_id,
  p.display_name,
  pe.full_name,
  pe.avatar_url,
  p.current_city,
  p.current_state,
  p.current_country,
  p.profession,
  p.show_profession
from public.profiles p
join public.people pe on pe.id = p.person_id
where p.show_city = true
  and p.current_city is not null
  and length(trim(p.current_city)) > 0
  and pe.is_visible = true;

grant select on public.public_profile_locations to anon, authenticated;