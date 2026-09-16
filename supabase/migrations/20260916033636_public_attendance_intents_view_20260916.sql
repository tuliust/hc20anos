create or replace view public.public_attendance_intents
with (security_invoker=true) as
select pr.person_id
from public.profiles pr
join public.people pe on pe.id=pr.person_id
where pr.intends_to_attend=true
  and pr.show_confirmed_status=true
  and pe.is_visible=true;
grant select on public.public_attendance_intents to anon,authenticated;
