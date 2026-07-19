-- Evita mensagens com template incorreto antes da etapa específica de notificações.
-- Os jobs permanecem registrados para auditoria e poderão ser reativados na Etapa 3.

create or replace function public.defer_guest_approval_notification_job()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.event_type like 'guest_approval_%' then
    new.status := 'cancelled';
    new.last_error := 'deferred_until_notification_templates_are_configured';
    new.processed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists defer_guest_approval_notification_job on public.notification_jobs;
create trigger defer_guest_approval_notification_job
before insert on public.notification_jobs
for each row
execute function public.defer_guest_approval_notification_job();
