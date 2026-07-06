# Fase 2 — interações

Este documento registra a implementação incremental da Fase 2 do projeto **Turma 2006 — 20 anos depois**.

## Estado atual

Implementado e conectado ao Supabase:

- curtidas no mural de fotos;
- comentários moderados em fotos;
- caixa de memórias;
- moderação administrativa de comentários e memórias;
- destaques de fotos e memórias;
- enquetes nostálgicas;
- mapa/lista “Onde a turma está hoje” com dados autorizados de perfis;
- convite personalizado compartilhável.

## Migrations

- `supabase/migrations/20260705000005_phase2_interactions.sql`
  - `photo_likes`
  - `photo_comments`
  - `memories`
  - campos de destaque em `photos`

- `supabase/migrations/20260705000006_polls_where_archive.sql`
  - `polls`
  - `poll_options`
  - `poll_votes`
  - view `poll_results`
  - view `public_profile_locations`

## Front-end

Arquivos principais:

- `src/app/App.tsx`
- `src/lib/services.ts`
- `src/lib/database.types.ts`

Páginas adicionadas ou expandidas:

- `memories`
- `polls`
- `where-now`
- `share-invite`

Admin expandido:

- comentários de fotos;
- memórias;
- enquetes.

## Permissões

- Público vê apenas conteúdo aprovado ou aberto.
- Usuários autenticados podem curtir, comentar, enviar memórias e votar.
- `moderator`, `admin` e `superadmin` moderam comentários/memórias.
- `admin` e `superadmin` gerenciam enquetes.

## Observações

- O convite compartilhável usa Web Share API quando disponível e fallback para compartilhamento por texto.
- O mapa da turma usa apenas dados de perfis com `show_city=true`.
- Não foram adicionadas dependências pesadas para geração de imagem.
