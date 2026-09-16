-- HC 20 Anos — production readiness + single-ticket model
-- Sincroniza o repositório com o estado aplicado em produção em 16/09/2026.

update public.events
set event_date = date '2026-09-26',
    event_time = time '14:00:00',
    event_timezone = 'America/Sao_Paulo',
    event_status = 'published',
    sales_status = 'open',
    general_rules = 'Ingresso único por pessoa. O valor inclui o churrasco. Cada participante deve levar sua própria bebida. Filhos de até 8 anos não pagam; de 9 a 12 anos pagam 50%; a partir de 13 anos pagam o valor integral.',
    companion_policy = 'Cônjuges pagam o valor integral do ingresso. Filhos seguem a faixa etária vigente na data do evento.',
    updated_at = now()
where id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Reaproveita o lote de maior prioridade existente, sem depender de UUID gerado.
with target_lot as (
  select id
  from public.ticket_lots
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  order by sort_order desc, created_at desc
  limit 1
)
update public.ticket_lots l
set status = 'closed', updated_at = now()
where l.event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and l.id <> (select id from target_lot);

with target_lot as (
  select id
  from public.ticket_lots
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  order by sort_order desc, created_at desc
  limit 1
)
update public.ticket_lots l
set code = 'single',
    name = 'Lote único',
    sort_order = 100,
    starts_at = least(coalesce(starts_at, now()), now()),
    ends_at = timestamptz '2026-09-26 14:00:00-03:00',
    capacity = 500,
    status = 'open',
    updated_at = now()
where l.id = (select id from target_lot);

update public.ticket_types
set name = 'Ingresso',
    description = 'R$ 120 por pessoa, com churrasco incluído. Cada participante leva sua bebida. Filhos até 8 anos não pagam; de 9 a 12 anos pagam R$ 60; a partir de 13 anos pagam R$ 120. Cônjuges pagam R$ 120.',
    price_cents = 12000,
    participant_type = 'alumni',
    package_kind = 'individual',
    included_people_count = 1,
    metadata_json = jsonb_build_object(
      'pricing_model','per_person',
      'adult_price_cents',12000,
      'spouse_price_cents',12000,
      'child_free_max_age',8,
      'child_half_min_age',9,
      'child_half_max_age',12,
      'child_half_price_cents',6000,
      'child_full_min_age',13,
      'barbecue_included',true,
      'beverages_included',false,
      'beverages_policy','bring_your_own'
    ),
    status = 'open',
    available_quantity = 500,
    updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and product_code = 'simple';

update public.ticket_types
set status = 'closed', updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  and coalesce(product_code,'') <> 'simple';

with target_lot as (
  select id
  from public.ticket_lots
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  order by sort_order desc, created_at desc
  limit 1
)
update public.ticket_lot_prices lp
set is_active = false, updated_at = now()
where lp.lot_id = (select id from target_lot);

with target_lot as (
  select id
  from public.ticket_lots
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid
  order by sort_order desc, created_at desc
  limit 1
), simple_type as (
  select id from public.ticket_types
  where event_id = '00000000-0000-0000-0000-000000000001'::uuid and product_code = 'simple'
  limit 1
)
insert into public.ticket_lot_prices (lot_id, ticket_type_id, price_cents, is_active)
select target_lot.id, simple_type.id, 12000, true from target_lot, simple_type
on conflict (lot_id, ticket_type_id) do update
set price_cents = excluded.price_cents, is_active = true, updated_at = now();

create or replace function public.get_current_ticket_lot(
  p_event_id uuid,
  p_at timestamptz default now()
)
returns public.ticket_lots
language sql
stable
security definer
set search_path = public
as $$
  select l
  from public.ticket_lots l
  join public.events e on e.id = l.event_id
  where l.event_id = p_event_id
    and e.event_status = 'published'
    and e.sales_status = 'open'
    and p_at < ((e.event_date + e.event_time) at time zone e.event_timezone)
    and l.status in ('scheduled','open')
    and (l.starts_at is null or l.starts_at <= p_at)
    and (l.ends_at is null or l.ends_at > p_at)
  order by case when l.status = 'open' then 0 else 1 end, l.sort_order desc
  limit 1;
$$;

create or replace function public.get_current_ticket_catalog(
  p_event_id uuid,
  p_at timestamptz default now()
)
returns table(
  lot_id uuid, lot_code text, lot_name text, lot_starts_at timestamptz,
  lot_ends_at timestamptz, ticket_type_id uuid, product_code text,
  product_name text, description text, participant_type text,
  package_kind text, included_people_count integer, metadata_json jsonb,
  price_cents integer
)
language sql
stable
security definer
set search_path = public
as $$
  with current_lot as (select * from public.get_current_ticket_lot(p_event_id, p_at))
  select l.id,l.code,l.name,l.starts_at,l.ends_at,
         tt.id,tt.product_code,tt.name,tt.description,tt.participant_type,
         tt.package_kind,tt.included_people_count,tt.metadata_json,lp.price_cents
  from current_lot l
  join public.ticket_lot_prices lp on lp.lot_id=l.id and lp.is_active=true
  join public.ticket_types tt on tt.id=lp.ticket_type_id
  where tt.status='open' and tt.product_code='simple'
  order by tt.name;
