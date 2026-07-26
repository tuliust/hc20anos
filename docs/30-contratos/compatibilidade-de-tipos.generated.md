---
status: generated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 801662e930e2c3563c8be25278bf172cb7cc86dd
generation_command: npm run docs:generate-type-compatibility
source_files:
  - src/lib/database.types.ts
  - docs/30-contratos/database.types.generated.ts
  - scripts/generate-type-compatibility-report.mjs
---

# Compatibilidade dos tipos Supabase

> Relatório gerado por comparação estrutural. Não editar manualmente.

## Conclusão

`src/lib/database.types.ts` não é uma saída atual da Supabase CLI. Ele combina interfaces de domínio, tipos compostos de interface, aliases históricos e um mapa parcial de banco.

O arquivo não deve ser substituído automaticamente pela baseline gerada, porque diversos componentes importam seus nomes ergonômicos. A migração segura deve separar o contrato real do Supabase dos tipos de domínio e de apresentação.

## Cobertura estrutural

| Categoria | Baseline gerada | Mapa manual | Ausentes no manual | Somente no manual |
|---|---|---|---|---|
| Tabelas | 0 | 30 | 0 | 30 |
| Views | 0 | 2 | 0 | 2 |
| Funções/RPCs | 1 | 7 | 1 | 7 |
| Enums | 0 | 9 | 0 | 9 |

## Objetos ausentes no mapa manual

### Tabelas (0)

—

### Views (0)

—

### Funções e RPCs (1)

`graphql`

### Enums (0)

—

## Objetos presentes somente no mapa manual

- Tabelas: `admin_users`, `audit_logs`, `event_page_content`, `events`, `faq_categories`, `faq_items`, `home_page_content`, `memories`, `orders`, `payment_events`, `people`, `photo_comments`, `photo_likes`, `photo_removal_requests`, `photo_tags`, `photos`, `poll_options`, `poll_votes`, `polls`, `profile_claim_answers`, `profile_claim_disputes`, `profile_claims`, `profile_school_questionnaire_answers`, `profiles`, `public_alumni_directory_status`, `public_curiosity_profile_stats`, `public_profile_cards`, `public_school_questionnaire_option_stats`, `ticket_types`, `tickets`.
- Views: `poll_results`, `public_profile_locations`.
- Funções: `fn_increment_sold`, `get_event_reports`, `has_structured_faq_items`, `is_admin`, `move_faq_category_items`, `reorder_faq_categories`, `reorder_faq_items`.
- Enums: `admin_role`, `claim_status`, `event_status`, `payment_status`, `photo_status`, `profile_status`, `sales_status`, `tag_status`, `ticket_status`.

Essas diferenças podem representar aliases históricos, objetos removidos, classificação incorreta ou tipos de aplicação que nunca foram objetos físicos do banco.

## Classificação divergente

- Entradas tratadas como tabela no arquivo manual, mas geradas como view: —.
- Entradas tratadas como view no arquivo manual, mas geradas como tabela: —.

## Linhas sem tipagem efetiva

Mapeamentos com `Row: any`: `payment_events`.

## Divergência de campos nos objetos comparáveis

Nenhuma divergência de campos foi detectada nos objetos comparáveis.

## Estratégia recomendada

1. Manter `database.types.generated.ts` como contrato bruto e não editável.
2. Configurar o cliente Supabase com o tipo bruto gerado.
3. Mover interfaces de tela, conteúdo JSON e agregados para um módulo de tipos de domínio.
4. Substituir gradualmente interfaces `Db*` por aliases derivados de `Database["public"]` quando a forma for realmente idêntica.
5. Criar adaptadores explícitos quando a interface de domínio combinar tabela, view, RPC ou campos calculados.
6. Remover `any` e objetos inexistentes somente depois de corrigir os consumidores.
7. Executar build, TypeScript e E2E a cada grupo de migração.

## Critérios para substituir o arquivo manual

- nenhum consumidor depende de campo ausente no banco;
- views não são declaradas como tabelas;
- RPCs usadas pelo código existem na baseline gerada;
- tipos de conteúdo JSON possuem adaptadores ou aliases próprios;
- não há `Row: any`;
- build e testes passam com o cliente tipado pela saída gerada;
- a migração é dividida em commits revisáveis, sem troca massiva não auditada.

## Limitações da auditoria

- compara nomes e campos, não equivalência completa de tipos TypeScript;
- não interpreta aliases condicionais ou generics complexos;
- tipos de domínio sem correspondência direta são intencionalmente preservados;
- diferenças podem exigir análise funcional antes de correção.

