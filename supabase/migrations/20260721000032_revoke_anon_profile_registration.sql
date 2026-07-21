-- Explicitly remove unauthenticated Data API access to the profile
-- registration RPC. PostgreSQL functions receive EXECUTE for PUBLIC by
-- default, and Supabase recommends revoking both PUBLIC and anon before
-- granting the intended authenticated role.

revoke all on function public.complete_profile_registration_v3(
  uuid, text, text, date, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, boolean, integer, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean
) from public;

revoke all on function public.complete_profile_registration_v3(
  uuid, text, text, date, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, boolean, integer, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean
) from anon;

grant execute on function public.complete_profile_registration_v3(
  uuid, text, text, date, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, boolean, integer, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean
) to authenticated;

notify pgrst, 'reload schema';
