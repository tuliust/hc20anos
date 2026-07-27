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
  - src/lib/supabase.ts
  - src/app/admin/faq/AdminFaqPanel.tsx
  - src/app/admin/faq/AdminFaqTrash.tsx
  - docs/50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
  - .github/workflows/type-compatibility.yml
---

# Migração dos tipos Supabase

## Objetivo

Migrar a aplicação do mapa manual parcial em `src/lib/database.types.ts` para o contrato real produzido pela Supabase CLI, sem perder os tipos de domínio e apresentação que hoje estão misturados no mesmo arquivo.

A decisão arquitetural está registrada em [`ADR-001`](../50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md).

## Diagnóstico atual

A auditoria automática compara o arquivo usado historicamente pela aplicação com `database.types.generated.ts`.

| Categoria | Baseline gerada | Mapa manual | Ausentes no manual | Somente no manual |
|---|---:|---:|---:|---:|
| Tabelas | 45 | 30 | 19 | 4 |
| Views | 6 | 2 | 4 | 0 |
| Funções/RPCs | 80 | 7 | 73 | 0 |
| Enums | 11 | 9 | 2 | 0 |

Achados prioritários:

- quatro views públicas estão classificadas como tabelas;
- `payment_events` usa `Row: any`;
- `orders`, `tickets` e `ticket_types` omitem campos comerciais vigentes;
- `events` omite timezone;
- tipos editoriais omitem campos atuais;
- o mapa de RPCs representa menos de 10% das funções públicas geradas;
- o arquivo manual contém tipos de domínio que não devem ser apagados sem adaptação.

O relatório vigente está em [`compatibilidade-de-tipos.generated.md`](./compatibilidade-de-tipos.generated.md).

## Estado atual da execução

O inventário automático registra 8 consumidores restantes de `database.types.ts`, contra 21 no início da migração.

Implementado:

- ponte estável `src/lib/database.generated.ts`;
- `SupabaseClient<Database>` parametrizado pela baseline gerada;
- família FAQ integralmente separada em `src/lib/faq.types.ts`;
- serviço, Home e painel administrativo de FAQ migrados;
- diferenças entre domínio FAQ e rows gerados documentadas;
- `AdminRole` e `DbAdminUser` derivados da baseline em `src/lib/admin.types.ts`;
- consumidores administrativos do FAQ migrados;
- inventário regenerado após cada mudança;
- publicação dos relatórios resiliente a pushes concorrentes;
- builds das etapas publicadas validados na Vercel.

Ainda não comprovado integralmente:

- suíte unitária completa;
- E2E integral de perfil, checkout e área administrativa;
- migração dos grandes agregadores `App.tsx` e `services.ts`;
- eliminação da augmentação `database.people-extensions.d.ts`;
- adaptação dos tipos comerciais divergentes.

## Estado desejado

```text
src/lib/database.generated.ts          ponte para o contrato bruto gerado
src/lib/*.types.ts                     aliases e tipos funcionais explícitos
src/lib/supabase.ts                    cliente tipado pelo contrato bruto
src/lib/adapters/                      conversões entre banco e domínio
```

Os nomes exatos podem evoluir, mas as responsabilidades não devem voltar a ser misturadas.

## Princípios

1. O banco não deve ser alterado para acomodar um tipo de tela.
2. Arquivos gerados não recebem edição manual.
3. Tipos de domínio não fingem representar tabelas completas.
4. Aliases simples derivam da baseline gerada.
5. Views permanecem na seção de views.
6. RPCs usam as assinaturas geradas como fonte de verdade.
7. JSON exige tipo ou adaptador explícito.
8. Cada etapa deve ser pequena, reversível e testada.
9. A remoção de `any` não pode criar casts indiscriminados.
10. Build aprovado não substitui testes funcionais.

## Fase 0 — preparação

- [x] Gerar tipos após replay integral.
- [x] Versionar `database.types.generated.ts`.
- [x] Criar comparador automático.
- [x] Versionar relatório de compatibilidade.
- [x] Criar ADR.
- [x] Inventariar todos os imports de `database.types.ts`.
- [x] Classificar consumidores por categoria e símbolos importados.
- [x] Confirmar que os imports existentes são exclusivamente de tipos.
- [x] Tornar a publicação dos relatórios resiliente a concorrência.
- [ ] Corrigir o cabeçalho do arquivo manual, que ainda se apresenta como gerado.
- [ ] Classificar os consumidores restantes por fluxo e forma de dados.

