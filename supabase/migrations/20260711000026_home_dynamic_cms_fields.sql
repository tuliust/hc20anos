-- ================================================================
-- Home dinâmica: campos administráveis para previews e estatísticas
-- ================================================================

alter table public.home_page_content
  add column if not exists home_alumni_overview_json text not null default $$
{
  "eyebrow": "Ex-alunos",
  "title": "A turma em movimento",
  "description": "Uma prévia compacta da página de ex-alunos, com amostras rotativas, presença no reencontro e distribuição por turma.",
  "sample_label": "Amostra da turma",
  "sample_title_template": "{total} ex-alunos cadastrados",
  "presence_label": "Presença",
  "presence_title": "Reencontro em formação",
  "confirmed_label": "Confirmados",
  "intending_label": "Pretendem ir",
  "progress_label": "Confirmados sobre a base cadastrada",
  "classes_label": "Turmas",
  "classes_title": "Distribuição por sala",
  "confirmed_grid_label": "Confirmados",
  "confirmed_grid_title": "Quem confirmou presença",
  "footer_note": "Amostras rotativas com pessoas cadastradas na tabela da turma.",
  "view_all_label": "Ver todos"
}
$$,
  add column if not exists home_nostalgia_timeline_json text not null default $$
[
  {"year":"1995","icon":"phone-call","title":"Orelhão pra ligar pra casa","description":"Ainda na nossa época de alfabetização, o normal ainda era usar o orelhão para ligar pra casa."},
  {"year":"1996","icon":"laptop","title":"Internet discada e Cadê?","description":"Quando entramos na 1ª série, começava-se a era da internet discada e das buscas no site Cadê?."},
  {"year":"1999","icon":"messages-square","title":"mIRC e ICQ","description":"Na 4ª série, começaram os tempos de mIRC e ICQ."},
  {"year":"2000","icon":"proportions","title":"MSN Messenger","description":"Boa parte do nosso Ensino Fundamental foi conversando pelo MSN Messenger."},
  {"year":"2003","icon":"smartphone","title":"Nokia e SMS","description":"Na 8ª série, passamos a mandar SMS com nossos Nokias."},
  {"year":"2004","icon":"book-image","title":"Orkut e Fotolog","description":"No Ensino Médio, Orkut e Fotolog marcaram para sempre nossas vidas."}
]
$$,
  add column if not exists home_profile_stats_json text not null default $$
[
  {"key":"law","icon":"graduation-cap","label":"trabalham na área do Direito","mode":"auto","fallback_value":"5%"},
  {"key":"children","icon":"baby","label":"tem filhos","mode":"auto","fallback_value":"40%"},
  {"key":"women","icon":"venus","label":"são mulheres","mode":"auto","fallback_value":"55%"}
]
$$,
  add column if not exists home_map_stats_json text not null default $$
[
  {"key":"natal","label":"Natal","mode":"auto","fallback_value":57},
  {"key":"interior","label":"Interior","mode":"auto","fallback_value":12},
  {"key":"other_state","label":"Outro estado","mode":"auto","fallback_value":25},
  {"key":"foreign","label":"Fora do país","mode":"auto","fallback_value":6}
]
$$,
  add column if not exists home_poll_id uuid null,
  add column if not exists home_poll_fallback_json text not null default $$
{
  "question": "Qual professor te marcou?",
  "empty_label": "Configure uma enquete no painel Admin.",
  "login_required_label": "Entre para votar.",
  "options": ["Agamenon", "Adailton", "Sérgio Trindade"]
}
$$;

notify pgrst, 'reload schema';
