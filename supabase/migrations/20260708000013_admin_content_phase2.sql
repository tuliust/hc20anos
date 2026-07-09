-- ================================================================
-- Evento Ex-Alunos HC
-- Fase 2 do Admin de Conteúdo: labels, CTAs, seções e links
-- ================================================================

alter table public.home_page_content
  add column if not exists primary_cta_page text not null default 'tickets',
  add column if not exists secondary_cta_page text not null default 'who-going',
  add column if not exists home_sections_json text not null default $$[
  {
    "key": "hero",
    "label": "Hero",
    "is_visible": true,
    "sort_order": 10
  },
  {
    "key": "about",
    "label": "Sobre",
    "is_visible": true,
    "sort_order": 20
  },
  {
    "key": "info",
    "label": "Informações do evento",
    "is_visible": true,
    "sort_order": 30
  },
  {
    "key": "tickets",
    "label": "Ingressos",
    "is_visible": true,
    "sort_order": 40
  },
  {
    "key": "confirmed",
    "label": "Confirmados",
    "is_visible": true,
    "sort_order": 50
  },
  {
    "key": "photos",
    "label": "Fotos",
    "is_visible": true,
    "sort_order": 60
  },
  {
    "key": "timeline",
    "label": "Linha do tempo",
    "is_visible": true,
    "sort_order": 70
  },
  {
    "key": "faq",
    "label": "FAQ",
    "is_visible": true,
    "sort_order": 80
  }
]$$,
  add column if not exists countdown_days_label text not null default 'Dias',
  add column if not exists countdown_hours_label text not null default 'Horas',
  add column if not exists countdown_minutes_label text not null default 'Min',
  add column if not exists countdown_seconds_label text not null default 'Seg',
  add column if not exists info_date_label text not null default 'Data',
  add column if not exists info_time_label text not null default 'Horário',
  add column if not exists info_location_label text not null default 'Local',
  add column if not exists info_doors_subtitle_template text not null default 'Portas abertas às {time}',
  add column if not exists info_dinner_subtitle_template text not null default 'Jantar servido a partir das {time}',
  add column if not exists info_time_fallback_label text not null default '19h00 — 01h00',
  add column if not exists tickets_preview_limit text not null default '3',
  add column if not exists tickets_view_all_label text not null default 'Ver todos',
  add column if not exists tickets_active_lot_label text not null default 'Lote ativo',
  add column if not exists tickets_buy_label text not null default 'Comprar agora',
  add column if not exists tickets_sold_out_label text not null default 'Esgotado',
  add column if not exists tickets_empty_title text not null default 'Ingressos em breve',
  add column if not exists tickets_empty_subtitle text not null default 'Os lotes ativos cadastrados no painel aparecerão aqui.',
  add column if not exists tickets_empty_cta_label text not null default 'Abrir página de ingressos',
  add column if not exists tickets_remaining_label_template text not null default '{available}/{total} restantes',
  add column if not exists confirmed_preview_limit text not null default '8',
  add column if not exists confirmed_view_all_label text not null default 'Ver todos',
  add column if not exists confirmed_privacy_note text not null default 'Apenas pessoas que autorizaram aparecem na lista.',
  add column if not exists photos_preview_limit text not null default '6',
  add column if not exists photos_view_all_label text not null default 'Ver todas',
  add column if not exists photos_empty_title text not null default 'Nenhuma foto aprovada ainda',
  add column if not exists photos_empty_subtitle text not null default 'As fotos aprovadas pela moderação aparecerão aqui.',
  add column if not exists photos_empty_cta_label text not null default 'Abrir mural',
  add column if not exists footer_links_json text not null default $$[
  {
    "page": "tickets",
    "label": "Ingressos",
    "is_visible": true
  },
  {
    "page": "who-going",
    "label": "Quem Vai",
    "is_visible": true
  },
  {
    "page": "the-class",
    "label": "A Turma",
    "is_visible": true
  },
  {
    "page": "photo-wall",
    "label": "Mural de Fotos",
    "is_visible": true
  },
  {
    "page": "memories",
    "label": "Memórias",
    "is_visible": true
  },
  {
    "page": "polls",
    "label": "Enquetes",
    "is_visible": true
  },
  {
    "page": "where-now",
    "label": "Onde a turma está",
    "is_visible": true
  },
  {
    "page": "archive",
    "label": "Acervo Digital",
    "is_visible": true
  }
]$$;
