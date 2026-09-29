-- P3 performance: consolidate permissive RLS policies without changing the
-- effective OR-based authorization semantics for anon/authenticated.
-- Public policies are retargeted to anon; authenticated receives one policy
-- per operation containing the exact union of the previous predicates.

create temporary table p3_policy_snapshot on commit drop as
select p.*
from pg_policies p
where p.schemaname='public'
  and p.permissive='PERMISSIVE'
  and p.tablename = any(array[
    'admin_users','audit_logs','cms_assets','contact_collectors','event_archive_settings',
    'events','faq_categories','faq_items','home_page_content','memories','orders','payment_events',
    'people','photo_comments','photo_likes','photo_removal_requests','photo_tags','photos',
    'poll_options','poll_votes','polls','profile_claim_answers','profile_claim_disputes',
    'profile_claims','profile_school_questionnaire_answers','profiles','ticket_types','tickets'
  ])
  and ('authenticated'=any(p.roles) or 'public'=any(p.roles));

do $do$
declare
  pol record;
  rec record;
  v_sql text;
  v_check text;
begin
  for pol in select * from p3_policy_snapshot order by tablename,policyname
  loop
    execute format('drop policy if exists %I on public.%I',pol.policyname,pol.tablename);
  end loop;

  -- Preserve signed-out behavior while preventing PUBLIC policies from also
  -- participating in authenticated queries.
  for pol in
    select * from p3_policy_snapshot
    where 'public'=any(roles) or 'anon'=any(roles)
    order by tablename,policyname
  loop
    v_sql := format(
      'create policy %I on public.%I as permissive for %s to anon',
      pol.policyname,pol.tablename,lower(pol.cmd)
    );

    if pol.cmd in ('SELECT','UPDATE','DELETE','ALL') and pol.qual is not null then
      v_sql := v_sql || ' using (' || pol.qual || ')';
    end if;

    v_check := case
      when pol.cmd in ('INSERT','UPDATE') then pol.with_check
      when pol.cmd='ALL' then coalesce(pol.with_check,pol.qual)
      else null
    end;

    if v_check is not null then
      v_sql := v_sql || ' with check (' || v_check || ')';
    end if;

    execute v_sql;
  end loop;

  -- Postgres combines permissive policies using OR. Reproduce that exact OR
  -- union in one authenticated policy for each table/operation.
  for rec in
    with expanded as (
      select s.*,x.action,
        case when x.action in ('SELECT','UPDATE','DELETE') then s.qual end effective_using,
        case
          when x.action='INSERT' then coalesce(s.with_check,case when s.cmd='ALL' then s.qual end)
          when x.action='UPDATE' then coalesce(s.with_check,s.qual)
        end effective_check
      from p3_policy_snapshot s
      cross join lateral (
        select unnest(
          case when s.cmd='ALL'
            then array['SELECT','INSERT','UPDATE','DELETE']::text[]
            else array[s.cmd]::text[]
          end
        ) action
      ) x
    )
    select tablename,action,
      string_agg('('||coalesce(effective_using,'false')||')',' OR ' order by policyname)
        filter (where action in ('SELECT','UPDATE','DELETE')) using_expr,
      string_agg('('||coalesce(effective_check,'false')||')',' OR ' order by policyname)
        filter (where action in ('INSERT','UPDATE')) check_expr
    from expanded
    group by tablename,action
    order by tablename,action
  loop
    v_sql := format(
      'create policy %I on public.%I as permissive for %s to authenticated',
      'p3_auth_'||lower(rec.action),rec.tablename,lower(rec.action)
    );

    if rec.action in ('SELECT','UPDATE','DELETE') then
      v_sql := v_sql || ' using (' || rec.using_expr || ')';
    end if;

    if rec.action in ('INSERT','UPDATE') then
      v_sql := v_sql || ' with check (' || rec.check_expr || ')';
    end if;

    execute v_sql;
  end loop;
end
$do$;
