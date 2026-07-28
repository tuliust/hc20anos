---
status: canonical
owner: tuliust
last_verified: 2026-07-28
source_files:
  - docs/30-contratos/RLS.generated.md
  - docs/30-contratos/RPCs.generated.md
  - docs/30-contratos/RPCs-consumidas.generated.md
  - docs/30-contratos/database.types.generated.ts
  - supabase/migrations/
  - supabase/tests/phase1_environment_security.sql
  - src/lib/rpc.types.ts
  - supabase/functions/
---

# Matriz efetiva de permissões

## Autoridade

Esta matriz resume o comportamento vigente do banco reproduzido, das RPCs e das Functions. Em caso de divergência, prevalecem:

1. migrations reaplicadas em banco vazio;
2. `RLS.generated.md`;
3. `RPCs.generated.md`;
4. verificações internas das RPCs e Functions;
5. testes SQL da Fase 1.

A interface pode esconder ou mostrar recursos por role, mas não é autoridade de segurança.

## Atores

| Ator | Identificação efetiva |
|---|---|
| público | sem sessão Supabase |
| autenticado | sessão válida, sem linha em `admin_users` |
| proprietário | `auth.uid()` vinculado ao recurso ou relação validada pela RPC |
| `viewer` | linha em `admin_users`; atualmente não integra `is_admin_panel_user()` |
| `checkin_staff` | role operacional aceita pelas RPCs de check-in |
| `moderator` | role aceita por policies de moderação de conteúdo |
| `admin` | administração geral, operação e finanças autorizadas |
| `superadmin` | administração máxima e gestão de roles |
| worker | chamada server-side validada por chave própria |
| webhook | chamada validada por assinatura e consulta ao provedor |
| service role | credencial server-side que ignora RLS; nunca pode chegar ao navegador |

## Legenda

- `L`: leitura;
- `E`: escrita ou execução;
- `C`: acesso condicionado à propriedade, estado ou validação interna;
- `—`: não autorizado pelo contrato vigente.

## Matriz funcional consolidada

| Recurso ou operação | Público | Autenticado/proprietário | viewer | checkin_staff | moderator | admin | superadmin | Interno |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| evento, CMS e FAQ publicados | L | L | L | L | L | L/E | L/E | E |
| catálogo público | L | L | L | L | L | L/E | L/E | E |
| perfil público autorizado | L | L | L | L | L | L/E | L/E | E |
| editar o próprio perfil | — | C | — | — | — | C | C | E |
| dados privados de outro usuário | — | — | — | — | C somente em fila autorizada | L/E | L/E | E |
| reivindicar perfil | — | C | — | — | — | C | C | E |
| decidir reivindicação ou disputa | — | — | — | — | C | E | E | E |
| conteúdo colaborativo aprovado | L | L | L | L | L | L/E | L/E | E |
| enviar foto, comentário, memória ou tag | — | C | — | — | — | C | C | E |
| moderar foto, comentário, memória ou tag | — | — | — | — | E | E | E | E |
| solicitar remoção | — | C | — | — | — | C | C | E |
| criar checkout | — | C | — | — | — | C | C | E |
| consultar o próprio pedido ou ingresso | — | C | — | — | — | C | C | E |
| consultar todos os pedidos | — | — | — | — | — | L/E | L/E | E |
| aplicar pagamento | — | — | — | — | — | — | — | webhook/service role |
| operar check-in e vouchers | — | — | — | E | — | E | E | E |
| ler indicadores operacionais | — | — | — | L | — | L | L | E |
| consultar ou decidir reembolso | — | C somente solicitação própria | — | — | — | L/E | L/E | E |
| relatório financeiro consolidado | — | — | — | — | — | L | L | E |
| processar fila de notificações | — | — | — | — | — | — | — | worker/service role |
| consultar auditoria sensível | — | — | — | — | — | — | L | E |
| alterar roles | — | — | — | — | — | — | E | E |

## Observações por role

### `viewer`

A role existe no enum e pode ler a própria linha em `admin_users`, mas o helper vigente `is_admin_panel_user()` reconhece somente `admin` e `superadmin`. Portanto, `viewer` não possui hoje uma superfície administrativa geral comprovada. Qualquer ampliação futura precisa de policies de leitura específicas; não deve ser feita tornando policies de escrita mais permissivas.

### `checkin_staff`

A role não recebe acesso financeiro. As RPCs operacionais verificam explicitamente `checkin_staff`, `admin` ou `superadmin`. A interface também não monta reembolsos ou indicadores financeiros reservados.

### `moderator`

A role é limitada às policies e filas de conteúdo que a incluem explicitamente. Não recebe relatórios financeiros, reembolsos ou gestão de roles.

### `admin`

Pode administrar conteúdo, operação, pedidos e reembolsos previstos. Não pode alterar roles em `admin_users`; essa escrita permanece exclusiva de `superadmin`.

### `superadmin`

Pode gerenciar roles e consultar auditoria sensível. O uso deve ser excepcional, auditado e revogado quando não for necessário.

## RPCs `security definer`

Cada RPC consumida deve:

- ter nome literal validado contra `Database["public"]["Functions"]`;
- definir `search_path` explícito;
- validar `auth.uid()`, role, propriedade ou segredo interno;
- retornar somente os dados necessários;
- não confiar em IDs arbitrários sem verificação;
- preservar idempotência e auditoria em operações sensíveis.

O inventário versionado está em `RPCs-consumidas.generated.md`. Chamadas dinâmicas fazem o check da Fase 1 falhar.

## Validação automatizada

O teste `supabase/tests/phase1_environment_security.sql` comprova, em Supabase local reconstruído:

- presença das cinco roles administrativas;
- usuários sintéticos separados por role;
- RLS habilitada nas tabelas sensíveis;
- constraints, índices e triggers críticos;
- `search_path` em RPCs críticas `security definer`;
- bloqueio de RPCs operacionais para `anon`;
- isolamento da tabela `admin_users`;
- impossibilidade de autopromoção de `viewer`;
- acesso operacional de `checkin_staff`;
- bloqueio financeiro de `checkin_staff` e `moderator`;
- relatório financeiro para `admin`;
- gestão de roles somente por `superadmin`.

## Limites

Esta matriz não substitui testes de homologação remota, secrets reais, Mercado Pago, Storage, câmera ou operação presencial. Ela comprova o contrato local reproduzido e deve ser regenerada ou revisada quando migrations, RPCs, Functions ou roles mudarem.
