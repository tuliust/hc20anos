alter table public.refund_policy enable row level security;

drop view if exists public.public_people_directory;
create view public.public_people_directory
with (security_invoker=true) as
select id,full_name,class_year,class_group,nickname_at_school,profile_status,
       is_visible,avatar_url,display_name,gender,
       (claimed_by_user_id is not null) as is_claimed
from public.people
where is_visible=true;
grant select on public.public_people_directory to anon,authenticated;

drop view if exists public.public_profile_bios;
create view public.public_profile_bios
with (security_invoker=true) as
select pr.person_id,pr.bio,pr.updated_at
from public.profiles pr
join public.people pe on pe.id=pr.person_id
where pe.is_visible=true and pr.show_confirmed_status=true;
grant select on public.public_profile_bios to anon,authenticated;
