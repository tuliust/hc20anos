---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
period: migrations 20260705000000 a 20260705000007
superseded_by:
  - docs/00-visao-geral/fontes-de-verdade.md
planned_replacement:
  - docs/30-contratos/banco.generated.md
---

# Supabase Schema — snapshot parcial das migrations iniciais

> [!CAUTION]
> Este documento não descreve o banco vigente. Ele cobre principalmente as migrations `20260705000000` a `20260705000007` e não incorpora integralmente a fundação comercial, lotes, participantes, preferências de pagamento, notificações, reembolsos, transferências, reporting e mudanças posteriores do modelo de ingressos.
>
> Até que `docs/30-contratos/banco.generated.md` seja produzido por introspecção, a fonte de verdade é o replay completo de `supabase/migrations/`, complementado pelos testes SQL e pelas policies efetivamente aplicadas. Consulte [`00-visao-geral/fontes-de-verdade.md`](./00-visao-geral/fontes-de-verdade.md).

O conteúdo abaixo é mantido apenas para rastrear o modelo inicial do projeto **Turma 2006 — 20 anos depois**.

## Convenções observadas na fase inicial

- IDs principais usam `uuid`.
- Datas técnicas usam `timestamptz`.
- Conteúdo público deve respeitar flags de privacidade e status de moderação.
- Administração é controlada por `admin_users` e funções/policies de RLS.

## Tabelas documentadas nesse snapshot

### events
Finalidade: evento principal do reencontro.
Campos principais: `id`, `title`, `slug`, `description`, `event_date`, `event_time`, `location_name`, `location_address`, `event_status`, `sales_status`, `contact_email`, `contact_whatsapp`, `general_rules`, `companion_policy`, `refund_policy`.
Relacionamentos: `ticket_types`, `orders`, `photos`, `memories`, `polls` usam `event_id`.
Privacidade: leitura pública do evento publicado; edição restrita a `admin`/`superadmin`.
Status: `draft`, `published`, `cancelled`, `completed`; vendas `open`, `paused`, `closed`.

### people
Finalidade: base pré-carregada de ex-alunos.
Campos: `full_name`, `class_year`, `class_group`, `nickname_at_school`, `profile_status`, `claimed_by_user_id`, `is_visible`.
Relacionamentos: `profiles`, `profile_claims`, `tickets`, `photo_tags`.
Privacidade: só exibir pessoas com `is_visible=true` nos contextos públicos.
Status: `unclaimed`, `claimed`, `confirmed`.

### profiles
Finalidade: dados atuais e preferências públicas do ex-aluno.
Campos: `display_name`, `current_photo_url`, `current_city`, `current_state`, `current_country`, `profession`, `bio`, `instagram_url`, `linkedin_url`, flags `show_*`.
Relacionamentos: pertence a `people` e `auth.users`.
Privacidade: campos só devem aparecer se a flag correspondente permitir.

### profile_claims / profile_claim_answers / profile_claim_disputes
Finalidade: reivindicação e disputa de perfis.
Campos: solicitante, contato, score, respostas, motivo e status.
Privacidade: leitura/moderação restrita a organização.
Status: claims `pending`, `approved`, `rejected`, `disputed`, `expired`; disputes `pending`, `approved`, `rejected`, `cancelled`.

### ticket_types
Finalidade histórica: tipos de ingresso antes da separação completa entre produto, lote e preço.
Campos: `name`, `description`, `price_cents`, `available_quantity`, `sold_quantity`, `allows_guest`, `status`, janela de vendas.
Relacionamentos: usado por `orders` e `tickets`.
Status descritos: `draft`, `open`, `paused`, `sold_out`, `closed`.

### orders
Finalidade: pedido de compra e status de pagamento.
Campos históricos: `buyer_name`, `buyer_email`, `buyer_phone`, `person_id`, `ticket_type_id`, `quantity`, `total_amount_cents`, provider e status.
Relacionamentos: gera `tickets`; associado a `events` e `ticket_types`.
Status descritos: `pending`, `in_process`, `approved`, `rejected`, `cancelled`, `refunded`, `expired`, `charged_back`.
Privacidade: usuário deve acessar apenas pedidos vinculados à própria identidade; admin vê conforme role e policy.

