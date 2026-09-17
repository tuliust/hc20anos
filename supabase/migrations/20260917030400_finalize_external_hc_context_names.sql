do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'hc_graduation_year'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'class_year'
  ) then
    alter table public.profiles rename column hc_graduation_year to class_year;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'hc_class_group'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'class_group'
  ) then
    alter table public.profiles rename column hc_class_group to class_group;
  end if;
end
$$;

alter table public.profiles
  drop constraint if exists profiles_hc_graduation_year_check;
alter table public.profiles
  drop constraint if exists profiles_hc_class_group_length_check;

alter table public.profiles
  drop constraint if exists profiles_class_year_check;
alter table public.profiles
  add constraint profiles_class_year_check
  check (class_year is null or class_year between 1950 and 2100);

alter table public.profiles
  drop constraint if exists profiles_class_group_length_check;
alter table public.profiles
  add constraint profiles_class_group_length_check
  check (class_group is null or char_length(btrim(class_group)) between 1 and 40);

comment on column public.profiles.class_year is
  'Ano de formação declarado no cadastro externo quando estudou no HC.';
comment on column public.profiles.class_group is
  'Sala/turma declarada no cadastro externo quando estudou no HC.';
