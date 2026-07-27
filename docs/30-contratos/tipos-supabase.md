---
status: canonical
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 18d87ebc527265239e77b2a6fab20b1d3e36aa3b
source_files:
  - docs/30-contratos/database.types.generated.ts
  - docs/30-contratos/compatibilidade-de-tipos.generated.md
  - docs/30-contratos/consumidores-dos-tipos.generated.md
  - src/lib/database.generated.ts
  - src/lib/database.types.ts
  - src/lib/admin.types.ts
  - src/lib/commerce.types.ts
  - src/lib/content.types.ts
  - src/lib/engagement.types.ts
  - src/lib/faq.types.ts
  - src/lib/identity.types.ts
  - src/lib/people.types.ts
  - src/lib/photo.types.ts
  - src/lib/supabase.ts
  - src/app/App.tsx
  - src/lib/services.ts
  - scripts/audit-database-types.mjs
  - scripts/generate-database-type-consumers.mjs
  - .github/workflows/type-compatibility.yml
---

# Tipos Supabase

## Estado vigente

A migração do mapa manual para contratos gerados e módulos funcionais foi concluída no runtime.

O sistema possui três camadas:

1. **Contrato estrutural gerado**
   - `docs/30-contratos/database.types.generated.ts`;
   - produzido pela Supabase CLI após replay integral das migrations;
   - representa tabelas, views, RPCs, enums e relações reais;
   - não recebe edição manual.

2. **Ponte do cliente**
   - `src/lib/database.generated.ts`;
   - reexporta o contrato estrutural para o código da aplicação;
   - `src/lib/supabase.ts` usa `SupabaseClient<Database>`.

3. **Tipos funcionais e de domínio**
   - `admin.types.ts` — roles e usuários administrativos;
   - `commerce.types.ts` — catálogo, pedidos, ingressos e agregados comerciais;
   - `content.types.ts` — evento, CMS, arquivo e auditoria;
   - `engagement.types.ts` — memórias e enquetes;
   - `faq.types.ts` — FAQ estruturado;
   - `identity.types.ts` — reivindicações e disputas de perfil;
   - `people.types.ts` — pessoas, perfis e views públicas;
   - `photo.types.ts` — fotos, tags, comentários, remoções e estatísticas.

## Resultado da migração

O relatório [`consumidores-dos-tipos.generated.md`](./consumidores-dos-tipos.generated.md) registra:

| Métrica | Quantidade |
|---|---:|
| Arquivos consumidores do mapa manual | 0 |
| Declarações legadas | 0 |
| Símbolos legados importados | 0 |
| Imports de valor | 0 |
| Augmentações de módulo | 0 |

A migração partiu de 21 arquivos consumidores e terminou sem qualquer import de `src/lib/database.types.ts` no runtime.

## Famílias migradas

### FAQ

`faq.types.ts` preserva uma forma de domínio composta. Ela difere deliberadamente do row bruto porque inclui relação opcional de categoria e não expõe todos os campos desnormalizados do banco.

### Administração

`admin.types.ts` deriva diretamente:

```ts
export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type DbAdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
```

### Pessoas e perfis

`people.types.ts` combina:

- rows gerados de `people` e `profiles`;
- compatibilidade temporária com mocks que omitem campos anuláveis;
- modelos de leitura para as views públicas;
- invariantes não nulas usadas pela interface;
- formas tipadas para estatísticas JSON.

### Fotos e moderação

`photo.types.ts` deriva os rows de fotos, tags, likes e solicitações de remoção. Comentários restringem o status ao conjunto funcional da moderação. `PhotoStats` permanece um agregado, não uma tabela.

### Memórias e enquetes

`engagement.types.ts` deriva rows e restringe os status usados pela interface. `PollResultRow` representa a view agregada com as invariantes esperadas pelos consumidores.

### Identidade

`identity.types.ts` deriva diretamente reivindicações, respostas e disputas, além dos enums correspondentes.

### Evento e conteúdo editorial

`content.types.ts` deriva evento, auditoria, página do evento, home e arquivo. Campos JSON interpretados pela interface permanecem modelados explicitamente, como links de destaque e itens de galeria ou agenda.

### Comércio, pedidos e ingressos

`commerce.types.ts` usa contratos de compatibilidade:

- os campos históricos consumidos pelas telas permanecem obrigatórios;
- campos atuais de lote, idempotência, reserva, cancelamento, transferência e vouchers ficam disponíveis como opcionais;
- os enums vêm da baseline gerada;
- nenhuma regra de preço, pagamento, emissão ou check-in foi alterada pela migração.

Essas projeções devem ser substituídas por adaptadores mais específicos à medida que os E2E comerciais forem ampliados.

## Arquivo manual legado

`src/lib/database.types.ts` está depreciado e sem consumidores.

Ele permanece temporariamente no repositório somente porque o relatório [`compatibilidade-de-tipos.generated.md`](./compatibilidade-de-tipos.generated.md) ainda o usa como referência histórica para demonstrar divergências do snapshot antigo, incluindo:

- tabelas e views ausentes;
- views classificadas como tabelas;
- RPCs não representadas;
- `payment_events` com `Row: any` no snapshot manual;
- campos comerciais e editoriais omitidos.

O arquivo não é fonte de verdade e não deve receber imports ou novas interfaces.

## Proteção no CI

O workflow `Supabase type compatibility`:

1. regenera o relatório estrutural;
2. regenera o inventário de consumidores;
3. reprova a execução se houver qualquer consumidor do mapa manual;
4. audita a documentação;
5. exige ausência de drift em pull requests;
6. publica as baselines em `main` com rebase em caso de concorrência;
7. disponibiliza os relatórios como artefato.

## Evidências e limites

Todos os grupos migrados passaram pelo build da Vercel antes de serem considerados concluídos.

A evidência disponível comprova:

- compilação;
- geração dos inventários;
- ausência de imports legados;
- deployment das etapas funcionais.

Ainda são necessárias validações funcionais completas:

- unitários por domínio;
- E2E de perfil e reivindicação;
- E2E de FAQ administrativo;
- E2E de fotos, memórias e enquetes;
- E2E de catálogo, checkout, pedidos, emissão, check-in, transferência e reembolso.

TypeScript não substitui RLS, autorização server-side, testes SQL ou validação operacional.

## Comandos

```bash
npm run docs:generate-type-compatibility
npm run docs:check-type-compatibility
npm run docs:generate-type-consumers
npm run docs:check-type-consumers
```

## Próxima etapa

A frente de migração de imports está concluída. As próximas atividades são:

1. executar testes funcionais e E2E das famílias migradas;
2. criar adaptadores comerciais mais específicos;
3. substituir usos históricos de `Row: any` nos artefatos de referência;
4. decidir se o comparador deve passar a usar um snapshot arquivado;
5. remover fisicamente `database.types.ts` quando o comparador não depender mais dele.
