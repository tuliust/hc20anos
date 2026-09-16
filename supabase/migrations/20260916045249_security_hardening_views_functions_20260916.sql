-- HC 20 Anos — hardening seguro de views e funções expostas.

create schema if not exists app_private;
grant usage on schema app_private to anon, authenticated;

do $$
declare
  v_name text;
begin
  foreach v_name in array array[
    'poll_results',
    'public_profile_locations',
    'public_curiosity_profile_stats',
    'public_school_questionnaire_option_stats',
    'public_alumni_directory_status',
    'public_profile_cards'
  ]
  loop
    if to_regclass(format('public.%I', v_name)) is not null
       and to_regclass(format('app_private.%I', v_name)) is null then
      execute format('alter view public.%I set schema app_private', v_name);
    end if;
  end loop;
end $$;

create view public.poll_results with (security_invoker=true) as select * from app_private.poll_results;
create view public.public_profile_locations with (security_invoker=true) as select * from app_private.public_profile_locations;
create view public.public_curiosity_profile_stats with (security_invoker=true) as select * from app_private.public_curiosity_profile_stats;
create view public.public_school_questionnaire_option_stats with (security_invoker=true) as select * from app_private.public_school_questionnaire_option_stats;
create view public.public_alumni_directory_status with (security_invoker=true) as select * from app_private.public_alumni_directory_status;
create view public.public_profile_cards with (security_invoker=true) as select * from app_private.public_profile_cards;

grant select on app_private.poll_results,
  app_private.public_profile_locations,
  app_private.public_curiosity_profile_stats,
  app_private.public_school_questionnaire_option_stats,
  app_private.public_alumni_directory_status,
  app_private.public_profile_cards to anon, authenticated;
grant select on public.poll_results,
  public.public_profile_locations,
  public.public_curiosity_profile_stats,
  public.public_school_questionnaire_option_stats,
  public.public_alumni_directory_status,
  public.public_profile_cards to anon, authenticated;

alter function public.age_on_date(date,date) set search_path = public, auth, extensions, pg_temp;
alter function public.fn_generate_qr_code() set search_path = public, auth, extensions, pg_temp;
alter function public.fn_increment_sold(uuid,integer) set search_path = public, auth, extensions, pg_temp;
alter function public.fn_set_updated_at() set search_path = public, auth, extensions, pg_temp;
alter function public.fn_touch_home_page_content() set search_path = public, auth, extensions, pg_temp;
alter function public.fn_validate_poll_vote() set search_path = public, auth, extensions, pg_temp;
alter function public.has_admin_role(public.admin_role,uuid) set search_path = public, auth, extensions, pg_temp;
alter function public.is_admin(uuid) set search_path = public, auth, extensions, pg_temp;
alter function public.normalize_profile_answer(text) set search_path = public, auth, extensions, pg_temp;
alter function public.set_cms_assets_updated_at() set search_path = public, auth, extensions, pg_temp;
alter function public.set_event_page_content_updated_at() set search_path = public, auth, extensions, pg_temp;
alter function public.set_faq_items_updated_at() set search_path = public, auth, extensions, pg_temp;
alter function public.set_public_page_content_updated_at() set search_path = public, auth, extensions, pg_temp;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'admin\_%' escape '\'
  loop
    execute format('revoke execute on function %s from public, anon', r.signature);
    execute format('grant execute on function %s to authenticated, service_role', r.signature);
  end loop;
end $$;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'apply_automatic_content_approval','audit_sensitive_row_change',
        'enqueue_order_status_notifications','enqueue_ticket_whatsapp_notification',
        'fn_validate_poll_vote','sync_order_payment_sales_trigger',
        'sync_ticket_type_sold_quantity_trigger','sync_people_attendance_status_from_profile',
        'fn_generate_qr_code','fn_set_updated_at','fn_touch_home_page_content',
        'set_cms_assets_updated_at','set_event_page_content_updated_at',
        'set_faq_items_updated_at','set_public_page_content_updated_at'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.signature);
  end loop;
end $$;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('complete_profile_registration_v3','create_checkout_order','update_my_public_profile')
  loop
    execute format('revoke execute on function %s from public, anon', r.signature);
    execute format('grant execute on function %s to authenticated, service_role', r.signature);
  end loop;
end $$;

revoke execute on function public.fn_increment_sold(uuid,integer) from public, anon, authenticated;
grant execute on function public.fn_increment_sold(uuid,integer) to service_role;
