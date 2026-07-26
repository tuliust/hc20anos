---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e2c64aee03e1abf6ae0e3ac38604e7b831acaccc
source_files:
  - docs/50-governanca/template-ADR.md
  - docs/50-governanca/processo-de-atualizacao.md
  - docs/50-governanca/ADR/ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md
---

# Registros de decisões arquiteturais

Este diretório contém ADRs — registros curtos e versionados das decisões que alteram arquitetura, fronteiras de confiança, fontes de verdade ou processos críticos.

## Numeração

Usar sequência crescente:

```text
ADR-001-titulo-curto.md
ADR-002-titulo-curto.md
```

Não reutilizar número de ADR removido ou rejeitado.

## Estados da decisão

- `proposto`;
- `aceito`;
- `rejeitado`;
- `substituído`;
- `deprecated`, quando mantido apenas por histórico documental.

O `status` do front matter classifica o documento no sistema documental; o estado da decisão deve continuar registrado no corpo do ADR.

## Quando criar

Criar ADR para decisões que:

- mudam a fonte de verdade;
- introduzem ou removem integração externa;
- alteram autenticação, autorização ou RLS;
- mudam o modelo de produtos, pagamentos ou emissão;
- adicionam transform de build ou runtime paralelo;
- mudam a estrutura central do banco;
- exigem ordem especial de deployment ou migração;
- aceitam dívida técnica relevante conscientemente.

## Processo

1. Copiar [`../template-ADR.md`](../template-ADR.md).
2. Preencher contexto, decisão e alternativas.
3. Identificar consequências e rollback.
4. Listar impacto documental.
5. Revisar com responsáveis técnicos e de negócio.
6. Marcar decisão como aceita ou rejeitada.
7. Atualizar documentos de domínio, contratos e runbooks.
8. Quando substituído, criar novo ADR e ligar os dois registros.

## Índice

| ADR | Estado | Decisão |
|---|---|---|
| [`ADR-001`](./ADR-001-separar-contrato-supabase-e-tipos-de-dominio.md) | aceito | separar o contrato bruto gerado do Supabase dos tipos de domínio e apresentação; migrar consumidores em etapas. |

## Próximos ADRs potenciais

Criar novos registros somente quando a implementação exigir decisão arquitetural explícita, como:

- substituir o cliente Supabase não tipado pelo contrato gerado;
- alterar estratégia de roteamento e remover transforms;
- mudar a autoridade do CMS público;
- reorganizar fronteiras entre Vercel Functions e Edge Functions;
- alterar o modelo financeiro ou de emissão.
