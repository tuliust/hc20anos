---
status: generated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: ae73f19c15cbeb88ace44d2feffbfaf71fcbf594
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
| Arquivos consumidores | 21 |
| Declarações de import ou augmentação | 21 |
| Símbolos importados distintos | 21 |
| Imports que não são exclusivamente `import type` | 15 |
| Augmentações de módulo | 1 |

## Consumidores por categoria

| Categoria | Arquivos |
|---|---|
| admin | 8 |
| serviço/biblioteca | 5 |
| componente/página | 2 |
| enhancement | 2 |
| home | 2 |
| cliente Supabase | 1 |
| outro runtime | 1 |

## Arquivos consumidores

| Arquivo | Categoria | Modo | Módulo | Símbolos |
|---|---|---|---|---|
| `src/app/admin/faq/AdminFaqCategories.tsx` | admin | import | `../../../lib/database.types` | `ArrowDown`, `ArrowUp`, `Eye`, `EyeOff`, `Pencil`, `Plus`, `Trash2` |
| `src/app/admin/faq/AdminFaqPanel.tsx` | admin | import | `../../../lib/database.types` | `useCallback`, `useEffect`, `useMemo`, `useState` |
| `src/app/admin/faq/AdminFaqQuestions.tsx` | admin | import | `../../../lib/database.types` | `useMemo`, `useState` |
| `src/app/admin/faq/AdminFaqTrash.tsx` | admin | import | `../../../lib/database.types` | `useState` |
| `src/app/admin/faq/faqAdmin.types.ts` | admin | import type | `../../../lib/database.types` | `DbFaqCategory`, `DbFaqItem` |
| `src/app/admin/faq/faqAdmin.utils.ts` | admin | import type | `../../../lib/database.types` | `DbFaqCategory`, `DbFaqItem` |
| `src/app/admin/faq/FaqCategoryDeleteDialog.tsx` | admin | import | `../../../lib/database.types` | `useEffect`, `useState` |
| `src/app/admin/faq/FaqItemModal.tsx` | admin | import | `../../../lib/database.types` | `useEffect`, `useState` |
| `src/app/App.tsx` | componente/página | import | `../lib/database.types` | `Fragment`, `useCallback`, `useEffect`, `useMemo`, `useRef`, `useState` |
| `src/app/home/HomeFaqSection.tsx` | home | import | `../../lib/database.types` | `useEffect`, `useMemo`, `useState` |
| `src/app/home/HomeFaqSectionLoader.tsx` | home | import | `../../lib/database.types` | `useEffect`, `useState` |
| `src/app/SecureCheckoutPage.tsx` | componente/página | import | `../lib/database.types` | `useEffect`, `useMemo`, `useState` |
| `src/historyContentEnhancements.ts` | outro runtime | import | `./lib/database.types` | `getApprovedPhotos` |
| `src/historyPersonFilterEnhancement.ts` | enhancement | import | `./lib/database.types` | `getApprovedPhotos` |
| `src/historyPhotoRefreshEnhancement.ts` | enhancement | import | `./lib/database.types` | `getApprovedPhotos` |
| `src/lib/database.people-extensions.d.ts` | serviço/biblioteca | declare module | `./database.types` | — |
| `src/lib/faq.ts` | serviço/biblioteca | import type | `./database.types` | `DbFaqCategory`, `DbFaqItem` |
| `src/lib/faqPresentation.ts` | serviço/biblioteca | import type | `./database.types` | `DbFaqCategory`, `DbFaqItem` |
| `src/lib/publicTicketCatalog.ts` | serviço/biblioteca | import type | `./database.types` | `DbTicketType` |
| `src/lib/services.ts` | serviço/biblioteca | import | `./database.types` | `DEV_MODE`, `supabase` |
| `src/lib/supabase.ts` | cliente Supabase | import | `./database.types` | `createClient`, `SupabaseClient` |

## Símbolos por alcance

