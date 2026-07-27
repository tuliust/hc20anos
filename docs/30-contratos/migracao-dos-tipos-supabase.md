---
status: canonical
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: cdbe16b579047a1d8d1ad980cc7dba5cdcf9c576
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
  - docs/50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
---

# Migração dos tipos Supabase

## Objetivo

Migrar a aplicação do mapa manual parcial em `src/lib/database.types.ts` para o contrato real produzido pela Supabase CLI, sem perder os tipos de domínio e apresentação que hoje estão misturados no mesmo arquivo.

A decisão arquitetural está registrada em [`ADR-001`](../50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md).

## Diagnóstico atual

A auditoria automática compara o arquivo usado pela aplicação com `database.types.generated.ts`.

Resumo vigente:

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
- o arquivo manual contém tipos de domínio que não devem ser apagados.

O relatório atualizado está em [`compatibilidade-de-tipos.generated.md`](./compatibilidade-de-tipos.generated.md).

## Estado atual da execução

O inventário automático registra 17 consumidores restantes de `database.types.ts`. O cliente Supabase e a camada pública do FAQ já foram removidos desse conjunto.

Implementado:

- ponte estável `src/lib/database.generated.ts`;
- `SupabaseClient<Database>` parametrizado pela baseline gerada;
- módulo de domínio `src/lib/faq.types.ts`;
- apresentação, loader e componente público do FAQ migrados;
- inventário regenerado após cada mudança;
- implantação mais recente validada com sucesso na Vercel.

Ainda não comprovado nesta etapa:

- suíte unitária completa;
- E2E integral de perfil, checkout e área administrativa;
- equivalência semântica entre os tipos FAQ manuais e os rows gerados;
- migração do serviço central `src/lib/faq.ts`;
- migração do painel administrativo de FAQ.

## Estado desejado

```text
src/lib/database.generated.ts          ponte para o contrato bruto gerado
src/lib/*.types.ts                     tipos funcionais e de apresentação
src/lib/supabase.ts                    cliente tipado pelo contrato bruto
src/lib/adapters/                      conversões entre banco e domínio, quando necessárias
```

Os nomes exatos dos diretórios podem ser ajustados durante a implementação, mas as responsabilidades não devem voltar a ser misturadas.

## Princípios

1. O banco não deve ser alterado para acomodar um tipo de tela.
2. Arquivos gerados não recebem edição manual.
3. Tipos de domínio não fingem representar tabelas completas.
4. Views permanecem na seção de views.
5. RPCs usam as assinaturas geradas como fonte de verdade.
6. JSON exige tipo ou adaptador explícito.
7. Cada etapa deve ser pequena, reversível e testada.
8. A remoção de `any` não pode criar casts indiscriminados.

## Fase 0 — preparação

- [x] Gerar tipos após replay integral.
- [x] Versionar `database.types.generated.ts`.
- [x] Criar comparador automático.
- [x] Versionar relatório de compatibilidade.
- [x] Criar ADR.
- [x] Inventariar todos os imports de `database.types.ts`.
- [x] Classificar consumidores por categoria e símbolos importados.
- [x] Confirmar que os imports existentes são exclusivamente de tipos.
- [ ] Corrigir o cabeçalho do arquivo manual.
- [ ] Classificar, por fluxo, quais consumidores executam queries Supabase e quais usam apenas tipos de domínio.

### Critério de saída

O inventário estrutural está concluído. A classificação funcional fina continuará durante cada grupo de migração, antes de alterar seus imports.

## Fase 1 — cliente Supabase tipado

Objetivo: aplicar o contrato gerado no ponto de criação do cliente, sem mudar ainda todos os tipos importados pelos componentes.

- [x] Localizar as instâncias vigentes de `createClient`.
- [x] Criar alias estável para o `Database` gerado.
- [x] Parametrizar `createClient<Database>`.
- [x] Confirmar que o cliente deixou de consumir `database.types.ts`.
- [x] Validar build no deployment de produção.
- [ ] Corrigir gradualmente erros reais de tabela, view e RPC revelados pelo cliente.
- [ ] Proibir `createClient<any>` ou cliente não tipado em código novo por regra automatizada.

### Validação executada

- deployment mais recente da Vercel concluído com sucesso;
- inventário reduziu de 21 para 20 consumidores após a migração do cliente;
- nenhuma mudança deliberada de runtime foi introduzida.

### Validação ainda pendente

- testes unitários completos;
- verificações E2E dos fluxos principais;
- verificação dedicada de todas as queries inferidas pelo cliente gerado.

### Rollback

Reverter somente a importação do `Database` em `src/lib/supabase.ts`. Não remover a baseline nem a ponte gerada.

## Fase 2 — separar tipos de domínio

Mover para módulos próprios os tipos que não representam diretamente uma linha de tabela ou view:

- conteúdo da home;
- conteúdo da página do evento;
- FAQ estruturado;
- cards e estatísticas públicas;
- formulários de perfil;
- agregados de relatórios;
- payloads de moderação;
- estados de checkout e notificações.

- [x] Criar o primeiro módulo funcional de tipos de domínio.
- [x] Mover as interfaces públicas de FAQ sem alterar sua forma.
- [x] Migrar a apresentação e a home do FAQ.
- [x] Confirmar redução de consumidores de 20 para 17.
- [x] Validar build da primeira família funcional.
- [ ] Migrar `src/lib/faq.ts`.
- [ ] Migrar os oito consumidores do painel administrativo de FAQ.
- [ ] Revisar `icon_key`, `category_key` e `category_label` antes de derivar aliases da baseline.
- [ ] Separar os demais grupos funcionais.
- [ ] Remover a frase “tipos gerados” dos módulos manuais.
- [ ] Adicionar comentários sobre a fonte de cada forma composta.

### Critério de saída do grupo FAQ

- nenhum arquivo funcional de FAQ importa `DbFaqCategory` ou `DbFaqItem` de `database.types.ts`;
- serviço público e operações administrativas compilam com `faq.types.ts`;
- home e painel administrativo passam nos testes aplicáveis;
- diferenças entre o domínio FAQ e o row gerado estão documentadas ou adaptadas explicitamente.

### Critério de saída da fase

O arquivo de compatibilidade deixa de ser ponto central para tipos de tela e conteúdo.

## Fase 3 — aliases para objetos idênticos

Para objetos cuja forma manual corresponde ao contrato bruto, usar aliases derivados:

```ts
export type DbPerson = Database["public"]["Tables"]["people"]["Row"];
export type PublicLocationRow = Database["public"]["Views"]["public_profile_locations"]["Row"];
```

- [ ] Começar por objetos simples e estáveis.
- [ ] Não criar alias quando a interface manual combina campos calculados.
- [ ] Manter nomes ergonômicos para reduzir mudanças nos consumidores.
- [ ] Confirmar nullability e defaults antes de cada substituição.

### Ordem sugerida

1. `people`;
2. `profiles`;
3. `admin_users`;
4. tabelas de FAQ;
5. fotos e interações;
6. enquetes;
7. views públicas;
8. objetos comerciais somente depois dos adaptadores.

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
- divergências removidas do relatório;
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
