-- ================================================================
-- Home/Admin: usa a timeline da seção Sobre como fonte única.
-- Mantém o campo legado sincronizado para compatibilidade.
-- ================================================================

alter table public.home_page_content
  add column if not exists home_nostalgia_timeline_json text not null default '[]'::text,
  add column if not exists timeline_items_json text not null default '[]'::text;

-- Em bancos onde apenas a timeline antiga possui dados, importa os marcos
-- para o formato consumido atualmente pela seção Sobre da Home.
update public.home_page_content h
set home_nostalgia_timeline_json = coalesce((
  select jsonb_agg(
    (item - 'label' - 'desc' - 'highlight')
    || jsonb_build_object(
      'title', coalesce(item->>'title', item->>'label', ''),
      'description', coalesce(item->>'description', item->>'desc', ''),
      'is_visible', coalesce((item->>'is_visible')::boolean, true)
    )
  )
  from jsonb_array_elements(h.timeline_items_json::jsonb) item
), '[]'::jsonb)::text
where jsonb_array_length(h.home_nostalgia_timeline_json::jsonb) = 0
  and jsonb_array_length(h.timeline_items_json::jsonb) > 0;

-- Espelha a timeline vigente da seção Sobre no campo legado. A aplicação
-- também grava os dois campos em conjunto a partir do painel administrativo.
update public.home_page_content h
set timeline_items_json = coalesce((
  select jsonb_agg(
    (item - 'title' - 'description' - 'icon')
    || jsonb_build_object(
      'label', coalesce(item->>'title', item->>'label', ''),
      'desc', coalesce(item->>'description', item->>'desc', ''),
      'is_visible', coalesce((item->>'is_visible')::boolean, true)
    )
  )
  from jsonb_array_elements(h.home_nostalgia_timeline_json::jsonb) item
), '[]'::jsonb)::text
where jsonb_array_length(h.home_nostalgia_timeline_json::jsonb) > 0;

notify pgrst, 'reload schema';
