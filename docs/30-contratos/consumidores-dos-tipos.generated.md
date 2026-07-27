---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: eb30a4a2334d6b2187b59b95db7236d2948828d5
generation_command: npm run docs:generate-type-consumers
source_files:
  - src/
  - scripts/generate-database-type-consumers.mjs
---

# Consumidores dos tipos manuais do banco

> Inventário gerado a partir de imports e augmentações de `database.types`. Não editar manualmente.

## Resumo

| Métrica | Quantidade |
|---|---|
| Arquivos consumidores | 2 |
| Declarações de import ou augmentação | 2 |
| Símbolos importados distintos | 28 |
| Imports que não são exclusivamente `import type` | 0 |
| Augmentações de módulo | 0 |

## Consumidores por categoria

| Categoria | Arquivos |
|---|---|
| componente/página | 1 |
| serviço/biblioteca | 1 |

## Arquivos consumidores

| Arquivo | Categoria | Modo | Módulo | Símbolos |
|---|---|---|---|---|
| `src/app/App.tsx` | componente/página | import type | `../lib/database.types` | `DbAuditLog`, `DbEvent`, `DbEventArchiveSettings`, `DbMemory`, `DbOrder`, `DbPhotoComment`, `DbPhotoRemovalRequest`, `DbPhotoTag`, `DbPoll`, `DbPollOption`, `DbPollVote`, `DbProfileClaim`, `DbProfileClaimDispute`, `EventPageGalleryItem`, `EventPageInfoItem`, `EventPageScheduleItem`, `ModerationStatus`, `PhotoStats`, `PollStatus`, `TicketStatus`, `TicketWithDetails` |
| `src/lib/services.ts` | serviço/biblioteca | import type | `./database.types` | `DbAuditLog`, `DbEvent`, `DbEventArchiveSettings`, `DbEventPageContent`, `DbHomePageContent`, `DbMemory`, `DbOrder`, `DbPhotoComment`, `DbPhotoLike`, `DbPhotoRemovalRequest`, `DbPhotoTag`, `DbPoll`, `DbPollOption`, `DbPollVote`, `DbProfileClaim`, `DbProfileClaimAnswer`, `DbProfileClaimDispute`, `DbTicket`, `InsertOrder`, `ModerationStatus`, `PhotoStats`, `PollResultRow`, `PollStatus`, `TicketStatus`, `TicketWithDetails` |

## Símbolos por alcance

| Símbolo | Consumidores | Arquivos |
|---|---|---|
| `DbAuditLog` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbEvent` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbEventArchiveSettings` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbMemory` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbOrder` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPhotoComment` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPhotoRemovalRequest` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPhotoTag` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPoll` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPollOption` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPollVote` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbProfileClaim` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbProfileClaimDispute` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `ModerationStatus` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `PhotoStats` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `PollStatus` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `TicketStatus` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `TicketWithDetails` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbEventPageContent` | 1 | `src/lib/services.ts` |
| `DbHomePageContent` | 1 | `src/lib/services.ts` |
| `DbPhotoLike` | 1 | `src/lib/services.ts` |
| `DbProfileClaimAnswer` | 1 | `src/lib/services.ts` |
| `DbTicket` | 1 | `src/lib/services.ts` |
| `EventPageGalleryItem` | 1 | `src/app/App.tsx` |
| `EventPageInfoItem` | 1 | `src/app/App.tsx` |
| `EventPageScheduleItem` | 1 | `src/app/App.tsx` |
| `InsertOrder` | 1 | `src/lib/services.ts` |
| `PollResultRow` | 1 | `src/lib/services.ts` |

## Interpretação para a migração

- `src/lib/supabase.ts` já foi migrado para a baseline gerada e não aparece entre os consumidores do arquivo manual.
- arquivos em `src/lib/` tendem a combinar queries, adaptadores e tipos de domínio; exigem revisão antes de trocar aliases.
- componentes e páginas devem migrar depois dos services, evitando acoplamento direto ao formato bruto de tabelas.
- módulos de FAQ formam um grupo funcional próprio e podem ser migrados em conjunto.
- enhancements precisam ser validados contra o bundle transformado, porque podem injetar imports ou formas adicionais.
- augmentações de módulo devem ser eliminadas ou substituídas por tipos de domínio explícitos antes de remover o arquivo manual.

## Ordem recomendada

1. services e bibliotecas sem UI;
2. FAQ;
3. perfis e conteúdo público;
4. fotos, memórias e enquetes;
5. checkout, pedidos e catálogo;
6. componentes administrativos;
7. enhancements e augmentações;
8. limpeza do arquivo manual.

## Limitações

- o inventário cobre imports estáticos terminados por ponto e vírgula e `declare module`;
- usos indiretos por reexportação podem exigir análise adicional;
- um import sem `type` pode ser removido do JavaScript pelo compilador, mas é classificado conservadoramente;
- o relatório não prova que todos os símbolos importados são efetivamente usados;
- transforms podem introduzir consumidores somente no bundle final.

