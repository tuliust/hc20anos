-- ================================================================
-- Página Evento — conteúdo editável
-- Turma 2006 — Colégio Henrique Castriciano
-- ================================================================

-- Label novo no menu principal, usado pelo admin de conteúdo.
alter table public.home_page_content
  add column if not exists nav_event_label text not null default 'Evento';

create table if not exists public.event_page_content (
  event_id uuid primary key references public.events(id) on delete cascade,
  hero_eyebrow text not null default 'O reencontro',
  title text not null default 'O Evento',
  subtitle text not null default 'Tudo sobre a noite em que a Turma 2006 volta a se encontrar.',
  description text not null default 'Uma página central para reunir informações sobre local, programação, atrações, estrutura, serviço de bar/comidas, banheiros, segurança e orientações para os convidados.',
  hero_image_url text,
  gallery_json jsonb not null default '[]'::jsonb,
  map_embed_url text,
  map_link_url text,
  venue_notes text not null default 'Local com estrutura para recepção, circulação dos convidados, área de alimentação, bar e apoio da organização durante todo o evento.',
  attractions_json jsonb not null default '[]'::jsonb,
  schedule_json jsonb not null default '[]'::jsonb,
  food_bar_text text not null default 'Serviço de bar e comidas com operação durante o evento. Detalhes de cardápio, bebidas inclusas e itens pagos à parte devem ser confirmados pela organização.',
  bathrooms_text text not null default 'Banheiros disponíveis no local, com orientação da equipe de apoio para acesso durante todo o evento.',
  security_text text not null default 'Equipe de segurança e apoio na entrada, circulação interna e encerramento do evento.',
  extra_info_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by_admin_id uuid references public.admin_users(id) on delete set null,
  constraint event_page_content_gallery_array check (jsonb_typeof(gallery_json) = 'array'),
  constraint event_page_content_attractions_array check (jsonb_typeof(attractions_json) = 'array'),
  constraint event_page_content_schedule_array check (jsonb_typeof(schedule_json) = 'array'),
  constraint event_page_content_extra_info_array check (jsonb_typeof(extra_info_json) = 'array')
);

create or replace function public.set_event_page_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_event_page_content_updated_at on public.event_page_content;
create trigger trg_event_page_content_updated_at
before update on public.event_page_content
for each row
execute function public.set_event_page_content_updated_at();

alter table public.event_page_content enable row level security;

drop policy if exists "event_page_content_select_public" on public.event_page_content;
create policy "event_page_content_select_public"
  on public.event_page_content
  for select
  using (true);

drop policy if exists "event_page_content_manage_admins" on public.event_page_content;
create policy "event_page_content_manage_admins"
  on public.event_page_content
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  );

insert into public.event_page_content (
  event_id,
  gallery_json,
  attractions_json,
  schedule_json,
  extra_info_json
)
values (
  '00000000-0000-0000-0000-000000000001',
  '[
    {"image_url":"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=800&fit=crop&auto=format","caption":"Clima de reencontro"},
    {"image_url":"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop&auto=format","caption":"Celebração da turma"},
    {"image_url":"https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&h=800&fit=crop&auto=format","caption":"Estrutura para receber convidados"}
  ]'::jsonb,
  '[
    {"title":"DJ e pista","description":"Trilha sonora para reencontrar amigos e celebrar os 20 anos da turma."},
    {"title":"Banda convidada","description":"Atração musical a confirmar pela organização."},
    {"title":"Espaço de fotos","description":"Área pensada para registros da turma e fotos comemorativas."}
  ]'::jsonb,
  '[
    {"time":"19h00","title":"Abertura da casa","description":"Recepção, check-in e primeiros reencontros."},
    {"time":"20h00","title":"Boas-vindas","description":"Mensagem da organização e início da programação principal."},
    {"time":"21h00","title":"Jantar e bar","description":"Serviço de alimentação e bebidas conforme estrutura contratada."},
    {"time":"22h00","title":"Atrações musicais","description":"DJ, banda e pista de dança."}
  ]'::jsonb,
  '[
    {"title":"Check-in","description":"Apresente seu ingresso ou QR Code na entrada."},
    {"title":"Acompanhantes","description":"A entrada de acompanhantes segue as regras do ingresso adquirido."}
  ]'::jsonb
)
on conflict (event_id) do nothing;

grant select on public.event_page_content to anon, authenticated;
grant insert, update, delete on public.event_page_content to authenticated;
