-- ================================================================
-- Checkout idempotency compatibility checkpoint
-- ================================================================
-- The original version rewrote pg_get_functiondef() text with escaped newline
-- sequences. That approach is not reproducible with standard_conforming_strings
-- and fails on a clean database. The explicit and deterministic replacement is
-- applied by 20260716000012_replace_checkout_order_rpc.sql immediately after
-- this checkpoint.
-- ================================================================

do $$
begin
  if to_regprocedure(
    'public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)'
  ) is null then
    raise exception 'create_checkout_order must exist before the explicit replacement migration';
  end if;

  raise notice 'Dynamic checkout function rewriting skipped; migration 20260716000012 applies the explicit replacement.';
end;
$$;

revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text) to service_role;

notify pgrst, 'reload schema';