$$;

grant execute on function public.get_current_ticket_catalog(uuid,timestamptz) to anon, authenticated;

create or replace function public.get_public_ticket_catalog(
  p_event_id uuid,
  p_at timestamptz default now()
)
returns table(
  lot_id uuid, lot_code text, lot_name text, lot_starts_at timestamptz,
  lot_ends_at timestamptz, lot_capacity integer, ticket_type_id uuid,
  product_code text, product_name text, description text, participant_type text,
  package_kind text, included_people_count integer, metadata_json jsonb,
  price_cents integer, ticket_status text, available_quantity integer,
  sold_quantity integer
)
language sql
stable
security definer
set search_path = public
as $$
  with current_lot as (select * from public.get_current_ticket_lot(p_event_id, p_at))
  select l.id,l.code,l.name,l.starts_at,l.ends_at,l.capacity,
         tt.id,tt.product_code,tt.name,tt.description,tt.participant_type,
         tt.package_kind,tt.included_people_count,tt.metadata_json,lp.price_cents,
         tt.status::text,tt.available_quantity,coalesce(tt.sold_quantity,0)
  from current_lot l
  join public.ticket_lot_prices lp on lp.lot_id=l.id and lp.is_active=true
  join public.ticket_types tt on tt.id=lp.ticket_type_id
  where tt.status in ('open','sold_out') and tt.product_code='simple'
  order by tt.name;
$$;

grant execute on function public.get_public_ticket_catalog(uuid,timestamptz) to anon, authenticated;

create or replace function public.perform_ticket_checkin(
  p_ticket_id uuid,
  p_undo boolean default false,
  p_notes text default null
)
returns public.tickets
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_ticket public.tickets;
begin
  if not exists(
    select 1 from public.admin_users a
    where a.user_id=auth.uid() and a.role in ('superadmin','admin','checkin_staff')
  ) then
    raise exception 'checkin_permission_required';
  end if;

  select * into v_ticket from public.tickets where id=p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;

  if not p_undo then
    if v_ticket.status <> 'active' then raise exception 'ticket_invalid'; end if;
    if v_ticket.checked_in then raise exception 'ticket_already_checked_in'; end if;
    update public.tickets
       set checked_in=true, checked_in_at=now(), checked_in_by_admin_id=auth.uid(),
           status='used', updated_at=now()
     where id=p_ticket_id returning * into v_ticket;
    insert into public.checkin_events(ticket_id,action,operator_user_id,notes)
    values(p_ticket_id,'check_in',auth.uid(),p_notes);
  else
    if not v_ticket.checked_in then raise exception 'ticket_not_checked_in'; end if;
    update public.tickets
       set checked_in=false, checked_in_at=null, checked_in_by_admin_id=null,
           status='active', updated_at=now()
     where id=p_ticket_id returning * into v_ticket;
    insert into public.checkin_events(ticket_id,action,operator_user_id,notes)
    values(p_ticket_id,'undo_check_in',auth.uid(),p_notes);
  end if;
  return v_ticket;
end;
$$;

create or replace function public.calculate_refund_quote(p_order_id uuid)
returns table(
  order_id uuid,gross_amount_cents integer,non_recoverable_fee_cents integer,
  refund_amount_cents integer,policy_label text,policy_notice text,
  refund_deadline timestamptz,eligible boolean,ineligibility_reason text
)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_order public.orders;
  v_policy public.refund_policy;
  v_fee integer := 0;
  v_deadline timestamptz;
  v_event_at timestamptz;
  v_used boolean := false;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_order from public.orders where id=p_order_id;
  if not found then raise exception 'order_not_found'; end if;
  if not (v_order.buyer_user_id=auth.uid() or lower(v_order.buyer_email)=lower(coalesce(auth.jwt()->>'email',''))) then
    raise exception 'order_not_owned';
  end if;

  select ((e.event_date + e.event_time) at time zone e.event_timezone)
    into v_event_at from public.events e where e.id=v_order.event_id;
  v_deadline := least(coalesce(v_order.paid_at,v_order.created_at)+interval '7 days',v_event_at-interval '7 days');

  select exists(select 1 from public.tickets t where t.order_id=v_order.id and (t.checked_in or t.status='used')) into v_used;
  select * into v_policy from public.refund_policy where id=true;
  if coalesce(v_policy.enabled,false) then
    v_fee := coalesce(v_policy.fixed_fee_cents,0)
      + floor(v_order.total_amount_cents*coalesce(v_policy.percentage_basis_points,0)/10000.0)::integer;
    if v_policy.maximum_fee_cents is not null then v_fee:=least(v_fee,v_policy.maximum_fee_cents); end if;
    v_fee:=least(v_fee,v_order.total_amount_cents);
  end if;

  return query select
    v_order.id,v_order.total_amount_cents,v_fee,greatest(v_order.total_amount_cents-v_fee,0),
    v_policy.policy_label,v_policy.policy_notice,v_deadline,
    (v_order.payment_status='approved' and now()<=v_deadline and not v_used and not exists(
      select 1 from public.refund_requests r where r.order_id=v_order.id and r.status in ('requested','under_review','approved','processing','refunded')
    )),
    case
      when v_order.payment_status<>'approved' then 'order_not_refundable'
      when v_used then 'ticket_already_used'
      when now()>v_deadline then 'refund_window_closed'
      when exists(select 1 from public.refund_requests r where r.order_id=v_order.id and r.status in ('requested','under_review','approved','processing','refunded')) then 'refund_already_requested'
      else null
    end;
