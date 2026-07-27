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
  - docs/50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md
  - .github/workflows/type-compatibility.yml
---

# Migração dos tipos Supabase

## Objetivo

Substituir o mapa parcial em `src/lib/database.types.ts` pelo contrato real produzido pela Supabase CLI, preservando tipos de domínio e apresentação que não correspondem diretamente a rows do banco.

A decisão arquitetural está registrada em [`ADR-001`](../50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md).

## Resultado

A migração estrutural foi concluída:

- [x] baseline Supabase gerada após replay integral;
- [x] cliente parametrizado com `SupabaseClient<Database>`;
- [x] comparador entre baseline e snapshot manual;
- [x] inventário automático dos consumidores;
- [x] separação dos tipos por família funcional;
- [x] migração de `App.tsx` e `services.ts`;
- [x] zero imports de `database.types.ts`;
- [x] zero augmentações de módulo;
- [x] CI bloqueando novos consumidores;
- [x] arquivo manual marcado como depreciado;
- [x] builds das etapas aprovados na Vercel.

A redução ocorreu de 21 arquivos e dezenas de símbolos importados para zero consumidores do mapa manual.

## Arquitetura final

```text
docs/30-contratos/database.types.generated.ts  contrato estrutural gerado
src/lib/database.generated.ts                  ponte estável para a aplicação
src/lib/*.types.ts                             contratos funcionais e aliases
src/lib/supabase.ts                            cliente tipado pela baseline
src/lib/database.types.ts                      snapshot manual depreciado
```

Módulos funcionais:

| Módulo | Responsabilidade |
|---|---|
| `admin.types.ts` | roles e usuários administrativos |
| `commerce.types.ts` | catálogo, pedidos, ingressos e agregados comerciais |
| `content.types.ts` | evento, CMS, arquivo e auditoria |
| `engagement.types.ts` | memórias e enquetes |
| `faq.types.ts` | FAQ estruturado |
| `identity.types.ts` | reivindicações e disputas |
| `people.types.ts` | pessoas, perfis e views públicas |
| `photo.types.ts` | fotos, interações e moderação |

## Decisões por família

### Aliases diretos

Foram usados quando a forma da aplicação corresponde ao contrato gerado, por exemplo:

- `admin_users`;
- `photos`;
- `photo_tags`;
- `photo_likes`;
- solicitações de remoção;
- reivindicações e disputas de perfil;
- opções e votos de enquetes;
- evento.

### Contratos de domínio

Foram mantidos quando a interface exige forma mais específica:

- FAQ com relação composta de categoria;
- views públicas com invariantes não nulas;
- estatísticas JSON transformadas em arrays tipados;
- comentários e memórias com status restringido;
- resultados agregados de enquetes;
- itens editoriais de galeria, agenda e informações;
- links de destaque do arquivo pós-evento.

### Contratos comerciais de compatibilidade

Pedidos, ingressos e tipos de ingresso não foram convertidos em aliases crus.

A estratégia adotada:

- campos históricos usados pelas telas permanecem obrigatórios;
- campos atuais do banco ficam disponíveis como opcionais;
- enums vêm da baseline;
- relações de `TicketWithDetails` permanecem explícitas;
- nenhuma regra de preço, pagamento, reserva, emissão ou check-in foi modificada.

Essa compatibilidade deve evoluir para adaptadores específicos depois dos E2E financeiros e operacionais.

## Proteção contra regressão

O workflow `Supabase type compatibility`:

1. regenera o relatório estrutural;
2. regenera o inventário de consumidores;
3. falha se `Arquivos consumidores` for diferente de zero;
4. audita front matter e links;
5. exige ausência de drift em pull requests;
6. publica relatórios atualizados em `main`;
7. lida com pushes concorrentes por rebase e novas tentativas.

## Snapshot manual depreciado

`src/lib/database.types.ts` não é mais usado pelo runtime.

Ele permanece temporariamente para o comparador histórico, que documenta:

- 19 tabelas ausentes no snapshot;
- quatro views ausentes e outras classificadas incorretamente;
- 73 RPCs ausentes;
- dois enums ausentes;
- `payment_events` com `Row: any` no mapa antigo;
- campos comerciais e editoriais omitidos.

A remoção física exige primeiro alterar o comparador para usar um snapshot arquivado ou excluir essa comparação histórica.

## Validações executadas

- geração dos contratos;
- replay e testes SQL do banco antes da baseline;
- auditoria dos consumidores após cada família;
- inspeção dos imports alterados;
- build e deployment das etapas funcionais;
- remoção de todos os workflows temporários utilizados nas migrações.

## Validações ainda pendentes

A migração de imports está concluída, mas a frente de qualidade dos fluxos ainda exige:

- [ ] unitários do FAQ e dos adaptadores de conteúdo;
- [ ] E2E de perfil, reivindicação e disputa;
- [ ] E2E de fotos, comentários, tags e remoções;
- [ ] E2E de memórias e enquetes;
- [ ] E2E do painel editorial;
- [ ] E2E de catálogo e seleção de ingresso;
- [ ] E2E de checkout e retornos do pagamento;
- [ ] E2E de emissão, transferência, cancelamento, check-in e reembolso;
- [ ] adaptação explícita dos rows comerciais completos;
- [ ] remoção física do snapshot manual quando o comparador for alterado.

## Critério de encerramento

A migração estrutural pode ser considerada concluída porque:

- nenhum arquivo importa o mapa manual;
- o cliente usa o contrato gerado;
- os tipos funcionais estão separados;
- o CI impede regressão;
- o arquivo antigo está depreciado;
- os builds aprovam a nova organização.

As pendências acima pertencem à validação funcional e à limpeza histórica, não à migração de imports.
