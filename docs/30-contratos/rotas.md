---
status: deprecated
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 9c6eba3bd05a16511bd8160b3e0d621c34f9918e
superseded_by:
  - docs/30-contratos/rotas.generated.md
source_files:
  - docs/30-contratos/rotas.generated.md
---

# Inventário manual de rotas — substituído

> [!WARNING]
> Este inventário manual foi substituído por [`rotas.generated.md`](./rotas.generated.md), produzido a partir do `App.tsx` transformado, dos mounts de `main.tsx` e da configuração da Vercel.

## Motivo da substituição

O inventário manual não conseguia garantir automaticamente:

- inclusão da rota de pedidos injetada no build;
- sincronização de aliases;
- classificação dos grupos protegidos;
- precedência das rotas standalone;
- captura de redirects legados;
- detecção do fallback administrativo e de rotas desconhecidas;
- divergência após mudanças futuras.

## Referência vigente

Use [`rotas.generated.md`](./rotas.generated.md) para consultar:

- rotas canônicas;
- páginas internas associadas;
- acesso público, autenticado ou administrativo;
- aliases;
- redirects;
- mounts standalone;
- retorno do checkout por query string;
- rewrite da Vercel;
- caminhos compartilhados por múltiplas páginas internas.

O procedimento de geração está documentado em [`geracao-de-rotas.md`](./geracao-de-rotas.md).

## Uso permitido deste arquivo

Este arquivo permanece apenas para preservar a existência do inventário manual anterior e redirecionar links antigos. Não deve ser atualizado com novas rotas.
