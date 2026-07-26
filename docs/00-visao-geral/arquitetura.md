---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - src/main.tsx
  - src/app/App.tsx
  - vite.config.ts
  - api/checkout-create.ts
  - api/generate-profile-bio.ts
  - src/lib/checkout.ts
  - src/lib/services.ts
  - supabase/functions
  - supabase/migrations
---

# Arquitetura

## Visão geral

O HC 20 Anos é uma aplicação web React/Vite integrada ao Supabase e publicada na Vercel.

A solução possui quatro camadas principais:

```text
Navegador
  ├─ React/Vite
  ├─ Supabase JS com chave anon
  └─ chamadas para /api/*
          │
          ▼
Vercel Functions
  ├─ proxy seguro para Edge Functions
  └─ integração de IA
          │
          ▼
Supabase
  ├─ Auth
  ├─ Postgres + RLS
  ├─ Storage
  ├─ RPCs
  └─ Edge Functions
          │
          ▼
Serviços externos
  ├─ Mercado Pago
  ├─ OpenAI ou Vercel AI Gateway
  └─ provedores opcionais de e-mail e WhatsApp
```

## Frontend

### Entrada

`src/main.tsx` é o ponto de composição da aplicação.

Ele:

- renderiza o `App` principal;
- trata rotas operacionais independentes;
- monta painéis complementares;
- instala enhancements de runtime;
- instala guards de CMS;
- importa os arquivos CSS globais e de refinamento.

### Aplicação principal

`src/app/App.tsx` concentra:

- definição de páginas;
- mapa de caminhos;
- autenticação e hidratação de roles;
- navegação via History API;
- páginas públicas;
- área autenticada;
- administração;
- moderação;
- retorno de checkout.

O roteamento não depende de um router declarativo externo. O caminho é convertido em um tipo interno `Page`, e a página é renderizada condicionalmente.

### Enhancements de runtime

Arquivos `*Enhancement.ts`, `*Enhancements.ts` e módulos `install*` alteram ou complementam comportamento depois que o bundle é carregado.

Eles devem ser considerados parte da arquitetura vigente enquanto forem importados e instalados em `src/main.tsx`.

### Transforms de build

O `vite.config.ts` registra transforms que modificam fontes antes da compilação.

Exemplos atuais:

- normalização de finais de linha;
- inserção da rota compartilhada de pedidos;
- alterações no fluxo de reivindicação de perfil;
- integração da geração de perfil por IA;
- ajustes do upload de fotos.

Esses transforms usam substituições textuais exatas. Se o trecho esperado mudar, o build deve falhar para evitar aplicação parcial silenciosa.

#### Consequência documental

A arquitetura efetiva deve ser inspecionada em três níveis:

1. fonte original;
2. transforms aplicados;
3. bundle e comportamento testado.

## Backend na Vercel

O diretório `api/` contém funções server-side publicadas junto ao frontend.

### Checkout proxy

`api/checkout-create.ts`:

- recebe a requisição autenticada do frontend;
- preserva o token do usuário e a chave anon;
- encaminha o corpo para a Edge Function `checkout-create`;
- normaliza diferentes formatos de resposta;
- nunca recebe a service role no navegador.

### Geração de perfil por IA

`api/generate-profile-bio.ts`:

- valida e sanitiza os dados recebidos;
- limita requisições por IP em memória;
- exige mesma origem quando aplicável;
- usa OpenAI diretamente ou Vercel AI Gateway;
- solicita resposta estruturada;
- evita incluir contato, data de nascimento e dados sensíveis no texto gerado.

## Supabase

### Auth

O Supabase Auth fornece sessão e identidade.

O frontend usa apenas:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_ANON_KEY`.

A sessão é persistida e renovada automaticamente pelo cliente Supabase.

### Postgres

O banco contém os domínios de:

- evento e CMS;
- pessoas e perfis;
- reivindicação e disputas;
- fotos, tags, comentários e memórias;
- enquetes;
- lotes, produtos e preços;
- pedidos, participantes e ingressos;
- eventos de pagamento;
- preferências de checkout;
- reembolsos e transferências;
- notificações;
- auditoria e relatórios.

O estado vigente é o resultado do replay integral de `supabase/migrations/**`.

### RLS e operações críticas

RLS protege leituras e escritas sensíveis.

Operações financeiras críticas são realizadas por RPCs ou processos server-side, incluindo:

- criação e precificação do pedido;
- reserva de participantes;
- emissão de ingressos;
- processamento de webhooks;
- reembolsos;
- transferências;
- notificações.

Ocultar um botão no frontend não é controle de autorização.

### Edge Functions

As Edge Functions vigentes incluem, entre outras:

- `checkout-create`;
- `payment-webhook`;
- `notification-worker`;
- `refund-processor`.

Elas utilizam variáveis seguras do ambiente Supabase e podem operar com service role quando necessário.

## Fluxo de checkout

```text
1. Usuário autenticado seleciona produto do catálogo vigente.
2. Frontend prepara participantes e chama createSecureCheckout().
3. POST /api/checkout-create recebe a sessão.
4. Proxy Vercel encaminha para /functions/v1/checkout-create.
5. Edge Function valida autenticação, payload e ambiente.
6. RPC create_checkout_order valida elegibilidade, composição, lote e preço.
7. Pedido e participantes são persistidos de forma transacional.
8. Edge Function cria preferência no Mercado Pago.
9. URL de checkout é devolvida ao navegador.
10. Mercado Pago notifica payment-webhook.
11. Webhook consulta o pagamento no provedor e aplica a transição no banco.
12. Em pagamento aprovado, ingressos são emitidos e notificações são enfileiradas.
13. O retorno do navegador consulta o status persistido por token público.
```

A query string de retorno não é prova de pagamento.

## CMS e conteúdo público

A Home e a página do evento dependem de registros no Supabase.

Defaults neutros removem conteúdo demonstrativo do bundle e guards impedem que áreas públicas críticas aparentem estar configuradas quando não há dados válidos.

O CMS é a fonte editorial; o bundle não deve ser usado como repositório de textos oficiais.

## Operação do evento

Rotas operacionais são tratadas separadamente do shell público.

A interface de operação consulta RPCs para:

- dashboard de check-in;
- registro e reversão de entrada;
- controle de fichas ou itens físicos quando presentes;
- listagem e revisão de reembolsos.

A interface atualiza dados periodicamente, mas o banco permanece como autoridade.

## Deploy

### Vercel

- frontend Vite;
- funções `api/*`;
- rewrite global para suportar rotas SPA.

### Supabase

- migrations;
- Edge Functions;
- secrets;
- jobs e integrações de banco.

Frontend e backend podem ser publicados separadamente. Mudanças que alterem contratos entre eles precisam de estratégia de compatibilidade.

## Dívida arquitetural reconhecida

1. `App.tsx` monolítico.
2. Roteamento distribuído entre fonte e transforms.
3. Enhancements de runtime acoplados ao DOM e ao shell principal.
4. Tipos do banco mantidos manualmente.
5. Evento principal referenciado por UUID fixo em vários módulos.
6. Documentos de fases anteriores ainda misturados com referências vigentes.

Esses pontos não invalidam o sistema atual, mas precisam estar visíveis para orientar manutenção e refatoração.