-- Movimento transacional das perguntas ativas antes do soft delete de categoria.

create or replace function public.move_faq_category_items(
  p_source_category_id uuid,
  p_target_category_id uuid,
  p_admin_id uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  source_event_id uuid;
  target_event_id uuid;
  target_base_order integer;
  moved_count integer;
begin
  if not (public.has_admin_role('admin') or public.has_admin_role('superadmin')) then
    raise exception 'Permissão insuficiente' using errcode = '42501';
  end if;
  if p_source_category_id = p_target_category_id then
    raise exception 'As categorias de origem e destino devem ser diferentes' using errcode = '22023';
  end if;

  select event_id into source_event_id
  from public.faq_categories
  where id = p_source_category_id and deleted_at is null;

  select event_id into target_event_id
  from public.faq_categories
  where id = p_target_category_id and deleted_at is null;

  if source_event_id is null or target_event_id is null or source_event_id <> target_event_id then
    raise exception 'Categorias inválidas ou de eventos diferentes' using errcode = '22023';
  end if;

  select coalesce(max(sort_order), -10) into target_base_order
  from public.faq_items
  where category_id = p_target_category_id and deleted_at is null;

  with moving as (
    select id, row_number() over (order by sort_order, created_at, id) as position
    from public.faq_items
    where category_id = p_source_category_id and deleted_at is null
  )
  update public.faq_items fi
  set category_id = p_target_category_id,
      sort_order = target_base_order + (moving.position * 10)::integer,
      updated_by_admin_id = p_admin_id
  from moving
  where fi.id = moving.id;

  get diagnostics moved_count = row_count;
  return moved_count;
end;
$$;

grant execute on function public.move_faq_category_items(uuid, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
