-- Repair avatar URLs emitted while photo-storage derived the public origin
-- from the Edge Runtime request host instead of the Supabase project URL.
-- This repair is intentionally narrow and idempotent.

update public.profiles
set current_photo_url = regexp_replace(
  current_photo_url,
  '^https?://edge-runtime\.supabase\.com',
  'https://tjnqqsbwgjcdzcxykyif.supabase.co'
)
where current_photo_url ~ '^https?://edge-runtime\.supabase\.com/storage/v1/object/public/avatars/';

update public.people
set avatar_url = regexp_replace(
  avatar_url,
  '^https?://edge-runtime\.supabase\.com',
  'https://tjnqqsbwgjcdzcxykyif.supabase.co'
)
where avatar_url ~ '^https?://edge-runtime\.supabase\.com/storage/v1/object/public/avatars/';
