-- ================================================================
-- CMS de páginas públicas secundárias
-- - Ex-alunos
-- - Memórias
-- - Curiosidades
-- - Pós-festa
-- ================================================================

create table if not exists public.public_page_content (
  event_id uuid not null references public.events(id) on delete cascade,
  page_slug text not null,
  content_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by_admin_id uuid references public.admin_users(id) on delete set null,
  primary key (event_id, page_slug),
  constraint public_page_content_json_object check (jsonb_typeof(content_json) = 'object')
);

create or replace function public.set_public_page_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_public_page_content_updated_at on public.public_page_content;
create trigger trg_public_page_content_updated_at
before update on public.public_page_content
for each row
execute function public.set_public_page_content_updated_at();

alter table public.public_page_content enable row level security;

drop policy if exists "public_page_content_select_public" on public.public_page_content;
create policy "public_page_content_select_public"
  on public.public_page_content
  for select
  using (true);

drop policy if exists "public_page_content_manage_admins" on public.public_page_content;
create policy "public_page_content_manage_admins"
  on public.public_page_content
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role in ('superadmin', 'admin')
    )
  );

insert into public.public_page_content (event_id, page_slug, content_json)
values
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'ex-alunos',
    '{
      "title":"Ex-alunos",
      "description":"Uma visão consolidada da turma, de quem comprou ingresso, quem pretende ir, quem já atualizou o cadastro e onde os ex-alunos estão hoje.",
      "claim_button_label":"Sou eu"
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'memorias',
    '{
      "show_anonymous_option":false,
      "show_moderation_notice":false
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'curiosidades',
    '{
      "title":"Curiosidades",
      "description":"Dados, lembranças, mapa, profissões, relacionamentos e enquetes sobre quem a gente era no HC — e quem a turma se tornou 20 anos depois.",
      "show_ai_card":false,
      "show_children_quantity_card":false,
      "questionnaire_button_label":"Responder questionário",
      "questionnaire_answered_behavior":"hide",
      "location_cards":[
        {"key":"natal","title":"Em Natal/RN","subtitle":"Cidade: Natal · UF: RN"},
        {"key":"interior","title":"No interior do estado","subtitle":"Cidade diferente de Natal · UF: RN"},
        {"key":"brazil","title":"Pelo Brasil","subtitle":"UF diferente de RN"},
        {"key":"foreign","title":"Vivendo no Exterior","subtitle":"País diferente de Brasil"}
      ],
      "location_empty_label":"Sem dados públicos ainda.",
      "location_percent_suffix":"dos perfis com localização pública"
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'pos-festa',
    '{
      "organization_card_title":"EM BREVE",
      "organization_card_subtitle":"Confira aqui, depois da festa, as fotos, vídeos e todos os destaques deste evento que ficará na memória",
      "show_content_after_message":false
    }'::jsonb
  )
on conflict (event_id, page_slug) do update
set
  content_json = public.public_page_content.content_json || excluded.content_json,
  updated_at = now();

grant select on public.public_page_content to anon, authenticated;
grant insert, update, delete on public.public_page_content to authenticated;

notify pgrst, 'reload schema';
