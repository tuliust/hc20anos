-- Consolidação da taxonomia do FAQ em sete categorias e inclusão de ícones.
-- Idempotente: preserva um backup pré-consolidação e reconhece tanto as chaves
-- legadas quanto as chaves finais em execuções subsequentes.
-- Pré-requisito: 20260716000100_structured_faq.sql já aplicada.

begin;

create extension if not exists unaccent with schema extensions;

-- Fresh databases may have been created directly by the structured FAQ
-- migration, without the temporary legacy columns used by this consolidation.
alter table public.faq_items
  add column if not exists category_key text,
  add column if not exists category_label text;

-- Preserve the original category fields before any remapping. The backup is
-- deliberately data-only and remains available to the corrective migration.
create table if not exists public.faq_items_backup_20260716
as table public.faq_items with no data;

create unique index if not exists faq_items_backup_20260716_id_unique
  on public.faq_items_backup_20260716 (id);

insert into public.faq_items_backup_20260716
select * from public.faq_items
on conflict (id) do nothing;

alter table public.faq_categories
  add column if not exists icon_key text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'faq_categories_icon_key_check'
  ) then
    alter table public.faq_categories
      add constraint faq_categories_icon_key_check
      check (
        icon_key is null
        or icon_key in (
          'user-key',
          'layout-grid',
          'shield-lock',
          'calendar-days',
          'ticket',
          'credit-card',
          'refresh-cw'
        )
      );
  end if;
end
$$;

insert into public.faq_categories (
  event_id, key, label, description, sort_order, icon_key,
  is_visible, deleted_at, deleted_by_admin_id
)
values
  ('00000000-0000-0000-0000-000000000001', 'account-access', 'Cadastro e Login',
   'Criação de conta, autenticação, acesso, senha e contas simplificadas.',
   10, 'user-key', true, null, null),
  ('00000000-0000-0000-0000-000000000001', 'site-sections', 'Seções do Site',
   'Minha Área, perfis, mural, álbum, enquetes e demais funcionalidades do site.',
   20, 'layout-grid', true, null, null),
  ('00000000-0000-0000-0000-000000000001', 'data-privacy', 'Dados e Privacidade',
   'Dados pessoais, consentimento, uso de imagem, segurança e privacidade.',
   30, 'shield-lock', true, null, null),
  ('00000000-0000-0000-0000-000000000001', 'event-information', 'Informações do Evento',
   'Data, horário, local, participantes, convidados, extras, check-in e funcionamento do evento.',
   40, 'calendar-days', true, null, null),
  ('00000000-0000-0000-0000-000000000001', 'tickets-pricing', 'Categorias e Valores',
   'Categorias de ingresso, pacotes, lotes, valores e regras comerciais.',
   50, 'ticket', true, null, null),
  ('00000000-0000-0000-0000-000000000001', 'checkout-payment', 'Checkout e Pagamento',
   'Reserva, Pix, cartão, parcelamento, Mercado Pago e confirmação da compra.',
   60, 'credit-card', true, null, null),
  ('00000000-0000-0000-0000-000000000001', 'refund-transfer', 'Reembolso e Transferência',
   'Reembolso, cancelamento, estorno, contestação e transferência de titularidade.',
   70, 'refresh-cw', true, null, null)
on conflict (event_id, key) do update
set label = excluded.label,
    description = excluded.description,
    sort_order = excluded.sort_order,
    icon_key = excluded.icon_key,
    is_visible = true,
    deleted_at = null,
    deleted_by_admin_id = null,
    updated_at = now();

