update public.home_page_content
set home_about_overview_json = jsonb_set(
  coalesce(nullif(btrim(home_about_overview_json), '')::jsonb, '{}'::jsonb),
  '{stats_total_label}',
  to_jsonb('TOTAL DE ALUNOS CONCLUINTES'::text),
  true
)::text;

notify pgrst, 'reload schema';
