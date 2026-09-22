---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - package.json
  - package-lock.json
  - .nvmrc
  - .github/workflows/pr-gate.yml
  - .github/workflows/release-stable.yml
  - .github/workflows/database-migrations.yml
  - .github/workflows/phase1-environment-security.yml
  - .github/workflows/phase2-content-storage.yml
  - docs/30-contratos/estado-operacional-2026-09-20.md
  - docs/30-contratos/advisors-2026-09-20.md
  - docs/40-runbooks/operacao-no-dia-do-evento.md
  - docs/40-runbooks/resposta-a-incidentes.md
  - docs/40-runbooks/rollback.md
---

# Release estável v1.0.0 — evidências e pendências aceitas

## Objetivo

Consolidar a baseline técnica liberável do HC 20 Anos em 20/09/2026, registrar as evidências que sustentam a release e separar explicitamente riscos aceitos de homologações ainda pendentes.

A designação **estável** significa que o código versionado passou pelos gates automatizados e pelo replay local integral das migrations. Não significa que todos os cenários físicos, financeiros externos e de contingência já tenham sido ensaiados em produção.

## Baseline da release

- versão: `1.0.0`;
- tag: `v1.0.0`;
- runtime: Node.js `22.23.2`;
- package manager: npm `10.9.8`;
- Supabase CLI validada: `2.109.1`;
- lockfile: npm lockfile v3;
- banco remoto: projeto `EventoHC`;
- migrations remotas observadas em 20/09/2026: **134**;
- canal transacional vigente: **e-mail**.

A tag é criada pelo workflow `Stable release` somente sobre um commit de `main` que execute com sucesso as verificações de release no mesmo SHA.

## Evidências consolidadas

### CI e reprodutibilidade

A baseline exige sucesso em:

- `npm ci`;
- `npm run audit:reproducibility`;
- `npm run audit:migrations`;
- `npm run audit:docs`;
- `npm run docs:check-contracts`;
- `npm run docs:check-routes`;
- `npm run docs:check-type-compatibility`;
- `npm run docs:check-type-consumers`;
- `npm run docs:check-rpc-usage`;
- `npm run build`.

O PR de preparação da release deve também passar pelos workflows já existentes de banco, segurança, Storage e regressões funcionais.

### Banco e Supabase

Em 20/09/2026 foram observados:

- sequência remota de migrations incluindo `20260920071001_advisor_batch1_indexes_rls_permissions`;
- Edge Functions de checkout, webhook, notificações, reembolso e Storage ativas;
- **2 pedidos aprovados**;
- **3 participantes ativos**;
- **3 ingressos emitidos**;
- **0 eventos de check-in persistidos**;
- notificações transacionais por e-mail ativas conforme configuração do worker.

A ausência de `checkin_events` persistidos é compatível com o ensaio técnico feito com rollback e não deve ser interpretada como homologação física.

### Check-in

A lógica server-side vigente comprova:

- registro de operador;
- registro de horário;
- criação de `checkin_events`;
- transição do ingresso para utilizado;
- rejeição de reutilização com `ticket_already_checked_in`.

A cobertura automatizada valida autorização de `checkin_staff`, operação, vouchers e segregação de indicadores financeiros.

### Segurança e contratos

Os contratos estáticos, tipos de banco, RPCs consumidas e documentação gerada são validados por CI. Os Advisors do Supabase ainda possuem itens conhecidos e aceitos para tratamento incremental; eles não foram ocultados nem classificados como resolvidos por esta release.

## Pendências aceitas

Estas pendências **não bloqueiam a criação da baseline de código v1.0.0**, mas permanecem abertas operacionalmente:

1. **Supabase CLI:** o projeto está congelado em `2.109.1`. Há versão posterior disponível. A atualização deve ocorrer em mudança isolada, seguida de replay integral das migrations e de todas as suítes de banco.
2. **Dependências npm:** `npm ci` reporta atualmente **3 vulnerabilidades conhecidas (1 moderada e 2 altas)**. Não aplicar `npm audit fix` automaticamente na release. Tratar em mudança específica de dívida técnica com revisão dos upgrades.
3. **Notificações:** validar entrega efetiva dos e-mails transacionais em ensaio controlado.
4. **Fluxo financeiro externo:** ainda requer novo ciclo controlado `checkout → pagamento → webhook → aprovação → ingresso → notificação` em tempo real.
5. **Reembolso, transferência e cancelamento:** requerem homologação integrada com invalidação/restauração verificadas.
6. **Check-in físico:** requer ensaio com câmera, dispositivo real, rede principal/reserva e tentativa de reutilização.
7. **QA móvel:** iPhone/Safari e Android/Chrome ainda precisam de validação operacional.
8. **Contingência e rollback:** procedimentos estão documentados, mas o ensaio presencial completo permanece pendente.

## Advisors aceitos

Os Advisors devem continuar sendo tratados gradualmente, conforme o registro da primeira rodada. Em especial:

- extensão `pg_trgm` em `public`;
- funções `SECURITY DEFINER` ainda intencionalmente ou provisoriamente executáveis;
- sobreposições de policies e índices ainda pendentes;
- tabelas com RLS habilitada e sem policy quando o desenho depende de RPC/service role;
- leaked password protection dependente de configuração do plano/painel.

Nenhum aviso deve ser suprimido apenas para tornar a release “verde”.

## Critério de rollback da release

Se a release introduzir regressão:

1. identificar o SHA/tag `v1.0.0`;
2. preservar logs e dados de negócio;
3. conter o componente afetado;
4. seguir [`../40-runbooks/rollback.md`](../40-runbooks/rollback.md);
5. para banco, nunca apagar/editar migration aplicada; criar migration corretiva;
6. para pagamentos, não alterar estado manualmente sem reconciliação;
7. registrar incidente conforme [`../40-runbooks/resposta-a-incidentes.md`](../40-runbooks/resposta-a-incidentes.md).

## Critério de encerramento

O tópico de release estável é considerado concluído quando:

- a preparação estiver mergeada em `main`;
- os gates do PR estiverem verdes;
- o workflow de release validar o SHA pós-merge;
- a tag `v1.0.0` e a GitHub Release existirem apontando para esse SHA;
- esta matriz de pendências permanecer disponível como referência.
