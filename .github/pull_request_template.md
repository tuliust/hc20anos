## Resumo

Descreva objetivamente o que mudou e por quê.

## Impacto

- [ ] frontend/runtime
- [ ] banco ou migrations
- [ ] Vercel Function
- [ ] Supabase Edge Function
- [ ] autenticação, RLS ou permissões
- [ ] pagamentos, pedidos ou ingressos
- [ ] CMS ou conteúdo público
- [ ] operação do evento
- [ ] somente documentação

## Validação

Liste comandos, testes, ambientes e evidências utilizados.

```text
npm run build
npm run audit:docs
```

## Impacto documental

- [ ] não altera comportamento documentado
- [ ] documentação de domínio foi atualizada
- [ ] runbook foi atualizado
- [ ] inventário/contrato foi atualizado
- [ ] documento anterior foi depreciado ou arquivado
- [ ] ADR foi criado ou atualizado
- [ ] mudança em migrations exige regenerar schema, RPCs, RLS e tipos
- [ ] mudança em rotas/transforms exige regenerar inventário de rotas
- [ ] mudança em Functions exige revisar variáveis e códigos de erro

Documentos alterados:

- 

## Segurança e privacidade

- [ ] nenhum secret foi versionado
- [ ] dados pessoais não aparecem em logs, fixtures ou screenshots
- [ ] service role permanece server-side
- [ ] autorização foi validada além do frontend
- [ ] operações financeiras permanecem idempotentes

## Deployment e rollback

Ordem de deployment:

1. 

Rollback ou contenção:

1. 

## Checklist final

- [ ] links e front matter passam em `npm run audit:docs`
- [ ] testes relevantes passam
- [ ] compatibilidade com dados existentes foi considerada
- [ ] documentos históricos não foram apresentados como vigentes
- [ ] riscos e pendências residuais estão registrados
