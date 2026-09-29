-- HC 20 Anos — make the documented public archive read contract reproducible.
-- Production already has this table-level privilege; RLS continues to control rows.

grant select on public.event_archive_settings to anon, authenticated;
