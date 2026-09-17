-- HC 20 anos — suporte ao Atalho do iPhone e congelamento do roster original de 181 pré-cadastrados.

create table if not exists public.contact_research_roster (
  person_id uuid primary key references public.people(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into public.contact_research_roster (person_id)
select p.id
from public.people p
where p.class_year = 2006
  and p.person_type = 'alumni'
  and p.class_group in ('A','B','C','D')
  and p.created_at < timestamptz '2026-08-01 00:00:00+00'
on conflict (person_id) do nothing;

alter table public.contact_research_roster enable row level security;

drop policy if exists contact_research_roster_public_read on public.contact_research_roster;
create policy contact_research_roster_public_read
  on public.contact_research_roster
  for select
  to anon, authenticated
  using (true);

alter table public.alumni_contact_research
  drop constraint if exists alumni_contact_research_source_check;

alter table public.alumni_contact_research
  add constraint alumni_contact_research_source_check
  check (source in ('manual','device_contact_picker','ios_shortcut'));

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
language sql
stable
security definer
set search_path = public
as $$
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
  from public.contact_research_roster roster
  join public.people p on p.id = roster.person_id
  left join public.alumni_contact_research r on r.person_id = p.id
  order by p.class_group, p.full_name;
$$;

revoke all on function public.get_contact_research_directory() from public;
grant execute on function public.get_contact_research_directory() to anon, authenticated, service_role;

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
  if not exists (
    select 1
    from public.contact_research_roster roster
    where roster.person_id = p_person_id
  ) then
    raise exception 'invalid_contact_research_person';
  end if;

  v_source := case
    when p_source = 'device_contact_picker' then 'device_contact_picker'
    when p_source = 'ios_shortcut' then 'ios_shortcut'
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

revoke all on function public.save_contact_research(uuid,text,text,text,text,text,boolean) from public;
grant execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) to anon, authenticated, service_role;
