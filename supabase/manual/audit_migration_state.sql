-- ================================================================
-- Auditoria somente leitura do estado das migrations do Supabase
-- HC 20 Anos
-- ================================================================
--
-- Objetivo:
--   1. mapear objetos já presentes no banco remoto;
--   2. distinguir migrations aplicadas, parciais, ausentes ou superadas;
--   3. impedir o uso de migration repair sem evidência do estado real.
--
-- Este arquivo contém apenas consultas SELECT. Não cria, altera ou exclui
-- objetos e dados permanentes.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Histórico remoto registrado pelo Supabase
-- ----------------------------------------------------------------
select
  version,
  name
from supabase_migrations.schema_migrations
order by version;

-- ----------------------------------------------------------------
-- 2. Matriz de objetos esperados por família de migration
-- ----------------------------------------------------------------
with checks(version, component, object_name, present, details) as (
  select '20260716000001', 'commerce_foundation', 'public.ticket_lots',
    to_regclass('public.ticket_lots') is not null,
    'Tabela de lotes comerciais'
  union all
  select '20260716000001', 'commerce_foundation', 'public.ticket_lot_prices',
    to_regclass('public.ticket_lot_prices') is not null,
    'Tabela de preços por lote'
  union all
  select '20260716000001', 'commerce_foundation', 'public.order_participants',
    to_regclass('public.order_participants') is not null,
    'Participantes vinculados aos pedidos'
  union all
  select '20260716000001', 'commerce_foundation', 'public.participant_extras',
    to_regclass('public.participant_extras') is not null,
    'Extras por participante'
  union all
  select '20260716000001', 'commerce_foundation', 'public.payment_preferences',
    to_regclass('public.payment_preferences') is not null,
    'Histórico de preferências de pagamento'
  union all
  select '20260716000001', 'commerce_foundation', 'public.refund_requests',
    to_regclass('public.refund_requests') is not null,
    'Solicitações de reembolso'
  union all
  select '20260716000001', 'commerce_foundation', 'public.ticket_transfers',
    to_regclass('public.ticket_transfers') is not null,
    'Transferências de ingresso'
  union all
  select '20260716000001', 'commerce_foundation', 'public.notification_jobs',
    to_regclass('public.notification_jobs') is not null,
    'Fila transacional de notificações'

  union all
  select '20260716000002', 'commerce_functions', 'public.get_current_ticket_catalog(uuid,timestamptz)',
    to_regprocedure('public.get_current_ticket_catalog(uuid,timestamp with time zone)') is not null,
    'Catálogo comercial vigente'
  union all
  select '20260716000002', 'commerce_functions', 'public.age_on_date(date,date)',
    to_regprocedure('public.age_on_date(date,date)') is not null,
    'Cálculo de idade em data de referência'
  union all
  select '20260716000002', 'commerce_functions', 'public.release_expired_ticket_reservations(timestamptz)',
    to_regprocedure('public.release_expired_ticket_reservations(timestamp with time zone)') is not null,
    'Liberação de reservas vencidas'

  union all
  select '20260716000003', 'commerce_rls', 'ticket_lots RLS',
    coalesce((select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.ticket_lots')), false),
    'RLS habilitada em ticket_lots'
  union all
  select '20260716000003', 'commerce_rls', 'notification_jobs restricted',
    not coalesce(has_table_privilege('authenticated', 'public.notification_jobs', 'SELECT'), false),
    'Authenticated não pode ler a fila operacional'

  union all
  select '20260716000004', 'checkout_dependencies', 'orders.checkout_idempotency_key',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'checkout_idempotency_key'
    ),
    'Coluna de idempotência do checkout'
  union all
  select '20260716000004', 'checkout_dependencies', 'order_participants.client_key',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'order_participants' and column_name = 'client_key'
    ),
    'Chave estável do participante no payload'
  union all
  select '20260716000004', 'checkout_dependencies', 'public.age_on_event_date(date,uuid)',
    to_regprocedure('public.age_on_event_date(date,uuid)') is not null,
    'Cálculo de idade na data do evento'
  union all
  select '20260716000004', 'checkout_rpc', 'public.create_checkout_order',
    to_regprocedure('public.create_checkout_order(uuid,text,text,text,text,jsonb,jsonb,text)') is not null,
    'RPC transacional de criação do pedido'

  union all
  select '20260716000100', 'faq_schema', 'public.faq_categories',
    to_regclass('public.faq_categories') is not null,
    'Categorias relacionais do FAQ'
  union all
  select '20260716000100', 'faq_schema', 'public.faq_items',
    to_regclass('public.faq_items') is not null,
    'Perguntas relacionais do FAQ'
  union all
  select '20260716000100', 'faq_schema', 'public.has_structured_faq_items(uuid)',
    to_regprocedure('public.has_structured_faq_items(uuid)') is not null,
    'Detecção segura de FAQ estruturado'

  union all
  select '20260716000101', 'faq_consolidation', 'faq_categories.icon_key',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'faq_categories' and column_name = 'icon_key'
    ),
    'Ícone controlado por categoria'
  union all
  select '20260716000102', 'faq_mapping_fix', 'public.faq_items_backup_20260716',
    to_regclass('public.faq_items_backup_20260716') is not null,
    'Backup usado pela correção de mapeamento'
  union all
  select '20260716000103', 'faq_admin_rpc', 'public.move_faq_category_items(uuid,uuid,uuid)',
    to_regprocedure('public.move_faq_category_items(uuid,uuid,uuid)') is not null,
    'Movimentação transacional de perguntas'

  union all
  select '20260719000001', 'commerce_reporting', 'public.get_admin_orders(text)',
    to_regprocedure('public.get_admin_orders(text)') is not null,
    'Consulta administrativa de pedidos'
  union all
  select '20260719000001', 'commerce_reporting', 'public.get_event_reports(uuid)',
    to_regprocedure('public.get_event_reports(uuid)') is not null,
    'Relatório comercial do evento'
  union all
  select '20260719000005', 'capacity_guard', 'public.enforce_hc20_commerce_capacity()',
    to_regprocedure('public.enforce_hc20_commerce_capacity()') is not null,
    'Trigger function de capacidade máxima'
  union all
  select '20260719000005', 'capacity_guard', 'ticket_types_enforce_hc20_capacity',
    exists(
      select 1 from pg_trigger
      where tgname = 'ticket_types_enforce_hc20_capacity' and not tgisinternal
    ),
    'Trigger de capacidade dos produtos'
  union all
  select '20260719000005', 'capacity_guard', 'ticket_lots_enforce_hc20_capacity',
    exists(
      select 1 from pg_trigger
      where tgname = 'ticket_lots_enforce_hc20_capacity' and not tgisinternal
    ),
    'Trigger de capacidade dos lotes'

  union all
  select '20260719000012', 'guest_approval', 'public.create_guest_approval_request',
    to_regprocedure('public.create_guest_approval_request(uuid,text,text,text,text)') is not null,
    'Criação de solicitação de convidado externo'
  union all
  select '20260719000014', 'whatsapp_notifications', 'notification_jobs.channel',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'notification_jobs' and column_name = 'channel'
    ),
    'Canal de entrega da notificação'
  union all
  select '20260719000015', 'transfers', 'public.get_my_ticket_transfers()',
    to_regprocedure('public.get_my_ticket_transfers()') is not null,
    'Listagem de transferências do usuário'
  union all
  select '20260719000016', 'refunds', 'public.refund_policy',
    to_regclass('public.refund_policy') is not null,
    'Política de reembolso configurável'
  union all
  select '20260719000017', 'checkin_reporting', 'public.checkin_events',
    to_regclass('public.checkin_events') is not null,
    'Histórico operacional de check-in'
  union all
  select '20260719000018', 'security', 'public.security_audit_log',
    to_regclass('public.security_audit_log') is not null,
    'Log operacional de segurança'
  union all
  select '20260719000018', 'security', 'public.rate_limit_buckets',
    to_regclass('public.rate_limit_buckets') is not null,
    'Buckets de rate limiting'

  union all
  select '20260721000031', 'profile_identity', 'public.profile_identity_verifications',
    to_regclass('public.profile_identity_verifications') is not null,
    'Evidências privadas da reivindicação de perfil'
  union all
  select '20260721000031', 'profile_identity', 'public.complete_profile_registration_v3',
    to_regprocedure('public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)') is not null,
    'RPC de cadastro com data declarada'
  union all
  select '20260721000032', 'profile_identity_security', 'anon cannot execute registration v3',
    not coalesce(
      has_function_privilege(
        'anon',
        to_regprocedure('public.complete_profile_registration_v3(uuid,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer,boolean,boolean,boolean,boolean,boolean,boolean,boolean)'),
        'EXECUTE'
      ),
      false
    ),
    'Execução da RPC bloqueada para anon'
)
select
  version,
  component,
  object_name,
  case when present then 'PRESENT' else 'MISSING' end as state,
  details
