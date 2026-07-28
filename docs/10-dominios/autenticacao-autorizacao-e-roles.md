---
status: canonical
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: fc81497f428bbd38cf0b62ba360e2906ee8193d9
source_files:
  - src/lib/supabase.ts
  - src/lib/database.generated.ts
  - src/lib/rpc.types.ts
  - src/lib/rpc.generated.ts
  - src/app/App.tsx
  - src/app/OperationsRouteGuard.tsx
  - src/app/OperationsPage.tsx
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/fixtures/local_test_context.sql
  - supabase/tests/phase1_environment_security.sql
  - docs/30-contratos/RLS.generated.md
  - docs/30-contratos/RPCs.generated.md
  - docs/30-contratos/RPCs-consumidas.generated.md
  - docs/30-contratos/permissoes.md
  - docs/30-contratos/fase-1-ambiente-e-seguranca.generated.md
---

# Autenticação, autorização e roles

## Objetivo

Documentar como sessões, propriedade, roles administrativas, RLS, RPCs e Functions protegem o HC 20 Anos.

## Autenticação

O frontend usa Supabase Auth por meio do cliente tipado em `src/lib/supabase.ts`.

A sessão:

- é persistida no navegador;
- pode ser renovada automaticamente;
- fornece access token para chamadas autenticadas;
- identifica o usuário por `auth.uid()` no banco;
- não concede, por si só, privilégio administrativo.

## Autorização em camadas

Uma operação protegida pode exigir, de forma cumulativa:

1. sessão válida;
2. propriedade ou vínculo com o recurso;
3. role em `admin_users`;
4. policy de RLS;
5. validação dentro de uma RPC;
6. validação adicional em Vercel ou Edge Function;
7. uso de service role somente depois que o chamador ou evento foi autenticado.

Ocultar um botão ou bloquear uma rota melhora a experiência, mas não substitui essas verificações.

## Roles administrativas vigentes

O enum `admin_role` contém:

- `superadmin`;
- `moderator`;
- `checkin_staff`;
- `admin`;
- `viewer`.

### `superadmin`

Administração máxima. Pode gerenciar roles e consultar auditoria sensível. Deve ser excepcional e auditada.

### `admin`

Administração geral, conteúdo, pedidos, operação e funções financeiras autorizadas. Não pode alterar roles.

### `moderator`

Moderação de fotos, comentários, memórias, tags e solicitações relacionadas. Não recebe acesso financeiro.

### `checkin_staff`

Operação de entrada, check-in, desfazer check-in e entrega de vouchers. Não recebe relatórios financeiros ou reembolsos.

### `viewer`

A role existe e pode ler a própria linha em `admin_users`, mas o helper vigente `is_admin_panel_user()` reconhece somente `admin` e `superadmin`. Assim, `viewer` não possui atualmente uma superfície administrativa geral comprovada. Uma ampliação futura deve usar policies de leitura específicas, sem relaxar policies de escrita.

A matriz completa e efetiva está em [`../30-contratos/permissoes.md`](../30-contratos/permissoes.md).

## `admin_users`

A tabela associa `auth.users` a uma role administrativa.

Regras comprovadas:

- usuário comum não lista roles administrativas;
- `viewer` lê somente a própria linha;
- `viewer` não promove a própria conta;
- `admin` lê as linhas necessárias ao painel, mas não altera roles;
- somente `superadmin` altera roles;
- contas temporárias devem ser revogadas depois do uso;
- homologação e produção devem ter listas separadas.

## RLS e grants

RLS é o controle primário para acesso direto pelo cliente Supabase.

O contrato vigente está em [`../30-contratos/RLS.generated.md`](../30-contratos/RLS.generated.md) e registra:

- tabelas com RLS habilitada ou forçada;
- policies por comando e role;
- expressões `USING` e `WITH CHECK`;
- grants de tabelas e rotinas;
- estado final resultante de revokes e grants.

A Fase 1 valida automaticamente que as tabelas sensíveis possuem RLS e que RPCs operacionais não podem ser executadas por `anon`.

## RPCs

RPCs encapsulam transações e operações que exigem autorização, como:

