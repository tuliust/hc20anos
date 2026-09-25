-- HC20Anos passa de site de venda do reencontro para acervo/comunidade permanente da Turma 2006.
-- O domínio comercial é preservado para auditoria e reembolsos, mas novas vendas ficam encerradas.

update public.events
set
  event_status = 'cancelled',
  sales_status = 'closed',
  refund_policy = 'Evento cancelado por baixa adesão. Os pagamentos aprovados serão reembolsados integralmente pelo Mercado Pago para o meio de pagamento original.',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000001'::uuid;

update public.home_page_content
set
  header_cta_label = 'Criar meu perfil',
  header_cta_visible = false,
  header_auth_visible = true,

  nav_home_label = 'Início',
  nav_home_visible = true,
  nav_event_visible = false,
  nav_ex_alumni_label = 'Ex-alunos',
  nav_ex_alumni_visible = true,
  nav_who_going_visible = false,
  nav_the_class_visible = false,
  nav_photos_label = 'Nossa História',
  nav_photos_visible = true,
  nav_memories_visible = false,
  nav_polls_label = 'Curiosidades',
  nav_polls_visible = true,
  nav_where_now_visible = false,
  nav_archive_visible = false,

  hero_eyebrow = '2006 — 2026',
  hero_title = 'TURMA 2006',
  hero_tagline = '20 anos depois',
  hero_subtitle = 'Histórias, memórias e caminhos de quem fez parte do Henrique Castriciano.',
  hero_event_line = 'Colégio Henrique Castriciano · Natal/RN · Turma 2006',
  primary_cta_label = 'Ver ex-alunos',
  primary_cta_page = 'ex-alumni',
  secondary_cta_label = 'Criar ou atualizar meu perfil',
  secondary_cta_page = 'claim-profile',

  about_eyebrow = 'Dos bilhetinhos à IA',
  about_title = 'Histórias e amizades que passaram por todas as redes',
  about_body_1 = 'Começamos juntos quando a comunicação entre amigos significava escrever bilhetes, trocar recados e decorar números de telefone. Crescemos junto com a internet: atravessamos a conexão discada, os torpedos, as salas de bate-papo e as fotos de qualidade duvidosa.',
  about_body_2 = 'Vinte anos depois do Pré, este espaço reúne histórias, perfis, fotos e lembranças da Turma 2006 — e ajuda a acompanhar os caminhos que cada um tomou desde o Henrique Castriciano.',

  faq_eyebrow = 'Informações',
  faq_title = 'Sobre o site e o cancelamento',

  footer_eyebrow = '2006 — 2026',
  footer_title = 'Turma 2006',
  footer_body = 'Um espaço para reunir histórias, fotos e caminhos da turma do Henrique Castriciano, 20 anos depois.',
  footer_nav_title = 'Navegação',
  footer_copyright = '© 2026 Turma 2006 · HC20Anos',

  home_sections_json = $json$[
    {"key":"hero","label":"Hero","is_visible":true,"sort_order":10},
    {"key":"about","label":"Sobre","is_visible":true,"sort_order":20},
    {"key":"info","label":"Informações do evento","is_visible":false,"sort_order":30},
    {"key":"tickets","label":"Ingressos","is_visible":false,"sort_order":40},
    {"key":"confirmed","label":"Confirmados","is_visible":false,"sort_order":50},
    {"key":"photos","label":"Fotos","is_visible":false,"sort_order":60},
    {"key":"timeline","label":"Linha do tempo","is_visible":false,"sort_order":70},
    {"key":"faq","label":"FAQ","is_visible":true,"sort_order":80}
  ]$json$,

  footer_links_json = $json$[
    {"page":"home","label":"Início","is_visible":true},
    {"page":"ex-alumni","label":"Ex-alunos","is_visible":true},
    {"page":"photo-wall","label":"Nossa História","is_visible":true},
    {"page":"curiosities","label":"Curiosidades","is_visible":true},
    {"page":"claim-profile","label":"Criar meu perfil","is_visible":true}
  ]$json$,

  home_about_overview_json = (
    coalesce(nullif(home_about_overview_json, ''), '{}')::jsonb ||
    jsonb_build_object(
      'polls_description', 'Votações e perguntas sobre lembranças, gostos e histórias coletivas da turma.',
      'charts_description', 'Respostas do questionário viram gráficos sobre perfil, histórias e a fase atual da turma.',
      'profile_description', 'Um retrato atualizado de quem já se cadastrou e de como a turma se apresenta hoje.',
      'timeline_description', 'Uma amostra dos momentos que conectam escola, tecnologia e os caminhos da turma.',
      'stats_confirmed_label', 'Perfis cadastrados'
    )
  )::text,

  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Preserva todas as perguntas no Admin, mas tira do site público as regras comerciais antigas.
update public.faq_items
set is_visible = false, is_featured = false, updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

update public.faq_items
set
  question = 'O encontro de 20 anos ainda vai acontecer?',
  answer = 'Não. O encontro previsto para setembro de 2026 foi cancelado devido à baixa adesão de participantes. O site HC20Anos continua ativo como espaço da Turma 2006.',
  is_visible = true,
  is_featured = true,
  sort_order = 10,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and slug = 'quando-e-onde-sera-o-reencontro';

update public.faq_items
set
  question = 'O site continuará funcionando?',
  answer = 'Sim. Ex-alunos podem continuar criando ou atualizando seus perfis, respondendo ao questionário, consultando curiosidades, vendo a turma e contribuindo com fotos e memórias.',
  is_visible = true,
  is_featured = true,
  sort_order = 20,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and slug = 'como-sera-o-evento';

update public.faq_items
set
  question = 'Como será feito o reembolso?',
  answer = 'Os pagamentos aprovados serão reembolsados integralmente pela organização por meio do Mercado Pago, para o mesmo meio de pagamento usado na compra. O prazo para o valor aparecer pode variar conforme a forma de pagamento e a instituição financeira.',
  is_visible = true,
  is_featured = true,
  sort_order = 30,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and slug = 'formas-de-pagamento';

update public.faq_items
set
  question = 'Onde acompanho meu pagamento e o reembolso?',
  answer = 'Entre na sua conta e acesse Meus pedidos e ingressos. A área permanece disponível para quem realizou pagamento e será atualizada conforme o reembolso for processado.',
  is_visible = true,
  is_featured = true,
  sort_order = 40,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and slug = 'onde-os-ingressos-ficam-disponiveis';

-- Enquetes ligadas à festa deixam de aparecer publicamente, sem apagar votos ou histórico.
update public.polls
set status = 'archived', updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and (
    question ilike '%reencontro%'
    or question ilike '%evento%'
    or question ilike '%festa%'
    or coalesce(description, '') ilike '%reencontro%'
    or coalesce(description, '') ilike '%evento%'
    or coalesce(description, '') ilike '%festa%'
  );

notify pgrst, 'reload schema';
