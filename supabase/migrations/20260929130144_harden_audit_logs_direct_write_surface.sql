drop policy if exists audit_logs_service_insert on public.audit_logs;
drop policy if exists p3_auth_insert on public.audit_logs;

revoke all privileges on table public.audit_logs from anon;

revoke insert, update, delete, truncate, references, trigger
on table public.audit_logs
from authenticated;
