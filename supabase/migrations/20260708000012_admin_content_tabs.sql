-- ================================================================
-- Evento Ex-Alunos HC
-- Conteúdo segmentado do admin: Header, Home, Linha do Tempo, FAQ e Rodapé
-- ================================================================

alter table public.home_page_content
  add column if not exists header_logo_alt text not null default 'Turma 2006',
  add column if not exists header_fallback_badge_main text not null default 'HC',
  add column if not exists header_fallback_badge_year text not null default '20',
  add column if not exists header_fallback_title text not null default 'Turma 2006',
  add column if not exists header_fallback_subtitle text not null default '20 anos',
  add column if not exists header_cta_label text not null default 'Comprar ingresso',
  add column if not exists nav_home_label text not null default 'Home',
  add column if not exists nav_who_going_label text not null default 'Quem Vai',
  add column if not exists nav_the_class_label text not null default 'A Turma',
  add column if not exists nav_photos_label text not null default 'Fotos',
  add column if not exists nav_memories_label text not null default 'Memórias',
  add column if not exists nav_polls_label text not null default 'Enquetes',
  add column if not exists nav_where_now_label text not null default 'Mapa',
  add column if not exists nav_archive_label text not null default 'Acervo',
  add column if not exists timeline_items_json text not null default '[
  {
    "year": "2004",
    "label": "Primeiro ano juntos",
    "desc": "A turma se forma. Começa a história de três anos que ficaria para sempre."
  },
  {
    "year": "2005",
    "label": "No meio do caminho",
    "desc": "Gincanas, amizades reforçadas, as primeiras provas difíceis e os momentos que viraram lenda."
  },
  {
    "year": "2006",
    "label": "O ano da formatura",
    "desc": "Vestibular, colação de grau e o adeus que a gente não sabia que duraria tanto."
  },
  {
    "year": "2016",
    "label": "10 anos — onde estávamos?",
    "desc": "Alguns se reencontraram. Muitos já tinham filhos, carreiras e histórias novas."
  },
  {
    "year": "2026",
    "label": "20 anos depois — aqui estamos",
    "desc": "O reencontro que todos esperavam. Uma noite para celebrar quem a gente se tornou."
  }
]',
  add column if not exists faq_items_json text not null default '[
  {
    "q": "Quem pode participar?",
    "a": "O evento é exclusivo para ex-alunos do Colégio Henrique Castriciano formados em 2006 e seus acompanhantes."
  },
  {
    "q": "Posso levar acompanhante?",
    "a": "Sim! Você pode adquirir o ingresso casal ou mesa VIP. Acompanhantes não precisam ser ex-alunos."
  },
  {
    "q": "Como funciona a reivindicação?",
    "a": "Você busca seu nome na lista, informa seus contatos, passa por verificação e responde a perguntas sobre o HC antes de confirmar sua identidade."
  },
  {
    "q": "O ingresso é transferível?",
    "a": "Não. O ingresso é nominal e vinculado ao CPF. Em caso de impossibilidade, entre em contato com a organização."
  },
  {
    "q": "Qual é a forma de pagamento?",
    "a": "Aceitamos cartão de crédito (até 6× sem juros), débito e PIX via Mercado Pago."
  },
  {
    "q": "Como farei o check-in no dia?",
    "a": "Você receberá um QR Code por e-mail após confirmação do pagamento. Apresente na entrada — impresso ou no celular."
  }
]',
  add column if not exists footer_eyebrow text not null default 'Colégio Henrique Castriciano',
  add column if not exists footer_title text not null default 'Turma 2006',
  add column if not exists footer_body text not null default 'O reencontro dos ex-alunos, 20 anos depois de uma época que ficou para sempre.',
  add column if not exists footer_nav_title text not null default 'Navegação',
  add column if not exists footer_contact_title text not null default 'Contato',
  add column if not exists footer_email text not null default 'turma2006.hc@gmail.com',
  add column if not exists footer_phone text not null default '(84) 99999-0206',
  add column if not exists footer_location text not null default 'Natal, Rio Grande do Norte',
  add column if not exists footer_copyright text not null default '© 2026 Turma 2006 — Colégio Henrique Castriciano.',
  add column if not exists footer_terms_label text not null default 'Termos de Uso',
  add column if not exists footer_privacy_label text not null default 'Privacidade',
  add column if not exists footer_admin_label text not null default 'Admin';

insert into public.home_page_content (event_id)
select id from public.events
where id = '00000000-0000-0000-0000-000000000001'
on conflict (event_id) do nothing;

grant select on public.home_page_content to anon, authenticated;
grant insert, update, delete on public.home_page_content to authenticated;
