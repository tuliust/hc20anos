-- ================================================================
-- Atualiza nomenclatura pública do item Archive para Pós-festa.
-- A alteração de rota é feita no front-end (/pos-festa), mantendo
-- /acervo como fallback legado no roteador React.
-- ================================================================

alter table public.home_page_content
  add column if not exists nav_archive_label text default 'Pós-festa';

update public.home_page_content
set
  nav_archive_label = 'Pós-festa',
  footer_links_json = case
    when footer_links_json is null or btrim(footer_links_json) = '' then footer_links_json
    else replace(replace(footer_links_json, 'Acervo Digital', 'Pós-festa'), 'Acervo', 'Pós-festa')
  end,
  updated_at = now()
where nav_archive_label is null
   or nav_archive_label in ('Acervo', 'Acervo Digital')
   or footer_links_json like '%Acervo%';
