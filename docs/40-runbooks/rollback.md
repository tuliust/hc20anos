---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: a6fd273c8d7ca863ee672e428d728941559acc4a
source_files:
  - vercel.json
  - package.json
  - supabase/migrations/
  - supabase/functions/
  - docs/40-runbooks/deploy-vercel.md
  - docs/40-runbooks/deploy-edge-functions.md
  - docs/40-runbooks/migrations.md
---

# Rollback e recuperação

## Objetivo

Restaurar serviço estável com o menor impacto possível, sem apagar evidências nem introduzir divergência adicional entre aplicação, functions e banco.

## Princípios

1. contenha antes de modificar;
2. identifique o componente causador;
3. reverta somente o menor escopo necessário;
4. preserve pedidos, pagamentos, eventos, jobs e logs;
5. não edite migrations já aplicadas;
6. valide o fluxo afetado após a recuperação;
7. registre causa, ação e estado final.

## Classificação inicial

| Componente | Exemplos de falha | Estratégia inicial |
|---|---|---|
| frontend Vercel | página em branco, rota quebrada, CSS ausente | promover deployment anterior ou reverter commit; |
| Vercel Function | `/api/checkout-create` ou mini bio falhando | reverter arquivo/commit e redeploy Vercel; |
| Edge Function | webhook, checkout, worker ou reembolso falhando | republicar versão estável da function afetada; |
| banco/RPC/RLS | erro de migration, permissão, cálculo ou transição | conter consumidores e criar migration corretiva; |
| integração externa | Mercado Pago, Resend, WhatsApp ou OpenAI indisponível | desabilitar função dependente ou manter fila/retry; |
| configuração | secret, URL ou ambiente incorreto | corrigir configuração e redeploy sem expor valor. |

## Contenção

Antes do rollback:

- interrompa novos deploys concorrentes;
- identifique commit e horário da regressão;
- confirme ambiente afetado;
- pause vendas quando houver risco financeiro ou de inventário;
- evite processar reembolsos durante incerteza de estado;
- preserve logs e IDs necessários à reconciliação;
- não copie secrets ou payloads pessoais para canais públicos.

## Frontend e Vercel Functions

### Opção A — promover deployment anterior

Use quando o último deployment estável é conhecido e não depende de schema incompatível.

1. selecione o deployment anterior no painel Vercel;
2. promova-o para produção;
3. valide domínio, rotas e funções `api/`;
4. registre o SHA correspondente.

### Opção B — reverter commit

Use quando a linha principal precisa refletir a reversão:

1. crie um commit de revert do commit causador;
2. publique em `main`;
3. acompanhe o novo deployment;
4. valide o fluxo afetado.

Não altere banco ou Edge Functions para corrigir falha estritamente visual.

## Supabase Edge Functions

1. identifique a function afetada;
2. restaure o conteúdo da última versão estável;
3. publique apenas essa function com o script npm correspondente;
4. valide autenticação, CORS e resposta de erro;
5. execute smoke test sem efeito financeiro real;
6. reconcilie eventos recebidos durante a falha.

Comandos disponíveis:

```bash
npm run supabase:deploy:checkout
npm run supabase:deploy:webhook
npm run supabase:deploy:notifications
npm run supabase:deploy:refunds
```

Evite publicar todas as functions quando apenas uma está afetada.

## Banco e migrations

Não existe rollback seguro baseado em apagar ou editar migration aplicada.

Para corrigir:

1. contenha aplicação ou function incompatível;
2. reproduza o problema localmente com replay completo;
3. crie nova migration corretiva;
4. adicione teste SQL que reproduza a falha;
5. execute auditoria, replay, testes e build;
6. aplique a correção pelo procedimento remoto autorizado;
7. valide RLS, grants, RPCs e dados afetados.

Quando possível, restaure compatibilidade em vez de remover imediatamente estruturas novas.

## Pagamentos e webhook

Durante incidente financeiro:

- não altere manualmente `payment_status` sem reconciliação com o provedor;
- preserve `payment_events` e provider payloads;
- compare `external_reference`, valor, moeda, preferência e payment ID;
- trate eventos duplicados idempotentemente;
- não gere ingressos manualmente antes de confirmar o pagamento;
- não execute reembolso repetido para a mesma solicitação.

Após restaurar o webhook, reavalie eventos com `processing_status='failed'` ou equivalente por procedimento controlado.

## Notificações

Falha de e-mail ou WhatsApp não deve reverter pagamento aprovado.

1. preserve os jobs pendentes ou falhos;
2. corrija provider, template ou secret;
3. reexecute o worker com chave válida;
4. confirme idempotência e quantidade de tentativas;
5. evite envio duplicado ao destinatário.

## Reembolsos

Antes de repetir processamento:

- confirme status da solicitação;
- consulte o reembolso no Mercado Pago;
- verifique a chave idempotente `hc20-refund-<request_id>`;
- confira se inventário já foi restaurado;
- confira se ingressos já foram invalidados;
- não repita a chamada ao provedor sem reconciliação.

## Validação final

- componente voltou à versão estável;
- domínio e rotas respondem;
- autenticação e autorização funcionam;
- checkout não usa ambiente incorreto;
- webhook rejeita assinatura inválida;
- nenhum pagamento ou ingresso foi duplicado;
- filas e eventos permanecem auditáveis;
- erro original não é reproduzido;
- nenhuma credencial foi exposta durante a investigação.

## Registro pós-incidente

Documente:

- início e fim;
- ambiente;
- impacto;
- commit/deployment causador;
- componente revertido;
- evidências preservadas;
- validações executadas;
- pendências e ação preventiva;
- necessidade de ADR ou teste adicional.

## Estado de validação

As estratégias correspondem à arquitetura atual, mas o procedimento completo ainda não foi ensaiado em ambiente controlado. Permanece `draft`.