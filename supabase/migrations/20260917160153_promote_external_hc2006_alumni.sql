-- Cadastro externo: quando a própria pessoa declara que estudou no HC e se formou
-- em 2006, o perfil passa a integrar a lista pública da turma.
-- A promoção ocorre no mesmo registro people/profiles, preservando avatar, bio e demais dados.

create or replace function public.promote_external_hc2006_alumni()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.studied_at_hc is true
     and new.class_year = 2006
     and nullif(btrim(new.class_group), '') is not null then

    update public.people
       set person_type = 'alumni',
           class_year = 2006,
           class_group = upper(btrim(new.class_group)),
           is_visible = true,
           profile_status = 'confirmed',
           display_name = coalesce(nullif(btrim(new.display_name), ''), display_name, full_name),
           updated_at = now()
     where id = new.person_id
       and person_type = 'external';

    -- Ao entrar na lista da turma, adota os mesmos padrões públicos dos ex-alunos.
    new.show_current_photo := true;
    new.show_city := true;
    new.show_profession := true;
    new.show_social_links := true;
    new.allow_photo_tags := true;
    new.show_confirmed_status := true;
  end if;

  return new;
end;
$$;

revoke all on function public.promote_external_hc2006_alumni() from public, anon, authenticated;

drop trigger if exists trg_promote_external_hc2006_alumni on public.profiles;
create trigger trg_promote_external_hc2006_alumni
before insert or update of studied_at_hc, class_year, class_group on public.profiles
for each row
execute function public.promote_external_hc2006_alumni();

comment on function public.promote_external_hc2006_alumni() is
  'Promove cadastro externo autodeclarado como formando HC 2006 para a lista pública da turma, preservando o mesmo perfil.';
