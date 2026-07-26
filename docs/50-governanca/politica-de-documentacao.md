---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
---

# Política de documentação

## Objetivo

Manter uma documentação confiável, rastreável e proporcional à complexidade do sistema.

A política evita dois problemas:

1. documentação extensa que se torna obsoleta rapidamente;
2. conhecimento crítico disponível apenas no código ou na memória de quem implementou.

## Escopo

Aplica-se a:

- documentos em `docs/`;
- README;
- contratos gerados;
- ADRs;
- runbooks;
- diagramas;
- comentários de operação vinculados a scripts ou migrations.

## Metadados obrigatórios

Todo documento novo dentro da estrutura canônica deve começar com front matter YAML:

```yaml
---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: <sha>
source_files:
  - caminho/do/arquivo
---
```

### Campos

| Campo | Obrigatório | Uso |
|---|---|---|
| `status` | Sim | Classificação de vigência. |
| `owner` | Sim | Responsável por validar a referência. |
| `last_verified` | Sim | Data da última conferência contra código ou operação. |
| `last_verified_commit` | Recomendado | Commit usado como baseline. |
| `source_files` | Recomendado | Arquivos que sustentam o documento. |
| `supersedes` | Quando aplicável | Documento substituído. |
| `superseded_by` | Quando aplicável | Referência que passou a prevalecer. |

## Estados permitidos

### `canonical`

Documento humano vigente.

Deve:

- representar o estado atual;
- apontar fontes verificáveis;
- possuir responsável;
- ser atualizado no mesmo PR de mudanças incompatíveis.

### `generated`

Documento produzido automaticamente.

Deve:

- declarar o comando de geração;
- conter aviso para não editar manualmente;
- ser reproduzível em CI;
- falhar a validação quando o arquivo gerado estiver divergente.

### `draft`

Proposta ainda não aprovada.

Não deve ser citada como regra vigente.

### `historical`

Registro de auditoria, plano executado ou arquitetura anterior.

Deve informar a data ou período representado.

### `deprecated`

Documento substituído.

Deve apontar explicitamente para a referência atual.

## Quando atualizar documentação

A atualização é obrigatória quando o PR altera:

- produto público ou regras de elegibilidade;
- rotas ou permissões;
- modelo comercial;
- schema, RPC, trigger, view, enum, RLS ou grant;
- contrato de API ou Edge Function;
- variável de ambiente;
- provedor externo;
- estado ou transição de pagamento;
- fluxo de emissão, check-in ou reembolso;
- procedimento de deploy ou rollback;
- política de privacidade ou exposição de dados;
- arquitetura de build, mounts ou enhancements.

## Impacto documental em PRs

Todo PR estrutural deve responder:

```text
Impacto documental:
- [ ] Não altera contrato ou operação documentada.
- [ ] Atualiza documentação canônica neste PR.
- [ ] Atualiza artefato gerado neste PR.
- [ ] Exige ADR.
- [ ] Depreca ou arquiva documento anterior.
```

A opção “não altera” deve ser justificável pela diff.

## ADRs

Criar ADR quando houver decisão difícil de reverter ou com efeito transversal, por exemplo:

- mudança de provedor de pagamento;
- troca do modelo de roteamento;
- remoção dos build transforms;
- adoção de arquitetura multi-evento;
- alteração do modelo de identidade e reivindicação;
- mudança da estratégia de autorização;
- substituição do CMS ou do backend.

Um ADR deve conter:

1. contexto;
2. decisão;
3. alternativas consideradas;
4. consequências positivas;
5. riscos e custos;
6. plano de migração, quando necessário.

ADRs aprovados não devem ser reescritos para refletir decisões futuras. Uma nova decisão cria um novo ADR que substitui o anterior.

## Runbooks

Runbooks devem ser orientados à execução.

Cada runbook deve declarar:

- objetivo;
- ambiente permitido;
- permissões necessárias;
- pré-condições;
- passos numerados;
- validação de sucesso;
- sinais de falha;
- rollback ou recuperação;
- dados sensíveis que não podem ser copiados para logs ou issues.

## Documentos históricos

Antes de mover um documento para `archive/`:

1. identificar se alguma informação ainda é vigente;
2. migrar o conteúdo útil para documento canônico ou runbook;
3. adicionar `status: historical` ou `deprecated`;
4. indicar o motivo do arquivamento;
5. apontar a referência atual.

Não excluir auditorias ou planos úteis para explicar a evolução do sistema sem necessidade de segurança ou privacidade.

## Documentação gerada recomendada

A evolução da fundação deve gerar automaticamente:

- rotas e nível de acesso;
- endpoints Vercel;
- Edge Functions;
- tabelas, views, enums e colunas;
- RPCs e assinaturas;
- triggers;
- policies e grants;
- variáveis de ambiente usadas;
- códigos de erro;
- diagrama de entidades;
- tipos TypeScript do Supabase.

## Verificação periódica

Documentos canônicos devem ser revisados:

- quando suas fontes forem alteradas;
- antes de uma mudança operacional relevante;
- antes do evento;
- depois de incidente ou correção emergencial;
- no máximo a cada 90 dias enquanto o produto estiver em desenvolvimento ativo.

## Critério de qualidade

Uma documentação é aceitável quando permite que outra pessoa:

- localize a fonte de verdade;
- entenda o fluxo sem ler o repositório inteiro;
- identifique riscos e permissões;
- execute a operação com segurança;
- reconheça o que é histórico ou provisório;
- valide se a referência ainda está vigente.