---
status: canonical
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: e3ad48618537371075278b224192f33300d9abcd
source_files:
  - docs/30-contratos/database.types.generated.ts
  - docs/30-contratos/compatibilidade-de-tipos.generated.md
  - docs/30-contratos/consumidores-dos-tipos.generated.md
  - src/lib/database.generated.ts
  - src/lib/database.types.ts
  - src/lib/admin.types.ts
  - src/lib/faq.types.ts
  - src/lib/photo.types.ts
  - src/lib/commerce.types.ts
  - src/lib/supabase.ts
  - src/app/App.tsx
  - src/lib/services.ts
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
  - .github/workflows/type-compatibility.yml
---

# Tipos Supabase

## Estado vigente

O sistema de tipos possui três camadas:

1. **Contrato estrutural gerado**
   - `docs/30-contratos/database.types.generated.ts`;
   - produzido pela Supabase CLI contra o banco local reconstruído;
   - representa tabelas, views, RPCs, enums e relações reais;
   - não recebe edição manual.

2. **Aliases e contratos funcionais**
   - `src/lib/admin.types.ts` deriva os tipos administrativos da baseline;
   - `src/lib/photo.types.ts` deriva o row de fotos;
   - `src/lib/commerce.types.ts` expõe uma projeção controlada do catálogo e o enum de pagamento;
   - `src/lib/faq.types.ts` preserva uma forma de domínio composta, documentadamente diferente do row bruto.

3. **Mapa manual legado**
   - `src/lib/database.types.ts`;
   - ainda mistura interfaces históricas, conteúdo JSON, agregados, aliases e um mapa parcial do banco;
   - permanece necessário somente para `src/app/App.tsx` e `src/lib/services.ts`;
   - não deve receber novos consumidores.

## Cliente Supabase

`src/lib/supabase.ts` usa o contrato gerado pela ponte:

```text
src/lib/database.generated.ts
```

Assim, `SupabaseClient<Database>` representa o schema reproduzido, enquanto os tipos de domínio são migrados separadamente.

## Famílias concluídas

### FAQ

A família FAQ foi integralmente removida do mapa manual.

`src/lib/faq.types.ts` é um contrato de domínio, não um row completo:

- `DbFaqCategory` não expõe `icon_key` diretamente;
- `DbFaqItem` usa a relação composta opcional `category`;
- o row gerado possui também `category_key` e `category_label`;
- serviço, Home e painel administrativo usam o módulo separado.

### Administração

`src/lib/admin.types.ts` deriva diretamente da baseline:

```ts
export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type DbAdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
```

Os dois agregadores restantes também importam esses símbolos do módulo novo.

### Fotos

`src/lib/photo.types.ts` deriva:

```ts
export type DbPhoto = Database["public"]["Tables"]["photos"]["Row"];
```

Os três enhancements da história e os dois agregadores usam esse alias. View models com tags, relações ou contadores continuam sendo tipos distintos.

### Catálogo e checkout

`src/lib/commerce.types.ts` contém:

- `PaymentStatus`, derivado do enum gerado;
- `DbTicketType`, projeção de leitura para catálogo e seleção inicial do checkout.

A projeção mantém os campos históricos necessários e aceita como opcionais os metadados comerciais atuais. Ela não deve ser usada como row completo em escritas.

Consumidores migrados:

- `src/lib/publicTicketCatalog.ts`;
- `src/app/SecureCheckoutPage.tsx`;
- os imports comerciais de `src/app/App.tsx` e `src/lib/services.ts`.

## Inventário atual

O relatório [`consumidores-dos-tipos.generated.md`](./consumidores-dos-tipos.generated.md) registra:

| Métrica | Quantidade |
|---|---:|
| Arquivos consumidores do legado | 2 |
| Declarações legadas | 2 |
| Símbolos legados distintos | 40 |
| Imports que não são `import type` | 0 |
| Augmentações de módulo | 0 |

Consumidores restantes:

- `src/app/App.tsx`;
- `src/lib/services.ts`.

A migração reduziu o legado de 21 para 2 arquivos. Os símbolos já validados de FAQ, administração, fotos, catálogo e pagamento não fazem mais parte dos imports legados desses agregadores.

## Diagnóstico estrutural

O relatório [`compatibilidade-de-tipos.generated.md`](./compatibilidade-de-tipos.generated.md) continua comparando o arquivo manual com a baseline completa.

| Categoria | Baseline gerada | Mapa manual | Ausentes no manual | Somente no manual |
|---|---:|---:|---:|---:|
| Tabelas | 45 | 30 | 19 | 4 |
| Views | 6 | 2 | 4 | 0 |
| Funções/RPCs | 80 | 7 | 73 | 0 |
| Enums | 11 | 9 | 2 | 0 |

Achados críticos ainda abertos:

- quatro views estão classificadas como tabelas no mapa manual;
- `payment_events` usa `Row: any`;
- pedidos e ingressos exigem adaptadores, porque o manual omite campos vigentes;
- estruturas editoriais possuem divergências;
- a maior parte das RPCs não está representada no mapa manual.

Interfaces históricas já sem consumidores podem continuar aparecendo no relatório até a limpeza final de `database.types.ts`.

## Evidência de implantação

As etapas foram publicadas diretamente em `main` e os builds relevantes concluíram com sucesso na Vercel.

Durante a decomposição dos agregadores, uma primeira automação capturou um bloco de import maior que o pretendido. `main` foi restaurada ao último commit íntegro antes de qualquer validação positiva, e a mudança foi reaplicada com blocos exatos e rejeição de arquivos inesperados. O commit corrigido passou no build.

A evidência atual comprova compilação e deployment. Ainda não comprova a suíte unitária completa nem os E2E integrais de todos os fluxos.

## Regras

- arquivos gerados não recebem edição manual;
- aliases simples derivam da baseline;
- tipos compostos declaram explicitamente sua diferença em relação ao banco;
- nenhum novo código deve importar `database.types.ts`;
- TypeScript não substitui RLS, autorização ou validação server-side;
- migrações de tipos não devem alterar regras financeiras ou schema;
- cada nova família exige build, auditoria e testes aplicáveis.

## Próxima etapa

Decompor os 40 símbolos restantes por famílias:

1. pessoas, perfis e views públicas;
2. fotos relacionadas, moderação e interações;
3. memórias e enquetes;
4. evento e conteúdo editorial;
5. pedidos, ingressos e agregados comerciais;
6. limpeza de interfaces e mapa manual sem consumidores.

O plano detalhado está em [`migracao-dos-tipos-supabase.md`](./migracao-dos-tipos-supabase.md).

## Comandos

```bash
npm run docs:generate-type-compatibility
npm run docs:check-type-compatibility
npm run docs:generate-type-consumers
npm run docs:check-type-consumers
```

## CI

O workflow `Supabase type compatibility`:

1. gera os dois relatórios;
2. executa a auditoria documental;
3. exige ausência de drift em pull requests;
4. publica relatórios em pushes para `main`;
5. usa rebase e novas tentativas quando outro workflow atualizar `main` simultaneamente;
6. envia os relatórios como artefato.
