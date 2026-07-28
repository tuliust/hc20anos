---
status: canonical
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: eb956992069e064ce5589d42b630137b2a21649e
source_files:
  - src/
  - api/
  - build/
  - scripts/generate-static-contracts.mjs
  - scripts/generate-routes-contract.mjs
  - scripts/generate-database-contracts.mjs
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
  - supabase/functions/
  - supabase/migrations/
  - supabase/tests/
  - tests/unit/
  - tests/e2e/
  - docs/30-contratos/
  - .github/workflows/static-contracts.yml
  - .github/workflows/database-migrations.yml
  - .github/workflows/type-compatibility.yml
  - .github/workflows/functional-tests.yml
  - .github/workflows/commerce-functional-tests.yml
  - .github/workflows/operations-functional-tests.yml
  - .github/workflows/engagement-functional-tests.yml
  - .github/workflows/photo-interactions-functional-tests.yml
  - .github/workflows/editorial-moderation-functional-tests.yml
---

# Contratos técnicos

## Estado

As estruturas verificáveis do sistema possuem baselines versionadas com `status: generated`:

- rotas efetivas;
- Vercel Functions;
- Supabase Edge Functions;
- variáveis de ambiente;
- códigos de erro literais;
- schema do banco;
- RPCs e funções públicas;
- RLS, policies e grants;
- tipos TypeScript do Supabase;
- ERD;
- consumidores dos tipos legados;
- compatibilidade entre o snapshot manual e a baseline;
- evidências funcionais de perfil e FAQ;
- evidências funcionais de catálogo e checkout;
- evidências funcionais de autorização e operação;
- evidências funcionais de memórias e enquetes;
- evidências funcionais de interações em fotos;
- evidências funcionais de moderação editorial.

Arquivos gerados têm precedência sobre inventários humanos para estruturas verificáveis. Documentos manuais explicam intenção, semântica, responsabilidades, operação e limitações que não podem ser inferidas automaticamente.

## Baselines geradas

### Runtime e Functions

| Contrato | Arquivo | Fonte principal | Comando |
|---|---|---|---|
| Rotas efetivas | [`rotas.generated.md`](./rotas.generated.md) | `App.tsx` transformado, `main.tsx` e Vercel | `npm run docs:generate-routes` |
| Vercel Functions | [`APIs.generated.md`](./APIs.generated.md) | `api/` | `npm run docs:generate-contracts` |
| Edge Functions | [`edge-functions.generated.md`](./edge-functions.generated.md) | `supabase/functions/` | `npm run docs:generate-contracts` |
| Variáveis | [`variaveis-de-ambiente.generated.md`](./variaveis-de-ambiente.generated.md) | análise estática do repositório | `npm run docs:generate-contracts` |
| Erros literais | [`codigos-de-erro.generated.md`](./codigos-de-erro.generated.md) | JavaScript e TypeScript | `npm run docs:generate-contracts` |

Procedimentos:

- [`geracao-estatica.md`](./geracao-estatica.md);
- [`geracao-de-rotas.md`](./geracao-de-rotas.md).

### Banco reproduzido

| Contrato | Arquivo | Conteúdo | Comando |
|---|---|---|---|
| Schema final | [`banco.generated.md`](./banco.generated.md) | enums, tabelas, colunas, constraints, índices, views e triggers | `npm run docs:generate-db-contracts` |
| RPCs | [`RPCs.generated.md`](./RPCs.generated.md) | argumentos, retorno, volatilidade, `security definer` e ACL | `npm run docs:generate-db-contracts` |
| Segurança | [`RLS.generated.md`](./RLS.generated.md) | estado de RLS, policies e grants | `npm run docs:generate-db-contracts` |
| Tipos | [`database.types.generated.ts`](./database.types.generated.ts) | tipos TypeScript gerados pela Supabase CLI | `npm run docs:generate-db-contracts` |
| ERD | [`erd.generated.mmd`](./erd.generated.mmd) | entidades, colunas e chaves estrangeiras | `npm run docs:generate-db-contracts` |

Procedimento: [`geracao-do-banco.md`](./geracao-do-banco.md).

### Compatibilidade dos tipos

