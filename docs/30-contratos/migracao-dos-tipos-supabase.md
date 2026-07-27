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
  - docs/50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
---

# Migração dos tipos Supabase

## Objetivo

Substituir gradualmente o mapa parcial em `src/lib/database.types.ts` pelo contrato real produzido pela Supabase CLI, preservando tipos de domínio e apresentação que não correspondem diretamente a rows do banco.

A decisão arquitetural está registrada em [`ADR-001`](../50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md).

## Diagnóstico

| Categoria | Baseline gerada | Mapa manual | Ausentes no manual | Somente no manual |
|---|---:|---:|---:|---:|
| Tabelas | 45 | 30 | 19 | 4 |
| Views | 6 | 2 | 4 | 0 |
| Funções/RPCs | 80 | 7 | 73 | 0 |
| Enums | 11 | 9 | 2 | 0 |

Pendências estruturais relevantes:

- quatro views classificadas como tabelas;
- `payment_events` com `Row: any`;
- entidades comerciais com campos ausentes no mapa manual;
- estruturas editoriais divergentes;
- mapa manual de RPCs muito incompleto.

## Progresso consolidado

O inventário caiu de 21 para 2 arquivos consumidores e de 49 símbolos inicialmente detectados — incluindo ruídos posteriormente corrigidos — para 40 símbolos legados reais.

Concluído:

- [x] gerar e versionar a baseline Supabase;
- [x] tipar o cliente Supabase pela baseline;
- [x] criar auditoria estrutural e inventário de consumidores;
- [x] proteger relatórios contra drift;
- [x] tornar o push dos relatórios resiliente à concorrência;
- [x] separar integralmente a família FAQ;
- [x] derivar `AdminRole` e `DbAdminUser` da baseline;
- [x] derivar `DbPhoto` da tabela gerada;
- [x] migrar os enhancements de fotos;
- [x] remover a augmentação redundante de `DbPerson`;
- [x] criar projeção segura de catálogo e enum de pagamento;
- [x] migrar catálogo público e checkout seguro;
- [x] decompor os símbolos validados em `App.tsx` e `services.ts`;
- [x] validar os builds das famílias publicadas.

Restam somente:

- `src/app/App.tsx`;
- `src/lib/services.ts`.

Esses arquivos continuam importando 40 símbolos de `database.types.ts`.

## Arquitetura-alvo

```text
src/lib/database.generated.ts          ponte para a baseline bruta
src/lib/*.types.ts                     aliases e tipos funcionais explícitos
src/lib/adapters/                      banco → domínio/apresentação
src/lib/supabase.ts                    cliente tipado pela baseline
src/lib/database.types.ts              removido ou deprecated ao final
```

## Princípios

1. Arquivos gerados não recebem edição manual.
2. Aliases simples derivam da baseline.
3. Tipos compostos não fingem representar rows completos.
4. Views permanecem classificadas como views.
5. RPCs usam assinaturas geradas.
6. JSON exige tipos ou adaptadores explícitos.
7. Migração de tipos não altera schema ou regra de negócio.
8. Dinheiro permanece em centavos nas camadas internas.
9. Cada família é pequena, reversível e validada.
10. Build aprovado não substitui testes funcionais.

## Fase 0 — infraestrutura

- [x] Replay integral das migrations.
- [x] Geração de tipos, schema, RPCs, RLS e ERD.
- [x] Comparador de compatibilidade.
- [x] Inventário automático de consumidores.
- [x] ADR e documentação canônica.
- [x] Workflow com drift e publicação automática.
- [x] Zero augmentações de módulo restantes.
- [ ] Corrigir o cabeçalho do arquivo manual, que ainda se apresenta como gerado.
- [ ] Impedir novos imports de `database.types.ts` por check dedicado.

## Fase 1 — cliente tipado

- [x] Criar `src/lib/database.generated.ts`.
- [x] Parametrizar `SupabaseClient<Database>`.
- [x] Remover o cliente dos consumidores do mapa manual.
- [x] Validar deployment.
- [ ] Revisar as queries que ainda dependem de casts amplos.
- [ ] Proibir cliente sem tipo ou `createClient<any>`.

## Fase 2 — contratos de domínio

### FAQ

- [x] Criar `faq.types.ts`.
- [x] Migrar serviço, Home e administração.
- [x] Documentar relação composta e campos desnormalizados.
- [x] Remover todos os imports FAQ do legado.
- [ ] Executar testes unitários e E2E específicos do FAQ.

### Catálogo e checkout

- [x] Criar `commerce.types.ts`.
- [x] Derivar `PaymentStatus` do enum gerado.
- [x] Criar projeção de leitura `DbTicketType`.
- [x] Migrar catálogo, checkout e imports dos agregadores.
- [x] Validar build.
- [ ] Validar E2E de seleção, criação de checkout e retornos de pagamento.
- [ ] Não reutilizar a projeção como row de escrita.

### Conteúdo e apresentação — pendente