from checks
order by version, component, object_name;

-- ----------------------------------------------------------------
-- 3. Identidade real dos eventos e datas configuradas
-- ----------------------------------------------------------------
select
  id,
  event_date,
  event_timezone,
  created_at,
  updated_at
from public.events
order by created_at;

-- ----------------------------------------------------------------
-- 4. Contagens que devem ser preservadas durante a reconciliação
-- ----------------------------------------------------------------
select 'orders'::text as entity, count(*)::bigint as row_count from public.orders
union all select 'tickets', count(*) from public.tickets
union all select 'order_participants', count(*) from public.order_participants
union all select 'participant_extras', count(*) from public.participant_extras
union all select 'payment_preferences', count(*) from public.payment_preferences
union all select 'payment_events', count(*) from public.payment_events
union all select 'refund_requests', count(*) from public.refund_requests
union all select 'ticket_transfers', count(*) from public.ticket_transfers
union all select 'guest_approval_requests', count(*) from public.guest_approval_requests
union all select 'notification_jobs', count(*) from public.notification_jobs
order by entity;

-- ----------------------------------------------------------------
-- 5. Capacidade e integridade do catálogo
-- ----------------------------------------------------------------
select
  tt.event_id,
  tt.id as ticket_type_id,
  tt.product_code,
  tt.name,
  tt.available_quantity,
  tt.sold_quantity,
  case
    when tt.available_quantity between 0 and 500
     and tt.sold_quantity between 0 and tt.available_quantity
    then 'VALID'
    else 'INVALID'
  end as capacity_state
