---
status: draft
owner: tuliust
last_verified: 2026-09-20
source_files:
  - docs/30-contratos/release-v1.0.0.md
  - docs/30-contratos/release-readiness-pos-v1.0.0.md
  - docs/40-runbooks/procedimento-operacional-v1.0.0.md
  - docs/40-runbooks/operacao-no-dia-do-evento.md
  - docs/40-runbooks/resposta-a-incidentes.md
  - docs/40-runbooks/rollback.md
---

# Checklist de homologação final

## Uso

Este checklist fecha a lacuna entre uma baseline tecnicamente validada e a operação real. Marcar um item como concluído exige evidência correspondente; não inferir homologação física a partir de testes automatizados.

## A. Baseline técnica

- [ ] SHA candidato identificado.
- [ ] PR correspondente mergeado por fluxo protegido.
- [ ] `npm ci` executado sem alteração de lockfile.
- [ ] `npm run ci:verify` aprovado.
- [ ] workflows de banco e segurança aprovados.
- [ ] contratos gerados sincronizados.
- [ ] deployment correspondente ao SHA identificado.

## B. Check-in físico

- [ ] login com operador individual no aparelho de entrada;
- [ ] câmera lê um QR real;
- [ ] primeira leitura registra sucesso;
- [ ] horário persistido conferido;
- [ ] operador persistido conferido;
- [ ] segunda leitura do mesmo ingresso retorna bloqueio de reutilização;
- [ ] busca textual/código alternativo testado;
- [ ] vouchers, quando aplicáveis, conferidos.

### Evidência mínima

Registrar somente IDs técnicos necessários, horário, operador e resultado. Não anexar QR completo, documento ou dado financeiro sensível.

## C. Contingência da recepção

- [ ] câmera indisponível;
- [ ] internet principal indisponível;
- [ ] rede reserva;
- [ ] participante sem QR;
- [ ] procedimento manual autorizado pelo líder;
- [ ] reconciliação posterior ensaiada;
- [ ] responsável por decisão identificado.

## D. Mobile

- [ ] iPhone/Safari;
- [ ] Android/Chrome;
- [ ] cadastro/login;
- [ ] reivindicação de perfil;
- [ ] edição de perfil/avatar;
- [ ] compra e retorno do pagamento;
- [ ] acesso ao ingresso;
- [ ] rotas públicas críticas;
- [ ] modais e scroll em telas pequenas.

## E. Financeiro

Executar somente com autorização e transação identificada.

- [ ] checkout criado;
- [ ] pagamento realizado;
- [ ] webhook recebido no tempo esperado;
- [ ] pedido aprovado;
- [ ] participantes/tickets emitidos;
- [ ] notificação correspondente gerada;
- [ ] ausência de duplicidade conferida.

## F. Transferência, cancelamento e reembolso

- [ ] transferência controlada;
- [ ] QR/ingresso anterior invalidado conforme regra;
- [ ] destinatário correto;
- [ ] cancelamento controlado;
- [ ] reembolso autorizado e conciliado com provedor;
- [ ] inventário restaurado quando aplicável;
- [ ] tickets invalidados quando aplicável.

## G. WhatsApp

Enquanto o canal estiver desabilitado, registrar como não habilitado, não como falha.

Antes da ativação:

- [ ] templates aprovados no provedor;
- [ ] quantidade e ordem das variáveis conferidas contra o worker;
- [ ] configuração/secrets validados;
- [ ] um envio controlado autorizado;
- [ ] provider message ID e retorno conferidos;
- [ ] duplicidade descartada;
- [ ] decisão explícita sobre jobs históricos.

## H. Incidente e rollback

- [ ] responsável/incident commander definido;
- [ ] rede/canal de comunicação de contingência definido;
- [ ] rollback de frontend revisado;
- [ ] rollback de Edge Function revisado;
- [ ] procedimento de migration corretiva revisado;
- [ ] regra financeira de não correção manual revisada;
- [ ] evidências de fechamento definidas.

## Critério de encerramento

A homologação final só pode ser marcada como concluída quando:

1. não houver falha crítica aberta;
2. pendências aceitas estiverem explicitamente registradas;
3. evidências automatizadas e manuais estiverem separadas;
4. o SHA operacional estiver identificado;
5. responsáveis de operação e tecnologia concordarem com a retomada/entrada em produção.
