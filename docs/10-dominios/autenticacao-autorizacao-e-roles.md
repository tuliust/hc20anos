---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/lib/supabase.ts
  - src/app/App.tsx
  - src/app/OperationsPage.tsx
  - src/lib/database.types.ts
  - supabase/functions/
  - supabase/migrations/
---

# Autenticação, autorização e roles

## Objetivo

Documentar como sessões, identidade, roles administrativas, RLS e operações server-side se combinam para proteger o HC 20 Anos.

## Autenticação

O frontend usa Supabase Auth por meio do cliente configurado em `src/lib/supabase.ts`.

A sessão:

- é persistida no navegador;
- pode ser atualizada automaticamente;
- é detectada em retornos de autenticação por URL;
- fornece access token para chamadas autenticadas;
- não concede, por si só, privilégio administrativo.

A aplicação deve reagir a mudanças de sessão e revalidar dados protegidos.

## Autorização em camadas

Uma operação protegida pode exigir várias verificações:

1. sessão válida;
2. `auth.uid()` associado ao recurso;
3. role em `admin_users`;
4. policy de RLS;
5. validação em RPC;
6. validação adicional em Vercel ou Edge Function;
7. service role somente depois que a Function autorizou a solicitação.

Nenhuma camada visual substitui essas verificações.

## Roles administrativas

O modelo atual reconhece roles como:

- `superadmin`;
- `admin`;
- `moderator`;
- `checkin_staff`;
- `viewer`.

### `superadmin`

Acesso administrativo máximo, incluindo decisões e configurações de maior risco. Não deve ser usado como role padrão.

### `admin`

Administração geral do evento, pedidos, conteúdo e operações financeiras autorizadas.

### `moderator`

Moderação de fotos, comentários, memórias, marcações e solicitações relacionadas, sem acesso financeiro irrestrito.

### `checkin_staff`

Operação de entrada, validação de ingressos e tarefas presenciais permitidas.

### `viewer`

Leitura administrativa e relatórios sem mutações sensíveis.

A matriz final depende das policies, grants e verificações de cada RPC. O nome da role não deve ser interpretado fora do contrato efetivo.

## `admin_users`

A tabela associa `auth.users` a uma role administrativa. Inserir uma linha nessa tabela é uma operação privilegiada.

Regras:

- o próprio usuário não pode promover a própria conta;
- mudanças de role devem ser auditadas;
- contas inativas devem ser revogadas;
- privilégios devem seguir o menor acesso necessário;
- ambientes de teste e produção devem manter listas separadas.

## RLS

Row Level Security é o controle primário de acesso direto ao Postgres via cliente Supabase.

Princípios:

- habilitar RLS em tabelas expostas;
- permitir leitura pública somente de registros publicados e autorizados;
- limitar recursos pessoais a `auth.uid()`;
- reservar escrita financeira e filas para backend;
- restringir moderação e operação por role;
- revogar privilégios genéricos quando a operação deve ocorrer por RPC.

O contrato final será gerado em `docs/30-contratos/RLS.generated.md` após replay do banco.

## RPCs

RPCs encapsulam operações que precisam de validação ou transação, como:

- criação de pedido;
- aplicação de pagamento;
- reivindicação de perfil;
- moderação;
- check-in;
- claim e conclusão de jobs;
- relatórios;
- reembolso e restauração de inventário.

Cada função precisa definir explicitamente:

- quem pode executá-la;
- se usa `security definer`;
- `search_path` seguro;
- validação de `auth.uid()`;
- roles permitidas;
- dados retornados;
- efeitos e idempotência.

## Service role

`SUPABASE_SERVICE_ROLE_KEY` ignora RLS e só pode existir em ambientes server-side controlados.

É usada por Edge Functions para operações como:

- criar pedidos após autenticação;
- aplicar webhooks;
- processar fila de notificações;
- executar reembolsos.

A presença de service role não elimina a necessidade de validar usuário, assinatura, worker key ou role antes da operação.

## Vercel Functions

### `/api/checkout-create`

Exige bearer token e repassa a sessão à Edge Function. Não mantém service role no navegador.

### `/api/generate-profile-bio`

Aplica controles de origem, rate limit e contrato de entrada antes de chamar o provedor de IA. Não deve expor chave do provedor ao frontend.

## Edge Functions

### `checkout-create`

Valida sessão Supabase e payload antes de usar service role.

### `payment-webhook`

Não usa sessão de usuário. Valida assinatura do Mercado Pago, consulta o pagamento no provedor e aplica a transação no banco.

### `notification-worker`

Valida `x-worker-key` e usa service role para assumir e concluir jobs.

### `refund-processor`

Valida sessão e exige role `admin` ou `superadmin` antes de processar reembolso.

## Rotas protegidas

O roteamento do frontend marca páginas de área de ex-aluno e administração como protegidas. Isso melhora a experiência, mas a segurança real permanece nos dados e endpoints.

Rotas administrativas e standalone, como `/admin`, `/checkin`, `/admin/operacao` e `/admin/checkin`, devem carregar somente depois da verificação apropriada.

## Privacidade de logs

Não registrar:

- access tokens;
- refresh tokens;
- service role;
- senhas;
- chaves do Mercado Pago, OpenAI, Resend ou WhatsApp;
- QR token completo;
- respostas privadas de reivindicação;
- payload financeiro integral quando um identificador for suficiente.

## Gestão de acesso

Procedimento recomendado:

1. confirmar identidade e função da pessoa;
2. conceder menor role suficiente;
3. registrar responsável, data e justificativa;
4. testar a operação necessária;
5. revisar acessos antes do evento;
6. remover acessos temporários depois da operação;
7. revisar logs de ações sensíveis.

## Testes mínimos

- visitante não acessa recurso autenticado;
- usuário autenticado não acessa dados de outro usuário;
- `viewer` não executa mutação;
- `moderator` não processa reembolso;
- `checkin_staff` executa somente operações de entrada permitidas;
- `admin` processa operação autorizada;
- chamada direta do cliente não contorna RPC;
- Function rejeita token ausente ou inválido;
- webhook rejeita assinatura inválida;
- worker rejeita chave inválida;
- service role não aparece no bundle.

## Dívidas conhecidas

- `database.types.ts` pode não refletir todas as roles, tabelas e campos atuais.
- A matriz completa de policies, grants e RPCs ainda precisa ser gerada automaticamente.
- O roteamento protegido é customizado e parte dele é injetada por transforms de build.
