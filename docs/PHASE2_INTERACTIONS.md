---
status: historical
owner: tuliust
period: 2026-07-05
last_verified: 2026-07-26
last_verified_commit: fe3c9a12bd1e1d15f15ef85af8a546b2a2b69928
superseded_by:
  - docs/10-dominios/acervo-fotos-e-moderacao.md
  - docs/10-dominios/memorias-curiosidades-e-enquetes.md
  - docs/10-dominios/pessoas-perfis-e-privacidade.md
---

# Fase 2 — interações

Este documento preserva o registro do incremento que introduziu:

- curtidas e comentários em fotos;
- memórias e moderação;
- destaques editoriais;
- enquetes;
- mapa de localização autorizada;
- convite compartilhável.

## Migrations da fase

- `20260705000005_phase2_interactions.sql`;
- `20260705000006_polls_where_archive.sql`.

## Classificação

Este é um registro histórico de implementação, não a especificação vigente. As regras atuais estão em:

- [`10-dominios/acervo-fotos-e-moderacao.md`](./10-dominios/acervo-fotos-e-moderacao.md);
- [`10-dominios/memorias-curiosidades-e-enquetes.md`](./10-dominios/memorias-curiosidades-e-enquetes.md);
- [`10-dominios/pessoas-perfis-e-privacidade.md`](./10-dominios/pessoas-perfis-e-privacidade.md).

O estado atual do banco depende de todas as migrations posteriores, não apenas das migrations desta fase.
