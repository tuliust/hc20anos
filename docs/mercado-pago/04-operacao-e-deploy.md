---
status: historical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
period: operação do primeiro fluxo comercial modular
superseded_by:
  - docs/40-runbooks/deploy-edge-functions.md
  - docs/40-runbooks/validacao-de-pagamentos.md
---

# Operação e deploy do checkout — registro histórico

> [!WARNING]
> Este documento contém comandos e identificadores usados em uma etapa anterior. Ele ainda oferece contexto operacional, mas não foi validado como runbook vigente. Confirme scripts em `package.json`, configuração do Supabase e funções existentes antes de executar qualquer publicação.

## Projeto Supabase registrado

- Nome: `EventoHC`.
- Project ref registrado: `tjnqqsbwgjcdzcxykyif`.
- URL registrada: `https://tjnqqsbwgjcdzcxykyif.supabase.co`.
- Webhook registrado: `https://tjnqqsbwgjcdzcxykyif.supabase.co/functions/v1/payment-webhook`.

O identificador público do projeto não é uma credencial, mas não deve substituir a descoberta e validação explícita do ambiente. Nunca copie secrets ou tokens para a documentação.

## Regra operacional preservada

Evitar seleção interativa ambígua ao publicar funções. Os scripts do repositório devem fixar ou receber explicitamente o projeto correto.

## Transformação administrativa registrada

Em Windows ou sistemas com arquivos CRLF, o fluxo antigo orientava:

```powershell
npm run admin:apply-mercado-pago-ui
npm run build
```

O executor normalizava temporariamente finais de linha, aplicava transformação e restaurava `App.tsx`.

Esse processo deve ser considerado dívida técnica e não uma etapa permanente de deploy. Confirme se o script ainda existe e se o build atual continua dependendo dele.

## Deploy das Edge Functions registrado

```powershell
npm run supabase:deploy:commerce
```

Publicação individual registrada:

```powershell
npm run supabase:deploy:checkout
npm run supabase:deploy:webhook
npm run supabase:deploy:notifications
```

O conjunto vigente também pode incluir `refund-processor`. O runbook futuro deverá gerar a lista diretamente de `package.json` e `supabase/functions/`.

## Verificações registradas antes do deploy

```powershell
Get-Content supabase\.temp\project-ref
npx supabase secrets list --project-ref tjnqqsbwgjcdzcxykyif
npm run build
```

Não registrar a saída de secrets em issues, logs públicos ou documentação.

## Rollback registrado

1. Não remover migrations já aplicadas.
2. Reverter o código de frontend ou Edge Function responsável pelo incidente.
3. Publicar novamente as funções no projeto validado.
4. Validar administração, pedidos, relatórios e checkout.
5. Preservar `payment_events`, `orders`, `payment_preferences` e `notification_jobs` para auditoria.

## Limites deste registro

Este arquivo não define:

- qual ambiente deve receber o deploy;
- quais secrets estão configurados;
- quais functions estão publicadas;
- a ordem vigente de migrations;
- o procedimento completo de rollback de banco;
- critérios atuais de aprovação para produção.

Esses pontos serão consolidados em runbooks canônicos e verificáveis.
