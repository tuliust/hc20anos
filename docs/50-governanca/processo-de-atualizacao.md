---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 735cc954688d50588d670a58ad61582c7a84e35e
source_files:
  - docs/50-governanca/politica-de-documentacao.md
  - docs/50-governanca/template-ADR.md
  - scripts/audit-docs.mjs
  - .github/workflows/documentation.yml
  - .github/CODEOWNERS
  - .github/pull_request_template.md
---

# Processo de atualização da documentação

## Objetivo

Garantir que mudanças no produto, banco, APIs ou operação atualizem as referências correspondentes no mesmo ciclo de trabalho.

## Regra principal

Uma mudança não está documentalmente concluída quando altera comportamento, fonte de verdade, permissão, operação ou contrato sem atualizar a documentação relacionada.

## Fluxo

### 1. Identificar impacto

Antes de alterar código, classificar a mudança:

- regra de negócio;
- rota ou navegação;
- tabela, coluna, enum ou constraint;
- RPC, policy ou grant;
- Vercel ou Edge Function;
- variável de ambiente;
- código de erro;
- procedimento operacional;
- decisão arquitetural.

### 2. Localizar referências

Consultar:

- `docs/00-visao-geral/` para arquitetura e fontes;
- `docs/10-dominios/` para regras funcionais;
- `docs/30-contratos/` para inventários;
- `docs/40-runbooks/` para operação;
- `docs/50-governanca/ADR/` para decisões;
- `docs/archive/` e documentos históricos apenas para contexto.

### 3. Atualizar no mesmo commit

Mudanças incompatíveis devem atualizar:

- documento de domínio afetado;
- runbook afetado;
- inventário manual enquanto o contrato automático não existir;
- documento anterior, marcando `deprecated` ou `historical` quando necessário;
- ADR para decisões relevantes.

### 4. Atualizar metadados

Revisar:

- `status`;
- `owner`;
- `last_verified`;
- `last_verified_commit`;
- `source_files`;
- `supersedes` ou `superseded_by`.

`last_verified_commit` deve representar o baseline realmente conferido. Quando o próprio documento estiver sendo criado junto da mudança, pode apontar para o commit anterior de referência e ser atualizado posteriormente pelo gerador ou revisão.

### 5. Executar auditoria

```bash
npm run audit:docs
```

A auditoria valida:

- front matter nas áreas canônicas;
- status permitido;
- owner e data;
- links locais;
- arquivos declarados em `source_files`;
- referências de substituição;
- exigência de comando para futuros arquivos `generated`.

### 6. Validar comportamento

Documentação não substitui testes. Executar os comandos do domínio e runbook aplicáveis.

Exemplos:

```bash
npm run build
npm run test:faq
npm run test:e2e
npm run audit:migrations
npm run audit:cms-strict
```

### 7. Revisar impacto arquitetural

Criar ADR quando a mudança:

- altera fonte de verdade;
- adiciona integração externa;
- muda autenticação ou autorização;
- muda modelo financeiro;
- introduz transform de build;
- altera estrutura de dados central;
- exige ordem especial de deployment;
- cria dívida técnica relevante e intencional.

Usar [`template-ADR.md`](./template-ADR.md).

### 8. Classificar documentos antigos

- `historical`: registro válido de uma fase anterior;
- `deprecated`: referência substituída, apontando para a atual;
- não apagar conteúdo exclusivo antes de preservar o contexto útil;
- mover fisicamente para `archive/` apenas depois de revisar links.

## Mudanças diretas em `main`

Commits diretos em `main` podem disparar deployment de produção. Para documentação:

- o workflow `Documentation safety` executa em push;
- cada commit deve ser pequeno e coerente;
- executar auditoria antes de publicar quando houver checkout local;
- acompanhar o check depois do push;
- corrigir imediatamente falha documental;
- não agrupar mudança funcional não validada com correção editorial.

Para alterações de runtime, banco ou segurança, PR continua sendo a opção mais segura mesmo quando commits diretos são permitidos.

## CODEOWNERS

`/.github/CODEOWNERS` atribui revisão da documentação e do mecanismo de auditoria a `@tuliust`.

Ownership não substitui revisão técnica especializada quando o documento trata de pagamentos, banco, segurança ou privacidade.

## Checklist por tipo de mudança

### Migration

- [ ] atualizar domínio;
- [ ] atualizar inventário manual;
- [ ] executar replay e testes SQL;
- [ ] regenerar schema, RPCs, RLS, tipos e ERD quando geradores existirem;
- [ ] atualizar runbook de migrations quando o processo mudar.

### Rota ou transform

- [ ] atualizar arquitetura quando necessário;
- [ ] atualizar `30-contratos/rotas.md`;
- [ ] testar acesso direto, refresh e aliases;
- [ ] regenerar contrato pós-build quando disponível.

### Function

- [ ] atualizar domínio;
- [ ] atualizar APIs/Functions;
- [ ] atualizar variáveis;
- [ ] atualizar erros;
- [ ] atualizar deploy e runbook operacional;
- [ ] conferir autenticação e idempotência.

### Permissão

- [ ] atualizar autenticação/roles;
- [ ] atualizar matriz de permissões;
- [ ] testar atores permitidos e negados;
- [ ] regenerar RLS/grants quando disponível;
- [ ] registrar ADR se a fronteira de confiança mudou.

### Processo operacional

- [ ] atualizar runbook;
- [ ] manter status `draft` até executar;
- [ ] registrar evidências;
- [ ] promover para `canonical` somente após validação.

## Critério de conclusão

- documentação afetada atualizada;
- metadados válidos;
- auditoria sem erros;
- testes do comportamento executados;
- contratos gerados atualizados ou pendência explicitamente registrada;
- documento substituído classificado;
- risco residual documentado.
