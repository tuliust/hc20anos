do $$
declare
  v_page_view text := pg_get_functiondef('public.record_site_page_view(uuid,text,text,text,text,boolean,text)'::regprocedure);
  v_contact text := pg_get_functiondef('public.save_contact_research(uuid,text,text,text,text,text,boolean)'::regprocedure);
begin
  if position('site_page_view_visitor_hour' in v_page_view) = 0
     or position('site_page_view_ip_hour' in v_page_view) = 0 then
    raise exception 'FAIL: record_site_page_view rate limits missing';
  end if;

  if position('contact_research_save_public_hour' in v_contact) = 0
     or position('contact_research_save_public_day' in v_contact) = 0 then
    raise exception 'FAIL: save_contact_research public rate limits missing';
  end if;

  if not has_function_privilege('anon','public.record_site_page_view(uuid,text,text,text,text,boolean,text)','EXECUTE') then
    raise exception 'FAIL: public page-view contract changed unexpectedly';
  end if;

  if not has_function_privilege('anon','public.save_contact_research(uuid,text,text,text,text,text,boolean)','EXECUTE') then
    raise exception 'FAIL: anonymous contact-research contribution contract changed unexpectedly';
  end if;
end $$;

select 'PASS public write RPC hardening' as result;
