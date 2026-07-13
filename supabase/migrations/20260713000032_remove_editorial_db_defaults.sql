-- ================================================================
-- Remoção de defaults editoriais do banco
-- - Mantém conteúdos já salvos nas linhas existentes
-- - Remove defaults públicos de novas linhas CMS
-- - Remove imagens externas Unsplash herdadas de seed antigo, se ainda existirem
-- ================================================================

-- Home: novas linhas não devem nascer com texto editorial público.
alter table if exists public.home_page_content
  alter column hero_eyebrow set default '',
  alter column hero_title set default '',
  alter column hero_tagline set default '',
  alter column hero_subtitle set default '',
  alter column hero_event_line set default '',
  alter column primary_cta_label set default '',
  alter column secondary_cta_label set default '',
  alter column about_eyebrow set default '',
  alter column about_title set default '',
  alter column about_body_1 set default '',
  alter column about_body_2 set default '',
  alter column info_eyebrow set default '',
  alter column info_title set default '',
  alter column tickets_eyebrow set default '',
  alter column tickets_title set default '',
  alter column confirmed_eyebrow set default '',
  alter column confirmed_title set default '',
  alter column photos_eyebrow set default '',
  alter column photos_title set default '',
  alter column timeline_eyebrow set default '',
  alter column timeline_title set default '',
  alter column faq_eyebrow set default '',
  alter column faq_title set default '';

alter table if exists public.home_page_content
  alter column nav_event_label set default '';

-- Evento: novas linhas não devem nascer com texto editorial público.
alter table if exists public.event_page_content
  alter column hero_eyebrow set default '',
  alter column title set default '',
  alter column subtitle set default '',
  alter column description set default '',
  alter column gallery_json set default '[]'::jsonb,
  alter column venue_notes set default '',
  alter column attractions_json set default '[]'::jsonb,
  alter column schedule_json set default '[]'::jsonb,
  alter column food_bar_text set default '',
  alter column bathrooms_text set default '',
  alter column security_text set default '',
  alter column extra_info_json set default '[]'::jsonb;

-- Campos avançados do evento também devem nascer vazios/neutros.
alter table if exists public.event_page_content
  alter column structure_cards_json set default '[]'::jsonb,
  alter column show_gallery_preview set default false,
  alter column local_section_eyebrow set default null,
  alter column local_section_title set default null,
  alter column program_section_eyebrow set default null,
  alter column program_section_title set default null,
  alter column structure_section_eyebrow set default null,
  alter column structure_section_title set default null,
  alter column structure_section_subtitle set default null;

-- Remove imagens externas usadas apenas como fallback/seed antigo, sem mexer em galerias próprias.
update public.event_page_content
set
  gallery_json = '[]'::jsonb,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and gallery_json::text ilike '%images.unsplash.com%';

-- Remove assets externos seedados por fallback antigo, preservando uploads/URLs próprias.
update public.cms_assets
set
  file_url = null,
  storage_path = null,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and file_url ilike '%images.unsplash.com%';

notify pgrst, 'reload schema';
