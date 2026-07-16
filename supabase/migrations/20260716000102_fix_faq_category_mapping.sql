-- Corrige a distribuição das perguntas após a consolidação das categorias do FAQ.
-- Motivo: a migration 20260716000101 era reexecutável apenas parcialmente;
-- em uma segunda execução, category_key já continha as novas chaves e os itens
-- comerciais caíam no fallback event-information.
-- Esta correção usa o backup pré-migração faq_items_backup_20260716 como fonte.

begin;

-- Corrige os textos das sete categorias usando escapes Unicode,
-- evitando qualquer dependência da codificação do terminal/clipboard.
update public.faq_categories
set
  label = case key
    when 'account-access' then 'Cadastro e Login'
    when 'site-sections' then U&'Se\00E7\00F5es do Site'
    when 'data-privacy' then 'Dados e Privacidade'
    when 'event-information' then U&'Informa\00E7\00F5es do Evento'
    when 'tickets-pricing' then 'Categorias e Valores'
    when 'checkout-payment' then 'Checkout e Pagamento'
    when 'refund-transfer' then U&'Reembolso e Transfer\00EAncia'
  end,
  updated_at = now()
where event_id = '00000000-0000-0000-0000-000000000001'
  and key in (
    'account-access',
    'site-sections',
    'data-privacy',
    'event-information',
    'tickets-pricing',
    'checkout-payment',
    'refund-transfer'
  );

do $$
begin
  if to_regclass('public.faq_items_backup_20260716') is null then
    raise exception 'FAQ_BACKUP_NOT_FOUND: public.faq_items_backup_20260716';
  end if;
end
$$;

with source_items as (
  select
    fi.id,
    fi.slug,
    fi.question,
    fi.answer,
    backup.category_key as original_category_key,
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

      when backup.category_key in ('pricing', 'tickets') then 'tickets-pricing'
      when backup.category_key = 'payments' then 'checkout-payment'
      when backup.category_key in ('refunds', 'transfers') then 'refund-transfer'
      when backup.category_key in ('general', 'participants', 'guests', 'extras', 'checkin')
        then 'event-information'
      else 'event-information'
    end as target_key
  from public.faq_items fi
  join public.faq_items_backup_20260716 backup
    on backup.id = fi.id
  where fi.event_id = '00000000-0000-0000-0000-000000000001'
),
targets as (
  select
    source_items.id as item_id,
    source_items.target_key,
    fc.id as target_category_id,
    fc.label as target_category_label
  from source_items
  join public.faq_categories fc
    on fc.event_id = '00000000-0000-0000-0000-000000000001'
   and fc.key = source_items.target_key
   and fc.deleted_at is null
)
update public.faq_items fi
set
  category_id = targets.target_category_id,
  category_key = targets.target_key,
  category_label = targets.target_category_label,
  updated_at = now()
from targets
where fi.id = targets.item_id;

-- Garante que os rótulos redundantes dos itens estejam iguais à categoria.
update public.faq_items fi
set
  category_key = fc.key,
  category_label = fc.label,
  updated_at = now()
from public.faq_categories fc
where fi.category_id = fc.id
  and fi.event_id = '00000000-0000-0000-0000-000000000001'
  and (
    fi.category_key is distinct from fc.key
    or fi.category_label is distinct from fc.label
  );

do $$
declare
  backup_count integer;
  mapped_count integer;
  inconsistent_count integer;
begin
  select count(*)
  into backup_count
  from public.faq_items_backup_20260716
  where event_id = '00000000-0000-0000-0000-000000000001';

  select count(*)
  into mapped_count
  from public.faq_items
  where event_id = '00000000-0000-0000-0000-000000000001';

  if mapped_count <> backup_count then
    raise exception 'FAQ_BACKUP_COUNT_MISMATCH:backup=%,current=%',
      backup_count, mapped_count;
  end if;

  select count(*)
  into inconsistent_count
  from public.faq_items fi
  left join public.faq_categories fc on fc.id = fi.category_id
  where fi.event_id = '00000000-0000-0000-0000-000000000001'
    and (
      fc.id is null
      or fc.deleted_at is not null
      or fi.category_key is distinct from fc.key
      or fi.category_label is distinct from fc.label
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

  if inconsistent_count > 0 then
    raise exception 'FAQ_MAPPING_STILL_INCONSISTENT:%', inconsistent_count;
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