- checkout e pagamento;
- perfis e identidade;
- moderação;
- check-in;
- notificações;
- relatórios;
- transferências e reembolsos.

O contrato completo está em [`../30-contratos/RPCs.generated.md`](../30-contratos/RPCs.generated.md).

O inventário do runtime está em [`../30-contratos/RPCs-consumidas.generated.md`](../30-contratos/RPCs-consumidas.generated.md). Ele registra 50 RPCs distintas, 61 ocorrências literais e zero chamadas dinâmicas.

Os aliases de `Args`, `Returns` e `Row` são gerados em `src/lib/rpc.generated.ts` a partir de `Database["public"]["Functions"]`. O build reprova nomes ausentes da baseline.

RPCs `security definer` críticas devem:

- definir `search_path` explícito;
- validar `auth.uid()`, role, propriedade ou contexto interno;
- limitar os dados retornados;
- não confiar em IDs arbitrários;
- preservar idempotência e auditoria.

## Service role

`SUPABASE_SERVICE_ROLE_KEY` ignora RLS e só pode existir em ambiente server-side.

É usada por Functions para:

- criar pedidos depois da autenticação;
- processar webhook validado;
- executar notificações;
- processar reembolsos autorizados.

Ela nunca pode ser incluída no bundle do navegador.

## Vercel Functions

### `/api/checkout-create`

Exige bearer token e encaminha a sessão à Edge Function. Não mantém service role no frontend.

### `/api/generate-profile-bio`

Aplica controles de origem, rate limiting e contrato de entrada antes de acessar o provedor de IA.

## Edge Functions

### `checkout-create`

Valida sessão e payload antes de usar service role.

### `payment-webhook`

Valida assinatura do Mercado Pago, consulta o pagamento no provedor e aplica a transação no banco.

### `notification-worker`

Valida chave própria antes de assumir e concluir jobs.

### `refund-processor`

Valida sessão e exige `admin` ou `superadmin` antes do processamento.

## Rotas protegidas

Rotas autenticadas e administrativas são verificadas no frontend, mas o acesso aos dados depende do backend.

As rotas standalone `/admin/operacao` e `/admin/checkin` usam guard específico e permitem somente:

- `checkin_staff`;
- `admin`;
- `superadmin`.

`checkin_staff` não monta painéis financeiros.

## Evidência integrada da Fase 1

O workflow `Phase 1 environment and security` executa:

1. geração dos contratos das RPCs consumidas;
2. build TypeScript e da aplicação;
3. inicialização do Supabase local;
4. replay integral de todas as migrations;
5. criação de usuários sintéticos por role;
6. todos os testes SQL;
7. regeneração dos contratos do banco;
8. auditoria documental.

A execução aprovada está em [`../30-contratos/fase-1-ambiente-e-seguranca.generated.md`](../30-contratos/fase-1-ambiente-e-seguranca.generated.md).

Foram comprovados:

- isolamento de usuário comum;
- impossibilidade de autopromoção;
- segregação de `viewer`, `moderator` e `checkin_staff`;
- acesso financeiro de `admin`;
- gestão de roles por `superadmin`;
- RLS, grants, triggers, constraints e índices críticos;
- `search_path` em RPCs críticas;
- replay integral sem acesso a produção.

## Privacidade de logs

Não registrar:

- access ou refresh tokens;
- service role;
- senhas;
- chaves de provedores;
- QR token completo;
- respostas privadas de identidade;
- payload financeiro integral quando um identificador for suficiente.

## Gestão de acesso

1. confirmar identidade e função da pessoa;
2. conceder a menor role suficiente;
3. registrar responsável, data e justificativa;
4. testar a operação necessária;
5. revisar acessos antes do evento;
6. remover acessos temporários depois da operação;
7. revisar auditoria de ações sensíveis.

## Limites e pendências

A Fase 1 valida o banco local reproduzido. Ainda dependem de ensaio separado:

- projeto remoto de homologação, caso seja criado;
- secrets e configurações remotas;
- Mercado Pago e webhook integrados;
- Storage e upload real;
- carga, concorrência e abuso em ambiente conectado;
- dispositivos e operação presencial.
