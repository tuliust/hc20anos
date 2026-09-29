drop policy if exists p3_auth_insert on public.profiles;

revoke insert, update, delete, truncate, references, trigger
on table public.profiles
from authenticated;

grant update (
  studied_at_hc,
  class_year,
  class_group,
  relationship_to_class
)
on table public.profiles
to authenticated;

create or replace function public.guard_profile_identity_columns()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if current_user = 'authenticated'
     and (
       new.id is distinct from old.id
       or new.user_id is distinct from old.user_id
       or new.person_id is distinct from old.person_id
     )
  then
    raise exception 'profile_identity_columns_immutable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_profile_identity_columns() from public, anon, authenticated;

drop trigger if exists profiles_identity_columns_immutable on public.profiles;
create trigger profiles_identity_columns_immutable
before update on public.profiles
for each row
execute function public.guard_profile_identity_columns();
