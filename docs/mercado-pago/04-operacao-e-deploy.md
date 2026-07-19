# Operação e deploy do checkout

## Projeto Supabase

- Nome: `EventoHC`
- Project ref: `tjnqqsbwgjcdzcxykyif`
- URL: `https://tjnqqsbwgjcdzcxykyif.supabase.co`
- Webhook: `https://tjnqqsbwgjcdzcxykyif.supabase.co/functions/v1/payment-webhook`

Nunca selecione o projeto de forma interativa para publicar as funções deste repositório. Os scripts npm fixam explicitamente o project ref correto.

## Aplicar a interface administrativa

Em Windows ou sistemas com arquivos CRLF:

```powershell
npm run admin:apply-mercado-pago-ui
npm run build
```

O executor normaliza temporariamente os finais de linha, aplica a transformação e restaura o formato original do `App.tsx`.

## Deploy das Edge Functions

Publicar todas as funções do fluxo comercial:

```powershell
npm run supabase:deploy:commerce
```

Publicação individual:

```powershell
npm run supabase:deploy:checkout
npm run supabase:deploy:webhook
npm run supabase:deploy:notifications
```

## Verificações anteriores ao deploy

```powershell
Get-Content supabase\.temp\project-ref
npx supabase secrets list --project-ref tjnqqsbwgjcdzcxykyif
npm run build
```

O project ref exibido deve ser exatamente `tjnqqsbwgjcdzcxykyif`.

## Rollback

1. Não remova migrations já aplicadas.
2. Reverta o commit de frontend ou Edge Function que causou o problema.
3. Publique novamente as funções usando os scripts com project ref fixo.
4. Valide `/admin`, `/admin/tickets?tab=orders`, `/admin/reports` e o checkout.
5. Preserve `payment_events`, `orders`, `payment_preferences` e `notification_jobs` para auditoria.
