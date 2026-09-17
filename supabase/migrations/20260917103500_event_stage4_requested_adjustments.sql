-- Etapa 4 — página pública do evento (HC-06, HC-07 e HC-08)
-- Mantém o CMS como fonte de verdade e altera apenas os itens solicitados.

update public.event_page_content
set
  attractions_json = coalesce(
    (
      select jsonb_agg(
        case
          when lower(trim(item ->> 'title')) = 'banda'
            then jsonb_set(
              item,
              '{description}',
              to_jsonb('A definir, dependendo do número de participantes'::text),
              true
            )
          else item
        end
        order by ordinality
      )
      from jsonb_array_elements(attractions_json) with ordinality as attraction(item, ordinality)
      where lower(trim(item ->> 'title')) <> 'dj'
    ),
    '[]'::jsonb
  ),
  schedule_json = coalesce(
    (
      select jsonb_agg(
        case
          when lower(trim(item ->> 'title')) = 'banda'
            then jsonb_set(
              item,
              '{description}',
              to_jsonb('A definir, dependendo do número de participantes'::text),
              true
            )
          else item
        end
        order by ordinality
      )
      from jsonb_array_elements(schedule_json) with ordinality as schedule_item(item, ordinality)
      where lower(trim(item ->> 'title')) <> 'dj'
    ),
    '[]'::jsonb
  ),
  structure_section_title = 'Bar e comidas',
  bathrooms_text = '',
  security_text = '',
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid;
