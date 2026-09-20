---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - src/app/App.tsx
  - vite.config.ts
  - build/
  - scripts/check-reproducibility.mjs
  - tests/unit/build-transform-utils.test.mjs
---

# Dívida técnica — baseline de 20/09/2026

## Objetivo

Registrar a dívida técnica atual e impor uma estratégia de redução incremental, evitando refactors amplos imediatamente antes do evento.

## App principal

`src/app/App.tsx` continua sendo o principal concentrador de dívida estrutural. O arquivo possui aproximadamente 560 KB de código-fonte e concentra navegação, páginas, componentes, dados fallback e integrações históricas.

A decomposição completa não faz parte deste lote porque alteraria uma área muito ampla da aplicação. O trabalho deverá ocorrer por fatias funcionais, cada uma com testes e sem mudança de comportamento.

### Ordem recomendada

1. tipos e constantes sem dependência de estado;
2. dados fallback/mock ainda necessários;
3. componentes de página autocontidos;
4. componentes administrativos;
5. navegação e resolução de rotas;
6. efeitos globais e integrações;
7. remoção dos transforms somente depois que cada patch estiver incorporado diretamente ao código-fonte.

## Transforms de build

A aplicação ainda depende de transforms em `vite.config.ts` para compor correções sobre `App.tsx` e `services.ts`.

Neste lote foi reduzida a duplicação interna desses transforms:

- normalização de IDs de módulo centralizada;
- substituição obrigatória de trechos centralizada;
- substituição de intervalos centralizada;
- erros continuam identificando o transform responsável;
- testes unitários cobrem sucesso, ausência, duplicidade e intervalos inválidos.

O helper compartilhado fica em `build/transformUtils.mjs`.

Isso não elimina os transforms. A remoção deve acontecer apenas quando o comportamento de cada um for incorporado às fontes e validado pelo build/E2E.

## Tipos legados

A migração para tipos gerados já possui auditorias específicas. Próximas alterações devem priorizar:

- reduzir casts `any` residuais em serviços e mounts;
- não criar novos consumidores de tipos legados;
- manter `database.generated.ts` e contratos gerados como referências sincronizadas;
- remover aliases/tipos antigos somente quando não houver consumidor real.

## Artefatos e código sem uso

Não remover arquivo apenas porque uma busca textual não encontrou consumidor.

Antes de exclusão:

1. verificar import estático/dinâmico;
2. verificar referência em scripts/package.json;
3. verificar uso por Vite/build transform;
4. verificar workflows;
5. verificar documentação operacional;
6. executar build e testes relacionados.

Scripts de migração/patch históricos podem ser mantidos enquanto ainda documentarem ou suportarem reconstrução de uma etapa. Quando não forem mais necessários, devem ser arquivados/removidos em PR específico.

## Regras para próximos lotes

- uma preocupação por PR;
- evitar refactor + mudança funcional no mesmo lote;
- build obrigatório;
- contratos e documentação sincronizados;
- preservar migrations aplicadas;
- preferir extrações mecânicas antes de mudanças de arquitetura;
- executar refactors maiores depois do evento, salvo correção de risco real.

## Concluído neste lote

- utilitários repetidos dos transforms consolidados;
- teste unitário dos utilitários;
- comando único `npm run ci:verify`;
- auditoria de reprodutibilidade reforçada para identidade do lockfile, peer dependencies e Supabase CLI;
- PR gate passa a executar o conjunto reproduzível consolidado.

## Próximos candidatos

- extrair constantes/tipos independentes de `App.tsx`;
- mapear transforms que podem ser removidos por incorporação direta;
- revisar casts `any` em `src/lib/services.ts` e mounts administrativos;
- auditar scripts de patch antigos sem remover automaticamente;
- revisar vulnerabilidades npm em PR isolado, sem `npm audit fix --force`.