with classified as (
  select
    fi.id,
    case
      when fi.slug in (
        'conjuge-e-filhos-precisam-de-conta',
        'convidado-externo-precisa-de-conta',
        'novo-titular-precisa-de-conta'
      ) then 'account-access'

      when fi.slug in (
        'onde-aprovar-ou-recusar-convidado',
        'onde-os-ingressos-ficam-disponiveis'
      ) then 'site-sections'

      when lower(extensions.unaccent(fi.question || ' ' || fi.answer)) ~
        '(privacidade|dados pessoais|lgpd|consentimento|uso de imagem|direito de imagem|excluir meus dados|exclusao de dados|tratamento de dados|protecao de dados)'
        then 'data-privacy'

      when lower(extensions.unaccent(fi.question || ' ' || fi.answer)) ~
        '(criar (uma )?conta|cadastro|cadastrar|login|senha|recuperar senha|redefinir senha|entrar no site|acessar a conta|acesso a conta|conta simplificada|confirmacao de e-mail|confirmacao de email)'
        then 'account-access'

      when lower(extensions.unaccent(fi.question || ' ' || fi.answer)) ~
        '(minha area|mural|album|enquete|perfil no site|secoes do site|secao do site|pagina do site|funcionalidades do site|onde encontro|onde acessar)'
        then 'site-sections'

      -- Preserve the already consolidated key on subsequent executions.
      when fi.category_key in (
        'account-access',
        'site-sections',
        'data-privacy',
        'event-information',
        'tickets-pricing',
        'checkout-payment',
        'refund-transfer'
      ) then fi.category_key

      when fi.category_key in ('pricing', 'tickets') then 'tickets-pricing'
      when fi.category_key = 'payments' then 'checkout-payment'
      when fi.category_key in ('refunds', 'transfers') then 'refund-transfer'
      when fi.category_key in ('general', 'participants', 'guests', 'extras', 'checkin')
        then 'event-information'
      else 'event-information'
    end as target_key
  from public.faq_items fi
  where fi.event_id = '00000000-0000-0000-0000-000000000001'
),
targets as (
  select
    c.id as item_id,
    c.target_key,
    fc.id as target_category_id,
    fc.label as target_category_label
  from classified c
  join public.faq_categories fc
    on fc.event_id = '00000000-0000-0000-0000-000000000001'
   and fc.key = c.target_key
)
update public.faq_items fi
set category_id = targets.target_category_id,
    category_key = targets.target_key,
    category_label = targets.target_category_label,
    updated_at = now()
from targets
where fi.id = targets.item_id
  and (
    fi.category_id is distinct from targets.target_category_id
    or fi.category_key is distinct from targets.target_key
    or fi.category_label is distinct from targets.target_category_label
  );

update public.faq_categories fc
set is_visible = false,
    deleted_at = coalesce(fc.deleted_at, now()),
    updated_at = now()
where fc.event_id = '00000000-0000-0000-0000-000000000001'
  and fc.key not in (
    'account-access',
    'site-sections',
    'data-privacy',
    'event-information',
    'tickets-pricing',
    'checkout-payment',
    'refund-transfer'
  )
  and not exists (
    select 1
    from public.faq_items fi
    where fi.category_id = fc.id
      and fi.deleted_at is null
  );

do $$
declare
  unmapped_count integer;
  obsolete_active_count integer;
begin
  select count(*)
  into unmapped_count
  from public.faq_items fi
  left join public.faq_categories fc on fc.id = fi.category_id
  where fi.event_id = '00000000-0000-0000-0000-000000000001'
    and (
      fi.category_id is null
      or fc.id is null
      or fc.key not in (
        'account-access',
        'site-sections',
        'data-privacy',
        'event-information',
        'tickets-pricing',
        'checkout-payment',
        'refund-transfer'
      )
    );

  if unmapped_count > 0 then
    raise exception 'FAQ_CATEGORY_MIGRATION_UNMAPPED_ITEMS:%', unmapped_count;
  end if;

  select count(*)
  into obsolete_active_count
  from public.faq_categories fc
  where fc.event_id = '00000000-0000-0000-0000-000000000001'
    and fc.key not in (
      'account-access',
      'site-sections',
      'data-privacy',
      'event-information',
      'tickets-pricing',
      'checkout-payment',
      'refund-transfer'
    )
    and fc.deleted_at is null;

  if obsolete_active_count > 0 then
    raise exception 'FAQ_CATEGORY_MIGRATION_ACTIVE_OBSOLETE_CATEGORIES:%', obsolete_active_count;
  end if;
end
$$;

comment on column public.faq_categories.icon_key is
  'Chave controlada de ícone usada pelo frontend. Não armazena SVG ou HTML.';

notify pgrst, 'reload schema';

commit;
