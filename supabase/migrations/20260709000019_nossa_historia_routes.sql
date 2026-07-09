-- ================================================================
-- Slugs e navegação — Nossa História
-- - /fotos passa a /nossa-historia
-- - /memorias passa a /nossa-historia/memorias
-- - Memórias deixa de aparecer no header
-- ================================================================

alter table public.home_page_content
  add column if not exists nav_photos_label text not null default 'Nossa História';

alter table public.home_page_content
  add column if not exists nav_photos_visible boolean not null default true;

alter table public.home_page_content
  add column if not exists nav_memories_label text not null default 'Caixa de Memórias';

alter table public.home_page_content
  add column if not exists nav_memories_visible boolean not null default false;

alter table public.home_page_content
  alter column nav_photos_label set default 'Nossa História';

alter table public.home_page_content
  alter column nav_memories_label set default 'Caixa de Memórias';

alter table public.home_page_content
  alter column nav_memories_visible set default false;

update public.home_page_content
set
  nav_photos_label = case
    when nav_photos_label is null or btrim(nav_photos_label) = '' or nav_photos_label in ('Fotos', 'Mural de Fotos') then 'Nossa História'
    else nav_photos_label
  end,
  nav_photos_visible = true,
  nav_memories_label = case
    when nav_memories_label is null or btrim(nav_memories_label) = '' or nav_memories_label = 'Memórias' then 'Caixa de Memórias'
    else nav_memories_label
  end,
  nav_memories_visible = false,
  updated_at = now();

-- Ajusta links de rodapé existentes, se o JSON estiver válido.
do $$
declare
  row_item record;
  next_links jsonb;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'home_page_content'
      and column_name = 'footer_links_json'
  ) then
    for row_item in
      select event_id, footer_links_json
      from public.home_page_content
      where footer_links_json is not null and btrim(footer_links_json) <> ''
    loop
      begin
        select jsonb_agg(
          case
            when item->>'page' = 'photo-wall'
              then item || jsonb_build_object('label', 'Nossa História', 'is_visible', true)
            when item->>'page' = 'memories'
              then item || jsonb_build_object('label', 'Caixa de Memórias', 'is_visible', false)
            else item
          end
        )
        into next_links
        from jsonb_array_elements(row_item.footer_links_json::jsonb) item;

        if next_links is not null then
          update public.home_page_content
          set footer_links_json = jsonb_pretty(next_links),
              updated_at = now()
          where event_id = row_item.event_id;
        end if;
      exception when others then
        -- Mantém o conteúdo existente caso algum JSON legado esteja inválido.
        null;
      end;
    end loop;
  end if;
end $$;