end;
$$;

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname='public' and tablename like 'backup\_%' escape '\'
  loop
    execute format('revoke all on table public.%I from anon, authenticated',r.tablename);
    execute format('alter table public.%I enable row level security',r.tablename);
  end loop;
end $$;

revoke insert,update,delete,truncate,references,trigger on public.refund_policy from anon, authenticated;

-- Conteúdo público alinhado com a regra comercial vigente.
update public.faq_items set answer='O reencontro será realizado no sábado, 26 de setembro de 2026, a partir das 14h, na Casa de Tulius.',updated_at=now() where slug='quando-e-onde-sera-o-reencontro';
update public.faq_items set question='Qual é o valor do ingresso?',answer='O ingresso custa R$ 120 por pessoa e inclui o churrasco. Cada participante deve levar sua própria bebida.',updated_at=now() where slug='precos-ingresso-simples';
update public.faq_items set question='Como funciona a compra para ex-aluno e família?',answer='O ex-aluno compra pelo próprio cadastro e pode incluir cônjuge e filhos no mesmo pedido. O cônjuge paga R$ 120. Filhos seguem a faixa etária vigente na data do evento.',updated_at=now() where slug='quem-pode-comprar-ingresso-simples';
update public.faq_items set question='Quanto pagam os filhos?',answer='Filhos de até 8 anos não pagam. Dos 9 aos 12 anos, o valor é R$ 60. A partir de 13 anos, o valor é R$ 120.',updated_at=now(),is_visible=true where slug='como-funciona-filho-adicional';
update public.faq_items set answer='Filhos com 13 anos ou mais pagam o valor integral de R$ 120.',updated_at=now() where slug='como-participa-filho-com-13-anos-ou-mais';
update public.faq_items set answer='A idade da criança é calculada em 26 de setembro de 2026, data do evento.',updated_at=now() where slug='como-e-calculada-a-idade-da-crianca';
update public.faq_items set answer='Sim. Cônjuges e filhos são bem-vindos e podem ser incluídos no mesmo pedido do ex-aluno. O cônjuge paga R$ 120; filhos seguem a regra por idade.',updated_at=now() where slug='posso-levar-minha-familia';
update public.faq_items set answer='Cada pedido pode incluir até seis pessoas, considerando o ex-aluno, cônjuge e filhos.',updated_at=now() where slug='quantas-pessoas-podem-participar-do-pedido';
update public.faq_items set question='As bebidas estão incluídas?',answer='Não. O churrasco está incluído no ingresso, mas cada pessoa deve levar a bebida que pretende consumir.',updated_at=now(),is_visible=true where slug='o-que-inclui-extra-bebidas';
update public.faq_items set answer='O prazo termina às 14h do dia 25 de setembro de 2026, 24 horas antes do início do evento.',updated_at=now() where slug='prazo-final-para-transferencia';
update public.faq_items set answer='A solicitação deve ser feita em até sete dias corridos após a compra e nunca depois de 19 de setembro de 2026, às 14h. Vale o prazo que terminar primeiro.',updated_at=now() where slug='prazo-para-solicitar-reembolso';

update public.faq_items
set is_visible=false,updated_at=now()
where slug in (
  'quais-sao-as-datas-dos-lotes','mudanca-de-lote-automatica','existe-limite-por-lote',
  'precos-pacotes-familiares','o-que-inclui-familia-completa','o-que-inclui-familia-sem-conjuge',
  'convidado-externo-precisa-de-conta','como-convidado-externo-pode-comprar',
  'dados-necessarios-para-convidado-externo','convidado-pode-comprar-antes-da-aprovacao',
  'solicitacao-de-convidado-expira','quantos-convidados-externos-por-ex-aluno','aprovacao-reserva-ingresso',
  'o-que-inclui-extra-churrasco','existe-limite-de-extras','como-extras-sao-distribuidos',
  'extras-tem-qr-code-separado','como-extras-serao-entregues','precos-dos-extras-mudam-por-lote',
  'como-equipe-identifica-extras','entrega-de-fichas-pode-ocorrer-duas-vezes','extras-acompanham-transferencia',
  'ingresso-base-ex-aluno-para-convidado'
);

-- O worker de notificações continua agendado pelo GitHub Actions.
do $$
declare v_jobid bigint;
begin
  if to_regclass('cron.job') is not null then
    select jobid into v_jobid from cron.job where jobname='hc20anos-notification-worker' limit 1;
    if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
  end if;
end $$;
