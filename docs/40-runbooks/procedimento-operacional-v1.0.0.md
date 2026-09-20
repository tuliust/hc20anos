---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - src/app/OperationsPage.tsx
  - src/app/CheckinScanner.tsx
  - supabase/tests/transfers_refunds_checkin.sql
  - docs/40-runbooks/operacao-no-dia-do-evento.md
  - docs/40-runbooks/resposta-a-incidentes.md
  - docs/40-runbooks/rollback.md
  - docs/30-contratos/release-v1.0.0.md
---

# Procedimento operacional mínimo — release v1.0.0

## Objetivo

Definir o procedimento mínimo executável para entrada/check-in, contingência, incidentes e recuperação na baseline v1.0.0.

Este documento consolida decisões operacionais. Os runbooks especializados continuam sendo a referência detalhada.

## 1. Check-in normal

1. Operador acessa a área de operação com credencial individual.
2. Lê o QR pela câmera; se necessário, usa o código textual.
3. Confere o titular retornado pelo sistema.
4. Executa o check-in exclusivamente pela tela/RPC oficial.
5. Confirma sucesso antes de liberar a entrada.
6. Confere e registra vouchers quando aplicável.
7. Em segunda leitura, a operação deve retornar `ticket_already_checked_in`; nunca corrigir esse caso alterando a tabela diretamente.

Escalar ao líder quando houver ingresso pendente, cancelado, transferido, reembolsado, não encontrado ou divergência de identidade.

## 2. Contingência de conectividade

### Rede principal indisponível

- migrar as estações para a rede reserva;
- manter autenticação individual;
- reduzir consultas não essenciais;
- confirmar visualmente cada resposta do sistema.

### Aplicação ou backend indisponível

A contingência manual só pode ser ativada pelo líder da operação.

Registrar apenas:

- código reduzido do ingresso;
- nome;
- horário;
- operador/estação;
- motivo;
- vouchers entregues;
- observação de conflito.

Não armazenar QR completo, documento, dado financeiro ou token.

Quando o serviço retornar:

1. reconciliar cada entrada;
2. executar o check-in oficial quando válido;
3. identificar duplicidades;
4. registrar divergências;
5. preservar uma única evidência controlada;
6. destruir cópias temporárias desnecessárias.

## 3. Incidentes

Classificação mínima:

- **SEV-1:** indisponibilidade total na entrada, vazamento de dados/credenciais, duplicidade em escala, incidente financeiro crítico;
- **SEV-2:** degradação relevante com impacto em múltiplos usuários;
- **SEV-3:** falha isolada com contorno seguro.

Ao abrir incidente:

1. registrar horário, ambiente e sintoma;
2. nomear incident commander;
3. congelar mudanças concorrentes;
4. preservar logs e IDs;
5. conter o menor escopo possível;
6. separar fatos de hipóteses;
7. aplicar correção ou rollback;
8. validar fluxo afetado;
9. registrar encerramento e follow-ups.

## 4. Recuperação

### Frontend/Vercel

Promover deployment anterior estável ou reverter o commit causador. Confirmar domínio, rotas, autenticação e funções server-side.

### Edge Function

Republicar apenas a função afetada a partir do código estável. Fazer smoke test sem efeito financeiro real e reconciliar eventos acumulados.

### Banco/RPC/RLS

Nunca apagar ou editar migration aplicada.

1. conter consumidores incompatíveis;
2. reproduzir localmente;
3. criar migration corretiva;
4. adicionar teste de regressão;
5. replay completo em banco vazio;
6. aplicar pelo procedimento autorizado;
7. validar RLS, grants, RPCs e dados afetados.

### Pagamentos

- preservar `payment_events`;
- reconciliar com Mercado Pago;
- impedir reprocessamento concorrente;
- não gerar ingresso ou reembolso manualmente sem confirmar estado no provedor;
- manter idempotência.

### Notificações

Falha de e-mail/WhatsApp não deve reverter pagamento aprovado. Preservar jobs, corrigir configuração/provider e reprocessar apenas após verificar idempotência.

## 5. Critérios de retomada

Retomar o fluxo normal somente quando:

- causa imediata estiver contida;
- correção ou rollback estiver aplicado;
- dados afetados estiverem reconciliados;
- teste do fluxo crítico passar;
- logs não mostrarem repetição do erro;
- operação e responsável técnico concordarem;
- contingência temporária estiver documentada.

## 6. Evidências obrigatórias

Registrar, sem dados sensíveis:

- início/fim;
- operadores;
- incidentes;
- quantidade agregada de check-ins;
- uso de contingência;
- SHA/deployment afetado;
- ação de recuperação;
- validação final.

## Referências detalhadas

- [`operacao-no-dia-do-evento.md`](./operacao-no-dia-do-evento.md)
- [`resposta-a-incidentes.md`](./resposta-a-incidentes.md)
- [`rollback.md`](./rollback.md)
- [`migrations.md`](./migrations.md)
- [`investigacao-de-webhook.md`](./investigacao-de-webhook.md)
- [`notificacoes.md`](./notificacoes.md)
- [`reembolsos.md`](./reembolsos.md)
