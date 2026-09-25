-- Preserva na Home todo o conteúdo histórico/não comercial após o cancelamento.
update public.home_page_content
set
  home_sections_json = $json$[
    {"key":"hero","label":"Hero","is_visible":true,"sort_order":10},
    {"key":"about","label":"Sobre","is_visible":true,"sort_order":20},
    {"key":"info","label":"Informações do evento","is_visible":false,"sort_order":30},
    {"key":"tickets","label":"Ingressos","is_visible":false,"sort_order":40},
    {"key":"confirmed","label":"Confirmados","is_visible":false,"sort_order":50},
    {"key":"photos","label":"Fotos","is_visible":true,"sort_order":60},
    {"key":"timeline","label":"Linha do tempo","is_visible":true,"sort_order":70},
    {"key":"faq","label":"FAQ","is_visible":true,"sort_order":80}
  ]$json$,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;

notify pgrst, 'reload schema';
