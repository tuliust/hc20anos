-- Allow the security-invoker public bio view to read only the profile columns it needs.
-- RLS continues to restrict rows to visible people with show_confirmed_status=true.

grant select (person_id, bio, updated_at, show_confirmed_status)
on public.profiles
to anon, authenticated;
