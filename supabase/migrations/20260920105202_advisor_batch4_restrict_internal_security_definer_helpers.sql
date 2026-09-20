-- HC 20 Anos — Advisors batch 4.
-- Restrict direct access to SECURITY DEFINER helpers that are only consumed
-- by other privileged database functions.

revoke execute on function public.enforce_rate_limit(text,integer,integer,text)
  from authenticated;

revoke execute on function public.admin_can_manage_people()
  from authenticated;
