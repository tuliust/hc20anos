-- P3 regression: no anon/authenticated operation may have more than one
-- permissive RLS policy after the consolidation migration.
do $$
declare
  v_overlap_count integer;
begin
  with roles(role_name) as (
    values ('anon'::text),('authenticated'::text)
  ),
  expanded as (
    select p.tablename,p.policyname,p.cmd,r.role_name
    from pg_policies p
    cross join roles r
    where p.schemaname='public'
      and p.permissive='PERMISSIVE'
      and (r.role_name=any(p.roles) or 'public'=any(p.roles))
  ),
  actions as (
    select tablename,policyname,role_name,
      unnest(
        case when cmd='ALL'
          then array['SELECT','INSERT','UPDATE','DELETE']::text[]
          else array[cmd]::text[]
        end
      ) action
    from expanded
  ),
  overlap_rows as (
    select tablename,role_name,action,count(*) policy_count
    from actions
    group by tablename,role_name,action
    having count(*)>1
  )
  select count(*) into v_overlap_count from overlap_rows;

  if v_overlap_count<>0 then
    raise exception 'FAIL p3_multiple_permissive_policy_overlaps_remaining: %',v_overlap_count;
  end if;

  raise notice 'PASS p3_multiple_permissive_policy_overlaps_zero';
end;
$$;
