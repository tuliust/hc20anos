-- Age helper bound to an event date.

create or replace function public.age_on_event_date(
  p_birth_date date,
  p_event_id uuid
)
returns integer
language sql
stable
strict
security definer
set search_path = public
as $$
  select public.age_on_date(p_birth_date, e.event_date)
  from public.events e
  where e.id = p_event_id;
$$;

revoke all on function public.age_on_event_date(date, uuid) from public;
grant execute on function public.age_on_event_date(date, uuid) to service_role;

notify pgrst, 'reload schema';
