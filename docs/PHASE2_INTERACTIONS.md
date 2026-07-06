# Fase 2 — interações

Este documento registra a implementação incremental da Fase 2 do projeto **Turma 2006 — 20 anos depois**.

## Implementado

- curtidas no mural de fotos
- comentários moderados em fotos
- caixa de memórias
- moderação administrativa de comentários e memórias
- destaques de fotos e memórias
- enquetes nostálgicas
- mapa/lista Onde a turma está hoje
- convite compartilhável

## Migrations

- `supabase/migrations/20260705000005_phase2_interactions.sql`
- `supabase/migrations/20260705000006_polls_where_archive.sql`

## Arquivos principais

- `src/app/App.tsx`
- `src/lib/services.ts`
- `src/lib/database.types.ts`

## Páginas adicionadas

- `memories`
- `polls`
- `where-now`
- `share-invite`

## Admin expandido

- comentários de fotos
- memórias
- enquetes

## Permissões

- Público vê apenas conteúdo aprovado ou aberto.
- Usuários autenticados podem curtir, comentar, enviar memórias e votar.
- Moderadores e admins moderam comentários e memórias.
- Admins gerenciam enquetes.
