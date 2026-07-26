---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/app/OperationsPage.tsx
  - src/app/App.tsx
  - supabase/migrations/20260719000009_transfers_refunds_checkin_operations.sql
  - docs/10-dominios/checkin-reembolsos-e-operacao.md
---

# Runbook — operação no dia do evento

## Objetivo

Operar entrada, check-in, QR Code, busca textual, vouchers e contingências com segurança e rastreabilidade.

## Quando executar

Durante a preparação final, abertura dos portões e período de entrada do HC 20 Anos.

## Responsáveis

Definir antes do evento:

- líder de operação;
- responsável técnico;
- equipe de check-in;
- equipe de suporte ao comprador;
- responsável por vouchers;
- responsável por incidentes e escalonamento;
- administrador habilitado para decisões excepcionais.

## Permissões

- equipe de check-in: role mínima necessária;
- líderes: acesso ao dashboard e suporte;
- reembolsos ou alterações financeiras: somente `admin`/`superadmin`;
- acesso técnico ao Supabase: restrito.

Revisar e remover acessos temporários após o evento.

## Preparação — 7 a 2 dias antes

- [ ] Confirmar data, horário, local e conectividade.
- [ ] Validar deployment da Vercel.
- [ ] Validar Edge Functions e Supabase.
- [ ] Confirmar migrations aplicadas.
- [ ] Executar build e testes relevantes.
- [ ] Testar login de cada operador.
- [ ] Confirmar roles.
- [ ] Testar `/admin/operacao` e `/admin/checkin`.
- [ ] Testar QR real de pedido aprovado de teste.
- [ ] Testar código textual.
- [ ] Testar ingresso já utilizado.
- [ ] Testar ingresso pendente, reembolsado e inexistente.
- [ ] Testar câmera em dispositivos reais.
- [ ] Testar fallback em navegador sem `BarcodeDetector`.
- [ ] Confirmar carregadores, baterias e rede reserva.
- [ ] Definir procedimento de contingência.
- [ ] Confirmar canal interno de comunicação.

Não usar ingresso real de participante para teste sem autorização e posterior correção auditada.

## Preparação — no dia, antes da abertura

1. Confirmar status da Vercel e Supabase.
2. Abrir dashboard de operação.
3. Validar atualização de métricas.
4. Executar check-in de teste controlado.
5. Reverter ou usar ingresso técnico próprio do ambiente.
6. Confirmar horário dos dispositivos.
7. Testar câmera, foco e iluminação.
8. Confirmar lista de operadores e posições.
9. Distribuir responsabilidades e escalonamento.
10. Registrar início da operação.

## Estação de check-in

Cada estação deve possuir:

- dispositivo carregado;
- navegador atualizado;
- acesso autenticado individual;
- câmera autorizada;
- conexão principal e alternativa;
- acesso ao código textual;
- identificação do operador;
- canal de suporte.

Não compartilhar uma única conta administrativa entre toda a equipe.

## Fluxo normal

1. Solicitar QR Code individual.
2. Ler pelo scanner.
3. Conferir nome e resultado retornado.
4. Executar check-in somente pela RPC/tela oficial.
5. Confirmar mensagem de sucesso.
6. Entregar vouchers elegíveis.
7. Liberar entrada.

Não liberar entrada apenas porque o QR “parece válido”.

## Resultado: aprovado

Confirmar:

- nome do titular;
- produto ou categoria quando necessário;
- check-in registrado;
- horário e operador;
- vouchers pendentes.

## Resultado: já utilizado

- não executar novamente;
- verificar horário e operador anteriores;
- confirmar identidade do portador;
- encaminhar ao líder;
- não editar `checked_in` diretamente;
- registrar ocorrência quando houver suspeita de compartilhamento.

## Resultado: pendente ou não aprovado

- não liberar pelo fluxo normal;
- confirmar pedido na Área do Comprador;
- consultar status financeiro administrativo;
- se o Mercado Pago mostrar aprovado e o banco divergir, seguir o runbook de webhook;
- não marcar pedido manualmente como aprovado.

## Resultado: reembolsado, cancelado ou transferido

- não liberar com o QR antigo;
- consultar histórico;
- em transferência, solicitar ingresso atual do novo titular;
- escalar contestação ao líder.

## Resultado: não encontrado

1. Tentar novamente com iluminação adequada.
2. Usar código textual.
3. Buscar por dados permitidos na operação.
4. Confirmar evento correto.
5. Encaminhar ao suporte se persistir.

Não criar ingresso improvisado no banco.

## Vouchers e fichas

Antes de entregar:

- confirmar participante;
- consultar quantidade elegível;
- registrar entrega na tela;
- confirmar sucesso;
- entregar quantidade exata.

Se a tela indicar já entregue, não duplicar sem decisão do líder e registro de ocorrência.

## Conectividade instável

### Rede principal falhou

- mudar para rede reserva;
- manter as estações autenticadas;
- reduzir consultas não essenciais;
- confirmar cada resposta antes de liberar.

### Sistema indisponível

Ativar contingência somente por decisão do líder.

A contingência deve priorizar:

- lista previamente preparada com dados mínimos;
- registro manual de código, horário e operador;
- marcação clara de entrada provisória;
- reconciliação posterior antes de importar qualquer dado.

Não exportar dados pessoais excessivos nem circular planilhas abertas sem controle.

## Contingência manual mínima

Registrar:

- código reduzido do ingresso;
- nome;
- horário;
- estação e operador;
- motivo da contingência;
- vouchers entregues;
- observação de conflito.

Depois da restauração:

1. reconciliar cada registro;
2. executar check-in pela operação oficial quando válido;
3. identificar duplicidades;
4. preservar a folha ou arquivo como evidência controlada;
5. eliminar cópias desnecessárias.

## Monitoramento durante o evento

Acompanhar:

- total de check-ins;
- taxa por intervalo;
- falhas de leitura;
- já utilizados;
- pendentes;
- tempo médio por pessoa;
- fila física;
- disponibilidade do sistema;
- vouchers restantes;
- incidentes de identidade ou acesso.

## Incidentes

Abrir incidente quando houver:

- indisponibilidade geral;
- check-ins duplicados em escala;
- vazamento de lista ou token;
- usuário não autorizado operando;
- divergência financeira recorrente;
- QR Codes válidos rejeitados em massa;
- vouchers duplicados em massa.

Seguir [`resposta-a-incidentes.md`](./resposta-a-incidentes.md).

## Encerramento

- [ ] Registrar horário de encerramento.
- [ ] Confirmar sincronização dos check-ins.
- [ ] Reconciliar contingências manuais.
- [ ] Revisar vouchers.
- [ ] Exportar métricas autorizadas.
- [ ] Preservar logs e evidências.
- [ ] Revogar acessos temporários.
- [ ] Recolher dispositivos e materiais.
- [ ] Registrar incidentes e decisões.
- [ ] Produzir relatório pós-operação.

## Evidências

- lista de operadores e roles;
- testes pré-abertura;
- horários de início e fim;
- métricas agregadas;
- registros de contingência;
- incidentes;
- reconciliação final.

Não guardar QR tokens completos, documentos ou dados financeiros em relatórios gerais.

## Critérios para promoção a `canonical`

Este runbook só deve ser promovido depois de:

- simulação presencial completa;
- teste em dispositivos reais;
- teste de conectividade alternativa;
- validação do fluxo de contingência;
- definição nominal dos responsáveis;
- revisão pós-evento ou ensaio geral.
