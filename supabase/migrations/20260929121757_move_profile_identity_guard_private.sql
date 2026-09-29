create or replace function app_private.guard_profile_identity_columns()
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

revoke all on function app_private.guard_profile_identity_columns() from public, anon, authenticated;

drop trigger if exists profiles_identity_columns_immutable on public.profiles;
create trigger profiles_identity_columns_immutable
before update on public.profiles
for each row
execute function app_private.guard_profile_identity_columns();

drop function if exists public.guard_profile_identity_columns();
