-- ================================================================
-- Ajustes finais de páginas públicas
-- - Memórias sem anonimato
-- - Memórias publicadas diretamente, sem fila de moderação
-- ================================================================

create or replace function public.force_public_memory_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_anonymous := false;
  new.status := 'approved';
  new.approved_at := coalesce(new.approved_at, now());
  return new;
end;
$$;

drop trigger if exists trg_force_public_memory_defaults on public.memories;

create trigger trg_force_public_memory_defaults
before insert on public.memories
for each row
execute function public.force_public_memory_defaults();

update public.memories
set
  is_anonymous = false,
  status = 'approved',
  approved_at = coalesce(approved_at, now())
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and status = 'pending';
