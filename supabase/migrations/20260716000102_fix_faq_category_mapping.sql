-- Corrige a distribuição das perguntas após a consolidação das categorias do FAQ.
-- A fonte preferencial é o backup pré-consolidação. Em ambientes que ainda não
-- o possuam, a migration cria uma cópia dos itens atuais e usa também as chaves
-- finais como entrada válida, sem interromper o replay por ausência da tabela.

begin;

create table if not exists public.faq_items_backup_20260716
as table public.faq_items with no data;

create unique index if not exists faq_items_backup_20260716_id_unique
  on public.faq_items_backup_20260716 (id);

insert into public.faq_items_backup_20260716
select * from public.faq_items
on conflict (id) do nothing;

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

with source_items as (
  select
    fi.id,
    fi.slug,
    fi.question,
    fi.answer,
    coalesce(backup.category_key, fi.category_key) as original_category_key,
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

      when coalesce(backup.category_key, fi.category_key) in (
        'account-access',
        'site-sections',
        'data-privacy',
        'event-information',
        'tickets-pricing',
        'checkout-payment',
        'refund-transfer'
      ) then coalesce(backup.category_key, fi.category_key)

      when coalesce(backup.category_key, fi.category_key) in ('pricing', 'tickets')
        then 'tickets-pricing'
      when coalesce(backup.category_key, fi.category_key) = 'payments'
        then 'checkout-payment'
      when coalesce(backup.category_key, fi.category_key) in ('refunds', 'transfers')
        then 'refund-transfer'
      when coalesce(backup.category_key, fi.category_key) in (
        'general', 'participants', 'guests', 'extras', 'checkin'
      ) then 'event-information'
      else 'event-information'
    end as target_key
  from public.faq_items fi
  left join public.faq_items_backup_20260716 backup
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
  missing_backup_count integer;
  inconsistent_count integer;
begin
  select count(*)
  into missing_backup_count
  from public.faq_items fi
  left join public.faq_items_backup_20260716 backup on backup.id = fi.id
  where fi.event_id = '00000000-0000-0000-0000-000000000001'
    and backup.id is null;

  if missing_backup_count > 0 then
    raise exception 'FAQ_BACKUP_INCOMPLETE:%', missing_backup_count;
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