from public.ticket_types tt
order by tt.event_id, tt.product_code nulls last, tt.name;

select
  l.event_id,
  l.id as lot_id,
  l.code,
  l.name,
  l.capacity,
  l.status,
  case when l.capacity between 0 and 500 then 'VALID' else 'INVALID' end as capacity_state
from public.ticket_lots l
order by l.event_id, l.sort_order, l.code;

-- ----------------------------------------------------------------
-- 6. Integridade do FAQ consolidado
-- ----------------------------------------------------------------
select
  fc.event_id,
  fc.key,
  fc.label,
  fc.icon_key,
  fc.is_visible,
  fc.deleted_at,
  count(fi.id) filter (where fi.deleted_at is null) as active_items
from public.faq_categories fc
left join public.faq_items fi on fi.category_id = fc.id
where fc.key in (
  'account-access',
  'site-sections',
  'data-privacy',
  'event-information',
  'tickets-pricing',
  'checkout-payment',
  'refund-transfer'
)
group by fc.id
order by fc.event_id, fc.sort_order, fc.key;

select
  count(*) filter (where fi.category_id is null) as items_without_category,
  count(*) filter (where fc.id is null) as items_with_missing_category,
  count(*) filter (where fc.deleted_at is not null) as items_in_deleted_category,
  count(*) filter (
    where fi.category_key is distinct from fc.key
       or fi.category_label is distinct from fc.label
  ) as items_with_redundant_label_mismatch
from public.faq_items fi
left join public.faq_categories fc on fc.id = fi.category_id;

-- ----------------------------------------------------------------
-- 7. Resumo das políticas RLS relevantes
-- ----------------------------------------------------------------
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ticket_lots',
    'ticket_lot_prices',
    'guest_approval_requests',
    'order_participants',
    'participant_extras',
    'payment_preferences',
    'refund_requests',
    'ticket_transfers',
    'notification_jobs',
    'faq_categories',
    'faq_items',
    'profile_identity_verifications'
  )
order by tablename, policyname;

-- ----------------------------------------------------------------
-- 8. Extensões e agendamentos disponíveis
-- ----------------------------------------------------------------
select
  extname,
  extversion
from pg_extension
where extname in ('pgcrypto', 'unaccent', 'pg_cron')
order by extname;

select
  to_regclass('cron.job') is not null as cron_job_catalog_available;
