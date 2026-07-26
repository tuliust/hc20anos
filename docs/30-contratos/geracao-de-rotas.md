---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 9c6eba3bd05a16511bd8160b3e0d621c34f9918e
source_files:
  - scripts/generate-routes-contract.mjs
  - src/app/App.tsx
  - src/main.tsx
  - build/buyerOrdersSharedRouteTransform.mjs
  - vite.config.ts
  - vercel.json
  - .github/workflows/static-contracts.yml
  - package.json
---

# Geração do contrato de rotas

## Objetivo

Produzir um inventário determinístico das rotas efetivas da aplicação, considerando não apenas o código-fonte original de `App.tsx`, mas também a rota de pedidos injetada durante o build e os mounts independentes definidos em `src/main.tsx`.

## Comandos

Gerar ou atualizar:

```bash
npm run docs:generate-routes
```

Verificar divergência:

```bash
npm run docs:check-routes
```

Saída:

```text
docs/30-contratos/rotas.generated.md
```

## Por que a geração não usa apenas busca textual

O projeto não possui um manifesto único de React Router. O runtime combina:

- estado interno do tipo `Page`;
- `PAGE_PATHS`;
- `pageFromPathname`;
- History API;
- grupos protegidos;
- transform de build;
- mounts condicionais em `main.tsx`;
- redirects executados antes do shell principal;
- rewrite da Vercel.

Uma busca simples por strings poderia omitir rotas introduzidas pelo transform ou interpretar como rota um caminho usado apenas em teste, estilo ou conteúdo.

## Transform aplicado

Antes de analisar `App.tsx`, o gerador importa e executa `buyerOrdersSharedRouteTransform.mjs` sobre o código-fonte.

Isso adiciona ao contrato:

- página interna `buyer-orders`;
- caminho `/meus-pedidos`;
- proteção autenticada;
- alias `/meus-ingressos`;
- renderização de `BuyerOrdersPage` no shell compartilhado.

Se o transform deixar de encontrar os trechos obrigatórios, a geração falha. Isso evita produzir um contrato silenciosamente incompleto.

## Informações extraídas

### `App.tsx` transformado

- mapa `PAGE_PATHS`;
- ordem das páginas para resolução de caminhos duplicados;
- grupos `PROTECTED_ALUMNI` e `PROTECTED_ADMIN`;
- aliases de `legacyRoutes`;
- fallback de `/admin/*`;
- fallback de rota desconhecida para `home`;
- parâmetros de retorno do checkout.

### `main.tsx`

- rotas standalone de operações;
- componentes montados fora do shell compartilhado;
- redirects de fluxos legados;
- destino dos redirects.

### `vercel.json`

- rewrites usados para servir a SPA em acessos diretos.

## Classificação de acesso

Cada rota canônica recebe uma classificação:

- `público`: não consta dos grupos protegidos do frontend;
- `autenticado`: consta de `PROTECTED_ALUMNI`;
- `administrativo`: consta de `PROTECTED_ADMIN`;
- `administrativo/operacional`: mount standalone de operações.

Essa classificação descreve o comportamento do frontend. Ela não substitui RLS, grants, RPCs ou verificações server-side.

## Caminhos duplicados

Quando mais de uma página interna aponta para o mesmo caminho, a ordem de `PAGE_PATHS` define qual página é resolvida por acesso direto.

O contrato registra:

- caminho compartilhado;
- todos os IDs internos associados;
- página que prevalece na entrada por URL.

No estado atual, `curiosities` e `polls` compartilham `/curiosidades`, com resolução direta para `curiosities`.

## Rotas standalone

`/admin/operacao` e `/admin/checkin` são identificadas em `src/main.tsx` antes da montagem de `App.tsx`.

Esses caminhos prevalecem sobre a regra genérica que mapeia `/admin/*` para a página administrativa do shell principal.

## Redirects

O gerador extrai conjuntos de caminhos legados e o destino passado a `window.location.replace`.

No estado atual:

- `/convidado` redireciona para `/ingressos`;
- `/aprovacoes-convidados` redireciona para `/ingressos`.

Aliases interpretados por `pageFromPathname`, como `/fotos` e `/meus-ingressos`, são documentados separadamente porque preservam a URL acessada em vez de executar substituição de localização.

## Retorno do checkout

O contrato registra a detecção dos parâmetros:

- `checkout=<status>`;
- `token=<public_token>`;
- parâmetro legado `order=<token>`.

Quando a combinação é válida, o frontend força a página interna `checkout`. Isso não comprova pagamento e não substitui a consulta ao estado financeiro server-side.

## Determinismo

A saída registra:

- `status: generated`;
- data do último commit que alterou as fontes;
- SHA desse commit;
- comando de geração;
- lista de arquivos-fonte.

O commit do bot que publica a saída não altera os metadados, pois arquivos gerados não fazem parte das fontes do contrato.

## CI

O workflow `.github/workflows/static-contracts.yml`:

1. gera os contratos estáticos;
2. gera o contrato de rotas;
3. executa `npm run audit:docs`;
4. falha em pull requests quando houver drift;
5. publica as saídas em pushes para `main`;
6. envia os arquivos como artefato.

O conjunto de arquivos é explícito, evitando que o workflow estático capture contratos do banco por engano.

## Critérios de interrupção

A geração deve falhar quando:

- `PAGE_PATHS` não puder ser extraído;
- os grupos protegidos não existirem;
- o transform de pedidos não puder ser aplicado;
- os conjuntos de rotas standalone ou redirects desaparecerem sem atualização do gerador;
- o destino dos redirects não puder ser identificado;
- `vercel.json` não for JSON válido;
- a auditoria documental detectar metadados ou referências inválidas.

## Limitações

- tabs administrativas não são rotas independentes;
- modais e estados internos não entram no contrato;
- parâmetros dinâmicos de conteúdo não são tratados como segmentos de rota;
- novos transforms que alterem roteamento precisam ser integrados explicitamente;
- o contrato não executa testes de autorização server-side;
- a geração representa a composição declarativa do runtime, não uma navegação E2E de cada caminho.

## Referência vigente

A saída canônica gerada está em [`rotas.generated.md`](./rotas.generated.md). O inventário manual anterior em [`rotas.md`](./rotas.md) permanece apenas como redirect documental depreciado.
