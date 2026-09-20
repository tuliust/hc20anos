-- Advisor batch 1 regression checks.
with checks as (
  select 'buscar_read_remains_anonymous' as check_name,
    has_function_privilege('anon','public.get_contact_research_directory()','EXECUTE') as passed
  union all
  select 'buscar_write_remains_anonymous',
    has_function_privilege('anon','public.save_contact_research(uuid,text,text,text,text,text,boolean)','EXECUTE')
  union all
  select 'current_ticket_lot_not_anonymous',
    not has_function_privilege('anon','public.get_current_ticket_lot(uuid,timestamp with time zone)','EXECUTE')
  union all
  select 'current_ticket_lot_not_authenticated',
    not has_function_privilege('authenticated','public.get_current_ticket_lot(uuid,timestamp with time zone)','EXECUTE')
  union all
  select 'profiles_owner_update_scoped_authenticated',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='profiles'
        and policyname='profiles_owner_update'
        and roles = array['authenticated'::name]
        and with_check is not null
    )
  union all
  select 'people_owner_read_scoped_authenticated',
    exists (
      select 1 from pg_policies
      where schemaname='public'
        and tablename='people'
        and policyname='people_owner_read'
        and roles = array['authenticated'::name]
    )
  union all
  select 'orders_event_index_exists',
    to_regclass('public.orders_event_id_idx') is not null
  union all
  select 'orders_lot_index_exists',
    to_regclass('public.orders_lot_id_idx') is not null
  union all
  select 'orders_ticket_type_index_exists',
    to_regclass('public.orders_ticket_type_id_idx') is not null
  union all
  select 'order_participants_person_index_exists',
    to_regclass('public.order_participants_person_id_idx') is not null
  union all
  select 'notification_jobs_order_index_exists',
    to_regclass('public.notification_jobs_order_id_idx') is not null
  union all
  select 'notification_jobs_ticket_index_exists',
    to_regclass('public.notification_jobs_ticket_id_idx') is not null
  union all
  select 'tickets_ticket_type_index_exists',
    to_regclass('public.tickets_ticket_type_id_idx') is not null
  union all
  select 'checkin_operator_index_exists',
    to_regclass('public.checkin_events_operator_user_id_idx') is not null
)
select check_name, case when passed then 'PASS' else 'FAIL' end result
from checks
order by check_name;
