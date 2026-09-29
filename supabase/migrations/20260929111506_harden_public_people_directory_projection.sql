create or replace view public.public_people_directory
with (security_invoker = true) as
select
  id,
  full_name,
  class_year,
  class_group,
  nickname_at_school,
  profile_status,
  is_visible,
  avatar_url,
  display_name,
  gender,
  (profile_status <> 'unclaimed'::public.profile_status) as is_claimed,
  created_at,
  updated_at,
  person_type
from public.people
where is_visible = true
  and person_type = 'alumni';

revoke all privileges on table public.public_people_directory from anon, authenticated;
grant select on table public.public_people_directory to anon, authenticated;
