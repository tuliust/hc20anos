-- Política configurável de reembolso, sem assumir taxas não aprovadas.

create table if not exists public.refund_policy (
  id boolean primary key default true check (id = true),
  enabled boolean not null default false,
  percentage_basis_points integer not null default 0 check (percentage_basis_points between 0 and 10000),
  fixed_fee_cents integer not null default 0 check (fixed_fee_cents >= 0),
  maximum_fee_cents integer check (maximum_fee_cents is null or maximum_fee_cents >= 0),
  policy_label text not null default 'Reembolso integral',
  policy_notice text not null default 'Nenhuma taxa não recuperável está configurada.',
  updated_by_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.refund_policy(id) values(true) on conflict(id) do nothing;

alter table public.refund_requests
  add column if not exists policy_snapshot_json jsonb not null default '{}'::jsonb;

create or replace function public.calculate_refund_quote(p_order_id uuid)
returns table(
  order_id uuid,
  gross_amount_cents integer,
  non_recoverable_fee_cents integer,
  refund_amount_cents integer,
  policy_label text,
  policy_notice text,
  refund_deadline timestamptz,
  eligible boolean,
  ineligibility_reason text
)
language plpgsql
security definer
set search_path=public, auth
as $$
declare
  v_order public.orders;
  v_policy public.refund_policy;
  v_fee integer := 0;
  v_deadline timestamptz;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_order from public.orders where id=p_order_id;
  if not found then raise exception 'order_not_found'; end if;
  if not (v_order.buyer_user_id=auth.uid() or lower(v_order.buyer_email)=lower(coalesce(auth.jwt()->>'email',''))) then
    raise exception 'order_not_owned';
  end if;

  select * into v_policy from public.refund_policy where id=true;
  v_deadline := least(coalesce(v_order.paid_at,v_order.created_at)+interval '7 days','2026-10-18 00:00:00-03'::timestamptz);

  if coalesce(v_policy.enabled,false) then
    v_fee := coalesce(v_policy.fixed_fee_cents,0) + floor(v_order.total_amount_cents * coalesce(v_policy.percentage_basis_points,0) / 10000.0)::integer;
    if v_policy.maximum_fee_cents is not null then v_fee := least(v_fee,v_policy.maximum_fee_cents); end if;
    v_fee := least(v_fee,v_order.total_amount_cents);
  end if;

  return query select
    v_order.id,
    v_order.total_amount_cents,
    v_fee,
    greatest(v_order.total_amount_cents-v_fee,0),
    v_policy.policy_label,
    v_policy.policy_notice,
    v_deadline,
    (v_order.payment_status='approved' and now()<=v_deadline and not exists(
      select 1 from public.refund_requests r where r.order_id=v_order.id and r.status in ('requested','under_review','approved','processing','refunded')
    )),
    case
      when v_order.payment_status<>'approved' then 'order_not_refundable'
      when now()>v_deadline then 'refund_window_closed'
      when exists(select 1 from public.refund_requests r where r.order_id=v_order.id and r.status in ('requested','under_review','approved','processing','refunded')) then 'refund_already_requested'
      else null
    end;
end $$;

create or replace function public.request_order_refund(p_order_id uuid,p_reason text)
returns uuid
language plpgsql
security definer
set search_path=public, auth
as $$
declare
  v_quote record;
  v_id uuid;
begin
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'refund_reason_required'; end if;
  select * into v_quote from public.calculate_refund_quote(p_order_id);
  if not coalesce(v_quote.eligible,false) then raise exception '%',coalesce(v_quote.ineligibility_reason,'order_not_refundable'); end if;

  insert into public.refund_requests(
    order_id,requested_by_user_id,reason,status,gross_amount_cents,
    non_recoverable_fee_cents,refund_amount_cents,provider_payment_id,policy_snapshot_json
  )
  select
    o.id,auth.uid(),trim(p_reason),'requested',v_quote.gross_amount_cents,
    v_quote.non_recoverable_fee_cents,v_quote.refund_amount_cents,o.payment_provider_order_id,
    jsonb_build_object(
      'policy_label',v_quote.policy_label,
      'policy_notice',v_quote.policy_notice,
      'gross_amount_cents',v_quote.gross_amount_cents,
      'non_recoverable_fee_cents',v_quote.non_recoverable_fee_cents,
      'refund_amount_cents',v_quote.refund_amount_cents,
      'quoted_at',now()
    )
  from public.orders o where o.id=p_order_id
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_update_refund_policy(
  p_enabled boolean,
  p_percentage_basis_points integer,
  p_fixed_fee_cents integer,
  p_maximum_fee_cents integer,
  p_policy_label text,
  p_policy_notice text
) returns public.refund_policy
language plpgsql
security definer
set search_path=public, auth
as $$
declare v_policy public.refund_policy;
begin
  if not exists(select 1 from public.admin_users where user_id=auth.uid() and role in ('superadmin','admin')) then raise exception 'admin_required'; end if;
  if coalesce(p_percentage_basis_points,0) not between 0 and 10000 then raise exception 'invalid_refund_percentage'; end if;
  if coalesce(p_fixed_fee_cents,0)<0 or coalesce(p_maximum_fee_cents,0)<0 then raise exception 'invalid_refund_fee'; end if;
  update public.refund_policy set
    enabled=coalesce(p_enabled,false),
    percentage_basis_points=coalesce(p_percentage_basis_points,0),
    fixed_fee_cents=coalesce(p_fixed_fee_cents,0),
    maximum_fee_cents=p_maximum_fee_cents,
    policy_label=coalesce(nullif(trim(p_policy_label),''),'Política de reembolso'),
    policy_notice=coalesce(nullif(trim(p_policy_notice),''),'Consulte as condições aplicáveis.'),
    updated_by_user_id=auth.uid(),updated_at=now()
  where id=true returning * into v_policy;
  return v_policy;
end $$;

revoke all on function public.calculate_refund_quote(uuid) from public, anon;
revoke all on function public.request_order_refund(uuid,text) from public, anon;
revoke all on function public.admin_update_refund_policy(boolean,integer,integer,integer,text,text) from public, anon;
grant execute on function public.calculate_refund_quote(uuid) to authenticated;
grant execute on function public.request_order_refund(uuid,text) to authenticated;
grant execute on function public.admin_update_refund_policy(boolean,integer,integer,integer,text,text) to authenticated;

notify pgrst, 'reload schema';
