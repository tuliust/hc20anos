-- Conteúdo editável da página inicial

create table if not exists public.home_page_content (
  event_id uuid primary key references public.events(id) on delete cascade,
  hero_eyebrow text not null default 'Colégio Henrique Castriciano · Natal, RN',
  hero_title text not null default 'Turma 2006 — 20 anos depois',
  hero_tagline text not null default '20 anos depois',
  hero_subtitle text not null default 'O reencontro dos ex-alunos do Colégio Henrique Castriciano',
  hero_event_line text not null default '17 de Outubro de 2026 · Espaço Cultural Ponta Negra · Natal, RN',
  primary_cta_label text not null default 'Comprar ingresso',
  secondary_cta_label text not null default 'Ver quem vai',
  about_eyebrow text not null default 'Sobre o Reencontro',
  about_title text not null default 'Uma noite para celebrar quem a gente se tornou',
  about_body_1 text not null default 'Vinte anos passaram desde que dividimos o mesmo pátio, os mesmos corredores e as mesmas angústias de vestibular.',
  about_body_2 text not null default 'No dia 17 de outubro de 2026, a Turma 2006 do Colégio Henrique Castriciano se reúne para uma noite inesquecível de memórias, reconexão e celebração.',
  info_eyebrow text not null default 'Informações do Evento',
  info_title text not null default 'Data, hora e local',
  tickets_eyebrow text not null default 'Ingressos',
  tickets_title text not null default 'Garanta sua vaga',
  confirmed_eyebrow text not null default 'Confirmados',
  confirmed_title text not null default 'Quem já garantiu vaga',
  photos_eyebrow text not null default 'Mural de Memórias',
  photos_title text not null default 'Fotos da época',
  timeline_eyebrow text not null default 'Nossa história',
  timeline_title text not null default 'A linha do tempo da turma',
  faq_eyebrow text not null default 'Dúvidas frequentes',
  faq_title text not null default 'FAQ',
  updated_at timestamptz not null default now(),
  updated_by_admin_id uuid null
);

alter table public.home_page_content enable row level security;

drop policy if exists home_page_content_public_read on public.home_page_content;
create policy home_page_content_public_read
on public.home_page_content for select
using (true);

drop policy if exists home_page_content_admin_write on public.home_page_content;
create policy home_page_content_admin_write
on public.home_page_content for all
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.role in ('admin','superadmin')
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.role in ('admin','superadmin')
  )
);

create or replace function public.fn_touch_home_page_content()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_home_page_content on public.home_page_content;
create trigger trg_touch_home_page_content
before update on public.home_page_content
for each row execute function public.fn_touch_home_page_content();

grant select on public.home_page_content to anon, authenticated;
grant insert, update, delete on public.home_page_content to authenticated;

insert into public.home_page_content (event_id)
select id from public.events
where id = '00000000-0000-0000-0000-000000000001'
on conflict (event_id) do nothing;
