-- Mantém o schema de home_page_content compatível com o formulário atual.
-- Pode ser executada mais de uma vez com segurança.

alter table public.home_page_content
  add column if not exists event_info_view_more_label text not null default '';

notify pgrst, 'reload schema';
