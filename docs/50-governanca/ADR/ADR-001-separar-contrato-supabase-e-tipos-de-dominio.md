---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 2b9b11e4193a9a0db5be5f021c91b0fd12616d0c
source_files:
  - docs/30-contratos/database.types.generated.ts
  - docs/30-contratos/compatibilidade-de-tipos.generated.md
  - src/lib/database.types.ts
  - scripts/audit-database-types.mjs
  - .github/workflows/type-compatibility.yml
---

# ADR-001 — Separar contrato Supabase e tipos de domínio

- **Status:** aceito
- **Data:** 2026-07-26
- **Responsáveis:** proprietário do repositório e mantenedores técnicos
- **Substitui:** prática implícita de manter contrato de banco e tipos de domínio no mesmo arquivo manual
- **Substituído por:** nenhum

## Contexto

O projeto possui dois artefatos com finalidades diferentes:

- `docs/30-contratos/database.types.generated.ts`, produzido pela Supabase CLI após replay integral das migrations e aprovação dos testes SQL;
- `src/lib/database.types.ts`, mantido manualmente e usado pelos componentes da aplicação.

O arquivo manual se apresenta como tipo gerado, mas combina:

- interfaces correspondentes a tabelas;
- interfaces correspondentes a views;
- tipos de conteúdo JSON;
- agregados usados pela interface;
- aliases históricos;
- um mapa parcial de `Database.public`;
- funções e enums incompletos.

A auditoria gerada em `compatibilidade-de-tipos.generated.md` identificou:

- 45 tabelas na baseline e 30 no mapa manual;
- 19 tabelas ausentes no mapa manual;
- 6 views na baseline e 2 no mapa manual;
- 4 views ausentes no mapa manual;
- 80 funções ou RPCs na baseline e 7 no mapa manual;
- 73 funções ou RPCs ausentes;
- 11 enums na baseline e 9 no mapa manual;
- 2 enums ausentes;
- quatro views públicas classificadas como tabelas no arquivo manual;
- `payment_events` tipado como `any`;
- campos ausentes em entidades centrais como `events`, `ticket_types`, `orders`, `tickets`, `event_page_content`, `faq_categories` e `faq_items`.

Substituir o arquivo manual diretamente pelo gerado produziria uma mudança ampla nos imports e poderia quebrar componentes que dependem de formas de domínio mais convenientes do que a representação bruta do banco.

## Decisão

Adotar duas camadas de tipos com responsabilidades explícitas:

1. **Contrato bruto do Supabase**
   - gerado automaticamente;
   - não editável manualmente;
   - representa tabelas, views, RPCs, enums e relações reais;
   - usado para tipar o cliente Supabase e operações diretas de banco.

2. **Tipos de domínio e apresentação**
   - mantidos em módulos próprios;
   - representam formulários, conteúdo editorial, agregados, estados de interface e respostas compostas;
   - não se apresentam como schema gerado;
   - usam aliases ou adaptadores explícitos quando derivam do contrato Supabase.

`src/lib/database.types.ts` não será substituído em uma única alteração. A migração será incremental, por grupo funcional, com build e testes após cada etapa.

## Alternativas consideradas

### Substituir o arquivo manual imediatamente

- **Vantagem:** elimina rapidamente o mapa desatualizado.
- **Desvantagens:** grande superfície de quebra, perda de tipos de domínio e dificuldade de revisar centenas de erros simultâneos.
- **Motivo para rejeição:** risco elevado e baixa rastreabilidade.

### Manter somente o arquivo manual

- **Vantagem:** nenhuma alteração imediata nos consumidores.
- **Desvantagens:** continua omitindo objetos reais, aceita `any`, classifica views incorretamente e depende de atualização humana.
- **Motivo para rejeição:** não representa o estado final das migrations e enfraquece a segurança de tipos.

### Gerar tipos diretamente sobre o arquivo usado pela aplicação

- **Vantagem:** caminho único e simples.
- **Desvantagens:** cada geração apagaria tipos de domínio e adaptações manuais; incentivaria edição de arquivo gerado.
- **Motivo para rejeição:** mistura fontes de verdade incompatíveis.

### Separar contrato bruto e domínio

- **Vantagens:** preserva ergonomia, permite migração gradual, mantém fonte estrutural verificável e reduz `any` progressivamente.
- **Desvantagens:** exige adaptadores e disciplina de imports.
- **Motivo para escolha:** oferece a melhor combinação de segurança, reversibilidade e revisão incremental.

## Consequências

### Positivas

- o cliente Supabase poderá usar o schema real;
- mudanças de migration produzirão drift detectável no CI;
- tipos de domínio deixarão de fingir que são gerados;
- views, tabelas e RPCs terão classificação correta;
- `any` poderá ser removido de forma controlada;
- cada migração terá escopo revisável.

### Negativas

- haverá dois níveis de tipos durante a transição;
- alguns consumidores precisarão de adaptadores;
- os imports precisarão ser reorganizados;
- a cobertura TypeScript pode revelar dívidas antes ocultas;
- a migração completa exigirá várias entregas.

## Compatibilidade e migração

A ordem segura é:

1. manter `database.types.generated.ts` como baseline imutável;
2. criar um módulo de acesso ao banco que importe o tipo gerado;
3. tipar o cliente Supabase pelo contrato bruto;
4. criar um módulo separado para tipos de domínio existentes;
5. migrar primeiro objetos simples e idênticos;
6. migrar views e RPCs com aliases derivados;
7. criar adaptadores para agregados e JSON;
8. remover objetos históricos e `any` somente após corrigir consumidores;
9. executar build, testes unitários, SQL e E2E a cada grupo;
10. depreciar o mapa manual apenas quando não houver mais consumidor.

Rollback por etapa:

- reverter o grupo de aliases ou adaptadores recém-migrado;
- manter o contrato gerado intacto;
- não alterar migrations para acomodar tipos de interface;
- preservar os tipos de domínio anteriores até a validação do grupo.

## Impacto documental

Criar ou atualizar:

- `docs/30-contratos/migracao-dos-tipos-supabase.md`;
- `docs/30-contratos/compatibilidade-de-tipos.generated.md`;
- `docs/30-contratos/README.md`;
- `docs/index.md`;
- Epic #41.

O cabeçalho de `src/lib/database.types.ts` deverá ser corrigido para deixar de afirmar que o arquivo é uma saída atual da Supabase CLI.

## Validação

A decisão será considerada implementada quando:

- o cliente Supabase estiver tipado pela baseline gerada;
- os tipos de domínio estiverem em módulo separado;
- nenhuma view estiver classificada como tabela;
- `payment_events` não usar `Row: any`;
- RPCs usadas pela aplicação estiverem no contrato real;
- o relatório de compatibilidade não apontar objetos estruturais incorretos;
- build e testes passarem em cada etapa;
- o workflow de compatibilidade não detectar drift.

## Referências

- `docs/30-contratos/database.types.generated.ts`;
- `docs/30-contratos/compatibilidade-de-tipos.generated.md`;
- `src/lib/database.types.ts`;
- `scripts/audit-database-types.mjs`;
- `.github/workflows/type-compatibility.yml`;
- Epic #41.
