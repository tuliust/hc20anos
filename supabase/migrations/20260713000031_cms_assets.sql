-- ================================================================
-- CMS de assets/imagens
-- - Tabela central para imagens públicas e arquivos visuais do CMS
-- - Bucket público cms-assets para uploads pelo painel Admin
-- ================================================================

create table if not exists public.cms_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  asset_key text not null,
  label text not null,
  file_url text,
  storage_path text,
  alt_text text,
  caption text,
  usage_context text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_admin_id uuid references public.admin_users(id) on delete set null,
  constraint cms_assets_key_format check (asset_key ~ '^[a-z0-9][a-z0-9_:-]*$'),
  constraint cms_assets_unique_key unique (event_id, asset_key)
);

create index if not exists cms_assets_event_active_idx
  on public.cms_assets (event_id, is_active, sort_order, asset_key);

create or replace function public.set_cms_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cms_assets_updated_at on public.cms_assets;
create trigger trg_cms_assets_updated_at
before update on public.cms_assets
for each row
execute function public.set_cms_assets_updated_at();

alter table public.cms_assets enable row level security;

drop policy if exists "cms_assets_select_active" on public.cms_assets;
create policy "cms_assets_select_active"
  on public.cms_assets
  for select
  using (is_active = true);

drop policy if exists "cms_assets_manage_admins" on public.cms_assets;
create policy "cms_assets_manage_admins"
  on public.cms_assets
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-assets',
  'cms-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cms_assets_storage_public_read" on storage.objects;
create policy "cms_assets_storage_public_read"
  on storage.objects
  for select
  using (bucket_id = 'cms-assets');

drop policy if exists "cms_assets_storage_admin_write" on storage.objects;
create policy "cms_assets_storage_admin_write"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'cms-assets'
    and exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  )
  with check (
    bucket_id = 'cms-assets'
    and exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  );

insert into public.cms_assets (event_id, asset_key, label, file_url, alt_text, usage_context, sort_order)
select
  e.id,
  seed.asset_key,
  seed.label,
  seed.file_url,
  seed.alt_text,
  seed.usage_context,
  seed.sort_order
from public.events e
cross join lateral (
  values
    ('home_hero_background', 'Home — imagem de fundo do hero', null::text, 'Imagem de fundo da página inicial', 'home.hero', 10),
    ('event_hero_image', 'Evento — imagem principal', (select epc.hero_image_url from public.event_page_content epc where epc.event_id = e.id), 'Imagem principal da página do evento', 'event.hero', 20),
    ('event_program_image', 'Evento — imagem da programação', (select epc.program_image_url from public.event_page_content epc where epc.event_id = e.id), 'Imagem da programação do evento', 'event.program', 30),
    ('archive_coming_soon_image', 'Pós-festa — imagem de espera', null::text, 'Imagem de espera da página pós-festa', 'archive.coming_soon', 40),
    ('header_logo', 'Cabeçalho — logo', (select hpc.header_logo_url from public.home_page_content hpc where hpc.event_id = e.id), 'Logo do site', 'global.header', 50),
    ('favicon', 'Navegador — favicon', (select hpc.favicon_url from public.home_page_content hpc where hpc.event_id = e.id), 'Ícone do site', 'global.favicon', 60)
) as seed(asset_key, label, file_url, alt_text, usage_context, sort_order)
where e.id = '00000000-0000-0000-0000-000000000001'::uuid
on conflict (event_id, asset_key) do update
set
  label = excluded.label,
  file_url = coalesce(public.cms_assets.file_url, excluded.file_url),
  alt_text = coalesce(public.cms_assets.alt_text, excluded.alt_text),
  usage_context = coalesce(public.cms_assets.usage_context, excluded.usage_context),
  sort_order = excluded.sort_order,
  updated_at = now();

notify pgrst, 'reload schema';
