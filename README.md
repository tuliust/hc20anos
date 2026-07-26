# HC 20 Anos

Plataforma digital do reencontro de 20 anos da Turma 2006 do Colégio Henrique Castriciano.

O sistema reúne experiência pública, perfis de ex-alunos, conteúdo colaborativo, ingressos, pagamentos, administração e operação do evento.

## Documentação

A referência principal está em [`docs/index.md`](./docs/index.md).

Leituras iniciais:

- [Produto](./docs/00-visao-geral/produto.md)
- [Arquitetura](./docs/00-visao-geral/arquitetura.md)
- [Mapa do repositório](./docs/00-visao-geral/mapa-do-repositorio.md)
- [Fontes de verdade](./docs/00-visao-geral/fontes-de-verdade.md)
- [Domínios funcionais](./docs/10-dominios/README.md)
- [Contratos e inventários](./docs/30-contratos/README.md)
- [Geração estática de contratos](./docs/30-contratos/geracao-estatica.md)
- [Runbooks operacionais](./docs/40-runbooks/README.md)
- [Política de documentação](./docs/50-governanca/politica-de-documentacao.md)
- [Processo de atualização](./docs/50-governanca/processo-de-atualizacao.md)

Documentos históricos ou depreciados permanecem no repositório por rastreabilidade, mas não prevalecem sobre as fontes de verdade.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth, Postgres, Storage, RPCs e Edge Functions
- Vercel Functions
- Mercado Pago
- OpenAI ou Vercel AI Gateway para geração de mini bio
- Playwright para testes E2E

## Desenvolvimento local

### Pré-requisitos

- Node.js 22, versão usada no CI
- npm
- variáveis públicas do Supabase

### Instalação

```bash
npm ci
```

### Variáveis mínimas

Crie um `.env.local` não versionado:

```bash
VITE_SUPABASE_URL=<url-do-projeto>
VITE_SUPABASE_ANON_KEY=<chave-anon>
VITE_DEV_MODE=false
```

Nunca exponha service role, senha do banco ou tokens de provedores em variáveis com prefixo `VITE_`.

### Executar

```bash
npm run dev
```

### Build

```bash
npm run build
```

O build inclui verificações específicas da reivindicação de perfil e da geração de mini bio.

## Testes, auditorias e contratos

```bash
npm run test:faq
npm run test:e2e
npm run audit:docs
npm run audit:migrations
npm run audit:cms-strict
npm run audit:bundle
npm run docs:generate-contracts
npm run docs:check-contracts
```

- `audit:docs` valida metadados, links locais, arquivos-fonte e referências de substituição nas áreas canônicas.
- `docs:generate-contracts` extrai APIs, Edge Functions, variáveis e códigos de erro detectáveis estaticamente.
- `docs:check-contracts` falha quando os arquivos gerados versionados estiverem diferentes do código atual.

O workflow de migrations reaplica todas as migrations em uma stack Supabase local e executa os testes SQL de `supabase/tests/`. O workflow `Documentation safety` executa a auditoria documental em PRs e pushes diretos para `main`. O workflow `Static contract generation` gera e audita os contratos estáticos e publica as saídas como artefato para revisão.

## Estrutura resumida

```text
src/                 frontend e módulos de runtime
api/                 Vercel Functions
build/               transforms aplicados pelo Vite
scripts/             auditorias, verificações e geradores
supabase/migrations/ evolução do banco
supabase/functions/  Edge Functions
supabase/tests/       contratos e testes SQL
tests/                testes unitários e E2E
docs/                 documentação canônica, gerada, operacional e histórica
```

Consulte o [mapa do repositório](./docs/00-visao-geral/mapa-do-repositorio.md) antes de alterar fluxos que possam envolver enhancements ou transforms de build.

## Deploy e operação

O frontend e `api/` são publicados na Vercel. Migrations, Edge Functions e secrets são administrados no Supabase.

Procedimentos atuais:

- [deploy Vercel](./docs/40-runbooks/deploy-vercel.md)
- [deploy de Edge Functions](./docs/40-runbooks/deploy-edge-functions.md)
- [migrations](./docs/40-runbooks/migrations.md)
- [validação de pagamentos](./docs/40-runbooks/validacao-de-pagamentos.md)
- [operação no evento](./docs/40-runbooks/operacao-no-dia-do-evento.md)
- [resposta a incidentes](./docs/40-runbooks/resposta-a-incidentes.md)
- [rollback](./docs/40-runbooks/rollback.md)

Os runbooks permanecem `draft` até execução integral e registro de evidências.

## Segurança

- Operações financeiras críticas são server-side.
- RLS e grants são os controles efetivos de acesso ao banco.
- O retorno do navegador não comprova pagamento.
- Conteúdo público deve respeitar moderação e flags de privacidade.
- Service role nunca deve ser incluída no frontend.
- Arquivos `.env*`, tokens e credenciais privadas não devem ser versionados.
