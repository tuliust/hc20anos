---
status: canonical
owner: tuliust
last_verified: 2026-07-26
source_files:
  - scripts/generate-static-contracts.mjs
  - package.json
  - api/
  - supabase/functions/
  - src/
  - build/
  - scripts/
---

# Geração estática de contratos

## Objetivo

Gerar documentação reproduzível para estruturas que podem ser extraídas diretamente dos arquivos do repositório, sem depender de banco remoto, secrets ou interpretação manual.

Este processo não substitui a introspecção do Postgres. Schema, RPCs, RLS, grants, triggers, views, constraints e ERD continuam dependendo do replay integral das migrations.

## Comandos

### Gerar ou atualizar

```bash
npm run docs:generate-contracts
```

O comando grava:

```text
docs/30-contratos/APIs.generated.md
docs/30-contratos/edge-functions.generated.md
docs/30-contratos/variaveis-de-ambiente.generated.md
docs/30-contratos/codigos-de-erro.generated.md
```

### Verificar divergência

```bash
npm run docs:check-contracts
```

O modo `--check` gera o conteúdo esperado em memória e falha quando qualquer arquivo estiver ausente ou diferente.

## Fontes analisadas

O gerador percorre arquivos JavaScript e TypeScript em:

- `api/`;
- `supabase/functions/`;
- `src/`;
- `build/`;
- `scripts/`.

Diretórios de dependências, build e metadados locais são ignorados.

## Contratos produzidos

### Vercel Functions

Extração por arquivo em `api/`:

- rota derivada do caminho;
- métodos HTTP literais;
- sinais estáticos de autenticação;
- variáveis de ambiente lidas;
- RPCs chamadas diretamente.

### Supabase Edge Functions

Extração por `supabase/functions/<nome>/index.*`:

- nome e arquivo;
- métodos HTTP detectados;
- sinais de autenticação e privilégio;
- variáveis lidas por `Deno.env.get`;
- RPCs chamadas diretamente.

### Variáveis de ambiente

São reconhecidos:

- `import.meta.env.NOME`;
- `process.env.NOME`;
- `process.env["NOME"]`;
- `Deno.env.get("NOME")`.

Variáveis com prefixo `VITE_` são classificadas como públicas no bundle. As demais são classificadas como server-side. Valores nunca são copiados.

### Códigos de erro

O gerador identifica códigos literais em padrões como:

- `{ error: "codigo" }`;
- `new Error("codigo")`;
- `throw "codigo"`.

Cada código recebe referências de arquivo e linha.

## Determinismo

Cada arquivo gerado registra:

- `status: generated`;
- commit de origem;
- data do commit;
- comando de geração;
- fontes analisadas.

Para o mesmo commit e conjunto de arquivos, a saída deve ser idêntica.

## Limitações conhecidas

A análise estática não garante compreensão semântica completa. Não são inferidos de forma definitiva:

- métodos construídos dinamicamente;
- autenticação encapsulada em helpers indiretos;
- rotas internas do SPA depois dos transforms;
- mensagens de erro interpoladas;
- erros retornados por Postgres ou provedores;
- tipos completos de payload e resposta;
- variáveis acessadas por nomes construídos dinamicamente;
- RPCs invocadas por SQL dinâmico.

Os contratos gerados devem ser interpretados como inventários verificáveis de ocorrências estáticas, não como substitutos dos testes de integração.

## Fluxo de atualização

1. Alterar código ou configuração.
2. Executar `npm run docs:generate-contracts`.
3. Revisar o diff dos arquivos `*.generated.md`.
4. Executar `npm run audit:docs`.
5. Executar `npm run docs:check-contracts`.
6. Versionar código e contratos no mesmo conjunto de mudanças.

## Segurança

- valores de secrets não são lidos nem gravados;
- somente nomes de variáveis aparecem;
- tokens, payloads reais e dados pessoais não devem ser adicionados aos exemplos;
- arquivos gerados não devem ser editados manualmente;
- divergências devem ser corrigidas pela fonte ou pelo gerador.

## Próxima evolução

Depois da primeira geração validada, o CI deverá executar `npm run docs:check-contracts` e falhar diante de drift. O workflow inicial gera e audita os arquivos como artefato para permitir revisão antes de tornar o check bloqueante.