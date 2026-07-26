---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 5287ae609251b2bb3001e1f5d369ea6a70fc5e83
source_files:
  - docs/30-contratos/database.types.generated.ts
  - docs/30-contratos/compatibilidade-de-tipos.generated.md
  - docs/30-contratos/consumidores-dos-tipos.generated.md
  - src/lib/database.generated.ts
  - src/lib/database.types.ts
  - src/lib/supabase.ts
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
  - .github/workflows/type-compatibility.yml
---

# Tipos Supabase

## Estado vigente

O projeto possui duas camadas de tipos:

1. **Contrato estrutural gerado**
   - `docs/30-contratos/database.types.generated.ts`;
   - produzido pela Supabase CLI contra banco local reconstruído;
   - representa tabelas, views, RPCs, enums e relações reais;
   - não recebe edição manual.

2. **Tipos manuais de compatibilidade e domínio**
   - `src/lib/database.types.ts`;
   - contém interfaces históricas, conteúdo JSON, agregados de interface e mapa parcial de banco;
   - continua temporariamente necessário para 20 arquivos consumidores;
   - será migrado em etapas.

## Cliente Supabase

`src/lib/supabase.ts` já usa o contrato gerado por meio da ponte:

```text
src/lib/database.generated.ts
```

A ponte reexporta tipos da baseline sem copiar ou editar o arquivo gerado.

Consequências:

- `SupabaseClient<Database>` representa o schema real;
- novas queries recebem inferência baseada na baseline;
- tipos de domínio antigos continuam disponíveis aos componentes;
- a mudança é exclusivamente de TypeScript e não altera credenciais, URL ou lógica de runtime.

## Evidência de implantação

A alteração do cliente foi publicada em `main`. O deployment imediatamente associado foi cancelado pela Vercel porque commits automatizados mais novos já estavam em processamento. A implantação mais recente do projeto concluiu com estado `READY` e contém a alteração.

Isso significa que não houve falha de build causada pela ponte de tipos.

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

- 20 arquivos consumidores;
- 20 declarações de import ou augmentação;
- 47 símbolos reais importados, além de um token sintático residual que será removido do gerador;
- todos os imports reais são exclusivamente de tipos;
- uma augmentação de módulo em `database.people-extensions.d.ts`.

Distribuição:

| Categoria | Arquivos |
|---|---:|
| Serviço/biblioteca | 8 |
| Outro runtime | 6 |
| Componente/página | 4 |
| Admin | 1 |
| Augmentação de módulo | 1 |

O cliente Supabase não aparece mais entre os consumidores do arquivo manual.

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
- [x] registrar ADR;
- [x] tipar o cliente Supabase pela baseline;
- [x] validar implantação.

### Próxima etapa

- [ ] remover o token sintático residual do inventário;
- [ ] classificar consumers por grupo de migração;
- [ ] separar tipos de FAQ;
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
