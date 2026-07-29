-- ================================================================
-- Phase 2 — authenticated e-mail fallback for removal requests
-- ================================================================
-- PostgREST omits undefined JSON properties. Keep the explicit four-argument
-- contract and provide a safe overload that derives the requester's verified
-- e-mail from the authenticated JWT when the client does not send it.

create or replace function public.submit_photo_removal_request(
  p_photo_id uuid,
  p_requester_name text,
  p_reason text
) returns public.photo_removal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(nullif(btrim(coalesce(auth.jwt()->>'email', '')), ''));
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if v_email is null then raise exception 'requester_email_required'; end if;

  return public.submit_photo_removal_request(
    p_photo_id,
    p_requester_name,
    v_email,
    p_reason
  );
end;
$$;

revoke execute on function public.submit_photo_removal_request(uuid,text,text) from public, anon;
grant execute on function public.submit_photo_removal_request(uuid,text,text) to authenticated;

notify pgrst, 'reload schema';
