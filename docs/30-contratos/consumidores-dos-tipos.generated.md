---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 4e98da0f57d382273f5b24fe6b3b6f3211ca791d
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
| Arquivos consumidores | 8 |
| Declarações de import ou augmentação | 8 |
| Símbolos importados distintos | 45 |
| Imports que não são exclusivamente `import type` | 0 |
| Augmentações de módulo | 1 |

## Consumidores por categoria

| Categoria | Arquivos |
|---|---|
| componente/página | 2 |
| enhancement | 2 |
| serviço/biblioteca | 2 |
| augmentação de módulo | 1 |
| outro runtime | 1 |

## Arquivos consumidores

| Arquivo | Categoria | Modo | Módulo | Símbolos |
|---|---|---|---|---|
| `src/app/App.tsx` | componente/página | import type | `../lib/database.types` | `AdminRole`, `AlumniDirectoryStatusRow`, `CuriosityProfileStatsRow`, `DbAdminUser`, `DbAuditLog`, `DbEvent`, `DbEventArchiveSettings`, `DbMemory`, `DbOrder`, `DbPerson`, `DbPhoto`, `DbPhotoComment`, `DbPhotoRemovalRequest`, `DbPhotoTag`, `DbPoll`, `DbPollOption`, `DbPollVote`, `DbProfile`, `DbProfileClaim`, `DbProfileClaimDispute`, `DbTicketType`, `EventPageGalleryItem`, `EventPageInfoItem`, `EventPageScheduleItem`, `Gender`, `LocationStat`, `ModerationStatus`, `PaymentStatus`, `PhotoStats`, `PollStatus`, `ProfileStatus`, `PublicLocationRow`, `PublicProfileCardRow`, `RelationshipStatus`, `SchoolQuestionnaireOptionStatRow`, `TicketStatus`, `TicketWithDetails` |
| `src/app/SecureCheckoutPage.tsx` | componente/página | import type | `../lib/database.types` | `DbTicketType`, `PaymentStatus` |
| `src/historyContentEnhancements.ts` | outro runtime | import type | `./lib/database.types` | `DbPhoto` |
| `src/historyPersonFilterEnhancement.ts` | enhancement | import type | `./lib/database.types` | `DbPhoto` |
| `src/historyPhotoRefreshEnhancement.ts` | enhancement | import type | `./lib/database.types` | `DbPhoto` |
| `src/lib/database.people-extensions.d.ts` | augmentação de módulo | declare module | `./database.types` | — |
| `src/lib/publicTicketCatalog.ts` | serviço/biblioteca | import type | `./database.types` | `DbTicketType` |
| `src/lib/services.ts` | serviço/biblioteca | import type | `./database.types` | `AdminRole`, `AlumniDirectoryStatusRow`, `CuriosityProfileStatsRow`, `DbAdminUser`, `DbAuditLog`, `DbEvent`, `DbEventArchiveSettings`, `DbEventPageContent`, `DbHomePageContent`, `DbMemory`, `DbOrder`, `DbPerson`, `DbPhoto`, `DbPhotoComment`, `DbPhotoLike`, `DbPhotoRemovalRequest`, `DbPhotoTag`, `DbPoll`, `DbPollOption`, `DbPollVote`, `DbProfile`, `DbProfileClaim`, `DbProfileClaimAnswer`, `DbProfileClaimDispute`, `DbTicket`, `DbTicketType`, `Gender`, `InsertOrder`, `LocationStat`, `ModerationStatus`, `PhotoStats`, `PollResultRow`, `PollStatus`, `PublicLocationRow`, `PublicProfileCardRow`, `SchoolQuestionnaireOptionStatRow`, `TicketStatus`, `TicketWithDetails`, `UpsertProfile` |

## Símbolos por alcance

| Símbolo | Consumidores | Arquivos |
|---|---|---|
| `DbPhoto` | 5 | `src/app/App.tsx`<br>`src/historyContentEnhancements.ts`<br>`src/historyPersonFilterEnhancement.ts`<br>`src/historyPhotoRefreshEnhancement.ts`<br>`src/lib/services.ts` |
| `DbTicketType` | 4 | `src/app/App.tsx`<br>`src/app/SecureCheckoutPage.tsx`<br>`src/lib/publicTicketCatalog.ts`<br>`src/lib/services.ts` |
| `AdminRole` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `AlumniDirectoryStatusRow` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `CuriosityProfileStatsRow` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbAdminUser` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbAuditLog` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbEvent` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbEventArchiveSettings` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbMemory` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbOrder` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPerson` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPhotoComment` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPhotoRemovalRequest` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPhotoTag` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPoll` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPollOption` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbPollVote` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbProfile` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbProfileClaim` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `DbProfileClaimDispute` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `Gender` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `LocationStat` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `ModerationStatus` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `PaymentStatus` | 2 | `src/app/App.tsx`<br>`src/app/SecureCheckoutPage.tsx` |
| `PhotoStats` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `PollStatus` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `PublicLocationRow` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `PublicProfileCardRow` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
| `SchoolQuestionnaireOptionStatRow` | 2 | `src/app/App.tsx`<br>`src/lib/services.ts` |
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
| `ProfileStatus` | 1 | `src/app/App.tsx` |
| `RelationshipStatus` | 1 | `src/app/App.tsx` |
| `UpsertProfile` | 1 | `src/lib/services.ts` |

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

