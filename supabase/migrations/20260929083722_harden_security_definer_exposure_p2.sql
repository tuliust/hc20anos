-- P2 security hardening: make SECURITY DEFINER exposure explicit and retire legacy public catalog access.

revoke execute on function public.get_current_ticket_catalog(uuid,timestamptz)
  from public, anon, authenticated;
grant execute on function public.get_current_ticket_catalog(uuid,timestamptz)
  to service_role;

revoke execute on function public.get_checkout_status_by_token(uuid) from public;
revoke execute on function public.get_contact_research_directory() from public;
revoke execute on function public.get_public_memories(uuid,boolean) from public;
revoke execute on function public.get_public_ticket_catalog(uuid,timestamptz) from public;
revoke execute on function public.has_structured_faq_items(uuid) from public;
revoke execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) from public;

grant execute on function public.get_checkout_status_by_token(uuid) to anon, authenticated, service_role;
grant execute on function public.get_contact_research_directory() to anon, authenticated, service_role;
grant execute on function public.get_public_memories(uuid,boolean) to anon, authenticated, service_role;
grant execute on function public.get_public_ticket_catalog(uuid,timestamptz) to anon, authenticated, service_role;
grant execute on function public.has_structured_faq_items(uuid) to anon, authenticated, service_role;
grant execute on function public.save_contact_research(uuid,text,text,text,text,text,boolean) to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

comment on function public.get_current_ticket_catalog(uuid,timestamptz) is
  'Legacy compatibility catalog. Server-only; public clients must use get_public_ticket_catalog.';
