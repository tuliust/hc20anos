-- HC 20 anos — mutirão privado de pesquisa de contatos em /buscar.
-- Mantém os dados coletados separados dos campos canônicos de public.people.

create table if not exists public.contact_collectors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alumni_contact_research (
  person_id uuid primary key references public.people(id) on delete cascade,
  whatsapp text,
  instagram text,
  email text,
  notes text,
  status text not null default 'pending' check (status in ('pending','located','no_contact')),
  source text not null default 'manual' check (source in ('manual','device_contact_picker')),
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alumni_contact_research_status_idx
  on public.alumni_contact_research(status);

create or replace function public.can_manage_contact_research()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
        and a.role in ('superadmin','admin')
    )
    or exists (
      select 1
      from public.contact_collectors c
      where c.user_id = auth.uid()
        and c.is_active = true
    )
  );
$$;

revoke all on function public.can_manage_contact_research() from public, anon;
grant execute on function public.can_manage_contact_research() to authenticated, service_role;

alter table public.contact_collectors enable row level security;
alter table public.alumni_contact_research enable row level security;

drop policy if exists contact_collectors_authorized_read on public.contact_collectors;
create policy contact_collectors_authorized_read
  on public.contact_collectors
  for select
  to authenticated
  using (public.can_manage_contact_research());

drop policy if exists contact_collectors_admin_write on public.contact_collectors;
create policy contact_collectors_admin_write
  on public.contact_collectors
  for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_users a
      where a.user_id = auth.uid()
        and a.role in ('superadmin','admin')
    )
  )
  with check (
    exists (
      select 1 from public.admin_users a
      where a.user_id = auth.uid()
        and a.role in ('superadmin','admin')
    )
  );

drop policy if exists alumni_contact_research_authorized_all on public.alumni_contact_research;
create policy alumni_contact_research_authorized_all
  on public.alumni_contact_research
  for all
  to authenticated
  using (public.can_manage_contact_research())
  with check (public.can_manage_contact_research());

-- Todo superadmin/admin existente já pode usar a ferramenta; também os registra
-- como coletores explícitos para a tela de gestão futura.
insert into public.contact_collectors (user_id, is_active, created_by)
select a.user_id, true, a.user_id
from public.admin_users a
where a.role in ('superadmin','admin')
on conflict (user_id) do update
set is_active = true,
    updated_at = now();

create or replace function public.get_contact_research_directory()
returns table (
  person_id uuid,
  full_name text,
  class_group text,
  whatsapp text,
  instagram text,
  email text,
  notes text,
  research_status text,
  source text,
  updated_by uuid,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_contact_research() then
    raise exception 'contact_research_not_authorized';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.class_group,
    r.whatsapp,
    r.instagram,
    r.email,
    r.notes,
    coalesce(r.status, 'pending') as research_status,
    coalesce(r.source, 'manual') as source,
    r.updated_by,
    r.updated_at
  from public.people p
  left join public.alumni_contact_research r on r.person_id = p.id
  where p.class_year = 2006
    and p.person_type = 'alumni'
    and p.class_group in ('A','B','C','D')
  order by p.class_group, p.full_name;
end;
$$;

revoke all on function public.get_contact_research_directory() from public, anon;
grant execute on function public.get_contact_research_directory() to authenticated, service_role;

create or replace function public.save_contact_research(
  p_person_id uuid,
  p_whatsapp text default null,
  p_instagram text default null,
  p_email text default null,
  p_notes text default null,
  p_source text default 'manual',
  p_mark_no_contact boolean default false
)
returns public.alumni_contact_research
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_source text;
  v_row public.alumni_contact_research;
begin
  if not public.can_manage_contact_research() then
    raise exception 'contact_research_not_authorized';
  end if;

  if not exists (
    select 1 from public.people p
    where p.id = p_person_id
      and p.class_year = 2006
      and p.person_type = 'alumni'
      and p.class_group in ('A','B','C','D')
  ) then
    raise exception 'invalid_contact_research_person';
  end if;

  v_source := case
    when p_source = 'device_contact_picker' then 'device_contact_picker'
    else 'manual'
  end;

  v_status := case
    when p_mark_no_contact then 'no_contact'
    when nullif(trim(coalesce(p_whatsapp,'')), '') is not null
      or nullif(trim(coalesce(p_instagram,'')), '') is not null
      or nullif(trim(coalesce(p_email,'')), '') is not null
      then 'located'
    else 'pending'
  end;

  insert into public.alumni_contact_research (
    person_id, whatsapp, instagram, email, notes, status, source, updated_by, updated_at
  ) values (
    p_person_id,
    nullif(trim(coalesce(p_whatsapp,'')), ''),
    nullif(trim(coalesce(p_instagram,'')), ''),
    nullif(trim(coalesce(p_email,'')), ''),
    nullif(trim(coalesce(p_notes,'')), ''),
    v_status,
    v_source,
    auth.uid(),
    now()
  )
  on conflict (person_id) do update set
    whatsapp = excluded.whatsapp,
    instagram = excluded.instagram,
    email = excluded.email,
    notes = excluded.notes,
    status = excluded.status,
    source = excluded.source,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.save_contact_research(uuid,text,text,text,text,text,boolean) from public, anon;
grant execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) to authenticated, service_role;

comment on table public.alumni_contact_research is
  'Pesquisa privada e colaborativa de contatos dos ex-alunos de 2006; não substitui dados canônicos de people.';