| Símbolo | Consumidores | Arquivos |
|---|---|---|
| `useState` | 9 | `src/app/App.tsx`<br>`src/app/SecureCheckoutPage.tsx`<br>`src/app/admin/faq/AdminFaqPanel.tsx`<br>`src/app/admin/faq/AdminFaqQuestions.tsx`<br>`src/app/admin/faq/AdminFaqTrash.tsx`<br>`src/app/admin/faq/FaqCategoryDeleteDialog.tsx`<br>`src/app/admin/faq/FaqItemModal.tsx`<br>`src/app/home/HomeFaqSection.tsx`<br>`src/app/home/HomeFaqSectionLoader.tsx` |
| `useEffect` | 7 | `src/app/App.tsx`<br>`src/app/SecureCheckoutPage.tsx`<br>`src/app/admin/faq/AdminFaqPanel.tsx`<br>`src/app/admin/faq/FaqCategoryDeleteDialog.tsx`<br>`src/app/admin/faq/FaqItemModal.tsx`<br>`src/app/home/HomeFaqSection.tsx`<br>`src/app/home/HomeFaqSectionLoader.tsx` |
| `useMemo` | 5 | `src/app/App.tsx`<br>`src/app/SecureCheckoutPage.tsx`<br>`src/app/admin/faq/AdminFaqPanel.tsx`<br>`src/app/admin/faq/AdminFaqQuestions.tsx`<br>`src/app/home/HomeFaqSection.tsx` |
| `DbFaqCategory` | 4 | `src/app/admin/faq/faqAdmin.types.ts`<br>`src/app/admin/faq/faqAdmin.utils.ts`<br>`src/lib/faq.ts`<br>`src/lib/faqPresentation.ts` |
| `DbFaqItem` | 4 | `src/app/admin/faq/faqAdmin.types.ts`<br>`src/app/admin/faq/faqAdmin.utils.ts`<br>`src/lib/faq.ts`<br>`src/lib/faqPresentation.ts` |
| `getApprovedPhotos` | 3 | `src/historyContentEnhancements.ts`<br>`src/historyPersonFilterEnhancement.ts`<br>`src/historyPhotoRefreshEnhancement.ts` |
| `useCallback` | 2 | `src/app/App.tsx`<br>`src/app/admin/faq/AdminFaqPanel.tsx` |
| `ArrowDown` | 1 | `src/app/admin/faq/AdminFaqCategories.tsx` |
| `ArrowUp` | 1 | `src/app/admin/faq/AdminFaqCategories.tsx` |
| `createClient` | 1 | `src/lib/supabase.ts` |
| `DbTicketType` | 1 | `src/lib/publicTicketCatalog.ts` |
| `DEV_MODE` | 1 | `src/lib/services.ts` |
| `Eye` | 1 | `src/app/admin/faq/AdminFaqCategories.tsx` |
| `EyeOff` | 1 | `src/app/admin/faq/AdminFaqCategories.tsx` |
| `Fragment` | 1 | `src/app/App.tsx` |
| `Pencil` | 1 | `src/app/admin/faq/AdminFaqCategories.tsx` |
| `Plus` | 1 | `src/app/admin/faq/AdminFaqCategories.tsx` |
| `supabase` | 1 | `src/lib/services.ts` |
| `SupabaseClient` | 1 | `src/lib/supabase.ts` |
| `Trash2` | 1 | `src/app/admin/faq/AdminFaqCategories.tsx` |
| `useRef` | 1 | `src/app/App.tsx` |

## Interpretação para a migração

- `src/lib/supabase.ts` deve ser tratado separadamente porque define o cliente e a tipagem estrutural do acesso ao banco.
- arquivos em `src/lib/` tendem a combinar queries, adaptadores e tipos de domínio; exigem revisão antes de trocar aliases.
- componentes e páginas devem migrar depois dos services, evitando acoplamento direto ao formato bruto de tabelas.
- módulos de FAQ formam um grupo funcional próprio e podem ser migrados em conjunto.
- enhancements precisam ser validados contra o bundle transformado, porque podem injetar imports ou formas adicionais.
- augmentações de módulo devem ser eliminadas ou substituídas por tipos de domínio explícitos antes de remover o arquivo manual.

## Ordem recomendada

1. cliente Supabase;
2. services e bibliotecas sem UI;
3. FAQ;
4. perfis e conteúdo público;
5. fotos, memórias e enquetes;
6. checkout, pedidos e catálogo;
7. componentes administrativos;
8. enhancements e augmentações;
9. limpeza do arquivo manual.

## Limitações

- o inventário cobre imports estáticos e `declare module`;
- usos indiretos por reexportação podem exigir análise adicional;
- um import sem `type` pode ser removido do JavaScript pelo compilador, mas é classificado conservadoramente;
- o relatório não prova que todos os símbolos importados são efetivamente usados;
- transforms podem introduzir consumidores somente no bundle final.

