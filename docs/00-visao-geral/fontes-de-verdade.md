---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - src/main.tsx
  - vite.config.ts
  - build
  - src/app/App.tsx
  - api
  - supabase/functions
  - supabase/migrations
  - supabase/tests
  - .github/workflows/database-migrations.yml
---

# Fontes de verdade

Este documento define qual artefato prevalece quando código, banco, documentação e comportamento aparente entrarem em conflito.

## Regra geral

A fonte de verdade deve ser o artefato mais próximo do comportamento validado em produção ou reproduzível em ambiente controlado.

Documentação humana explica o sistema, mas não substitui contratos executáveis.

## Matriz de autoridade

| Tema | Fonte primária | Fontes auxiliares | Não canônico |
|---|---|---|---|
| Estado do banco | Replay integral de `supabase/migrations/**` | Testes SQL e introspecção do banco local | `schema.sql` inicial isolado |
| Regras transacionais | RPCs, constraints, triggers e Edge Functions | Testes SQL/E2E | Regras duplicadas somente no frontend |
| Catálogo e preços | RPC de catálogo e lote vigente | `src/lib/publicTicketCatalog.ts` | Valores hardcoded, fixtures e mocks |
| Rotas públicas | Código efetivo após transforms de build | `PAGE_PATHS`, redirects e testes E2E | Leitura isolada do `App.tsx` antes do build |
| Autenticação | Supabase Auth e hidratação de sessão no frontend | Testes de rotas protegidas | Estado visual sem sessão válida |
| Autorização | RLS, grants, funções SQL e `admin_users` | Guards do frontend | Ocultação visual isolada |
| Checkout | Edge Function, RPC `create_checkout_order` e proxy Vercel | Cliente `src/lib/checkout.ts` | Cálculo de preço no navegador |
| Pagamento | Webhook, consulta ao provedor e eventos persistidos | Página de retorno | Query string do navegador isolada |
| Ingressos | Registros emitidos após confirmação transacional | Área do comprador e check-in | Reserva pendente sem emissão |
| Conteúdo editorial | Registros do CMS no Supabase | Defaults neutros e guards | Textos antigos no bundle |
| Privacidade | Policies, funções de exposição e flags `show_*` | Regras de apresentação | Campo existir no banco não implica exposição pública |
| Operação | RPCs operacionais, Edge Functions e runbooks vigentes | Interface administrativa | Procedimentos informais não versionados |
| Decisões arquiteturais | ADR aprovado | Documentação de arquitetura | Comentários temporários ou planos abandonados |

## Banco de dados

### Estado final

O modelo vigente é o resultado da aplicação ordenada de todas as migrations sobre um banco vazio.

Consequências:

- `supabase/migrations/20260705000000_schema.sql` é apenas a base histórica inicial;
- migrations posteriores podem adicionar, substituir ou desativar estruturas;
- uma função criada em migration antiga pode deixar de ser vigente após `create or replace function` posterior;
- tabelas e produtos históricos podem continuar existindo sem fazer parte da experiência atual.

### Tipos TypeScript

`src/lib/database.types.ts` deve ser tratado como contrato auxiliar enquanto não for gerado automaticamente do estado final do Supabase.

Quando houver divergência entre tipos manuais e banco reproduzido, o banco prevalece e os tipos devem ser corrigidos.

## Frontend e build

O comportamento final do frontend é composto por:

1. `src/app/App.tsx`;
2. componentes montados em `src/main.tsx`;
3. funções `install*` executadas no runtime;
4. transforms registrados no `vite.config.ts`;
5. CSS base e arquivos de refinamento carregados por `src/main.tsx`.

Portanto, uma rota, regra ou componente pode existir no bundle final mesmo sem aparecer diretamente na versão original do `App.tsx`.

Transforms baseados em substituição textual são considerados mecanismos de compatibilidade e devem ser documentados até serem removidos.

## Pagamentos

O navegador nunca é autoridade sobre:

- preço final;
- elegibilidade;
- composição de participantes;
- criação do pedido;
- aprovação do pagamento;
- emissão do ingresso;
- reembolso.

A URL de retorno do Mercado Pago serve para navegação e experiência do usuário. O status confiável deve vir do banco após processamento server-side.

## CMS e defaults

Defaults neutros existem para evitar conteúdo fictício ou editorial hardcoded quando o CMS ainda não está configurado.

A presença de um texto em mock, seed ou fallback não o torna conteúdo oficial.

## Testes

Testes são evidência de contrato, mas não substituem a implementação.

Quando um teste contradizer o comportamento efetivo:

1. confirmar qual comportamento é desejado;
2. corrigir implementação ou teste;
3. registrar ADR se houver mudança de regra relevante;
4. atualizar a documentação no mesmo PR.

## Resolução de divergências

Ao encontrar duas versões conflitantes:

1. identificar o domínio afetado;
2. localizar a fonte primária nesta matriz;
3. reproduzir o comportamento, quando possível;
4. marcar documentos antigos como `historical` ou `deprecated`;
5. atualizar a referência canônica;
6. adicionar teste ou validação para impedir regressão documental.