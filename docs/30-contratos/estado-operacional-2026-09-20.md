---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - .github/workflows/pr-gate.yml
  - supabase/migrations/
  - supabase/tests/transfers_refunds_checkin.sql
  - docs/40-runbooks/migrations.md
  - docs/40-runbooks/fase-3-financeiro.md
---

# Estado operacional — 20/09/2026

Este documento registra um snapshot factual do HC 20 Anos em 20/09/2026. Ele separa o que está implementado e observado no ambiente remoto do que ainda depende de homologação operacional completa.

## Implementação e governança concluídas

- a branch de produção é `main`;
- `main` está protegida por fluxo PR-only;
- o check **PR gate** é obrigatório antes do merge;
- uma tentativa de merge da PR #85 foi rejeitada enquanto o **PR gate** estava em andamento e aceita somente depois da conclusão do check;
- o workflow `.github/workflows/pr-gate.yml` valida política de `main`, migrations, documentação e build;
- o histórico remoto do Supabase contém **133 migrations**;
- o repositório contém a mesma sequência, incluindo as migrations `20260920052932_whatsapp_notification_channel_guard` e `20260920054440_fix_checkin_reuse_validation`;
- o estado remoto e o repositório estão reconciliados em **133 / 133** migrations.

A proteção da `main` e a obrigatoriedade do **PR gate** estão concluídas. A configuração de métodos de merge não está totalmente restrita a squash: o repositório ainda permite merge commit, squash e rebase no nível de configuração. Isso é uma pendência de governança separada da proteção PR-only.

## Evidência financeira e de emissão observada

No Supabase `EventoHC`:

- **2 pedidos** estão com pagamento aprovado;
- esses pedidos possuem **3 participantes ativos**;
- foram emitidos **3 ingressos**;
- os três ingressos estão vinculados aos participantes, sem órfãos;
- existem **3 jobs `ticket_issued` enviados por e-mail**, um por ingresso;
- não foi encontrada duplicidade de `idempotency_key` na fila de notificações.

Essa evidência comprova que o caminho de reconciliação financeira, emissão e e-mail produziu efeitos reais no banco. Ela não equivale, isoladamente, à homologação completa do fluxo de compra em tempo real.

## Divergência temporal observada

Os dois pagamentos foram efetuados em 17/09/2026, mas os primeiros webhooks válidos correspondentes só chegaram ao sistema em 19/09/2026. Nesse intervalo, os pedidos chegaram a passar pelo fluxo local de expiração e houve envio de comunicação de expiração antes da reconciliação posterior.

Portanto, permanece pendente comprovar em um novo ensaio controlado que:

- o webhook válido chega dentro da janela operacional esperada;
- o pedido não expira localmente depois de um pagamento já aprovado no provedor;
- a sequência `checkout → pagamento → webhook → aprovação → ingresso → e-mail` ocorre sem reconciliação tardia.

## Check-in

A RPC `perform_ticket_checkin` foi validada em transação com rollback:

- registra operador;
- registra horário;
- altera o ingresso para utilizado;
- grava `checkin_events`;
- impede reutilização do mesmo QR com `ticket_already_checked_in`.

A correção de reutilização foi versionada na migration `20260920054440_fix_checkin_reuse_validation` e mergeada pela PR #85.

O ensaio físico ainda não está homologado: no snapshot deste documento existem **0 ingressos com check-in persistido** e **0 registros em `checkin_events`**.

## Homologação ainda pendente

Continuam pendentes como evidência operacional completa:

- novo ciclo financeiro real com webhook em tempo adequado;
- transferência e cancelamento com invalidação comprovada do QR anterior;
- reembolso integrado e restauração de inventário;
- retentativas de notificações em cenários controlados;
- ativação e homologação do WhatsApp após configuração do provedor e templates;
- check-in físico com câmera/dispositivo, horário, operador e tentativa de reuso;
- QA em iPhone/Safari e Android/Chrome;
- incidentes, contingência e rollback;
- release/tag estável após os gates finais.

## Regra de interpretação

**Implementado** significa que código, migrations, configuração ou contrato estão presentes e validados tecnicamente.

**Evidenciado em produção** significa que houve registro remoto observável, como pedido aprovado, ingresso ou job enviado.

**Homologado** exige que o cenário operacional completo tenha sido executado de ponta a ponta, com resultado esperado, evidência suficiente e sem divergência relevante não explicada.
