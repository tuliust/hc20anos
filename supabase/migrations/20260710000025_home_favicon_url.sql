-- Adds configurable favicon URL for the public site.

alter table public.home_page_content
  add column if not exists favicon_url text;

comment on column public.home_page_content.favicon_url is
  'Public URL of the favicon configured in the admin Home tab.';

notify pgrst, 'reload schema';