| Contrato | Arquivo | Estado |
|---|---|---|
| Comparação estrutural | [`compatibilidade-de-tipos.generated.md`](./compatibilidade-de-tipos.generated.md) | snapshot histórico comparado à baseline |
| Inventário de consumidores | [`consumidores-dos-tipos.generated.md`](./consumidores-dos-tipos.generated.md) | zero consumidores, imports e augmentações |
| Referência canônica | [`tipos-supabase.md`](./tipos-supabase.md) | arquitetura e módulos funcionais |
| Plano concluído | [`migracao-dos-tipos-supabase.md`](./migracao-dos-tipos-supabase.md) | migração estrutural encerrada |

O cliente Supabase usa a baseline gerada. `src/lib/database.types.ts` está depreciado, sem consumidores e mantido temporariamente apenas para a comparação histórica. O workflow `Supabase type compatibility` reprova qualquer reintrodução.

## Evidências funcionais

### Perfil e FAQ

[`testes-funcionais.generated.md`](./testes-funcionais.generated.md) registra build, unitários do FAQ, Chromium e E2E com resultado `success`.

Cobertura:

- retomada de reivindicação depois de confirmação e login;
- disputas administrativas com evidências atuais e legadas;
- mini-bio por IA sem dados pessoais sensíveis;
- FAQ estruturado, busca normalizada e expansão;
- exclusão da categoria de privacidade da Home;
- fallback para `faq_items_json`.

### Catálogo e checkout

[`testes-comerciais.generated.md`](./testes-comerciais.generated.md) registra build, Chromium e três E2E com resultado `success`.

Cobertura:

- Home e página de ingressos usam o mesmo catálogo vigente;
- lote e preços em reais vêm das RPCs;
- a seleção é preservada pelo contrato de sessão;
- o ingresso Individual exige perfil vinculado;
- o perfil não é perdido por concorrência entre catálogo e consulta de perfil;
- termos são obrigatórios;
- a API recebe sessão, chave pública e idempotência;
- nome e e-mail são normalizados;
- o navegador não envia preço, total ou `ticket_type_id` como autoridade;
- o redirecionamento do provedor é simulado.

Durante a execução, os testes encontraram e corrigiram:

1. um seletor frágil do catálogo da Home, substituído pelo marcador estável `data-home-section="tickets"`;
2. uma corrida que apagava nome e `person_id` do perfil vinculado quando o catálogo terminava de carregar depois da consulta de perfil.

### Autorização e operação

[`testes-operacionais.generated.md`](./testes-operacionais.generated.md) registra build, Chromium e três E2E com resultado `success`.

Cobertura:

- visitante sem sessão é redirecionado ao login;
- a rota standalone exige role operacional;
- `checkin_staff` registra entrada e vouchers;
- `checkin_staff` não recebe reembolsos ou indicadores financeiros;
- `admin` recebe reembolsos e indicadores;
- os argumentos enviados às RPCs são verificados.

O frontend possui guard próprio para `/admin/operacao` e `/admin/checkin`. RLS, grants e RPCs continuam sendo a autoridade server-side.

### Memórias e enquetes

[`testes-engajamento.generated.md`](./testes-engajamento.generated.md) registra build, Chromium e dois E2E com resultado `success`.

Cobertura:

- somente memórias aprovadas são exibidas publicamente;
- memória anônima não revela o nome administrativo;
- o controle de anonimato permanece visível e acessível como `switch`;
- memória curta é rejeitada antes da escrita;
- nova memória é persistida como `pending`;
- voto único remove a seleção anterior antes da nova inserção;
- resultados ficam ocultos antes da participação;
- enquete fechada não aceita novo voto.

A regressão encontrada era causada por um enhancement legado que ocultava e desligava programaticamente o anonimato. `memoryAnonymityEnhancement.ts` restaura a visibilidade, a semântica acessível e bloqueia somente a desativação programática incompatível.

### Interações em fotos

[`testes-interacoes-fotos.generated.md`](./testes-interacoes-fotos.generated.md) registra build, Chromium e um E2E completo com resultado `success`.

Cobertura:

- foto aprovada e selecionada pela organização;
- comentário aprovado e contadores agregados;
- curtida autenticada;
- comentário novo como `pending`;
- marcação nova como `pending` para pessoa elegível;
- solicitação de remoção com motivo e identidade autenticada;
- ausência de publicação direta dessas escritas.

### Moderação editorial

[`testes-moderacao-editorial.generated.md`](./testes-moderacao-editorial.generated.md) registra build, Chromium e dois E2E com resultado `success`.

Cobertura:

