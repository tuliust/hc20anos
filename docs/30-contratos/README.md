---
status: canonical
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: ff07dc36ba5cc6b3a5b9851a82750778dd17a54b
source_files:
  - src/
  - api/
  - build/
  - scripts/generate-static-contracts.mjs
  - scripts/generate-routes-contract.mjs
  - scripts/generate-database-contracts.mjs
  - scripts/generate-consumed-rpc-contracts.mjs
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
  - .github/workflows/phase1-environment-security.yml
  - .github/workflows/phase2-content-storage.yml
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
- inventário e aliases das RPCs efetivamente consumidas;
- consumidores dos tipos legados;
- compatibilidade entre o snapshot manual e a baseline;
- evidência integrada da Fase 1 — ambiente e segurança;
- evidência integrada da Fase 2 — conteúdo e Storage;
- evidências funcionais de perfil e FAQ;
- evidências funcionais de catálogo e checkout;
- evidências funcionais de autorização e operação;
- evidências funcionais de memórias e enquetes;
- evidências funcionais de interações em fotos;
- evidências funcionais de moderação editorial.

Arquivos gerados têm precedência sobre inventários humanos para estruturas verificáveis. Documentos manuais explicam intenção, semântica, responsabilidades, operação e limites não inferíveis automaticamente.

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

### RPCs consumidas

| Contrato | Arquivo | Estado |
|---|---|---|
| Inventário de chamadas | [`RPCs-consumidas.generated.md`](./RPCs-consumidas.generated.md) | 61 RPCs distintas, 76 ocorrências literais e zero nomes dinâmicos |
| Aliases TypeScript | `src/lib/rpc.generated.ts` | `Args`, `Returns` e `Row` derivados da baseline |
| Utilitários genéricos | `src/lib/rpc.types.ts` | acesso tipado a `Database["public"]["Functions"]` |

O gerador falha diante de nomes dinâmicos e o build confirma que todas as RPCs inventariadas existem no contrato reproduzido.

### Compatibilidade dos tipos

| Contrato | Arquivo | Estado |
|---|---|---|
| Comparação estrutural | [`compatibilidade-de-tipos.generated.md`](./compatibilidade-de-tipos.generated.md) | snapshot histórico comparado à baseline |
| Inventário de consumidores | [`consumidores-dos-tipos.generated.md`](./consumidores-dos-tipos.generated.md) | zero consumidores, imports e augmentações |
| Referência canônica | [`tipos-supabase.md`](./tipos-supabase.md) | arquitetura e módulos funcionais |
| Plano concluído | [`migracao-dos-tipos-supabase.md`](./migracao-dos-tipos-supabase.md) | migração estrutural encerrada |

O cliente Supabase usa a baseline gerada. `src/lib/database.types.ts` está depreciado, sem consumidores e mantido temporariamente apenas para a comparação histórica.

## Fase 1 — ambiente e segurança

[`fase-1-ambiente-e-seguranca.generated.md`](./fase-1-ambiente-e-seguranca.generated.md) registra resultado `success` para:

- geração dos contratos das RPCs consumidas;
- build TypeScript e da aplicação;
- inicialização de uma stack Supabase local;
- replay integral de todas as migrations em banco vazio;
- criação de usuários sintéticos para usuário comum, `viewer`, `checkin_staff`, `moderator`, `admin` e `superadmin`;
- testes de RLS, grants, funções `security definer`, triggers, constraints, índices e segregação por role;
- regeneração dos contratos do banco;
- auditoria documental.

A matriz vigente está em [`permissoes.md`](./permissoes.md), agora `canonical`. A execução não consulta produção nem utiliza dados pessoais reais.

## Fase 2 — conteúdo e Storage

[`fase-2-conteudo-e-storage.generated.md`](./fase-2-conteudo-e-storage.generated.md) registra resultado `success` para:

- inspeção dos bytes e validação de assinatura, MIME, tamanho e dimensões;
- rejeição de markup ativo e metadados sensíveis;
- upload e download reais no Storage local;
- RLS do bucket privado e centralização das escritas na Edge Function;
- deduplicação, sanitização, rate limiting e concorrência;
- moderação por roles e mascaramento de memórias anônimas;
- solicitações idempotentes de remoção e exclusão física do objeto;
- assets públicos servidos pela origem correta;
- sete regressões Playwright em Chromium;
- auditoria documental.

