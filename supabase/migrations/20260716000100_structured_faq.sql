-- FAQ relacional, com migração gradual do JSON legado da Home.
-- Esta migration é deliberadamente compatível com ambientes que já tenham
-- public.faq_items com category_key/category_label. Esses campos não são
-- removidos aqui; a remoção deve acontecer apenas após validação em produção.

create table if not exists public.faq_categories (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_admin_id uuid references public.admin_users(id) on delete set null,
  updated_by_admin_id uuid references public.admin_users(id) on delete set null,
  deleted_at timestamptz,
  deleted_by_admin_id uuid references public.admin_users(id) on delete set null,
  constraint faq_categories_event_key_key unique (event_id, key),
  constraint faq_categories_key_format_check check (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint faq_categories_label_check check (length(btrim(label)) > 0),
  constraint faq_categories_sort_order_check check (sort_order >= 0)
);

-- Compatibilidade para uma eventual versão parcial já aplicada em outro ambiente.
alter table public.faq_categories
  add column if not exists description text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by_admin_id uuid references public.admin_users(id) on delete set null,
  add column if not exists updated_by_admin_id uuid references public.admin_users(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_admin_id uuid references public.admin_users(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'faq_categories_event_key_key') then
    alter table public.faq_categories
      add constraint faq_categories_event_key_key unique (event_id, key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_categories_key_format_check') then
    alter table public.faq_categories
      add constraint faq_categories_key_format_check check (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_categories_label_check') then
    alter table public.faq_categories
      add constraint faq_categories_label_check check (length(btrim(label)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_categories_sort_order_check') then
    alter table public.faq_categories
      add constraint faq_categories_sort_order_check check (sort_order >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'faq_categories_event_id_fkey') then
    alter table public.faq_categories
      add constraint faq_categories_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade;
  end if;
end
$$;

insert into public.faq_categories (event_id, key, label, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'general',      'Informações gerais',            10),
  ('00000000-0000-0000-0000-000000000001', 'pricing',      'Lotes e preços',                 20),
  ('00000000-0000-0000-0000-000000000001', 'tickets',      'Categorias de ingresso',         30),
  ('00000000-0000-0000-0000-000000000001', 'participants', 'Dados dos participantes',         40),
  ('00000000-0000-0000-0000-000000000001', 'guests',       'Compra por convidado externo',    50),
  ('00000000-0000-0000-0000-000000000001', 'extras',       'Extras de bebidas e churrasco',   60),
  ('00000000-0000-0000-0000-000000000001', 'payments',     'Checkout e pagamento',            70),
  ('00000000-0000-0000-0000-000000000001', 'transfers',    'Transferência',                   80),
  ('00000000-0000-0000-0000-000000000001', 'refunds',      'Reembolso',                       90),
  ('00000000-0000-0000-0000-000000000001', 'checkin',      'Check-in',                       100)
on conflict (event_id, key) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    updated_at = now()
where public.faq_categories.deleted_at is null;

do $$
begin
  if to_regclass('public.faq_items') is null then
    create table public.faq_items (
      id uuid primary key default uuid_generate_v4(),
      event_id uuid not null references public.events(id) on delete cascade,
      category_id uuid not null references public.faq_categories(id) on delete restrict,
      slug text not null,
      question text not null,
      answer text not null,
      sort_order integer not null default 0,
      is_visible boolean not null default true,
      is_featured boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      created_by_admin_id uuid references public.admin_users(id) on delete set null,
      updated_by_admin_id uuid references public.admin_users(id) on delete set null,
      deleted_at timestamptz,
      deleted_by_admin_id uuid references public.admin_users(id) on delete set null,
      constraint faq_items_event_slug_key unique (event_id, slug),
      constraint faq_items_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
      constraint faq_items_question_check check (length(btrim(question)) > 0),
      constraint faq_items_answer_check check (length(btrim(answer)) > 0),
      constraint faq_items_sort_order_check check (sort_order >= 0)
    );
  else
    alter table public.faq_items
      add column if not exists category_id uuid references public.faq_categories(id) on delete restrict,
      add column if not exists slug text,
      add column if not exists sort_order integer not null default 0,
      add column if not exists is_visible boolean not null default true,
      add column if not exists is_featured boolean not null default false,
      add column if not exists created_at timestamptz not null default now(),
      add column if not exists updated_at timestamptz not null default now(),
      add column if not exists created_by_admin_id uuid references public.admin_users(id) on delete set null,
      add column if not exists updated_by_admin_id uuid references public.admin_users(id) on delete set null,
      add column if not exists deleted_at timestamptz,
      add column if not exists deleted_by_admin_id uuid references public.admin_users(id) on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'faq_items_event_id_fkey') then
    alter table public.faq_items
      add constraint faq_items_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_items_category_id_fkey') then
    alter table public.faq_items
      add constraint faq_items_category_id_fkey foreign key (category_id) references public.faq_categories(id) on delete restrict;
  end if;
end
$$;

-- Se uma carga anterior trouxe category_key/category_label, preserve categorias
-- adicionais e vincule os itens por chave, sem duplicar registros.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'faq_items' and column_name = 'category_key'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'faq_items' and column_name = 'category_label'
    ) then
      execute $sql$
        insert into public.faq_categories (event_id, key, label, sort_order)
        select distinct
          fi.event_id,
          lower(regexp_replace(btrim(fi.category_key), '[^a-zA-Z0-9]+', '-', 'g')),
          coalesce(nullif(btrim(fi.category_label), ''), initcap(replace(fi.category_key, '-', ' '))),
          1000 + dense_rank() over (partition by fi.event_id order by fi.category_key) * 10
        from public.faq_items fi
        where nullif(btrim(fi.category_key), '') is not null
        on conflict (event_id, key) do nothing
      $sql$;
    else
      execute $sql$
        insert into public.faq_categories (event_id, key, label, sort_order)
        select distinct
          fi.event_id,
          lower(regexp_replace(btrim(fi.category_key), '[^a-zA-Z0-9]+', '-', 'g')),
          initcap(replace(fi.category_key, '-', ' ')),
          1000 + dense_rank() over (partition by fi.event_id order by fi.category_key) * 10
        from public.faq_items fi
        where nullif(btrim(fi.category_key), '') is not null
        on conflict (event_id, key) do nothing
      $sql$;
    end if;

    execute $sql$
      update public.faq_items fi
      set category_id = fc.id
      from public.faq_categories fc
      where fi.category_id is null
        and fc.event_id = fi.event_id
        and fc.key = lower(regexp_replace(btrim(fi.category_key), '[^a-zA-Z0-9]+', '-', 'g'))
    $sql$;
  end if;
end
$$;

-- Migra o JSON legado apenas quando ainda não existe nenhuma pergunta estruturada.
-- O conteúdo original permanece em home_page_content como backup temporário.
do $$
declare
  legacy_json jsonb;
begin
  if not exists (select 1 from public.faq_items limit 1) then
    select case
      when h.faq_items_json is null or btrim(h.faq_items_json) = '' then '[]'::jsonb
      else h.faq_items_json::jsonb
    end
    into legacy_json
    from public.home_page_content h
    where h.event_id = '00000000-0000-0000-0000-000000000001';

    insert into public.faq_items (
      event_id, category_id, slug, question, answer, sort_order, is_visible, is_featured
    )
    select
      '00000000-0000-0000-0000-000000000001'::uuid,
      fc.id,
      'legacy-' || substr(md5(item.value ->> 'q'), 1, 16),
      btrim(item.value ->> 'q'),
      btrim(item.value ->> 'a'),
      ((item.ordinality - 1) * 10)::integer,
      coalesce((item.value ->> 'is_visible')::boolean, true),
      true
    from jsonb_array_elements(coalesce(legacy_json, '[]'::jsonb)) with ordinality item(value, ordinality)
    join public.faq_categories fc
      on fc.event_id = '00000000-0000-0000-0000-000000000001'
     and fc.key = 'general'
    where nullif(btrim(item.value ->> 'q'), '') is not null
      and nullif(btrim(item.value ->> 'a'), '') is not null
    on conflict (event_id, slug) do nothing;
  end if;
exception
  when invalid_text_representation then
    raise warning 'faq_items_json inválido; conteúdo legado foi preservado e não migrado';
end
$$;

-- Qualquer registro parcial sem categoria é direcionado à categoria geral do evento.
insert into public.faq_categories (event_id, key, label, sort_order)
select distinct fi.event_id, 'general', 'Informações gerais', 10
from public.faq_items fi
where fi.category_id is null
on conflict (event_id, key) do nothing;

update public.faq_items fi
set category_id = fc.id
from public.faq_categories fc
where fi.category_id is null
  and fc.event_id = fi.event_id
  and fc.key = 'general';

-- Slugs ausentes em cargas antigas recebem um identificador estável e não editorial.
update public.faq_items
set slug = 'faq-' || substr(md5(id::text), 1, 16)
where slug is null or btrim(slug) = '';

alter table public.faq_items
  alter column category_id set not null,
  alter column slug set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'faq_items_event_slug_key') then
    alter table public.faq_items add constraint faq_items_event_slug_key unique (event_id, slug);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_items_slug_format_check') then
    alter table public.faq_items add constraint faq_items_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_items_question_check') then
    alter table public.faq_items add constraint faq_items_question_check check (length(btrim(question)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_items_answer_check') then
    alter table public.faq_items add constraint faq_items_answer_check check (length(btrim(answer)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_items_sort_order_check') then
    alter table public.faq_items add constraint faq_items_sort_order_check check (sort_order >= 0);
  end if;
end
$$;

create index if not exists idx_faq_categories_event_visible_order
  on public.faq_categories(event_id, is_visible, sort_order);
create index if not exists idx_faq_categories_event_deleted
  on public.faq_categories(event_id, deleted_at);
create index if not exists idx_faq_items_event_category_visible_order
  on public.faq_items(event_id, category_id, is_visible, sort_order);
create index if not exists idx_faq_items_event_featured_order
  on public.faq_items(event_id, is_featured, sort_order);
create index if not exists idx_faq_items_event_deleted
  on public.faq_items(event_id, deleted_at);

drop trigger if exists trg_faq_categories_updated_at on public.faq_categories;
create trigger trg_faq_categories_updated_at
before update on public.faq_categories
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_faq_items_updated_at on public.faq_items;
create trigger trg_faq_items_updated_at
before update on public.faq_items
for each row execute function public.fn_set_updated_at();

create or replace function public.prevent_faq_category_delete_with_active_items()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  active_count integer;
begin
  if (tg_op = 'DELETE') or (old.deleted_at is null and new.deleted_at is not null) then
    select count(*) into active_count
    from public.faq_items
    where category_id = old.id and deleted_at is null;

    if active_count > 0 then
      raise exception 'FAQ_CATEGORY_HAS_ACTIVE_ITEMS:%', active_count using errcode = '23503';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_faq_category_delete on public.faq_categories;
create trigger trg_prevent_faq_category_delete
before update of deleted_at or delete on public.faq_categories
for each row execute function public.prevent_faq_category_delete_with_active_items();

-- Reordenação atômica. A função rejeita itens fora da categoria/evento informado.
create or replace function public.reorder_faq_items(
  p_event_id uuid,
  p_category_id uuid,
  p_items jsonb,
  p_admin_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected_count integer;
  updated_count integer;
begin
  if not (public.has_admin_role('admin') or public.has_admin_role('superadmin')) then
    raise exception 'Permissão insuficiente' using errcode = '42501';
  end if;

  select count(*) into expected_count from jsonb_array_elements(p_items);

  with requested as (
    select (entry ->> 'id')::uuid as id, (entry ->> 'sort_order')::integer as sort_order
    from jsonb_array_elements(p_items) entry
  )
  update public.faq_items fi
  set sort_order = requested.sort_order,
      updated_by_admin_id = p_admin_id
  from requested
  where fi.id = requested.id
    and fi.event_id = p_event_id
    and fi.category_id = p_category_id
    and fi.deleted_at is null;

  get diagnostics updated_count = row_count;
  if updated_count <> expected_count then
    raise exception 'Conjunto de reordenação inválido' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.reorder_faq_categories(
  p_event_id uuid,
  p_categories jsonb,
  p_admin_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected_count integer;
  updated_count integer;
begin
  if not (public.has_admin_role('admin') or public.has_admin_role('superadmin')) then
    raise exception 'Permissão insuficiente' using errcode = '42501';
  end if;

  select count(*) into expected_count from jsonb_array_elements(p_categories);

  with requested as (
    select (entry ->> 'id')::uuid as id, (entry ->> 'sort_order')::integer as sort_order
    from jsonb_array_elements(p_categories) entry
  )
  update public.faq_categories fc
  set sort_order = requested.sort_order,
      updated_by_admin_id = p_admin_id
  from requested
  where fc.id = requested.id
    and fc.event_id = p_event_id
    and fc.deleted_at is null;

  get diagnostics updated_count = row_count;
  if updated_count <> expected_count then
    raise exception 'Conjunto de reordenação inválido' using errcode = '22023';
  end if;
end;
$$;

-- Permite ao frontend distinguir "tabela vazia" de "todos os itens ocultos"
-- sem revelar conteúdo ou contagem de registros protegidos por RLS.
create or replace function public.has_structured_faq_items(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.faq_items where event_id = p_event_id
  );
$$;

alter table public.faq_categories enable row level security;
alter table public.faq_items enable row level security;

drop policy if exists faq_categories_public_read on public.faq_categories;
create policy faq_categories_public_read on public.faq_categories
for select to anon, authenticated
using (is_visible = true and deleted_at is null);

drop policy if exists faq_categories_admin_read on public.faq_categories;
create policy faq_categories_admin_read on public.faq_categories
for select to authenticated
using (public.has_admin_role('admin') or public.has_admin_role('superadmin'));

drop policy if exists faq_categories_admin_insert on public.faq_categories;
create policy faq_categories_admin_insert on public.faq_categories
for insert to authenticated
with check (public.has_admin_role('admin') or public.has_admin_role('superadmin'));

drop policy if exists faq_categories_admin_update on public.faq_categories;
create policy faq_categories_admin_update on public.faq_categories
for update to authenticated
using (public.has_admin_role('admin') or public.has_admin_role('superadmin'))
with check (public.has_admin_role('admin') or public.has_admin_role('superadmin'));

drop policy if exists faq_categories_superadmin_delete on public.faq_categories;
create policy faq_categories_superadmin_delete on public.faq_categories
for delete to authenticated
using (public.has_admin_role('superadmin'));

drop policy if exists faq_items_public_read on public.faq_items;
create policy faq_items_public_read on public.faq_items
for select to anon, authenticated
using (
  is_visible = true
  and deleted_at is null
  and exists (
    select 1 from public.faq_categories fc
    where fc.id = faq_items.category_id
      and fc.event_id = faq_items.event_id
      and fc.is_visible = true
      and fc.deleted_at is null
  )
);

drop policy if exists faq_items_admin_read on public.faq_items;
create policy faq_items_admin_read on public.faq_items
for select to authenticated
using (public.has_admin_role('admin') or public.has_admin_role('superadmin'));

drop policy if exists faq_items_admin_insert on public.faq_items;
create policy faq_items_admin_insert on public.faq_items
for insert to authenticated
with check (public.has_admin_role('admin') or public.has_admin_role('superadmin'));

drop policy if exists faq_items_admin_update on public.faq_items;
create policy faq_items_admin_update on public.faq_items
for update to authenticated
using (public.has_admin_role('admin') or public.has_admin_role('superadmin'))
with check (public.has_admin_role('admin') or public.has_admin_role('superadmin'));

drop policy if exists faq_items_superadmin_delete on public.faq_items;
create policy faq_items_superadmin_delete on public.faq_items
for delete to authenticated
using (public.has_admin_role('superadmin'));

grant select on public.faq_categories, public.faq_items to anon;
grant select, insert, update, delete on public.faq_categories, public.faq_items to authenticated;
grant execute on function public.reorder_faq_items(uuid, uuid, jsonb, uuid) to authenticated;
grant execute on function public.reorder_faq_categories(uuid, jsonb, uuid) to authenticated;
grant execute on function public.has_structured_faq_items(uuid) to anon, authenticated;

-- Configurações editoriais da seção; sem DEFAULT editorial de coluna.
alter table public.home_page_content
  add column if not exists faq_search_placeholder text,
  add column if not exists faq_empty_label text,
  add column if not exists faq_view_all_label text,
  add column if not exists faq_initial_mode text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'home_page_content_faq_initial_mode_check') then
    alter table public.home_page_content
      add constraint home_page_content_faq_initial_mode_check
      check (faq_initial_mode is null or faq_initial_mode in ('featured', 'all'));
  end if;
end
$$;

update public.home_page_content
set faq_search_placeholder = coalesce(faq_search_placeholder, 'Busque uma dúvida'),
    faq_empty_label = coalesce(faq_empty_label, 'Nenhuma dúvida encontrada para esta busca.'),
    faq_view_all_label = coalesce(faq_view_all_label, 'Ver todas as dúvidas'),
    faq_initial_mode = coalesce(faq_initial_mode, 'featured')
where event_id = '00000000-0000-0000-0000-000000000001';

comment on column public.home_page_content.faq_items_json is
  'LEGADO TEMPORÁRIO: backup/fallback de compatibilidade. Não editar após ativação do Admin FAQ relacional.';

notify pgrst, 'reload schema';
