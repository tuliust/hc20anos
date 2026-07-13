-- ================================================================
-- Home CMS estrito: complementos de copy para remover fallbacks públicos
-- ================================================================

update public.home_page_content
set
  home_alumni_overview_json = (
    coalesce(nullif(home_alumni_overview_json, '')::jsonb, '{}'::jsonb)
    || '{
      "class_tab_label_template":"Turma {group}",
      "class_pagination_template":"Mostrando {start}-{end} de {total}",
      "class_empty_label":"Turma sem registros",
      "confirmed_empty_label":"As fotos de quem confirmou presença aparecerão aqui."
    }'::jsonb
  )::text,
  home_poll_fallback_json = (
    coalesce(nullif(home_poll_fallback_json, '')::jsonb, '{}'::jsonb)
    || '{
      "success_label":"Voto registrado.",
      "error_label":"Não foi possível registrar seu voto agora."
    }'::jsonb
  )::text,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

notify pgrst, 'reload schema';