A execução usa GoTrue, Postgres, Storage e Edge Runtime locais com identidades sintéticas. Não utiliza projeto remoto, dados pessoais reais nem provedor financeiro.

## Evidências funcionais

| Frente | Evidência | Resultado |
|---|---|---|
| Perfil e FAQ | [`testes-funcionais.generated.md`](./testes-funcionais.generated.md) | `success` |
| Catálogo e checkout | [`testes-comerciais.generated.md`](./testes-comerciais.generated.md) | `success` |
| Autorização e operação | [`testes-operacionais.generated.md`](./testes-operacionais.generated.md) | `success` |
| Memórias e enquetes | [`testes-engajamento.generated.md`](./testes-engajamento.generated.md) | `success` |
| Interações em fotos | [`testes-interacoes-fotos.generated.md`](./testes-interacoes-fotos.generated.md) | `success` |
| Moderação editorial | [`testes-moderacao-editorial.generated.md`](./testes-moderacao-editorial.generated.md) | `success` |

As evidências Playwright usam fixtures HTTP isoladas. As Fases 1 e 2 complementam essas suítes com replay, testes SQL, Auth, Storage e Edge Runtime reais no ambiente local.

## Verificação de drift

```bash
npm run docs:check-contracts
npm run docs:check-routes
npm run docs:check-db-contracts
npm run docs:check-type-compatibility
npm run docs:check-type-consumers
npm run docs:check-rpc-usage
npm run audit:docs
```

Em pull requests, os workflows falham quando as saídas esperadas diferem das baselines versionadas.

## Inventários humanos complementares

| Documento | Estado | Uso permitido |
|---|---|---|
| [`rotas.md`](./rotas.md) | `deprecated` | redirect documental para a baseline gerada |
| [`apis-e-functions.md`](./apis-e-functions.md) | `draft` | responsabilidades, exemplos de payload e integrações |
| [`variaveis-de-ambiente.md`](./variaveis-de-ambiente.md) | `draft` | obrigatoriedade, sensibilidade e configuração operacional |
| [`codigos-de-erro.md`](./codigos-de-erro.md) | `draft` | semântica de interface e fluxos não literais |
| [`permissoes.md`](./permissoes.md) | `canonical` | matriz efetiva confrontada com banco, RPCs e testes SQL |

Esses documentos não podem contradizer as baselines geradas.

## Limites das evidências

As Fases 1 e 2 comprovam o ambiente local reproduzido, incluindo Auth, banco, Storage e Edge Runtime. Ainda não comprovam:

- autenticação e configuração em um projeto remoto de homologação;
- funcionamento de um antivírus dedicado ou serviço externo de análise de malware;
- comportamento sob carga distribuída de grande escala;
- criação de preferência no Mercado Pago;
- assinatura e processamento integrado do webhook;
- reserva e restauração de inventário com provedor financeiro;
- emissão, transferência, cancelamento e reembolso de ponta a ponta;
- câmera, iluminação, conectividade instável e contingência offline;
- operação presencial completa;
- decisão humana de moderação ou tratamento jurídico de remoções.

Essas camadas permanecem subordinadas aos ensaios integrados e runbooks correspondentes.

## Regras

- não editar arquivos `generated` manualmente;
- corrigir fonte, teste ou gerador e regenerar;
- nunca incluir secrets, tokens ou dados pessoais reais;
- manter comandos e workflows reproduzíveis;
- revisar diffs gerados como mudança de contrato;
- atualizar documentação de domínio quando uma alteração mudar regra de negócio;
- registrar ADR quando a mudança alterar arquitetura, autoridade ou estratégia de compatibilidade;
- não promover runbook apenas porque o frontend ou o banco local passaram.

## Pendências restantes

1. validar ambiente remoto de homologação quando houver credenciais e isolamento apropriados;
2. executar checkout integrado com preferência controlada do Mercado Pago;
3. validar webhook assinado, idempotência e reconciliação financeira;
4. validar emissão, transferência, cancelamento, reembolso e inventário de ponta a ponta;
5. validar antivírus dedicado e repetir Storage em homologação remota;
6. ensaiar check-in em dispositivos, câmera, rede reserva e contingência offline;
7. mover o comparador de tipos para snapshot arquivado e remover o arquivo manual;
8. executar validações de design, responsividade e acessibilidade;
9. promover runbooks somente depois de evidência operacional suficiente.

O snapshot `docs/SUPABASE_SCHEMA.md` permanece depreciado e não deve voltar a representar o banco vigente.