### Critério de saída

O inventário estrutural está concluído. A classificação funcional fina continua antes de cada família.

## Fase 1 — cliente Supabase tipado

Objetivo: aplicar o contrato gerado no ponto de criação do cliente.

- [x] Localizar as instâncias vigentes de `createClient`.
- [x] Criar alias estável para o `Database` gerado.
- [x] Parametrizar `createClient<Database>`.
- [x] Confirmar que o cliente deixou de consumir `database.types.ts`.
- [x] Validar build no deployment de produção.
- [ ] Corrigir gradualmente erros reais de tabela, view e RPC revelados pelo cliente.
- [ ] Proibir `createClient<any>` ou cliente não tipado em código novo por regra automatizada.

### Validação executada

- deployment da Vercel concluído com sucesso;
- inventário reduziu de 21 para 20 consumidores após a migração do cliente;
- nenhuma mudança deliberada de runtime foi introduzida.

### Validação pendente

- testes unitários completos;
- E2E dos fluxos principais;
- verificação dedicada das queries inferidas pelo cliente gerado.

### Rollback

Reverter somente a importação do `Database` em `src/lib/supabase.ts`. Não remover a baseline nem a ponte gerada.

## Fase 2 — separar tipos de domínio

Mover para módulos próprios os tipos que não representam diretamente uma linha de tabela ou view.

### Grupo FAQ

- [x] Criar `src/lib/faq.types.ts`.
- [x] Preservar inicialmente a forma funcional existente.
- [x] Migrar apresentação, loader e componente da Home.
- [x] Migrar `src/lib/faq.ts`.
- [x] Migrar tipos, filtros, modais, diálogos e painéis administrativos.
- [x] Documentar `icon_key`, `category_key`, `category_label` e a relação composta `category`.
- [x] Confirmar que nenhum consumidor de FAQ importa os tipos do arquivo manual.
- [x] Validar build da família completa.
- [ ] Executar testes unitários específicos do FAQ.
- [ ] Executar E2E do painel administrativo e da Home.

### Outros grupos de domínio

- [ ] Conteúdo da Home.
- [ ] Conteúdo da página do evento.
- [ ] Cards e estatísticas públicas.
- [ ] Formulários de perfil.
- [ ] Agregados de relatórios.
- [ ] Payloads de moderação.
- [ ] Estados de checkout e notificações.
- [ ] Remover a frase “tipos gerados” dos módulos manuais.
- [x] Adicionar comentários sobre a fonte da forma composta do FAQ.

### Critério de saída

O arquivo manual deixa de ser ponto central para tipos de tela e conteúdo.

## Fase 3 — aliases para objetos idênticos

Para objetos cuja forma corresponde ao contrato bruto, usar aliases derivados:

```ts
export type DbPerson = Database["public"]["Tables"]["people"]["Row"];
export type PublicLocationRow = Database["public"]["Views"]["public_profile_locations"]["Row"];
```

### Concluído

- [x] Criar `src/lib/admin.types.ts`.
- [x] Derivar `AdminRole` do enum `admin_role`.
- [x] Derivar `DbAdminUser` do row de `admin_users`.
- [x] Migrar os consumidores administrativos do FAQ.
- [x] Validar build dos aliases administrativos.

### Pendente

- [ ] Migrar `AdminRole` e `DbAdminUser` em `App.tsx` e `services.ts` durante a decomposição desses imports.
- [ ] Criar módulo de fotos e derivar `DbPhoto`, se a equivalência continuar confirmada.
- [ ] Começar por objetos simples e estáveis.
- [ ] Não criar alias quando a interface manual combina campos calculados.
- [ ] Manter nomes ergonômicos para reduzir mudanças nos consumidores.
- [ ] Confirmar nullability e defaults antes de cada substituição.

### Ordem sugerida atual

1. fotos;
2. `people`;
3. `profiles`;
4. enquetes;
5. views públicas;
6. conteúdo editorial;
7. objetos comerciais somente depois dos adaptadores.

