---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - docs/00-visao-geral/arquitetura.md
  - docs/10-dominios/
  - docs/40-runbooks/rollback.md
  - .github/workflows/database-migrations.yml
---

# Runbook — resposta a incidentes

## Objetivo

Coordenar identificação, contenção, recuperação e aprendizado em incidentes de disponibilidade, segurança, dados, pagamentos e operação do HC 20 Anos.

## Princípios

- Proteger pessoas e dados antes de restaurar conveniência.
- Não apagar evidências.
- Não corrigir produção por alterações manuais não rastreadas.
- Separar estado observado de hipótese.
- Definir uma pessoa responsável pela coordenação.
- Comunicar fatos confirmados e incertezas explicitamente.
- Preservar eventos financeiros e trilhas administrativas.

## Classificação de severidade

### SEV-1 — crítico

Exemplos:

- vazamento de credencial ou dado pessoal relevante;
- pagamento aplicado ao pedido errado;
- indisponibilidade total durante entrada do evento;
- emissão ou check-in duplicado em escala;
- alteração não autorizada de dados financeiros;
- comprometimento de conta administrativa privilegiada.

Resposta imediata, contenção prioritária e comunicação executiva.

### SEV-2 — alto

Exemplos:

- checkout indisponível;
- webhook falhando para múltiplos pagamentos;
- fila de notificações parada;
- catálogo ou CMS público incorreto com impacto relevante;
- área administrativa parcialmente indisponível;
- reembolso inconsistente sem perda confirmada.

Resposta rápida e acompanhamento até estabilização.

### SEV-3 — moderado

Exemplos:

- erro isolado de usuário;
- falha de notificação individual;
- problema visual sem perda funcional;
- conteúdo editorial incorreto sem exposição sensível;
- operação manual disponível como contorno seguro.

Tratamento programado, preservando registro.

## Papéis

### Incident commander

- coordena ações;
- define severidade;
- controla prioridades;
- aprova contenção e retomada;
- mantém linha do tempo.

### Responsável técnico

- investiga logs, código e infraestrutura;
- propõe correção e rollback;
- valida recuperação.

### Responsável de negócio/operação

- avalia impacto em participantes;
- organiza contingência;
- valida regras comerciais e de atendimento.

### Comunicação

- prepara mensagens internas e externas;
- evita especulação;
- registra públicos e horários de envio.

Uma pessoa pode acumular papéis em incidente pequeno, mas o incident commander deve permanecer explícito.

## Ativação

Ao detectar incidente:

1. registrar horário e relator;
2. descrever sintoma sem inferir causa;
3. identificar ambiente e componente;
4. classificar severidade inicial;
5. nomear incident commander;
6. abrir canal e registro central;
7. limitar mudanças concorrentes.

## Registro inicial

```text
Incidente:
Severidade inicial:
Início observado:
Ambiente:
Sintoma:
Impacto conhecido:
Dados/pagamentos envolvidos:
Incident commander:
Responsável técnico:
Última alteração conhecida:
```

Não incluir secrets ou dados pessoais completos.

## Contenção

Escolher a menor ação que interrompa o dano.

Possibilidades:

- pausar vendas;
- desabilitar uma ação administrativa;
- interromper worker de notificações;
- bloquear credencial comprometida;
- revogar sessão ou role;
- retirar deployment da produção;
- usar rollback de frontend ou Edge Function;
- ativar contingência de check-in;
- ocultar conteúdo público indevido;
- impedir novo processamento de reembolso.

Não excluir registros para “limpar” o incidente.

## Investigação

Construir linha do tempo com:

- deployments;
- migrations;
- alterações de configuração;
- logs da Vercel;
- logs das Edge Functions;
- `payment_events`;
- `notification_jobs`;
- `audit_logs`;
- pedidos e ingressos afetados;
- status de provedores externos;
- relatos dos usuários.

Separar:

- fatos confirmados;
- hipóteses;
- ações executadas;
- resultados.

