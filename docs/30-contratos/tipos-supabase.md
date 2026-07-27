---
status: canonical
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: d39a041275940f5770b8b3a8e59dbb5cd7556674
source_files:
  - docs/30-contratos/database.types.generated.ts
  - docs/30-contratos/compatibilidade-de-tipos.generated.md
  - docs/30-contratos/consumidores-dos-tipos.generated.md
  - src/lib/database.generated.ts
  - src/lib/database.types.ts
  - src/lib/faq.types.ts
  - src/lib/faqPresentation.ts
  - src/lib/supabase.ts
  - src/app/home/HomeFaqSection.tsx
  - src/app/home/HomeFaqSectionLoader.tsx
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

2. **Tipos de domínio separados**
   - `src/lib/faq.types.ts` é o primeiro módulo funcional extraído;
   - preserva os contratos utilizados pela apresentação pública do FAQ;
   - não se apresenta como snapshot completo do banco;
   - será acompanhado por outros módulos funcionais durante a migração.

3. **Tipos manuais de compatibilidade e domínio**
   - `src/lib/database.types.ts`;
   - contém interfaces históricas, conteúdo JSON, agregados de interface e mapa parcial de banco;
   - continua temporariamente necessário para 17 arquivos consumidores;
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
- tipos de domínio antigos continuam disponíveis aos componentes;
- a mudança é exclusivamente de TypeScript e não altera credenciais, URL ou lógica de runtime.

## Primeira família funcional separada

A camada pública do FAQ foi o primeiro recorte de domínio migrado.

Arquivos migrados:

- `src/lib/faqPresentation.ts`;
- `src/app/home/HomeFaqSection.tsx`;
- `src/app/home/HomeFaqSectionLoader.tsx`.

Os três arquivos agora importam `DbFaqCategory` e `DbFaqItem` de `src/lib/faq.types.ts`.

O novo módulo preserva a forma que já era consumida pela interface. Nenhuma consulta, regra de visibilidade, ordenação, filtro, texto ou comportamento visual foi alterado deliberadamente.

Permanecem no mapa manual:

- `src/lib/faq.ts`, que centraliza queries e operações administrativas;
- oito arquivos do painel administrativo de FAQ;
- outros grupos funcionais não relacionados ao FAQ.

## Evidência de implantação

A separação do FAQ foi publicada diretamente em `main`.

O deployment do commit intermediário do loader foi cancelado porque o workflow de documentação publicou um commit automático mais recente. A implantação associada ao commit `d39a041275940f5770b8b3a8e59dbb5cd7556674` concluiu com estado `success` na Vercel e contém toda a primeira família migrada.

Isso confirma que a troca de origem dos tipos não introduziu falha de build no ambiente de produção.

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
- estruturas editoriais e FAQ possuem divergências de campos;
- o mapa manual não representa a maior parte das RPCs públicas.

## Consumidores do arquivo manual

O relatório [`consumidores-dos-tipos.generated.md`](./consumidores-dos-tipos.generated.md) identifica:

- 17 arquivos consumidores;
- 17 declarações de import ou augmentação;
- 47 símbolos reais importados;
- todos os imports reais são exclusivamente de tipos;
- uma augmentação de módulo em `database.people-extensions.d.ts`.

Distribuição atual:

| Categoria | Arquivos |
|---|---:|
| Admin | 8 |
| Serviço/biblioteca | 3 |
| Componente/página | 2 |
| Enhancement | 2 |
| Augmentação de módulo | 1 |
| Outro runtime | 1 |

O cliente Supabase e a camada pública do FAQ não aparecem mais entre os consumidores do arquivo manual.

## Decisão arquitetural

A decisão de separar contrato e domínio está registrada em:

[`ADR-001 — Separar contrato Supabase e tipos de domínio`](../50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md).

Regras centrais:

- contrato gerado é a fonte estrutural;
- tipos de domínio permanecem em módulos próprios;
- não haverá substituição massiva do arquivo manual;
- migração ocorre por grupo funcional;
- build e testes são obrigatórios em cada etapa;
- migrations não são alteradas para acomodar tipos de interface.

## Plano de migração

O plano completo está em:

[`migracao-dos-tipos-supabase.md`](./migracao-dos-tipos-supabase.md).

### Concluído

- [x] gerar baseline Supabase;
- [x] publicar tipos gerados;
- [x] criar auditoria de compatibilidade;
- [x] inventariar consumidores;
- [x] remover ruídos sintáticos do inventário;
- [x] registrar ADR;
- [x] tipar o cliente Supabase pela baseline;
- [x] validar implantação do cliente;
- [x] criar o primeiro módulo de tipos de domínio;
- [x] migrar apresentação, loader e componente público do FAQ;
- [x] validar implantação da primeira família funcional.

### Próxima etapa

- [ ] migrar `src/lib/faq.ts` para `faq.types.ts`;
- [ ] migrar os imports FAQ no painel administrativo;
- [ ] derivar os rows simples de FAQ do contrato gerado após revisar `icon_key`, `category_key` e `category_label`;
- [ ] separar tipos de conteúdo editorial;
- [ ] migrar aliases simples de tabelas e views;
- [ ] criar adaptadores para comércio e ingressos;
- [ ] remover `Row: any`;
- [ ] eliminar a augmentação de módulo;
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
5. envia os arquivos como artefato.

Qualquer mudança em `src/**`, na baseline gerada, nos comparadores ou no workflow atualiza o inventário.

## Limites

- TypeScript não substitui RLS ou autorização server-side;
- o relatório compara nomes e campos, não equivalência semântica completa;
- tipos de domínio podem legitimamente diferir de linhas do banco;
- imports de tipo não produzem código JavaScript, mas ainda podem ocultar contratos desatualizados;
- a migração deve evitar casts amplos para “silenciar” divergências.
