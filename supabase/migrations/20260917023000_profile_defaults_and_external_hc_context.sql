-- HC 20 Anos — primeira rodada de ajustes de perfil (17/09/2026).
-- 1) Novos perfis de ex-alunos iniciam com redes sociais visíveis por padrão.
-- 2) Cadastro de usuário externo passa a guardar sua relação com o HC/turma 2006.

alter table public.profiles
  alter column show_social_links set default true;

alter table public.profiles
  add column if not exists studied_at_hc boolean,
  add column if not exists hc_graduation_year integer,
  add column if not exists hc_class_group text,
  add column if not exists relationship_to_class text;

alter table public.profiles
  drop constraint if exists profiles_hc_graduation_year_check;

alter table public.profiles
  add constraint profiles_hc_graduation_year_check
  check (
    hc_graduation_year is null
    or (hc_graduation_year between 1950 and 2100)
  );

alter table public.profiles
  drop constraint if exists profiles_hc_class_group_length_check;

alter table public.profiles
  add constraint profiles_hc_class_group_length_check
  check (
    hc_class_group is null
    or char_length(btrim(hc_class_group)) between 1 and 40
  );

alter table public.profiles
  drop constraint if exists profiles_relationship_to_class_length_check;

alter table public.profiles
  add constraint profiles_relationship_to_class_length_check
  check (
    relationship_to_class is null
    or char_length(btrim(relationship_to_class)) between 1 and 240
  );

comment on column public.profiles.studied_at_hc is
  'Declaração do usuário externo sobre ter estudado no HC.';
comment on column public.profiles.hc_graduation_year is
  'Ano de formação declarado no cadastro externo quando estudou no HC.';
comment on column public.profiles.hc_class_group is
  'Sala/turma declarada no cadastro externo quando estudou no HC.';
comment on column public.profiles.relationship_to_class is
  'Relação declarada com a turma do HC de 2006 quando não estudou no HC.';
