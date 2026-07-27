---
status: generated
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 6c9411020486e0e348b0aae13fc9ea456c528e66
generation_command: npm run docs:generate-routes
source_files:
  - src/app/App.tsx
  - src/main.tsx
  - build/buyerOrdersSharedRouteTransform.mjs
  - vite.config.ts
  - vercel.json
  - scripts/generate-routes-contract.mjs
---

# Rotas efetivas

> Contrato gerado após aplicar o transform de pedidos ao App.tsx. Não editar manualmente.

## Arquitetura de roteamento

A aplicação usa estado interno de página, `window.location`, History API e mounts condicionais em `src/main.tsx`. O contrato aplica `buyerOrdersSharedRouteTransform` antes da extração para representar `/meus-pedidos` e `/meus-ingressos` como existem no runtime compilado.

## Rotas canônicas do shell compartilhado

| Caminho | Página resolvida na entrada | IDs internos associados | Acesso | Montagem |
|---|---|---|---|---|
| `/` | `home` | `home` | público | shell compartilhado de App.tsx |
| `/evento` | `event` | `event` | público | shell compartilhado de App.tsx |
| `/ingressos` | `tickets` | `tickets` | público | shell compartilhado de App.tsx |
| `/checkout` | `checkout` | `checkout` | autenticado | shell compartilhado de App.tsx |
| `/confirmacao` | `confirmation` | `confirmation` | público | shell compartilhado de App.tsx |
| `/quem-vai` | `who-going` | `who-going` | público | shell compartilhado de App.tsx |
| `/turma` | `the-class` | `the-class` | público | shell compartilhado de App.tsx |
| `/ex-alunos` | `ex-alumni` | `ex-alumni` | público | shell compartilhado de App.tsx |
| `/reivindicar-perfil` | `claim-profile` | `claim-profile` | público | shell compartilhado de App.tsx |
| `/nossa-historia` | `photo-wall` | `photo-wall` | público | shell compartilhado de App.tsx |
| `/foto` | `photo-detail` | `photo-detail` | público | shell compartilhado de App.tsx |
| `/nossa-historia/memorias` | `memories` | `memories` | público | shell compartilhado de App.tsx |
| `/curiosidades` | `curiosities` | `curiosities`, `polls` | público | shell compartilhado de App.tsx |
| `/mapa` | `where-now` | `where-now` | público | shell compartilhado de App.tsx |
| `/convite` | `share-invite` | `share-invite` | público | shell compartilhado de App.tsx |
| `/meu-ingresso` | `my-ticket` | `my-ticket` | autenticado | shell compartilhado de App.tsx |
| `/meus-pedidos` | `buyer-orders` | `buyer-orders` | autenticado | shell compartilhado de App.tsx |
| `/pos-festa` | `archive` | `archive` | público | shell compartilhado de App.tsx |
| `/minha-area` | `alumni-area` | `alumni-area` | autenticado | shell compartilhado de App.tsx |
| `/editar-perfil` | `edit-profile` | `edit-profile` | autenticado | shell compartilhado de App.tsx |
| `/admin` | `admin` | `admin` | administrativo | shell compartilhado de App.tsx |
| `/checkin` | `checkin` | `checkin` | administrativo | shell compartilhado de App.tsx |
| `/login` | `login` | `login` | público | shell compartilhado de App.tsx |
| `/termos` | `terms` | `terms` | público | shell compartilhado de App.tsx |
| `/privacidade` | `privacy` | `privacy` | público | shell compartilhado de App.tsx |

## Aliases legados interpretados pelo App

| Alias | Destino canônico | Página interna | Acesso |
|---|---|---|---|
| `/fotos` | `/nossa-historia` | `photo-wall` | público |
| `/memorias` | `/nossa-historia/memorias` | `memories` | público |
| `/acervo` | `/pos-festa` | `archive` | público |
| `/enquetes` | `/curiosidades` | `curiosities` | público |
| `/meus-ingressos` | `/meus-pedidos` | `buyer-orders` | autenticado |

## Rotas standalone

| Caminho | Componentes | Acesso | Montagem |
|---|---|---|---|
| `/admin/operacao` | OperationsPage + OperationsReportingPanel | administrativo/operacional | mount standalone em src/main.tsx |
| `/admin/checkin` | OperationsPage + OperationsReportingPanel | administrativo/operacional | mount standalone em src/main.tsx |

As rotas standalone são interceptadas antes de `App.tsx` e, portanto, prevalecem sobre o fallback genérico `/admin/*`.

## Redirecionamentos legados

| Origem | Destino | Mecanismo |
|---|---|---|
| `/convidado` | `/ingressos` | window.location.replace |
| `/aprovacoes-convidados` | `/ingressos` | window.location.replace |

## Regras de resolução

- Prefixo administrativo genérico: qualquer `/admin/*` não standalone resolve para a página `admin`.
- Rota desconhecida: resolve para `home` e caminho `/`.
- Retorno do checkout por query string: `checkout=<status>` com `token=<public_token>` ou parâmetro legado `order=<token>` força a página interna `checkout`.
- Proteção frontend redireciona páginas autenticadas ou administrativas para `/login`, mas não substitui RLS e autorização server-side.

## Caminhos compartilhados por mais de uma página interna

| Caminho | Páginas internas | Página resolvida por acesso direto |
|---|---|---|
| `/curiosidades` | `curiosities`, `polls` | `curiosities` |

## Rewrite da hospedagem

| Origem | Destino |
|---|---|
| `/(.*)` | `/` |

O rewrite da Vercel entrega a SPA para acessos diretos. A resolução funcional continua sendo responsabilidade do frontend.

## Limitações

- o contrato cobre rotas declaradas em `PAGE_PATHS`, aliases, transform de pedidos, mounts standalone e redirects de `main.tsx`;
- parâmetros internos de componentes, estados de modal e tabs administrativas não são tratados como rotas independentes;
- regras condicionais introduzidas por novos transforms devem ser adicionadas ao gerador;
- a existência de uma rota não comprova autorização server-side;
- links externos e âncoras não entram neste inventário.

