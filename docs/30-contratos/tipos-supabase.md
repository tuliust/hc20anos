---
status: canonical
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 2644f2e48d3dee214220c77118fc084b4da76841
source_files:
  - docs/30-contratos/database.types.generated.ts
  - docs/30-contratos/compatibilidade-de-tipos.generated.md
  - docs/30-contratos/consumidores-dos-tipos.generated.md
  - src/lib/database.generated.ts
  - src/lib/database.types.ts
  - src/lib/faq.types.ts
  - src/lib/admin.types.ts
  - src/lib/faq.ts
  - src/lib/faqPresentation.ts
  - src/lib/supabase.ts
  - src/app/home/HomeFaqSection.tsx
  - src/app/home/HomeFaqSectionLoader.tsx
  - src/app/admin/faq/AdminFaqPanel.tsx
  - src/app/admin/faq/AdminFaqTrash.tsx
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
  - .github/workflows/type-compatibility.yml
---

# Tipos Supabase

## Estado vigente

O projeto possui três camadas de tipos:

1. **Contrato estrutural gerado**
   - `docs/30-contratos/database.types.generated.ts`;
   - produzido pela Supabase CLI contra banco local reconstruído;
   - representa tabelas, views, RPCs, enums e relações reais;
   - não recebe edição manual.

2. **Tipos de domínio e aliases separados**
   - `src/lib/faq.types.ts` preserva a forma funcional consumida pelo FAQ;
   - `src/lib/admin.types.ts` deriva `AdminRole` e `DbAdminUser` diretamente da baseline;
   - os módulos declaram explicitamente se representam domínio composto ou aliases do banco;
   - novas famílias devem seguir o mesmo princípio.

3. **Tipos manuais de compatibilidade e domínio**
   - `src/lib/database.types.ts`;
   - contém interfaces históricas, conteúdo JSON, agregados de interface e mapa parcial de banco;
   - continua temporariamente necessário para 8 arquivos consumidores;
   - será migrado em etapas.

## Cliente Supabase

`src/lib/supabase.ts` usa o contrato gerado por meio da ponte:

```text
src/lib/database.generated.ts
```

A ponte reexporta tipos da baseline sem copiar ou editar o arquivo gerado.

Consequências:

- `SupabaseClient<Database>` representa o schema real;
- novas queries recebem inferência baseada na baseline;
- tipos de domínio antigos continuam disponíveis aos componentes durante a transição;
- a mudança é exclusivamente de TypeScript e não altera credenciais, URL ou lógica de runtime.

## Família FAQ

A família FAQ está integralmente separada do mapa manual.

O módulo [`src/lib/faq.types.ts`](../../src/lib/faq.types.ts) documenta que sua forma é um contrato de domínio, não um row bruto completo:

- `DbFaqCategory` não expõe `icon_key` diretamente;
- `DbFaqItem` usa a relação composta opcional `category`;
- o row gerado também possui campos desnormalizados como `category_key` e `category_label`;
- qualquer futura derivação direta da baseline exige revisar queries e fallback legado.

Consumidores migrados incluem:

- serviço central `src/lib/faq.ts`;
- apresentação e loader públicos;
- componente da Home;
- tipos e filtros administrativos;
- modais e diálogo de exclusão;
- painéis de perguntas, categorias, lixeira e coordenador administrativo.

Nenhum arquivo importa `DbFaqCategory` ou `DbFaqItem` de `database.types.ts`.

## Família administrativa

`src/lib/admin.types.ts` define aliases ergonômicos sem duplicação manual:

```ts
export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type DbAdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
```

Os componentes administrativos do FAQ usam esses aliases. `App.tsx` e `services.ts` ainda importam os mesmos nomes do arquivo manual e serão migrados quando suas importações forem decompostas por família.

## Evidência de implantação

As alterações foram publicadas diretamente em `main`.

Evidências atuais:

- a implantação que contém a família FAQ completa concluiu com estado `success`;
- a implantação associada ao relatório `2644f2e48d3dee214220c77118fc084b4da76841` também concluiu com estado `success`;
- o inventário automático foi atualizado após as migrações;
- nenhuma alteração deliberada de runtime, consulta ou regra funcional foi incluída nos commits de tipos.

A evidência disponível comprova o build na Vercel. A suíte unitária completa e os E2E integrais ainda precisam ser executados por família antes da remoção final do arquivo manual.

## Diagnóstico estrutural

O relatório [`compatibilidade-de-tipos.generated.md`](./compatibilidade-de-tipos.generated.md) compara o mapa manual com a baseline gerada.

| Categoria | Baseline gerada | Mapa manual | Ausentes no manual | Somente no manual |
|---|---:|---:|---:|---:|
| Tabelas | 45 | 30 | 19 | 4 |
| Views | 6 | 2 | 4 | 0 |
| Funções/RPCs | 80 | 7 | 73 | 0 |
| Enums | 11 | 9 | 2 | 0 |

