-- ================================================================
-- Turma 2006 — Migration 007: polls, public locations and shareable invite support
-- ================================================================

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  question text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'archived')),
  allow_multiple_votes boolean not null default false,
  created_by_admin_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(poll_id, option_id, user_id)
);

create index if not exists idx_polls_event_status on polls(event_id, status);
create index if not exists idx_polls_created_at on polls(created_at desc);
create index if not exists idx_poll_options_poll_sort on poll_options(poll_id, sort_order);
create index if not exists idx_poll_votes_poll_id on poll_votes(poll_id);
create index if not exists idx_poll_votes_user_id on poll_votes(user_id);
create index if not exists idx_poll_votes_option_id on poll_votes(option_id);

drop trigger if exists trg_polls_updated_at on polls;
create trigger trg_polls_updated_at
  before update on polls
  for each row execute function fn_set_updated_at();

create or replace function fn_validate_poll_vote()
returns trigger language plpgsql security definer as $$
declare
  v_status text;
  v_allow_multiple boolean;
begin
  select status, allow_multiple_votes into v_status, v_allow_multiple
  from polls
  where id = new.poll_id;

  if v_status is distinct from 'open' then
    raise exception 'poll is not open';
  end if;

  if not exists (
    select 1 from poll_options
    where id = new.option_id and poll_id = new.poll_id
  ) then
    raise exception 'invalid poll option';
  end if;

  if v_allow_multiple = false and exists (
    select 1 from poll_votes
    where poll_id = new.poll_id and user_id = new.user_id
  ) then
    raise exception 'user already voted in this poll';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_poll_vote on poll_votes;
create trigger trg_validate_poll_vote
  before insert on poll_votes
  for each row execute function fn_validate_poll_vote();

create or replace view poll_results as
select
  po.poll_id,
  po.id as option_id,
  po.option_text,
  po.sort_order,
  count(pv.id)::int as votes_count
from poll_options po
left join poll_votes pv on pv.option_id = po.id
group by po.poll_id, po.id, po.option_text, po.sort_order;

create or replace view public_profile_locations as
select
  p.id as profile_id,
  p.person_id,
  p.display_name,
  pe.full_name,
  p.current_city,
  p.current_state,
  p.current_country,
  p.profession,
  p.show_profession
from profiles p
join people pe on pe.id = p.person_id
where p.show_city = true
  and p.current_city is not null
  and length(trim(p.current_city)) > 0
  and pe.is_visible = true;

alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;

drop policy if exists "polls_public_read" on polls;
create policy "polls_public_read" on polls
  for select using (status in ('open', 'closed'));

drop policy if exists "polls_admin_all" on polls;
create policy "polls_admin_all" on polls
  for all using (has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "poll_options_public_read" on poll_options;
create policy "poll_options_public_read" on poll_options
  for select using (
    exists (select 1 from polls where polls.id = poll_options.poll_id and polls.status in ('open', 'closed'))
  );

drop policy if exists "poll_options_admin_all" on poll_options;
create policy "poll_options_admin_all" on poll_options
  for all using (has_admin_role('admin') or has_admin_role('superadmin'))
  with check (has_admin_role('admin') or has_admin_role('superadmin'));

drop policy if exists "poll_votes_owner_read" on poll_votes;
create policy "poll_votes_owner_read" on poll_votes
  for select using (user_id = auth.uid());

drop policy if exists "poll_votes_auth_insert" on poll_votes;
create policy "poll_votes_auth_insert" on poll_votes
  for insert with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "poll_votes_admin_read" on poll_votes;
create policy "poll_votes_admin_read" on poll_votes
  for select using (has_admin_role('admin') or has_admin_role('superadmin'));

grant select on poll_results to anon, authenticated;
grant select on public_profile_locations to anon, authenticated;
