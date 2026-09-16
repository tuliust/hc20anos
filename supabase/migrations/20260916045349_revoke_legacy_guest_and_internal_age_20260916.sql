revoke execute on function public.count_approved_external_guests(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.decide_guest_approval_request(uuid,text,uuid,text) from public, anon, authenticated;
revoke execute on function public.age_on_event_date(date,uuid) from public, anon, authenticated;
grant execute on function public.age_on_event_date(date,uuid) to service_role;
