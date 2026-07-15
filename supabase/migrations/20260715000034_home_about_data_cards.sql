-- ================================================================
-- Home: restaura os cards dinâmicos da seção Sobre.
-- Preserva mode/value configurados no CMS para chaves reaproveitadas.
-- ================================================================

-- Alguns ambientes receberam os campos dinâmicos sem a migração de copy
-- restaurada. Criamos todas as dependências deste script defensivamente para
-- que ele possa ser executado de forma isolada e repetida.
alter table public.home_page_content
  add column if not exists home_about_overview_json text not null default '{}'::text,
  add column if not exists home_profile_stats_json text not null default '[]'::text,
  add column if not exists home_map_stats_json text not null default '[]'::text,
  add column if not exists home_poll_id uuid null,
  add column if not exists home_poll_fallback_json text not null default '{}'::text;

with source as (
  select
    event_id,
    coalesce(nullif(home_profile_stats_json, '')::jsonb, '[]'::jsonb) as items
  from public.home_page_content
)
update public.home_page_content h
set home_profile_stats_json = jsonb_build_array(
  '{"key":"women","label":"são mulheres","mode":"auto","fallback_value":"0%"}'::jsonb
    || coalesce((select item from jsonb_array_elements(source.items) item where item->>'key' = 'women' limit 1), '{}'::jsonb)
    || '{"key":"women","label":"são mulheres"}'::jsonb,
  '{"key":"married","label":"são casadas","mode":"auto","fallback_value":"0%"}'::jsonb
    || coalesce((select item from jsonb_array_elements(source.items) item where item->>'key' = 'married' limit 1), '{}'::jsonb)
    || '{"key":"married","label":"são casadas"}'::jsonb,
  '{"key":"children","label":"têm filhos","mode":"auto","fallback_value":"0%"}'::jsonb
    || coalesce((select item from jsonb_array_elements(source.items) item where item->>'key' = 'children' limit 1), '{}'::jsonb)
    || '{"key":"children","label":"têm filhos"}'::jsonb
)::text
from source
where h.event_id = source.event_id;

with source as (
  select
    event_id,
    coalesce(nullif(home_map_stats_json, '')::jsonb, '[]'::jsonb) as items
  from public.home_page_content
)
update public.home_page_content h
set home_map_stats_json = jsonb_build_array(
  '{"key":"natal","label":"Natal/RN","mode":"auto","fallback_value":0}'::jsonb
    || coalesce((select item from jsonb_array_elements(source.items) item where item->>'key' = 'natal' limit 1), '{}'::jsonb)
    || '{"key":"natal","label":"Natal/RN"}'::jsonb,
  '{"key":"interior","label":"Interior do RN","mode":"auto","fallback_value":0}'::jsonb
    || coalesce((select item from jsonb_array_elements(source.items) item where item->>'key' = 'interior' limit 1), '{}'::jsonb)
    || '{"key":"interior","label":"Interior do RN"}'::jsonb,
  '{"key":"other_state","label":"Outros estados","mode":"auto","fallback_value":0}'::jsonb
    || coalesce((select item from jsonb_array_elements(source.items) item where item->>'key' = 'other_state' limit 1), '{}'::jsonb)
    || '{"key":"other_state","label":"Outros estados"}'::jsonb,
  '{"key":"foreign","label":"Exterior","mode":"auto","fallback_value":0}'::jsonb
    || coalesce((select item from jsonb_array_elements(source.items) item where item->>'key' = 'foreign' limit 1), '{}'::jsonb)
    || '{"key":"foreign","label":"Exterior"}'::jsonb
)::text
from source
where h.event_id = source.event_id;

update public.home_page_content
set
  home_about_overview_json = (
    coalesce(nullif(home_about_overview_json, '')::jsonb, '{}'::jsonb)
    || '{
      "stats_total_label":"Ex-alunos na base",
      "timeline_label":"Linha do tempo",
      "memories_label":"Memórias",
      "profile_label":"Perfil",
      "polls_label":"Enquete",
      "map_label":"Mapa da turma"
    }'::jsonb
  )::text,
  home_poll_fallback_json = (
    coalesce(nullif(home_poll_fallback_json, '')::jsonb, '{}'::jsonb)
    || '{
      "empty_label":"Nenhuma enquete está aberta no momento.",
      "login_required_label":"Entre para votar."
    }'::jsonb
  )::text;

notify pgrst, 'reload schema';
