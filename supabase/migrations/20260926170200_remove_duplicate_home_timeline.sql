-- Mantém na Home apenas a timeline nostálgica e o carrossel de memórias
-- embutidos na seção Sobre, imediatamente abaixo do hero.
-- O slot legado "timeline" gerava uma segunda timeline e uma segunda caixa de memórias.

update public.home_page_content as home
set home_sections_json = coalesce((
  select jsonb_agg(
    case
      when section.item ->> 'key' = 'timeline'
        then section.item || '{"is_visible": false}'::jsonb
      else section.item
    end
    order by section.ordinality
  )::text
  from jsonb_array_elements(
    coalesce(nullif(home.home_sections_json, '')::jsonb, '[]'::jsonb)
  ) with ordinality as section(item, ordinality)
), '[]')
where home.home_sections_json is not null;
