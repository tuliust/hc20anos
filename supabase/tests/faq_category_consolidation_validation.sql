-- Validação da consolidação das categorias do FAQ.
-- Somente leitura.

select
  count(*) as total_faq_items,
  count(*) filter (where deleted_at is null) as active_faq_items,
  count(*) filter (where deleted_at is not null) as deleted_faq_items
from public.faq_items
where event_id = '00000000-0000-0000-0000-000000000001';

select
  fc.key,
  fc.label,
  fc.icon_key,
  fc.sort_order,
  fc.is_visible,
  fc.deleted_at,
  count(fi.id) as total_items,
  count(fi.id) filter (where fi.deleted_at is null) as active_items,
  count(fi.id) filter (
    where fi.deleted_at is null and fi.is_visible = true
  ) as visible_items,
  count(fi.id) filter (
    where fi.deleted_at is null and fi.is_featured = true
  ) as featured_items
from public.faq_categories fc
left join public.faq_items fi on fi.category_id = fc.id
where fc.event_id = '00000000-0000-0000-0000-000000000001'
group by
  fc.id, fc.key, fc.label, fc.icon_key, fc.sort_order,
  fc.is_visible, fc.deleted_at
order by fc.deleted_at nulls first, fc.sort_order, fc.label;

select
  fi.slug,
  fi.question,
  fi.category_key,
  fi.category_label,
  fc.key as relational_category_key,
  fc.label as relational_category_label
from public.faq_items fi
join public.faq_categories fc on fc.id = fi.category_id
where fi.event_id = '00000000-0000-0000-0000-000000000001'
order by fc.sort_order, fi.sort_order, fi.question;

select count(*) as inconsistent_items
from public.faq_items fi
left join public.faq_categories fc on fc.id = fi.category_id
where fi.event_id = '00000000-0000-0000-0000-000000000001'
  and (
    fi.category_id is null
    or fc.id is null
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

select count(*) as active_obsolete_categories
from public.faq_categories
where event_id = '00000000-0000-0000-0000-000000000001'
  and key not in (
    'account-access',
    'site-sections',
    'data-privacy',
    'event-information',
    'tickets-pricing',
    'checkout-payment',
    'refund-transfer'
  )
  and deleted_at is null;
