-- ================================================================
-- Evento Ex-Alunos HC
-- Fix: admin RLS/grants for panel data + home content support
-- ================================================================

create or replace function public.is_admin_panel_user(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = uid
      and au.role in ('admin'::public.admin_role, 'superadmin'::public.admin_role)
  );
$$;

create or replace function public.is_superadmin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = uid
      and au.role = 'superadmin'::public.admin_role
  );
$$;

grant execute on function public.is_admin_panel_user(uuid) to anon, authenticated;
grant execute on function public.is_superadmin(uuid) to anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'events',
    'orders',
    'tickets',
    'ticket_types',
    'people',
    'profiles',
    'photos',
    'photo_tags',
    'photo_likes',
    'photo_comments',
    'memories',
    'polls',
    'poll_options',
    'poll_votes',
    'profile_claims',
    'profile_claim_answers',
    'photo_removal_requests',
    'profile_claim_disputes',
    'event_archive_settings',
    'home_page_content',
    'audit_logs',
    'payment_events'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('grant select on public.%I to authenticated', t);

      execute format('drop policy if exists admin_panel_select on public.%I', t);
      execute format(
        'create policy admin_panel_select on public.%I for select to authenticated using (public.is_admin_panel_user())',
        t
      );
    end if;
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'events',
    'orders',
    'tickets',
    'ticket_types',
    'people',
    'profiles',
    'photos',
    'photo_tags',
    'photo_comments',
    'memories',
    'polls',
    'poll_options',
    'poll_votes',
    'profile_claims',
    'profile_claim_answers',
    'photo_removal_requests',
    'profile_claim_disputes',
    'event_archive_settings',
    'home_page_content'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant insert, update, delete on public.%I to authenticated', t);

      execute format('drop policy if exists admin_panel_write on public.%I', t);
      execute format(
        'create policy admin_panel_write on public.%I for all to authenticated using (public.is_admin_panel_user()) with check (public.is_admin_panel_user())',
        t
      );
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.admin_users') is not null then
    alter table public.admin_users enable row level security;

    grant select, insert, update, delete on public.admin_users to authenticated;

    drop policy if exists admin_users_admin_panel_select on public.admin_users;
    create policy admin_users_admin_panel_select
      on public.admin_users
      for select
      to authenticated
      using (public.is_admin_panel_user());

    drop policy if exists admin_users_superadmin_write on public.admin_users;
    create policy admin_users_superadmin_write
      on public.admin_users
      for all
      to authenticated
      using (public.is_superadmin())
      with check (public.is_superadmin());
  end if;
end $$;

do $$
begin
  if to_regclass('public.audit_logs') is not null then
    alter table public.audit_logs enable row level security;

    grant select, insert on public.audit_logs to authenticated;

    drop policy if exists audit_logs_admin_panel_select on public.audit_logs;
    create policy audit_logs_admin_panel_select
      on public.audit_logs
      for select
      to authenticated
      using (public.is_admin_panel_user());

    drop policy if exists audit_logs_admin_panel_insert on public.audit_logs;
    create policy audit_logs_admin_panel_insert
      on public.audit_logs
      for insert
      to authenticated
      with check (public.is_admin_panel_user());
  end if;
end $$;

grant select on public.poll_results to anon, authenticated;
grant select on public.public_profile_locations to anon, authenticated;