---
status: generated
owner: tuliust
last_verified: 2026-08-09
last_verified_commit: 2b1ba03e46ffda8f0e684c93d72ab75cb134ed99
generation_command: npm run docs:generate-type-consumers
source_files:
  - src/
  - scripts/generate-database-type-consumers.mjs
---

# Consumidores dos tipos manuais do banco

> Inventário gerado a partir de imports e augmentações de `database.types`. Não editar manualmente.

## Resumo

| Métrica | Quantidade |
|---|---|
| Arquivos consumidores | 0 |
| Declarações de import ou augmentação | 0 |
| Símbolos importados distintos | 0 |
| Imports que não são exclusivamente `import type` | 0 |
| Augmentações de módulo | 0 |

## Consumidores por categoria

| Categoria | Arquivos |
|---|---|

## Arquivos consumidores

| Arquivo | Categoria | Modo | Módulo | Símbolos |
|---|---|---|---|---|

## Símbolos por alcance

| Símbolo | Consumidores | Arquivos |
|---|---|---|

## Interpretação para a migração

- `src/lib/supabase.ts` já foi migrado para a baseline gerada e não aparece entre os consumidores do arquivo manual.
- arquivos em `src/lib/` tendem a combinar queries, adaptadores e tipos de domínio; exigem revisão antes de trocar aliases.
- componentes e páginas devem migrar depois dos services, evitando acoplamento direto ao formato bruto de tabelas.
- módulos de FAQ formam um grupo funcional próprio e podem ser migrados em conjunto.
- enhancements precisam ser validados contra o bundle transformado, porque podem injetar imports ou formas adicionais.
- augmentações de módulo devem ser eliminadas ou substituídas por tipos de domínio explícitos antes de remover o arquivo manual.

## Ordem recomendada

1. services e bibliotecas sem UI;
2. FAQ;
3. perfis e conteúdo público;
4. fotos, memórias e enquetes;
5. checkout, pedidos e catálogo;
6. componentes administrativos;
7. enhancements e augmentações;
8. limpeza do arquivo manual.

## Limitações

- o inventário cobre imports estáticos terminados por ponto e vírgula e `declare module`;
- usos indiretos por reexportação podem exigir análise adicional;
- um import sem `type` pode ser removido do JavaScript pelo compilador, mas é classificado conservadoramente;
- o relatório não prova que todos os símbolos importados são efetivamente usados;
- transforms podem introduzir consumidores somente no bundle final.

