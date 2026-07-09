-- Página consolidada /ex-alunos: navegação e status públicos do diretório.
-- Mantém compatibilidade com /turma, /quem-vai e /mapa no front, mas expõe uma fonte única de status.

alter table public.home_page_content
  add column if not exists nav_ex_alumni_label text default 'Ex-alunos',
  add column if not exists nav_ex_alumni_visible boolean default true;

update public.home_page_content
set
  nav_ex_alumni_label = coalesce(nav_ex_alumni_label, 'Ex-alunos'),
  nav_ex_alumni_visible = coalesce(nav_ex_alumni_visible, true),
  nav_who_going_visible = false,
  nav_the_class_visible = false,
  nav_where_now_visible = false
where event_id = '00000000-0000-0000-0000-000000000001';

create or replace view public.public_alumni_directory_status as
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
  p.display_name,
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
where pe.is_visible = true;

grant select on public.public_alumni_directory_status to anon, authenticated;