## Componentes e runbooks especializados

| Sintoma | Runbook |
|---|---|
| pagamento/webhook divergente | [`investigacao-de-webhook.md`](./investigacao-de-webhook.md) |
| notificações paradas | [`notificacoes.md`](./notificacoes.md) |
| reembolso inconsistente | [`reembolsos.md`](./reembolsos.md) |
| entrada/check-in | [`operacao-no-dia-do-evento.md`](./operacao-no-dia-do-evento.md) |
| deployment ou regressão | [`rollback.md`](./rollback.md) |
| migrations | [`migrations.md`](./migrations.md) |

## Credencial comprometida

1. revogar ou rotacionar imediatamente;
2. identificar onde foi exposta;
3. revisar logs de uso;
4. atualizar ambientes necessários;
5. republicar Functions quando aplicável;
6. validar que a credencial antiga deixou de funcionar;
7. remover a credencial de commits, logs e artefatos;
8. avaliar impacto e obrigação de comunicação.

Não apenas criar uma nova chave mantendo a antiga ativa.

## Dados pessoais expostos

1. interromper a exposição;
2. preservar evidências e escopo;
3. identificar campos, pessoas e duração;
4. restringir acesso aos registros da investigação;
5. consultar orientação jurídica/privacidade quando necessário;
6. corrigir consulta, policy ou conteúdo;
7. validar páginas, caches e exports;
8. documentar comunicação e prevenção.

## Incidente financeiro

- pausar operações afetadas;
- reconciliar com Mercado Pago;
- não confiar no retorno do navegador;
- preservar pedidos, eventos e respostas do provedor;
- impedir reprocessamento concorrente;
- usar RPC ou correção revisada;
- confirmar valor, moeda, recebedor e ambiente;
- revisar ingressos e inventário.

## Recuperação

Antes de retomar:

- causa imediata contida;
- correção ou rollback aplicado;
- dados reconciliados;
- testes do fluxo afetado executados;
- logs sem erro recorrente;
- responsáveis de negócio e técnico concordam;
- monitoramento reforçado ativo;
- comunicação preparada.

Retomar gradualmente quando possível.

## Validação pós-recuperação

- verificar experiência pública;
- verificar login e áreas protegidas;
- verificar catálogo e CMS;
- verificar checkout de teste;
- verificar Functions afetadas;
- verificar banco e migrations;
- verificar fila de notificações;
- verificar operação administrativa;
- verificar que a contenção temporária não permaneceu indevidamente.

## Comunicação

Atualizações devem conter:

- o que está afetado;
- quando começou;
- impacto confirmado;
- contorno disponível;
- ação atual;
- próxima atualização.

Evitar atribuir causa antes da confirmação.

## Encerramento

Um incidente pode ser encerrado quando:

- serviço está estável;
- dados foram reconciliados;
- riscos residuais são conhecidos;
- ações temporárias foram removidas ou registradas;
- usuários afetados receberam orientação necessária;
- follow-ups possuem responsável.

## Pós-incidente

Produzir registro com:

1. resumo executivo;
2. impacto;
3. linha do tempo;
4. causa raiz e fatores contribuintes;
5. detecção;
6. resposta e recuperação;
7. o que funcionou;
8. o que falhou;
9. ações corretivas;
10. responsáveis e prazos;
11. atualização de documentação, testes e monitoramento.

Não usar o pós-incidente para buscar culpados. O objetivo é reduzir recorrência.

## Evidências mínimas

- logs e IDs técnicos;
- commits e deployments;
- migrations relacionadas;
- estados antes e depois;
- decisões e responsáveis;
- comunicações;
- validações finais.

## Critérios para promoção a `canonical`

- simulação de incidente executada;
- responsáveis definidos;
- canais de comunicação confirmados;
- rollback testado;
- ao menos um cenário de pagamento, dados e operação ensaiado;
- revisão pós-simulação incorporada.
