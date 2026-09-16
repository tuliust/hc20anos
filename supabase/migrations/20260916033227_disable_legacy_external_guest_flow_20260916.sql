revoke execute on function public.create_guest_approval_request(uuid,text,text,text,text) from public,anon,authenticated;
revoke execute on function public.count_approved_external_guests(uuid,uuid) from public,anon,authenticated;
revoke execute on function public.decide_guest_approval_request(uuid,text,uuid,text) from public,anon,authenticated;
revoke execute on function public.cancel_guest_approval_request(uuid) from public,anon,authenticated;
revoke execute on function public.respond_guest_approval_request(uuid,text,text) from public,anon,authenticated;
revoke execute on function public.search_external_guest_sponsors(text) from public,anon,authenticated;
revoke execute on function public.get_my_guest_approval_requests() from public,anon,authenticated;
