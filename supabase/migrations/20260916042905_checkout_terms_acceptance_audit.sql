create table if not exists public.checkout_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  accepted_via text not null default 'checkout_consent',
  created_at timestamptz not null default now()
);

alter table public.checkout_terms_acceptances enable row level security;
revoke all on public.checkout_terms_acceptances from public, anon, authenticated;
grant all on public.checkout_terms_acceptances to service_role;

create index if not exists checkout_terms_acceptances_buyer_user_id_idx
  on public.checkout_terms_acceptances (buyer_user_id);
create index if not exists checkout_terms_acceptances_accepted_at_idx
  on public.checkout_terms_acceptances (accepted_at desc);