- [ ] Home e página do evento.
- [ ] Cards e estatísticas públicas.
- [ ] Formulários e agregados de perfil.
- [ ] Relatórios e moderação.
- [ ] Memórias e enquetes.

## Fase 3 — aliases simples

### Concluído

- [x] `AdminRole`.
- [x] `DbAdminUser`.
- [x] `DbPhoto`.

### Próximos candidatos

- [ ] `DbPerson`.
- [ ] `DbProfile`.
- [ ] `DbAuditLog`.
- [ ] `DbPhotoTag`.
- [ ] `DbPhotoLike`.
- [ ] `DbPhotoComment`.
- [ ] tabelas de enquetes.
- [ ] views públicas corretamente classificadas.

Antes de cada alias:

- confirmar campos e nullability;
- verificar divergências no relatório;
- identificar relações ou cálculos adicionados pela aplicação;
- executar build e testes do fluxo afetado.

## Fase 4 — decomposição dos agregadores

### Estado atual

`App.tsx` e `services.ts` já importam de módulos separados:

- administração;
- fotos;
- catálogo;
- status de pagamento.

Os imports legados restantes devem ser removidos por família, não por reescrita massiva.

### Ordem recomendada

1. pessoas, perfis e views públicas;
2. interações de fotos e moderação;
3. memórias e enquetes;
4. evento e conteúdo editorial;
5. pedidos, ingressos e check-in;
6. limpeza de aliases históricos e interfaces sem consumidor.

### Controle de segurança

Uma primeira automação de decomposição capturou um bloco de import maior que o pretendido. `main` foi restaurada ao último commit íntegro, e a operação foi reaplicada com:

- correspondência de blocos completos;
- exigência de ocorrência única;
- rejeição de arquivos inesperados;
- inspeção dos imports resultantes;
- build aprovado.

Próximas automações devem preservar esses controles ou usar edição localizada equivalente.

## Fase 5 — comércio, pedidos e ingressos

Essa família não deve ser convertida por aliases simples.

### Divergências conhecidas

`ticket_types` possui campos atuais ausentes no contrato histórico, incluindo `product_code`, composição e metadados.

`orders` omite, entre outros:

- usuário comprador;
- idempotência;
- lote;
- moeda e parcelas;
- ambiente e detalhes de pagamento;
- valores subtotal e extras;
- token público;
- estados e timestamps de reserva, cancelamento e reembolso.

`tickets` omite campos de participante, QR, status, cancelamento, transferência e vouchers físicos.

### Pendências

- [ ] Criar rows brutos e view models distintos.
- [ ] Criar adaptadores de pedidos para telas administrativas e comprador.
- [ ] Tipar catálogo, checkout, transferência, reembolso e check-in pelas RPCs geradas.
- [ ] Substituir `payment_events: any`.
- [ ] Executar testes SQL e E2E financeiros.

### Critério de interrupção

Interromper se uma mudança de tipo exigir alteração de preço, status financeiro, reserva, emissão ou inventário sem decisão funcional explícita.

## Fase 6 — RPCs

A baseline contém 80 funções/RPCs; o mapa manual possui 7.

- [ ] Inventariar RPCs realmente chamadas pelo frontend e pelas Functions.
- [ ] Usar `Args` e `Returns` gerados.
- [ ] Criar tipos de domínio para retornos compostos.
- [ ] Remover assinaturas históricas sem consumidor.
- [ ] Revisar `security definer`, grants e RLS em conjunto.

Prioridade:

1. perfil e identidade;
2. catálogo e checkout;
3. pedidos do comprador;
4. check-in;
5. reembolsos e transferências;
6. relatórios;
7. CMS e FAQ.

## Fase 7 — limpeza final

- [ ] Zero imports de `database.types.ts`.
- [ ] Zero `Row: any`.
- [ ] Zero views em `Tables`.
- [ ] Interfaces sem consumidor removidas ou arquivadas.
- [ ] Mapa manual marcado como `deprecated` ou removido.
- [ ] Check que proíbe regressão.
- [ ] Build, unitários e E2E aprovados.

## Matriz de validação

| Mudança | Build | Unitários | E2E | SQL | Auditoria |
|---|---:|---:|---:|---:|---:|
| Alias simples | obrigatório | módulo afetado | fluxo afetado | recomendado | obrigatório |
| Tipo de domínio | obrigatório | módulo afetado | quando houver UI | não aplicável | obrigatório |
| RPC | obrigatório | obrigatório | fluxo afetado | obrigatório | obrigatório |
| Comércio | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |

## Evidências por entrega

Registrar:

- símbolos e consumidores migrados;
- diferenças justificadas;
- adaptadores criados;
- comandos e testes executados;
- casts temporários;
- rollback específico.

## Fora do escopo

- alterar schema para eliminar erro de interface;
- converter todas as famílias em um commit;
- remover tipos ergonômicos úteis;
- validar segurança apenas por TypeScript;
- substituir testes por compilação.
