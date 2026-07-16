-- ================================================================
-- Consolidated checkout database validation
-- Run in Supabase SQL Editor using "Run without RLS".
-- Creates and removes its own test records.
-- ================================================================

create temporary table if not exists _checkout_e2e_results (
  check_name text primary key,
  expected text,
  actual text,
  result text
) on commit preserve rows;
truncate table _checkout_e2e_results;

do $$
declare
  v_user_id uuid;
  v_key text := gen_random_uuid()::text;
  v_order record;
  v_same_order record;
  v_expiring_order record;
  v_payment_result record;
  v_payment_replay record;
  v_ticket_count integer;
  v_notification_count integer;
  v_extra_total integer;
  v_participant_count integer;
  v_preference_id text;
  v_error text;
begin
  select u.id into v_user_id from auth.users u order by u.created_at limit 1;
  if v_user_id is null then
    raise exception 'Test requires at least one auth.users row';
  end if;

  begin
    -- Six participants: alumni, spouse and four children. One drinks package
    -- and two barbecue packages are assigned to distinct participants.
    select * into v_order
    from public.create_checkout_order(
      v_user_id,
      'Teste E2E Checkout',
      'checkout-e2e@example.com',
      '5599999999999',
      'family_full',
      jsonb_build_array(
        jsonb_build_object('client_key','alumni','participant_type','alumni','full_name','Ex-aluno E2E'),
        jsonb_build_object('client_key','spouse','participant_type','spouse','full_name','Cônjuge E2E'),
        jsonb_build_object('client_key','child-1','participant_type','child','full_name','Filho 1','birth_date','2016-10-24'),
        jsonb_build_object('client_key','child-2','participant_type','child','full_name','Filho 2','birth_date','2017-10-24'),
        jsonb_build_object('client_key','child-3','participant_type','child','full_name','Filho 3','birth_date','2018-10-24'),
        jsonb_build_object('client_key','child-4','participant_type','child','full_name','Filho 4','birth_date','2019-10-24')
      ),
      jsonb_build_array(
        jsonb_build_object('participant_key','alumni','extra_type','drinks','quantity',1),
        jsonb_build_object('participant_key','spouse','extra_type','barbecue','quantity',2)
      ),
      'checkout-e2e-main-' || v_key
    );

    select count(*)::integer into v_participant_count
    from public.order_participants op where op.order_id = v_order.order_id;

    insert into _checkout_e2e_results values (
      'six_participants', '6', v_participant_count::text,
      case when v_participant_count = 6 then 'PASS' else 'FAIL' end
    );

    select coalesce(sum(pe.total_price_cents),0)::integer into v_extra_total
    from public.participant_extras pe where pe.order_id = v_order.order_id;

    insert into _checkout_e2e_results values (
      'extras_total_matches_order', v_order.total_amount_cents::text,
      ((select o.subtotal_amount_cents + v_extra_total from public.orders o where o.id=v_order.order_id))::text,
      case when v_order.total_amount_cents = (select o.subtotal_amount_cents + v_extra_total from public.orders o where o.id=v_order.order_id)
        then 'PASS' else 'FAIL' end
    );

    -- Same buyer + same idempotency key must return the same order.
    select * into v_same_order
    from public.create_checkout_order(
      v_user_id,
      'Teste E2E Checkout',
      'checkout-e2e@example.com',
      '5599999999999',
      'family_full',
      jsonb_build_array(
        jsonb_build_object('client_key','alumni','participant_type','alumni','full_name','Ex-aluno E2E'),
        jsonb_build_object('client_key','spouse','participant_type','spouse','full_name','Cônjuge E2E'),
        jsonb_build_object('client_key','child-1','participant_type','child','full_name','Filho 1','birth_date','2016-10-24'),
        jsonb_build_object('client_key','child-2','participant_type','child','full_name','Filho 2','birth_date','2017-10-24'),
        jsonb_build_object('client_key','child-3','participant_type','child','full_name','Filho 3','birth_date','2018-10-24'),
        jsonb_build_object('client_key','child-4','participant_type','child','full_name','Filho 4','birth_date','2019-10-24')
      ),
      '[]'::jsonb,
      'checkout-e2e-main-' || v_key
    );

    insert into _checkout_e2e_results values (
      'order_idempotency', v_order.order_id::text, v_same_order.order_id::text,
      case when v_same_order.order_id = v_order.order_id then 'PASS' else 'FAIL' end
    );

    v_preference_id := 'pref-e2e-' || v_key;
    update public.orders
    set payment_provider_preference_id = v_preference_id,
        payment_environment = 'test'
    where id = v_order.order_id;

    select * into v_payment_result
    from public.apply_mercado_pago_payment(
      v_order.order_id,
      'payment-e2e-' || v_key,
      'approved',
      'accredited',
      'visa',
      'credit_card',
      1,
      v_order.total_amount_cents,
      'BRL',
      v_preference_id,
      now()
    );

    select count(*)::integer into v_ticket_count
    from public.tickets t where t.order_id = v_order.order_id;

    insert into _checkout_e2e_results values (
      'one_ticket_per_participant', '6', v_ticket_count::text,
      case when v_ticket_count = 6 then 'PASS' else 'FAIL' end
    );

    -- Replay the same approved payment. No new tickets may be created.
    select * into v_payment_replay
    from public.apply_mercado_pago_payment(
      v_order.order_id,
      'payment-e2e-' || v_key,
      'approved',
      'accredited',
      'visa',
      'credit_card',
      1,
      v_order.total_amount_cents,
      'BRL',
      v_preference_id,
      now()
    );

    select count(*)::integer into v_ticket_count
    from public.tickets t where t.order_id = v_order.order_id;

    insert into _checkout_e2e_results values (
      'payment_replay_idempotency', '0 new / 6 total',
      v_payment_replay.tickets_created::text || ' new / ' || v_ticket_count::text || ' total',
      case when v_payment_replay.tickets_created = 0 and v_ticket_count = 6 then 'PASS' else 'FAIL' end
    );

    select count(*)::integer into v_notification_count
    from public.notification_jobs nj
    where nj.order_id = v_order.order_id and nj.event_type = 'ticket_issued';

    insert into _checkout_e2e_results values (
      'notification_idempotency', '6', v_notification_count::text,
      case when v_notification_count = 6 then 'PASS' else 'FAIL' end
    );

    -- Expiration of an unpaid reservation.
    select * into v_expiring_order
    from public.create_checkout_order(
      v_user_id,
      'Teste Expiração',
      'checkout-expiration@example.com',
      '5599999999999',
      'simple',
      jsonb_build_array(
        jsonb_build_object('client_key','alumni-exp','participant_type','alumni','full_name','Ex-aluno Expiração')
      ),
      '[]'::jsonb,
      'checkout-e2e-expiration-' || v_key
    );

    update public.orders set expires_at = now() - interval '1 minute'
    where id = v_expiring_order.order_id;
    perform public.release_expired_ticket_reservations(now());

    insert into _checkout_e2e_results
    select
      'reservation_expiration',
      'expired/expired',
      o.payment_status::text || '/' || o.reservation_status,
      case when o.payment_status::text='expired' and o.reservation_status='expired' then 'PASS' else 'FAIL' end
    from public.orders o where o.id = v_expiring_order.order_id;

    if exists (select 1 from _checkout_e2e_results where result <> 'PASS') then
      raise exception 'Consolidated checkout checks failed: %',
        (select jsonb_agg(to_jsonb(r)) from _checkout_e2e_results r where result <> 'PASS');
    end if;

    delete from public.orders where id in (v_order.order_id, v_expiring_order.order_id);
  exception when others then
    v_error := sqlerrm;
    if v_order.order_id is not null then delete from public.orders where id = v_order.order_id; end if;
    if v_expiring_order.order_id is not null then delete from public.orders where id = v_expiring_order.order_id; end if;
    raise exception '%', v_error;
  end;
end;
$$;

select check_name, expected, actual, result
from _checkout_e2e_results
order by check_name;

drop table if exists _checkout_e2e_results;
