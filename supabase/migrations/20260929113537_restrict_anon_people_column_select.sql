revoke select on table public.people from anon;

grant select (
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
  created_at,
  updated_at,
  person_type
) on table public.people to anon;
