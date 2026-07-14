-- ================================================================
-- Home restaurada: copy editável para seção Sobre e CTA de evento
-- - Colunas recebem defaults neutros, sem conteúdo editorial público.
-- - A linha oficial do evento é populada explicitamente para o CMS.
-- ================================================================

alter table public.home_page_content
  add column if not exists home_about_overview_json text not null default '{}'::text,
  add column if not exists event_info_view_more_label text not null default '';

update public.home_page_content
set
  event_info_view_more_label = 'Ver mais',
  home_about_overview_json = (
    coalesce(nullif(home_about_overview_json, '')::jsonb, '{}'::jsonb)
    || '{
      "stats_total_label":"Ex-alunos na base",
      "stats_confirmed_label":"Confirmados",
      "stats_memories_label":"Memórias",
      "timeline_label":"Linha do tempo",
      "timeline_title_template":"{total} marcos da turma",
      "timeline_description":"Uma amostra dos momentos que conectam escola, reencontro e bastidores da turma.",
      "memories_label":"Memórias",
      "memories_title_template":"{total} memórias publicadas",
      "memories_empty_title":"Memórias em construção",
      "memories_description":"Relatos curtos, lembranças de corredor e histórias que ajudam a reconstruir a época do HC.",
      "polls_label":"Enquetes",
      "polls_title":"Perguntas da turma",
      "polls_description":"Votações rápidas para descobrir preferências, expectativas e lembranças coletivas.",
      "charts_label":"Gráficos",
      "charts_title":"Raio-X em números",
      "charts_description":"Respostas do questionário viram gráficos sobre perfil, histórias, expectativas e fase atual.",
      "profile_label":"Perfil",
      "profile_title_template":"{total} perfis cadastrados",
      "profile_description":"Um retrato atualizado de quem confirmou, quem já se cadastrou e como a turma se apresenta hoje.",
      "map_label":"Mapa da turma",
      "map_title":"Onde cada um está",
      "map_description":"Uma prévia da distribuição da turma por cidades, estados e países.",
      "view_all_label":"Ver tudo"
    }'::jsonb
  )::text,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

notify pgrst, 'reload schema';
