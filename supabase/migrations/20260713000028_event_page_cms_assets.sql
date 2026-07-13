-- ================================================================
-- Página Evento: campos CMS para remover hardcodes/fallbacks públicos
-- ================================================================

alter table public.event_page_content
  add column if not exists program_image_url text,
  add column if not exists program_image_alt text,
  add column if not exists structure_cards_json jsonb not null default '[]'::jsonb,
  add column if not exists show_gallery_preview boolean not null default false,
  add column if not exists local_section_eyebrow text,
  add column if not exists local_section_title text,
  add column if not exists program_section_eyebrow text,
  add column if not exists program_section_title text,
  add column if not exists structure_section_eyebrow text,
  add column if not exists structure_section_title text,
  add column if not exists structure_section_subtitle text;

alter table public.event_page_content
  drop constraint if exists event_page_content_structure_cards_array;

alter table public.event_page_content
  add constraint event_page_content_structure_cards_array
  check (jsonb_typeof(structure_cards_json) = 'array');

update public.event_page_content
set
  local_section_eyebrow = coalesce(local_section_eyebrow, 'Local'),
  local_section_title = coalesce(local_section_title, 'Como chegar'),
  program_section_eyebrow = coalesce(program_section_eyebrow, 'Programação'),
  program_section_title = coalesce(program_section_title, 'Horários e atrações'),
  structure_section_eyebrow = coalesce(structure_section_eyebrow, 'Estrutura'),
  structure_section_title = coalesce(structure_section_title, 'Bar, comidas, banheiros e segurança'),
  structure_section_subtitle = coalesce(structure_section_subtitle, 'Estrutura do evento'),
  structure_cards_json = case
    when structure_cards_json = '[]'::jsonb then '[
      {"title":"Estacionamento","description":"Consulte a organização sobre vagas, pontos de embarque/desembarque e opções próximas ao local."},
      {"title":"Área Kids","description":"Espaço pensado para apoio às famílias, conforme estrutura final contratada para o evento."},
      {"title":"Registro de fotos e vídeos","description":"A noite terá registros oficiais para preservar os principais momentos do reencontro."}
    ]'::jsonb
    else structure_cards_json
  end,
  show_gallery_preview = false,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

notify pgrst, 'reload schema';