Achados críticos:

- quatro views públicas são declaradas como tabelas no mapa manual;
- `payment_events` usa `Row: any`;
- entidades comerciais omitem campos atuais;
- estruturas editoriais possuem divergências de campos;
- o mapa manual não representa a maior parte das RPCs públicas.

As diferenças de FAQ permanecem no relatório enquanto as interfaces históricas ainda existirem dentro de `database.types.ts`, embora nenhum consumidor funcional de FAQ dependa delas.

## Consumidores do arquivo manual

O relatório [`consumidores-dos-tipos.generated.md`](./consumidores-dos-tipos.generated.md) identifica:

- 8 arquivos consumidores;
- 8 declarações de import ou augmentação;
- 45 símbolos reais importados;
- todos os imports reais são exclusivamente de tipos;
- uma augmentação de módulo em `database.people-extensions.d.ts`.

Distribuição atual:

| Categoria | Arquivos |
|---|---:|
| Componente/página | 2 |
| Enhancement | 2 |
| Serviço/biblioteca | 2 |
| Augmentação de módulo | 1 |
| Outro runtime | 1 |

Consumidores restantes:

- `src/app/App.tsx`;
- `src/app/SecureCheckoutPage.tsx`;
- três módulos históricos de enhancement;
- `src/lib/database.people-extensions.d.ts`;
- `src/lib/publicTicketCatalog.ts`;
- `src/lib/services.ts`.

## Decisão arquitetural

A decisão de separar contrato e domínio está registrada em:

[`ADR-001 — Separar contrato Supabase e tipos de domínio`](../50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md).

Regras centrais:

- contrato gerado é a fonte estrutural;
- tipos de domínio permanecem em módulos próprios;
- aliases simples devem derivar da baseline;
- não haverá substituição massiva do arquivo manual;
- migração ocorre por grupo funcional;
- build e testes são obrigatórios em cada etapa;
- migrations não são alteradas para acomodar tipos de interface.

## Plano de migração

O plano completo está em:

[`migracao-dos-tipos-supabase.md`](./migracao-dos-tipos-supabase.md).

### Concluído

- [x] gerar e publicar a baseline Supabase;
- [x] criar auditoria de compatibilidade e inventário de consumidores;
- [x] remover ruídos sintáticos do inventário;
- [x] registrar ADR;
- [x] tipar o cliente Supabase pela baseline;
- [x] separar e migrar integralmente a família FAQ;
- [x] documentar as diferenças entre domínio FAQ e rows gerados;
- [x] derivar os aliases administrativos da baseline;
- [x] migrar os consumidores administrativos do FAQ;
- [x] reduzir o arquivo manual de 21 para 8 consumidores;
- [x] validar os builds das etapas publicadas;
- [x] tornar a publicação dos relatórios resiliente a pushes concorrentes.

### Próxima etapa

- [ ] criar módulo de tipos de fotos;
- [ ] migrar os três enhancements que usam somente `DbPhoto`;
- [ ] decompor imports de `App.tsx` e `services.ts` por família;
- [ ] separar tipos de conteúdo editorial;
- [ ] migrar aliases simples de tabelas e views;
- [ ] criar adaptadores para comércio e ingressos;
- [ ] remover `Row: any`;
- [ ] eliminar a augmentação de módulo;
- [ ] corrigir o cabeçalho histórico de `database.types.ts`;
- [ ] depreciar o arquivo manual ao final.

## Comandos

Gerar o diagnóstico estrutural:

```bash
npm run docs:generate-type-compatibility
```

Verificar drift:

```bash
npm run docs:check-type-compatibility
```

Gerar o inventário de consumidores:

```bash
npm run docs:generate-type-consumers
```

Verificar drift dos consumidores:

```bash
npm run docs:check-type-consumers
```

## CI

O workflow `Supabase type compatibility`:

1. gera os dois relatórios;
2. executa a auditoria documental;
3. falha em pull requests quando houver drift;
4. publica os relatórios em pushes para `main`;
5. rebasa e repete o push quando outro workflow atualizar `main` simultaneamente;
6. envia os arquivos como artefato.

Qualquer mudança em `src/**`, na baseline gerada, nos comparadores ou no workflow atualiza o inventário.

## Limites

- TypeScript não substitui RLS ou autorização server-side;
- o relatório compara nomes e campos, não equivalência semântica completa;
- tipos de domínio podem legitimamente diferir de linhas do banco;
- imports de tipo não produzem código JavaScript, mas ainda podem ocultar contratos desatualizados;
- a migração deve evitar casts amplos para “silenciar” divergências;
- build aprovado não substitui testes unitários, E2E e validação operacional.
