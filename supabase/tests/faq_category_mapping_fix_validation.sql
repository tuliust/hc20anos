select
  fc.key,
  fc.label,
  fc.icon_key,
  count(fi.id) filter (where fi.deleted_at is null) as total_perguntas
from public.faq_categories fc
left join public.faq_items fi on fi.category_id = fc.id
where fc.event_id = '00000000-0000-0000-0000-000000000001'
  and fc.deleted_at is null
group by fc.id, fc.key, fc.label, fc.icon_key, fc.sort_order
order by fc.sort_order;

select count(*) as inconsistent_items
from public.faq_items fi
left join public.faq_categories fc on fc.id = fi.category_id
where fi.event_id = '00000000-0000-0000-0000-000000000001'
  and (
    fc.id is null
    or fc.deleted_at is not null
    or fi.category_key is distinct from fc.key
    or fi.category_label is distinct from fc.label
  );

select
  count(*) as total_items,
  count(*) filter (where category_key = 'event-information') as event_information,
  count(*) filter (where category_key = 'tickets-pricing') as tickets_pricing,
  count(*) filter (where category_key = 'checkout-payment') as checkout_payment,
  count(*) filter (where category_key = 'refund-transfer') as refund_transfer,
  count(*) filter (where category_key = 'account-access') as account_access,
  count(*) filter (where category_key = 'site-sections') as site_sections,
  count(*) filter (where category_key = 'data-privacy') as data_privacy
from public.faq_items
where event_id = '00000000-0000-0000-0000-000000000001';
