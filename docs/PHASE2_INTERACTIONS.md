# Fase 2 — interações

Este documento registra a primeira etapa da Fase 2 implementada via conector GitHub.

## Implementado no banco

Migration: `supabase/migrations/20260705000005_phase2_interactions.sql`

Inclui:

- `photo_likes`
- `photo_comments`
- `memories`
- campos de destaque em `photos`
- índices
- triggers de `updated_at`
- RLS para leitura pública, criação autenticada e moderação por role

## Próximas integrações no front-end

As próximas alterações devem conectar estes recursos ao `src/app/App.tsx` e ao painel admin existente:

- contador e botão de curtidas no mural
- envio e moderação de comentários
- caixa de memórias
- moderação e destaque de memórias

## Observação

A implementação feita pelo conector nesta etapa foi restrita ao schema/documentação para evitar reescrever o arquivo monolítico `src/app/App.tsx` sem build local.
