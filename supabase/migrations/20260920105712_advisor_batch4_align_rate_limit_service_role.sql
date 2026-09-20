-- HC 20 Anos — Advisors batch 4 corrective migration.
-- Align the remote grant state with the reproducible migration chain.
-- enforce_rate_limit is internal to SECURITY DEFINER RPCs and is not called
-- directly by the frontend or Edge Functions.

revoke execute on function public.enforce_rate_limit(text,integer,integer,text)
  from service_role;
