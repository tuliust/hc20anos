-- ================================================================
-- Turma 2006 — Migration 003: Seed (dados de teste)
-- ATENÇÃO: Execute apenas em ambiente de desenvolvimento.
-- Em produção, importe a lista real de ex-alunos com dados verificados.
-- ================================================================

-- ----------------------------------------------------------------
-- Evento principal
-- ----------------------------------------------------------------
insert into events (
  id, title, slug, description,
  event_date, event_time, location_name, location_address,
  event_status, sales_status,
  contact_email, contact_whatsapp,
  general_rules, companion_policy, refund_policy
) values (
  '00000000-0000-0000-0000-000000000001',
  'Turma 2006 — 20 anos depois',
  'turma-2006-20-anos',
  'Reencontro dos ex-alunos do Colégio Henrique Castriciano formados em 2006. Vinte anos depois, uma noite para celebrar quem a gente se tornou.',
  '2026-10-17',
  '19:00:00',
  'Espaço Cultural Ponta Negra',
  'Av. Eng. Roberto Freire, Ponta Negra — Natal, RN',
  'published',
  'open',
  'turma2006.hc@gmail.com',
  '(84) 99999-0206',
  'Ingresso nominal e intransferível. Obrigatório apresentar documento com foto no check-in.',
  'Acompanhantes permitidos com ingresso casal ou mesa VIP. Acompanhante não precisa ser ex-aluno.',
  'Não há reembolso após confirmação do pagamento, exceto em caso de cancelamento do evento pela organização.'
) on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- Lotes de ingresso
-- ----------------------------------------------------------------
insert into ticket_types (id, event_id, name, description, price_cents, available_quantity, sold_quantity, allows_guest, status, sales_start_at, sales_end_at)
values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Ingresso Individual — 1º Lote',
    'Inclui jantar buffet completo, open bar por 4 horas, área fotográfica e brinde comemorativo.',
    12000, 100, 53, false, 'open',
    '2026-06-01 00:00:00-03', '2026-08-31 23:59:59-03'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Ingresso Casal — 1º Lote',
    'Inclui 2 jantares buffet, open bar por 4 horas, área fotográfica e 2 brindes comemorativos.',
    20000, 50, 42, true, 'open',
    '2026-06-01 00:00:00-03', '2026-08-31 23:59:59-03'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Mesa VIP — Edição Limitada (4 pessoas)',
    'Mesa reservada premium, champagne na chegada, open bar premium, brinde colecionável exclusivo e acesso à área VIP.',
    60000, 20, 20, true, 'sold_out',
    '2026-06-01 00:00:00-03', '2026-07-15 23:59:59-03'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Ingresso Individual — 2º Lote',
    'Inclui jantar buffet completo, open bar por 4 horas, área fotográfica e brinde comemorativo.',
    15000, 100, 0, false, 'closed',
    '2026-09-01 00:00:00-03', '2026-10-10 23:59:59-03'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Ingresso Casal — 2º Lote',
    'Inclui 2 jantares buffet, open bar por 4 horas, área fotográfica e 2 brindes comemorativos.',
    25000, 50, 0, true, 'closed',
    '2026-09-01 00:00:00-03', '2026-10-10 23:59:59-03'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- Ex-alunos (pessoas pré-carregadas)
-- NOTA: Sem dados sensíveis reais. Nomes fictícios para desenvolvimento.
-- ----------------------------------------------------------------
insert into people (id, full_name, class_year, class_group, nickname_at_school, profile_status, is_visible)
values
  ('00000000-0000-0000-0002-000000000001', 'Ana Paula Oliveira',   2006, 'A', 'Aninha',    'confirmed', true),
  ('00000000-0000-0000-0002-000000000002', 'Bruno Cavalcanti',     2006, 'B', 'Brunão',    'confirmed', true),
  ('00000000-0000-0000-0002-000000000003', 'Carla Medeiros',       2006, 'A', 'Carlinha',  'confirmed', true),
  ('00000000-0000-0000-0002-000000000004', 'Diego Ferreira',       2006, 'B', 'Diegão',    'claimed',   true),
  ('00000000-0000-0000-0002-000000000005', 'Eduarda Lima',         2006, 'A', 'Du',        'claimed',   true),
  ('00000000-0000-0000-0002-000000000006', 'Felipe Araújo',        2006, 'C', 'Fepa',      'confirmed', true),
  ('00000000-0000-0000-0002-000000000007', 'Gabriela Santos',      2006, 'B', 'Gabi',      'confirmed', true),
  ('00000000-0000-0000-0002-000000000008', 'Henrique Costa',       2006, 'C', 'Kiko',      'unclaimed', false),
  ('00000000-0000-0000-0002-000000000009', 'Isabela Rodrigues',    2006, 'A', 'Bela',      'confirmed', true),
  ('00000000-0000-0000-0002-000000000010', 'João Vitor Melo',      2006, 'B', 'JV',        'confirmed', true),
  ('00000000-0000-0000-0002-000000000011', 'Karoline Freitas',     2006, 'C', 'Karo',      'claimed',   true),
  ('00000000-0000-0000-0002-000000000012', 'Lucas Nogueira',       2006, 'A', 'Luquinhas', 'unclaimed', false),
  ('00000000-0000-0000-0002-000000000013', 'Marina Pinheiro',      2006, 'B', 'Mari',      'confirmed', true),
  ('00000000-0000-0000-0002-000000000014', 'Nathan Alves',         2006, 'C', 'Nath',      'confirmed', true),
  ('00000000-0000-0000-0002-000000000015', 'Olivia Carvalho',      2006, 'A', 'Oli',       'claimed',   true),
  ('00000000-0000-0000-0002-000000000016', 'Pedro Gomes',          2006, 'B', 'PH',        'unclaimed', false),
  ('00000000-0000-0000-0002-000000000017', 'Rafaela Souza',        2006, 'C', 'Rafa',      'confirmed', true),
  ('00000000-0000-0000-0002-000000000018', 'Sandro Vieira',        2006, 'A', 'Sandão',    'unclaimed', false)
on conflict (id) do nothing;
