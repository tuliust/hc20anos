-- HC 20 Anos — preservar o estado operacional de usuários externos diretos.
--
-- Usuários externos são privados por definição (show_confirmed_status=false e
-- people.is_visible=false), portanto não devem ter profile_status rebaixado para
-- 'claimed' pelo gatilho de presença que foi criado para perfis de ex-alunos.

create or replace function public.sync_people_attendance_status_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.people pe
  set profile_status = case
        when pe.person_type = 'external'
          then 'confirmed'::public.profile_status
        when new.intends_to_attend is true and new.show_confirmed_status is true
          then 'confirmed'::public.profile_status
        else 'claimed'::public.profile_status
      end,
      updated_at = now()
  where pe.id = new.person_id
    and pe.claimed_by_user_id is not null;

  return new;
end;
$$;

revoke all on function public.sync_people_attendance_status_from_profile()
from public, anon, authenticated;
