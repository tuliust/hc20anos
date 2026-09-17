begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '99999999-9999-4999-8999-999999999999'::uuid,
  'authenticated', 'authenticated', 'external-tests@local.invalid',
  crypt('external-local-test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Usuário Externo Teste"}'::jsonb,
  now(), now()
)
on conflict (id) do update
set email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999999', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '99999999-9999-4999-8999-999999999999',
    'role', 'authenticated',
    'email', 'external-tests@local.invalid'
  )::text,
  true
);

set local role authenticated;

select (public.register_external_user_profile(
  'Usuário Externo Teste',
  'external-tests@local.invalid',
  '(84) 99999-0000',
  'Natal, RN',
  'Convidado de teste'
)).id;

select *
from public.create_checkout_order(
  '99999999-9999-4999-8999-999999999999'::uuid,
  'Usuário Externo Teste',
  'external-tests@local.invalid',
  '(84) 99999-0000',
  'simple',
  jsonb_build_array(jsonb_build_object(
    'client_key', 'external-primary',
    'participant_type', 'alumni',
    'full_name', 'Usuário Externo Teste',
    'email', 'external-tests@local.invalid',
    'user_id', '99999999-9999-4999-8999-999999999999'
  )),
  '[]'::jsonb,
  'external-user-smoke-order'
);

reset role;

do $$
declare
  v_person public.people%rowtype;
  v_profile public.profiles%rowtype;
  v_order public.orders%rowtype;
  v_participant public.order_participants%rowtype;
  v_companion_order public.orders%rowtype;
  v_companion_count integer;
begin
  select pe.* into strict v_person
  from public.people pe
  where pe.claimed_by_user_id = '99999999-9999-4999-8999-999999999999'::uuid;

  if v_person.person_type <> 'external' then
    raise exception 'FAIL: expected external person_type, got %', v_person.person_type;
  end if;
  if v_person.is_visible then
    raise exception 'FAIL: external user must not appear in the public alumni directory';
  end if;
  if v_person.profile_status <> 'confirmed' then
    raise exception 'FAIL: external profile must be operational after registration';
  end if;

  select pr.* into strict v_profile
  from public.profiles pr
  where pr.user_id = '99999999-9999-4999-8999-999999999999'::uuid;

  if v_profile.person_id <> v_person.id then
    raise exception 'FAIL: external profile is not linked to its private person row';
  end if;
  if v_profile.show_confirmed_status or v_profile.show_city or v_profile.show_profession then
    raise exception 'FAIL: external profile privacy defaults are too permissive';
  end if;

  select o.* into strict v_order
  from public.orders o
  where o.buyer_user_id = '99999999-9999-4999-8999-999999999999'::uuid
    and o.checkout_idempotency_key = 'external-user-smoke-order';

  if v_order.total_amount_cents <> 12000 or v_order.quantity <> 1 then
    raise exception 'FAIL: external checkout expected one full-price ticket, got total=% quantity=%', v_order.total_amount_cents, v_order.quantity;
  end if;

  select op.* into strict v_participant
  from public.order_participants op
  where op.order_id = v_order.id;

  if v_participant.participant_type <> 'external_guest' then
    raise exception 'FAIL: external primary participant must be stored as external_guest, got %', v_participant.participant_type;
  end if;
  if v_participant.person_id <> v_person.id or v_participant.user_id <> '99999999-9999-4999-8999-999999999999'::uuid then
    raise exception 'FAIL: external participant lost account/person linkage';
  end if;
  if v_participant.email <> 'external-tests@local.invalid' or v_participant.phone is null then
    raise exception 'FAIL: external participant contact data is incomplete';
  end if;

  perform * from public.create_checkout_order(
    '99999999-9999-4999-8999-999999999999'::uuid,
    'Usuário Externo Teste',
    'external-tests@local.invalid',
    '(84) 99999-0000',
    'simple',
    jsonb_build_array(
      jsonb_build_object(
        'client_key', 'external-primary-2',
        'participant_type', 'alumni',
        'full_name', 'Usuário Externo Teste'
      ),
      jsonb_build_object(
        'client_key', 'external-spouse',
        'participant_type', 'spouse',
        'full_name', 'Acompanhante Permitido'
      )
    ),
    '[]'::jsonb,
    'external-user-companion-order'
  );

  select o.* into strict v_companion_order
  from public.orders o 
  where o.buyer_user_id = '99999999-9999-4999-8999-999999999999'::uuid
    and o.checkout_idempotency_key = 'external-user-companion-order';

  if v_companion_order.total_amount_cents <> 24000 or v_companion_order.quantity <> 2 then
    raise exception 'FAIL: external checkout with companion expected two full-price tickets, got total=% quantity=%', w_companion_order.total_amount_cents, v_companion_order.quantity;
  end if;

  select count(*)::integer into v_companion_count
  from public.order_participants op
  where op.order_id = v_companion_order.id;

  if v_companion_count <> 2 then
    raise exception 'FAIL: external checkout with companion expected two participants, got %', w_companion_count;
  end if;

  if not exists (
    select 1
    from public.order_participants op
    where op.order_id = v_companion_order.id
      and op.participant_type = 'external_guest'
      and op.user_id = '99999999-9999-4999-8999-99999999999'::uuid
      and op.person_id = v_person.id
  ) then
    raise exception 'FAIL: external checkout with companion lost primary account/person linkage';
  end if;

  if not exists (
    select 1
    from public.order_participants op
    where op.order_id = v_companion_order.id
      and op.participant_type = 'spouse'
      and op.full_name = 'Acompanhante Permitido'
  ) then
    raise exception 'FAIL: external checkout did not persist the companion';
  end if;

  if has_function_privilege('anon', 'public.register_external_user_profile(text,text,text,text,text)', 'EXECUTE') then
    raise exception 'FAIL: anon can execute external registration RPC';
  end if;
  if not has_function_privilege('authenticated', 'public.register_external_user_profile(text,text,text,text,text)', 'EXECUTE') then
    raise exception 'FAIL: authenticated role cannot execute external registration RPC';
  end if;

  raise notice 'PASS: external user registration and checkout';
end
$$;

do $$
declare
  v_person_id uuid;
  v_person_type text;
  v_is_visible boolean;
  v_visibility_blocked boolean := false;
begin
  select pe.id into strict v_person_id
  from public.people pe
  where pe.claimed_by_user_id = '99999999-9999-4999-8999-999999999999'::uuid;

  perform set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', '66666666-6666-4666-8666-666666666666',
      'role', 'authenticated',
      'email', 'admin-tests@local.invalid'
    )::text,
    true
  );

  perform public.admin_clear_person_profile(v_person_id);

  select pe.person_type, pe.is_visible
    into strict v_person_type, v_is_visible
  from public.people pe
  where pe.id = v_person_id;

  if v_person_type <> 'external' then
    raise exception 'FAIL: admin cleanup changed external person_type to %', v_person_type;
  end if;
  if v_is_visible then
    raise exception 'FAIL: admin cleanup exposed an external user in the alumni directory';
  end if;

  begin
    update public.people
    set is_visible = true
    where id = v_person_id;
  exception when check_violation then
    v_visibility_blocked := true;
  end;

  if not v_visibility_blocked then
    raise exception 'FAIL: database allowed an external user to become publicly visible';
  end if;

  raise notice 'PASS: external privacy survives admin cleanup and direct visibility updates';
end
$$;

rollback;