### tickets
Finalidade: ingresso nominal e check-in.
Campos: `order_id`, `ticket_type_id`, `person_id`, `attendee_name`, `attendee_email`, `attendee_phone`, `guest_name`, `qr_code`, `qr_token_hash`, `checked_in`, `checked_in_at`, `checked_in_by_admin_id`.
Relacionamentos: pertence a `orders`, `ticket_types`, opcionalmente `people`.
Check-in: o estado principal é controlado no ingresso.
Privacidade: titular vê seus ingressos; equipe autorizada vê para validação.

### payment_events
Finalidade: registro bruto de eventos de pagamento/webhook.
Relacionamentos: ligado a `orders` quando disponível.
Privacidade: admin/sistema.

### photos / photo_tags / photo_likes / photo_comments
Finalidade: mural de fotos, marcações, curtidas e comentários.
Campos-chave: fotos têm `status`, `authorization_given`, `is_featured`; comentários têm `status` e dados de aprovação.
Status fotos: `pending`, `approved`, `rejected`, `removed`.
Status comentários/tags: `pending`, `approved`, `rejected`, `hidden`/`removed` conforme tabela.
Privacidade: público vê apenas fotos aprovadas; comentários só após moderação; remoções respeitam LGPD.

### memories
Finalidade: caixa de memórias da turma.
Campos: `memory_text`, `author_name`, `is_anonymous`, `status`, `is_featured`, aprovação.
Privacidade: público vê apenas memórias aprovadas; anonimato deve ser respeitado.
Status: `pending`, `approved`, `rejected`, `hidden`.

### polls / poll_options / poll_votes
Finalidade: enquetes nostálgicas.
Campos: pergunta, descrição, status, múltiplos votos, opções e votos por usuário.
Status: `draft`, `open`, `closed`, `archived`.
Regras: público vê `open`/`closed`; autenticado vota em `open`; trigger impede voto fora de regra.

### photo_removal_requests
Finalidade: solicitações de remoção de imagem.
Campos: foto, solicitante, motivo, status, revisão e notas.
Status: `pending`, `approved`, `rejected`, `hidden_preventively`.

### admin_users
Finalidade: controle de permissões administrativas.
Roles observadas posteriormente: `superadmin`, `admin`, `moderator`, `checkin_staff`, `viewer`.

### audit_logs
Finalidade: trilha de ações administrativas e sensíveis.
Campos: `user_id`, `action`, `entity_type`, `entity_id`, `metadata_json`, `created_at`.

## Views registradas nesse snapshot

### poll_results
Agrega votos por opção de enquete.

### public_profile_locations
Expõe apenas localizações autorizadas por `profiles.show_city=true` e pessoas visíveis.

## Funções/RPCs registradas nesse snapshot

- `is_admin`.
- `has_admin_role`.
- `get_event_reports`.
- `fn_increment_sold`.
- `fn_set_updated_at`.
- `fn_validate_poll_vote`.

Essa lista não inclui as RPCs comerciais e operacionais criadas depois.

## Acervo e avatares

### event_archive_settings

Configura o Acervo Digital por evento com `archive_enabled`, `post_event_text`, `official_video_url`, `official_video_title`, `official_photo_ids`, `highlight_photo_ids` e `highlights_links`. A leitura é pública; escrita fica restrita às roles autorizadas.

### storage avatars

Bucket público `avatars` para fotos atuais de perfil. Upload, update e delete são restritos ao dono da pasta `auth.uid()`; a URL pública é salva em `profiles.current_photo_url`. A exibição pública continua condicionada a `profiles.show_current_photo`.

## Próxima referência

O substituto deste arquivo deverá ser gerado após `supabase db reset` e introspecção do banco final, contendo ao menos:

- enums;
- tabelas e colunas;
- chaves e constraints;
- índices;
- views;
- triggers;
- RPCs;
- policies e grants;
- tipos TypeScript gerados;
- diagrama de entidades.