- entrada administrativa nas filas editoriais;
- autoria protegida de memória anônima;
- aprovação de memória com administrador e timestamp;
- rejeição de comentário e limpeza de aprovação anterior;
- retirada do item da fila pendente;
- auditoria com ação, entidade e identificador.

## Evidência de geração

### Contratos estáticos e rotas

O workflow:

1. gera os contratos estáticos;
2. aplica o transform real de pedidos;
3. gera o contrato de rotas;
4. executa a auditoria documental;
5. detecta arquivos novos e modificados;
6. publica apenas a lista explícita de contratos.

### Banco

O workflow `Database migration safety`:

1. audita as migrations;
2. executa o build;
3. inicia uma stack Supabase local;
4. reaplica todas as migrations em banco vazio;
5. instala a fixture autenticada;
6. executa todos os testes SQL;
7. consulta os catálogos do Postgres local;
8. gera schema, RPCs, RLS, tipos e ERD;
9. executa a auditoria documental.

Nenhum gerador consulta o banco de produção.

## Verificação de drift

### Runtime e Functions

```bash
npm run docs:check-contracts
npm run docs:check-routes
```

### Banco

```bash
npm run docs:check-db-contracts
```

### Tipos

```bash
npm run docs:check-type-compatibility
npm run docs:check-type-consumers
```

Em pull requests, os workflows falham quando as saídas esperadas diferem das baselines versionadas.

## Inventários humanos complementares

| Documento | Estado | Uso permitido |
|---|---|---|
| [`rotas.md`](./rotas.md) | `deprecated` | redirect documental para a baseline gerada |
| [`apis-e-functions.md`](./apis-e-functions.md) | `draft` | responsabilidades, exemplos de payload e integrações |
| [`variaveis-de-ambiente.md`](./variaveis-de-ambiente.md) | `draft` | obrigatoriedade, sensibilidade e configuração operacional |
| [`codigos-de-erro.md`](./codigos-de-erro.md) | `draft` | semântica de interface e fluxos não literais |
| [`permissoes.md`](./permissoes.md) | `draft` | matriz funcional de atores e papéis |

Esses documentos não podem contradizer as baselines geradas.

## Limites das evidências

As evidências Playwright utilizam fixtures HTTP isoladas. Elas comprovam comportamento do frontend, composição de payloads e chamadas esperadas, mas não comprovam:

- autenticação real contra o projeto remoto;
- policies, grants e RLS no ambiente conectado;
- triggers, constraints ou concorrência do banco;
- rate limiting, sanitização e controles de abuso;
- upload, MIME type, antivírus, EXIF ou Storage real;
- criação real de preferência no Mercado Pago;
- assinatura e processamento do webhook;
- reserva e restauração reais de inventário;
- emissão, transferência, cancelamento ou reembolso integrados;
- câmera, iluminação, rede instável ou contingência offline;
- operação presencial completa;
- decisão humana de moderação ou tratamento jurídico de remoções.

Essas camadas permanecem subordinadas aos testes SQL, ensaios em ambiente controlado e runbooks.

## Regras

- não editar arquivos `generated` manualmente;
- corrigir fonte, teste ou gerador e regenerar;
- nunca incluir secrets, tokens ou dados pessoais reais;
- manter comandos e workflows reproduzíveis;
- revisar diffs gerados como mudança de contrato;
- atualizar documentação de domínio quando uma alteração mudar regra de negócio;
- registrar ADR quando a mudança alterar arquitetura, autoridade ou estratégia de compatibilidade;
- não promover runbook apenas porque o frontend passou em fixtures isoladas.

## Pendências restantes

1. executar checkout integrado com Supabase local e preferência controlada do Mercado Pago;
2. validar webhook assinado, idempotência e reconciliação financeira;
3. validar emissão, transferência, cancelamento, reembolso e inventário de ponta a ponta;
4. validar upload, Storage, RLS, sanitização e controles de abuso em ambiente integrado;
5. ensaiar check-in em dispositivos, câmera, rede reserva e contingência offline;
6. tipar as RPCs efetivamente consumidas com `Args` e `Returns` gerados;
7. mover o comparador de tipos para um snapshot arquivado e remover o arquivo manual;
8. executar validações de design, responsividade e acessibilidade;
9. promover runbooks somente depois de evidência operacional suficiente.

O snapshot `docs/SUPABASE_SCHEMA.md` permanece depreciado e não deve voltar a representar o banco vigente.
