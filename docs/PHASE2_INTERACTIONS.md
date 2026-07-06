# Fase 2 — interações

Este documento registra a implementação inicial da Fase 2 do projeto **Turma 2006 — 20 anos depois**.

## Banco de dados

Migration principal:

- `supabase/migrations/20260705000005_phase2_interactions.sql`

A migration cria/prepara:

- `photo_likes`
- `photo_comments`
- `memories`
- campos de destaque em `photos`:
  - `is_featured`
  - `featured_by_admin_id`
  - `featured_at`
- índices para consultas por foto, usuário, status e data
- triggers de `updated_at`
- RLS para leitura pública, criação autenticada e moderação por role

## Front-end integrado

Arquivos principais:

- `src/app/App.tsx`
- `src/lib/services.ts`
- `src/lib/database.types.ts`
- `src/lib/supabase.ts`

Implementado:

- contador de curtidas no mural
- curtir/descurtir foto com usuário autenticado
- contador de comentários aprovados
- envio de comentários pendentes para moderação
- listagem de comentários aprovados no detalhe da foto
- seção de fotos destacadas pela organização
- seção de fotos mais curtidas
- página `memories` para caixa de memórias
- envio de memória com opção de anonimato
- listagem de memórias aprovadas
- destaque visual de memórias destacadas
- abas admin para comentários e memórias
- moderação admin de comentários: aprovar, rejeitar, ocultar
- moderação admin de memórias: aprovar, rejeitar, ocultar, destacar/remover destaque

## Permissões

- Usuários autenticados podem curtir/descurtir fotos.
- Usuários autenticados podem enviar comentários e memórias com status `pending`.
- Público vê apenas comentários e memórias `approved`.
- `moderator`, `admin` e `superadmin` podem moderar comentários e memórias.
- `admin` e `superadmin` mantêm permissões ampliadas já existentes no Prompt 2B.

## Validação

Executado:

```bash
npm run build
```

Resultado:

- Build concluído com sucesso.
- Aviso mantido: bundle JS acima de 500 kB.

## Pendências

- Aplicar as migrations no Supabase remoto com `supabase db push`.
- Testar visualmente os fluxos autenticados no navegador.
- Validar RLS com usuários reais das roles `moderator`, `admin` e `superadmin`.
- Considerar code splitting futuro para reduzir o chunk principal.
