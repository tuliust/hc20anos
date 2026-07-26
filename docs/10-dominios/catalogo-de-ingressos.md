---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/lib/currentTicketCatalog.ts
  - src/lib/publicTicketCatalog.ts
  - src/app/PublicTicketsCatalogMount.tsx
  - src/ticketsCatalogLayoutEnhancements.ts
  - supabase/migrations/20260725000001_admin_ticket_lots_source_of_truth.sql
  - supabase/migrations/20260726040000_three_ticket_product_model.sql
  - tests/e2e/ticket-catalog-source-of-truth.spec.ts
  - supabase/tests/admin_ticket_lots_source_of_truth.sql
  - supabase/tests/ticket_product_model.sql
---

# Produtos, lotes e catálogo de ingressos

## Objetivo

Definir a origem e as regras do catálogo comercial apresentado na home, na página de ingressos, no checkout e na administração.

## Fonte de verdade

O catálogo vigente é derivado do banco, por RPC e estruturas do lote ativo. Nomes, descrições, preços e disponibilidade não devem ser duplicados como valores fixos em componentes públicos.

O frontend pode normalizar e agrupar a resposta para apresentação, mas não pode inventar preços nem decidir qual lote está vigente.

## Modelo comercial vigente

A migration do modelo de três produtos consolida:

| Código | Produto | Composição principal |
|---|---|---|
| `simple` | Individual | um ex-aluno pré-cadastrado e vinculado à conta |
| `family_full` | Família | ex-aluno, cônjuge e um ou mais filhos |
| `external_guest` | Convidado | um adulto que não é ex-aluno |

Produtos e estruturas legadas podem permanecer no banco por compatibilidade, mas não devem aparecer como opções públicas quando estiverem fechados ou fora do modelo vigente.

## Lotes

Um lote define a janela comercial e os preços disponíveis em determinado período.

O banco deve decidir:

- lote vigente;
- data de início e término;
- status de venda;
- preço de cada produto;
- disponibilidade e eventuais limites;
- dados usados pela administração e pelo checkout.

Se não houver lote ativo, o catálogo deve apresentar indisponibilidade explícita. O frontend não deve selecionar um lote anterior como fallback silencioso.

## RPC de catálogo

A RPC de catálogo público deve retornar apenas informações necessárias para a experiência pública, sem expor campos administrativos ou financeiros internos.

A resposta precisa permitir que home e página de ingressos apresentem a mesma combinação de:

- código do produto;
- nome;
- descrição;
- preço vigente;
- lote vigente;
- status ou disponibilidade;
- metadados estritamente necessários à composição visual.

## Normalização no frontend

`currentTicketCatalog.ts` e `publicTicketCatalog.ts` convertem a resposta do banco para o formato usado pela interface.

A normalização pode:

- ordenar os três produtos;
- adaptar valores nulos;
- inferir código somente para compatibilidade controlada;
- preparar texto de preço e metadados visuais.

A normalização não pode:

- recalcular preço;
- substituir produto indisponível por mock;
- usar nome como autoridade quando `product_code` estiver disponível;
- alterar composição comercial;
- liberar checkout de produto que o banco rejeita.

## Consistência entre páginas

A home e `/ingressos` devem consumir a mesma fonte. O teste `ticket-catalog-source-of-truth.spec.ts` verifica que lote, nomes e preços permanecem coerentes entre as duas experiências.

Mudanças no catálogo devem validar também o checkout, pois a apresentação pública e a criação do pedido dependem do mesmo código de produto.

## Administração

O painel administrativo pode editar lotes e preços por meio de RPCs ou operações autorizadas. A interface administrativa deve:

- mostrar qual lote está vigente;
- impedir sobreposição ou inconsistência conforme as constraints;
- diferenciar produto ativo de estrutura legada;
- não gravar preço diretamente em múltiplos lugares;
- confirmar alterações comerciais sensíveis;
- manter auditoria quando aplicável.

## Relação com checkout

O checkout envia `product_code`, participantes e extras. O backend identifica o lote ativo e calcula o valor no banco.

O preço exibido no navegador é informativo. A autoridade financeira é a RPC `create_checkout_order` executada no backend.

Consulte [`checkout-e-pagamentos.md`](./checkout-e-pagamentos.md).

## Regras de composição

### Individual

- exige sessão autenticada;
- exige ex-aluno pré-cadastrado e vinculado;
- contém somente o participante ex-aluno.

### Família

- exige sessão autenticada;
- exige um ex-aluno pré-cadastrado e vinculado;
- exige um cônjuge;
- exige pelo menos um filho;
- filhos devem possuir os dados exigidos pelo contrato vigente.

### Convidado

- representa um participante adulto não ex-aluno;
- exige os dados de identificação e contato definidos pelo checkout;
- não deve reutilizar regras antigas de aprovação por patrocinador quando essas estruturas estiverem encerradas pelo modelo vigente.

## Erros esperados

- `no_active_lot`;
- `invalid_primary_product`;
- `unsupported_primary_product`;
- `alumni_registration_required`;
- `simple_package_invalid_composition`;
- `family_full_invalid_composition`;
- `external_guest_package_invalid_composition`;
- erros de data ou maioridade de participante;
- `extras_not_supported`, quando itens adicionais não fizerem parte do modelo vigente.

O inventário completo está em [`../30-contratos/codigos-de-erro.md`](../30-contratos/codigos-de-erro.md).

## Testes mínimos

```bash
npm run test:e2e -- tests/e2e/ticket-catalog-source-of-truth.spec.ts
```

No replay do banco, executar os testes SQL relacionados ao catálogo e ao modelo de produtos.

Cenários:

- home e ingressos apresentam o mesmo lote;
- preços coincidem;
- somente três produtos vigentes aparecem;
- lote inativo não é selecionado;
- ausência de lote produz estado explícito;
- produto legado não inicia checkout;
- alteração administrativa é refletida sem mudança de código;
- backend rejeita composição incompatível mesmo que o frontend seja manipulado.

## Dívidas conhecidas

- Há lógica de compatibilidade que infere códigos por nomes antigos; ela deve ser removida quando o banco estiver integralmente normalizado.
- O catálogo é instalado também por mounts e enhancements; regressões visuais devem ser validadas em runtime.
- O contrato automático da RPC ainda precisa ser gerado após replay das migrations.
