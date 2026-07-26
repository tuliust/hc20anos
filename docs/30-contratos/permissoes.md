---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/app/App.tsx
  - src/app/OperationsPage.tsx
  - src/lib/database.types.ts
  - supabase/functions/
  - supabase/migrations/
---

# Matriz inicial de permissões

> Inventário humano. A versão definitiva deve ser gerada das policies de RLS, grants, RPCs e verificações das Functions após replay integral das migrations.

## Atores

| Ator | Descrição |
|---|---|
| público | visitante sem sessão |
| autenticado | usuário com sessão Supabase |
| proprietário | usuário autenticado relacionado ao recurso |
| `viewer` | leitura administrativa |
| `checkin_staff` | operação de entrada |
| `moderator` | moderação de conteúdo |
| `admin` | administração geral e financeira autorizada |
| `superadmin` | administração máxima |
| worker | chamada interna autenticada por chave própria |
| webhook | Mercado Pago autenticado por assinatura |
| service role | credencial server-side que ignora RLS |

## Regras gerais

- Público recebe somente dados publicados e autorizados.
- Autenticado não significa administrador.
- Propriedade é validada por `auth.uid()` ou relação equivalente.
- Roles são validadas em `admin_users`, RPC ou Function.
- Service role só é usada depois da validação do chamador ou evento.
- Segurança do frontend é complementar; o banco continua sendo a autoridade.

## Matriz funcional

Legenda: `L` leitura, `E` escrita/execução, `—` não permitido, `C` condicionado ao próprio recurso ou regra específica.

| Recurso/operação | Público | Autenticado | Proprietário | viewer | checkin_staff | moderator | admin | superadmin | interno |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| evento publicado | L | L | L | L | L | L | L/E | L/E | E |
| CMS publicado | L | L | L | L | L | L | L/E | L/E | E |
| CMS em draft | — | — | — | L | — | L | L/E | L/E | E |
| pessoa visível | L | L | L | L | L | L | L/E | L/E | E |
| perfil público autorizado | L | L | L | L | L | L | L/E | L/E | E |
| editar próprio perfil | — | — | E | — | — | — | C | C | E |
| dados privados de perfil | — | C | C | C | — | C | L/E | L/E | E |
| iniciar reivindicação | C | E | E | — | — | — | C | C | E |
| consultar própria reivindicação | — | C | C | — | — | — | C | C | E |
| decidir reivindicação/disputa | — | — | — | L | — | C | E | E | E |
| foto aprovada | L | L | L | L | L | L | L/E | L/E | E |
| enviar foto | C | E | E | — | — | — | C | C | E |
| moderar foto/comentário/memória | — | — | — | L | — | E | E | E | E |
| solicitar remoção | C | E | E | — | — | — | C | C | E |
| catálogo público | L | L | L | L | L | L | L/E | L/E | E |
| criar checkout | — | E | E | — | — | — | C | C | E |
| consultar próprio pedido | — | C | L | — | — | — | C | C | E |
| consultar todos os pedidos | — | — | — | L | — | — | L/E | L/E | E |
| aplicar pagamento | — | — | — | — | — | — | — | — | webhook/service role |
| consultar próprio ingresso | — | C | L | — | C | — | L | L | E |
| executar check-in | — | — | — | — | E | — | E | E | E |
| entregar voucher | — | — | — | — | E | — | E | E | E |
| consultar reembolsos | — | — | C | L | — | — | L/E | L/E | E |
| aprovar/processar reembolso | — | — | — | — | — | — | E | E | E |
| assumir notification jobs | — | — | — | — | — | — | — | — | worker/service role |
| alterar roles | — | — | — | — | — | — | C | E | E |
| consultar audit logs | — | — | — | C | — | C | L | L | E |

A tabela é conservadora. Uma célula `C` depende do contrato real da RPC ou policy.

## Acesso por superfície

### Público

Rotas públicas podem ler evento, CMS, catálogo, pessoas e conteúdo colaborativo aprovado. A leitura deve aplicar visibilidade e moderação no banco.

### Área do participante

Exige sessão. Recursos de perfil, pedidos e ingressos devem ser filtrados pelo usuário ou vínculo reconhecido.

### Administração

A UI pode mostrar ou ocultar painéis por role, mas cada query e mutação também precisa ser autorizada no backend.

### Operações

Check-in e vouchers exigem role operacional. Reembolsos continuam restritos a administradores mesmo quando aparecem na mesma página.

### Webhook

Não possui sessão. A autoridade é a assinatura válida, a consulta ao Mercado Pago e as validações da RPC financeira.

### Worker

Não possui sessão. A autoridade é `NOTIFICATION_WORKER_KEY` e a Function usa service role para processar jobs.

## `security definer`

RPCs `security definer` devem:

- definir `search_path` seguro;
- revogar execução pública desnecessária;
- validar `auth.uid()` ou contexto interno;
- validar roles explicitamente;
- retornar somente campos necessários;
- não aceitar IDs arbitrários sem checar propriedade;
- manter idempotência e auditoria.

## Grants

O estado final deve distinguir:

- `anon`;
- `authenticated`;
- `service_role`;
- execução de Functions/RPCs específicas.

Conceder `SELECT` amplo em tabela com dados privados não é compensado por filtragem no frontend.

## Casos de teste

- público não consulta registros pendentes;
- usuário A não lê ou altera recursos do usuário B;
- `viewer` não executa mutações;
- `moderator` modera conteúdo sem acesso financeiro;
- `checkin_staff` não processa reembolso;
- `admin` processa reembolso autorizado;
- `superadmin` altera roles com auditoria;
- webhook inválido não aplica pagamento;
- worker sem chave não assume jobs;
- chamada client-side não usa service role;
- RPC `security definer` não permite elevar privilégios por parâmetro.

## Geração futura

O gerador deve consultar o banco reproduzido e produzir:

- tabelas com RLS habilitada;
- policies por comando e role;
- grants de tabela, sequence e function;
- owner e `security definer` das RPCs;
- `search_path`;
- verificações de role encontradas no SQL;
- verificações adicionais das Edge Functions.

Divergência entre essa matriz e o contrato gerado deve bloquear promoção para `canonical`.