## Fase 4 — comércio e ingressos

Essa fase exige maior cautela porque o arquivo manual omite campos vigentes.

### `ticket_types`

Campos ausentes no manual:

- `included_people_count`;
- `metadata_json`;
- `package_kind`;
- `participant_type`;
- `product_code`.

### `orders`

Campos ausentes incluem:

- usuário comprador;
- idempotência;
- lote;
- moeda e parcelas;
- ambiente e detalhes do pagamento;
- valores subtotal e extras;
- token público;
- estados e timestamps de reserva, cancelamento e reembolso.

### `tickets`

Campos ausentes incluem:

- participante do pedido;
- token do QR Code;
- status atual;
- cancelamento;
- transferência;
- entrega de vouchers físicos.

- [ ] Criar adaptadores de pedido para telas administrativas.
- [ ] Separar row de banco de view model do comprador.
- [ ] Tipar RPCs de catálogo, checkout e operação.
- [ ] Substituir `payment_events: any`.
- [ ] Validar dinheiro sempre em centavos na camada de domínio.
- [ ] Executar testes de pagamento, emissão, transferência e reembolso.

### Critério de interrupção

Interromper se uma alteração de tipo exigir mudar status financeiro, cálculo de preço ou emissão sem uma decisão funcional explícita.

## Fase 5 — RPCs

A baseline contém 80 funções ou RPCs públicas; o mapa manual possui 7.

- [ ] Inventariar RPCs realmente chamadas pelo frontend e pelas Functions.
- [ ] Remover assinaturas históricas sem consumidor.
- [ ] Usar `Args` e `Returns` gerados.
- [ ] Criar tipos de domínio para retornos compostos quando necessário.
- [ ] Revisar RPCs `security definer` em conjunto com grants e RLS.

Prioridade:

1. perfil e identidade;
2. catálogo e checkout;
3. pedidos do comprador;
4. check-in;
5. reembolsos e transferências;
6. relatórios administrativos;
7. CMS e FAQ.

## Fase 6 — limpeza final

- [ ] Nenhuma view permanece em `Tables`.
- [ ] Nenhum objeto usa `Row: any`.
- [ ] Objetos removidos não permanecem no mapa.
- [x] O cliente está tipado pela baseline.
- [ ] Tipos de domínio estão integralmente separados.
- [ ] O comparador não aponta divergências não justificadas.
- [ ] A augmentação de módulo foi eliminada.
- [ ] O arquivo manual antigo é depreciado ou removido.
- [ ] O processo de geração e drift está documentado no onboarding.

## Estratégia de commits

Cada entrega deve conter apenas um grupo coerente:

1. infraestrutura do cliente;
2. tipos de domínio de um módulo;
3. aliases de uma família de tabelas;
4. adaptadores de uma tela;
5. RPCs de um fluxo;
6. remoção de dívida comprovadamente sem consumidor.

Evitar commits que misturem migração de tipos com mudança visual, regra financeira ou migration de banco.

## Matriz de validação

| Mudança | Build | Unitários | E2E | SQL | Auditoria de tipos |
|---|---:|---:|---:|---:|---:|
| Cliente tipado | obrigatório | obrigatório | fluxos principais | não aplicável | obrigatório |
| Tipo de domínio | obrigatório | módulo afetado | quando houver UI | não aplicável | obrigatório |
| Alias de tabela/view | obrigatório | módulo afetado | fluxo afetado | recomendado | obrigatório |
| RPC | obrigatório | obrigatório | fluxo afetado | obrigatório | obrigatório |
| Comércio | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |

## Evidências

Registrar em cada entrega:

- objetos migrados;
- consumidores atualizados;
- divergências removidas ou justificadas;
- comandos executados;
- testes aprovados;
- casts temporários introduzidos, com justificativa;
- rollback específico.

## Fora do escopo deste plano

- alterar schema para eliminar erros de interface;
- renomear tabelas sem migration própria;
- converter todos os tipos JSON em uma única etapa;
- remover tipos ergonômicos que agregam contexto funcional;
- validar segurança apenas por TypeScript;
- substituir testes por compilação.
