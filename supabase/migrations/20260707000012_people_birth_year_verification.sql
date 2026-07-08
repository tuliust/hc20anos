-- Campos usados no novo fluxo de cadastro/reivindicação de perfil.
-- birth_year pode ser exibido no frontend, conforme regra do projeto.

alter table public.people
  add column if not exists birth_year integer,
  add column if not exists verification_status text default 'not_started';

do $$ begin
  alter table public.people
    add constraint people_verification_status_check
    check (
      verification_status in (
        'not_started',
        'in_progress',
        'verified',
        'failed',
        'manual_review'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table public.people
    add constraint people_birth_year_check
    check (
      birth_year is null
      or birth_year between 1900 and extract(year from now())::integer
    );
exception
  when duplicate_object then null;
end $$;
