-- Permite gerenciar o logo do header pela aba Home do painel admin.

alter table public.home_page_content
  add column if not exists header_logo_url text;
