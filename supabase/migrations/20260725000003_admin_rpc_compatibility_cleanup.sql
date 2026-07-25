-- ================================================================
-- Remove stale RPC overloads left by remote migration history drift
-- ================================================================

-- PostgREST cannot resolve get_admin_orders when both the enum and text
-- signatures are present. The current frontend and reporting stack use the
-- text signature, so the legacy enum overload must be removed explicitly.
do $$
begin
  if to_regtype('public.payment_status') is not null
     and to_regprocedure('public.get_admin_orders(public.payment_status)') is not null then
    execute 'drop function public.get_admin_orders(public.payment_status)';
  end if;
end $$;

revoke all on function public.get_admin_orders(text) from public, anon;
grant execute on function public.get_admin_orders(text) to authenticated, service_role;

-- Ask PostgREST to refresh its function cache immediately after deployment.
notify pgrst, 'reload schema';
