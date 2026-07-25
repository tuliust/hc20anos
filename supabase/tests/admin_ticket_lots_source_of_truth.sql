-- Verificações estruturais do gerenciamento administrativo de lotes.

with checks as (
  select 'public_catalog_rpc_exists'::text as check_name,
    to_regprocedure('public.get_public_ticket_catalog(uuid,timestamp with time zone)') is not null as passed
  union all
  select 'admin_list_lots_rpc_exists',
    to_regprocedure('public.admin_get_ticket_lots(uuid)') is not null
  union all
  select 'admin_upsert_lot_rpc_exists',
    to_regprocedure('public.admin_upsert_ticket_lot(uuid,uuid,text,text,integer,timestamp with time zone,timestamp with time zone,integer,text,jsonb)') is not null
  union all
  select 'admin_archive_lot_rpc_exists',
    to_regprocedure('public.admin_archive_ticket_lot(uuid,uuid)') is not null
  union all
  select 'anon_can_read_public_catalog',
    has_function_privilege(
      'anon',
      'public.get_public_ticket_catalog(uuid,timestamp with time zone)',
      'EXECUTE'
    )
  union all
  select 'authenticated_can_read_public_catalog',
    has_function_privilege(
      'authenticated',
      'public.get_public_ticket_catalog(uuid,timestamp with time zone)',
      'EXECUTE'
    )
  union all
  select 'anon_cannot_manage_lots',
    not has_function_privilege(
      'anon',
      'public.admin_upsert_ticket_lot(uuid,uuid,text,text,integer,timestamp with time zone,timestamp with time zone,integer,text,jsonb)',
      'EXECUTE'
    )
  union all
  select 'authenticated_can_call_guarded_admin_rpc',
    has_function_privilege(
      'authenticated',
      'public.admin_upsert_ticket_lot(uuid,uuid,text,text,integer,timestamp with time zone,timestamp with time zone,integer,text,jsonb)',
      'EXECUTE'
    )
)
select check_name, case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
