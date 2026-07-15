-- ================================================================
-- Home / Sobre: transforma as memórias editoriais em registros reais.
-- Cada relato fica ligado a uma pessoa existente e visível da turma.
-- ================================================================

-- Os relatos editoriais que já foram publicados guardavam apenas o nome.
-- Vincula-os ao cadastro real sem alterar texto, destaque ou autoria.
update public.memories memory
set
  person_id = person.id,
  author_name = person.full_name,
  updated_at = now()
from public.people person
where memory.person_id is null
  and memory.is_anonymous = false
  and person.is_visible = true
  and lower(btrim(person.full_name)) = lower(btrim(memory.author_name));

-- Instala um conjunto inicial apenas em ambientes que ainda não possuem
-- nenhuma memória aprovada. Assim a migração não duplica o acervo vigente.
with ranked_people as (
  select
    p.id,
    p.full_name,
    row_number() over (
      order by (p.avatar_url is not null) desc, p.full_name, p.id
    ) as position
  from public.people p
  where p.is_visible = true
    and p.class_year = 2006
),
memory_seeds(position, id, memory_text, is_featured) as (
  values
    (1, '00000000-0000-0000-0004-000000000101'::uuid, 'Reencontrar a turma depois de tantos anos vai ser como abrir um álbum antigo.', true),
    (2, '00000000-0000-0000-0004-000000000102'::uuid, 'O sinal tocava e a gente corria para o corredor sem imaginar que sentiria tanta saudade daquela rotina.', true),
    (3, '00000000-0000-0000-0004-000000000103'::uuid, 'As melhores histórias começavam no intervalo e continuavam muito depois da última aula.', false),
    (4, '00000000-0000-0000-0004-000000000104'::uuid, 'A formatura encerrou um ciclo, mas as amizades fizeram a turma continuar presente por vinte anos.', false),
    (5, '00000000-0000-0000-0004-000000000105'::uuid, 'Basta lembrar das gincanas para voltar o barulho da torcida, as cores das equipes e a alegria no pátio.', false),
    (6, '00000000-0000-0000-0004-000000000106'::uuid, 'Cada reencontro mostra que mudamos muito, mas ainda reconhecemos o mesmo sorriso de quem sentava ao nosso lado.', false)
),
event_target as (
  select e.id
  from public.events e
  where e.id = '00000000-0000-0000-0000-000000000001'::uuid
  limit 1
)
insert into public.memories (
  id,
  event_id,
  person_id,
  author_name,
  memory_text,
  is_anonymous,
  status,
  is_featured,
  approved_at
)
select
  seed.id,
  event_target.id,
  person.id,
  person.full_name,
  seed.memory_text,
  false,
  'approved',
  seed.is_featured,
  now()
from memory_seeds seed
join ranked_people person on person.position = seed.position
cross join event_target
where not exists (
  select 1
  from public.memories existing
  where existing.event_id = event_target.id
    and existing.status = 'approved'
)
on conflict (id) do update set
  person_id = excluded.person_id,
  author_name = excluded.author_name,
  memory_text = excluded.memory_text,
  is_anonymous = false,
  status = 'approved',
  is_featured = excluded.is_featured,
  approved_at = coalesce(public.memories.approved_at, now()),
  updated_at = now();

notify pgrst, 'reload schema';
