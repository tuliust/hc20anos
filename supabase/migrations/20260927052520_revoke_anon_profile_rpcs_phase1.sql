-- HC 20 Anos — Security advisor phase 1.
-- Remove only the stale explicit anon grants from authenticated profile flows.
-- Keep authenticated/service_role access and all intentionally public RPCs.

revoke execute on function public.complete_profile_registration_v3(
  uuid, text, text, date, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, boolean, integer, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean
) from anon;

revoke execute on function public.register_external_user_profile(
  text, text, text, text, text
) from anon;

revoke execute on function public.update_my_public_profile(
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, boolean, integer
) from anon;

notify pgrst, 'reload schema';
