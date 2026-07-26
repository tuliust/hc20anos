---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
---

# Glossário

## Termos de produto

### Evento principal

O reencontro da Turma 2006 representado no banco pela entidade `events`. O código atual referencia em vários pontos o UUID:

```text
00000000-0000-0000-0000-000000000001
```

Esse identificador fixo é uma convenção vigente, não uma garantia de arquitetura multi-evento.

### Ex-aluno

Pessoa pré-cadastrada na tabela `people` como integrante da Turma 2006.

Um ex-aluno pode existir sem possuir conta ou perfil reivindicado.

### Pessoa

Registro-base em `people`. Representa a identidade pré-carregada da turma e contém dados controlados pela organização.

### Perfil

Registro editável associado a uma pessoa e a um usuário autenticado. Contém dados atuais e preferências de privacidade.

### Reivindicação de perfil

Fluxo pelo qual um usuário demonstra vínculo com uma pessoa pré-cadastrada e cria ou vincula seu perfil.

### Disputa de perfil

Processo administrativo para revisar vínculo incorreto, contestado ou duplicado.

### Intenção de presença

Indicação de que uma pessoa pretende comparecer. Não equivale necessariamente a ingresso emitido ou pagamento aprovado.

### Confirmado

Termo de apresentação que pode depender de status de perfil, intenção, privacidade ou regra específica da tela. Não deve ser usado como sinônimo automático de pagamento aprovado.

## Ingressos e comércio

### Produto de ingresso

Categoria comercial persistida em `ticket_types` e identificada por `product_code`.

Produtos públicos vigentes:

- `simple` — Individual;
- `family_full` — Família;
- `external_guest` — Convidado.

### Lote

Janela comercial configurada em `ticket_lots`, com período, ordem, status e capacidade.

### Preço do lote

Preço de um produto dentro de um lote, armazenado em `ticket_lot_prices`.

O preço público vigente deve vir do catálogo do lote atual, não de `ticket_types.price_cents` isoladamente quando houver metadados de lote.

### Catálogo público

Resultado da RPC que combina lote vigente, produtos vendáveis, preços e disponibilidade.

### Comprador

Usuário autenticado responsável pela criação e pelo pagamento do pedido.

O comprador pode ser também participante, mas os conceitos não são equivalentes.

### Participante

Pessoa incluída no pedido e persistida em `order_participants`.

Tipos:

- `alumni`;
- `spouse`;
- `child`;
- `external_guest`.

### Pedido

Registro comercial em `orders`. Possui comprador, valor, reserva, status de pagamento, token público e referências ao provedor.

### Reserva

Estado temporário de capacidade associado a um pedido ainda não concluído. Reserva não equivale a ingresso emitido.

### Preferência de pagamento

Sessão de checkout criada no Mercado Pago e registrada em `payment_preferences`.

### Evento de pagamento

Registro de webhook ou processamento relacionado ao provedor em `payment_events`.

### Ingresso

Credencial nominal emitida em `tickets`, normalmente após pagamento aprovado.

### QR token

Credencial usada para localizar e validar o ingresso no fluxo de check-in. Não deve ser confundida com o token público do pedido.

### Token público do pedido

Identificador opaco usado para consultar o estado do checkout sem expor diretamente detalhes internos desnecessários.

### Check-in

Registro de entrada associado ao ingresso. O estado atual é mantido no próprio ingresso e em operações auditáveis.

### Reembolso

Processo financeiro iniciado por `refund_requests` e executado por regras server-side e integração com o Mercado Pago.

## Conteúdo e comunidade

### CMS

Conjunto de tabelas e painéis administrativos responsáveis por conteúdo editorial da Home, evento, FAQ e assets.

### Default neutro

Valor vazio ou não editorial usado para impedir que conteúdo demonstrativo apareça como oficial.

### Strict CMS

Comportamento que bloqueia ou substitui a experiência pública quando dados essenciais não estão configurados no Supabase.

### Memória

Relato textual enviado por usuário, sujeito a moderação e possível anonimato.

### Foto aprovada

Foto com autorização e status de moderação compatível com exposição pública.

### Remoção preventiva

Ocultação temporária de conteúdo enquanto uma solicitação de remoção é analisada.

## Arquitetura

### Enhancement

Módulo executado no runtime para complementar ou alterar comportamento do shell principal.

### Mount

Componente React montado adicionalmente ao `App`, geralmente para inserir painéis ou substituir partes específicas da interface.

### Build transform

Transformação aplicada pelo Vite sobre o código-fonte antes da compilação.

### Fonte original

Arquivo armazenado no repositório antes dos transforms de build.

### Código efetivo

Resultado após composição de fonte, transforms, mounts e enhancements executados.

### RPC

Função Postgres exposta por Supabase/PostgREST e chamada pelo frontend ou por processos server-side.

### Edge Function

Função server-side executada no ambiente Supabase Functions.

### Vercel Function

Função server-side no diretório `api/`, publicada junto ao frontend na Vercel.

### RLS

Row Level Security do Postgres. Controla quais linhas podem ser lidas ou alteradas por cada contexto de autenticação.

### Service role

Credencial privilegiada do Supabase. Só pode existir em ambientes server-side seguros.

### Chave anon

Credencial pública do projeto Supabase usada pelo frontend em conjunto com RLS.

### Idempotência

Garantia de que repetir uma operação com a mesma chave não produz pedidos ou efeitos financeiros duplicados.

## Documentação

### Documento canônico

Referência humana vigente, revisada e marcada com `status: canonical`.

### Documento gerado

Arquivo derivado automaticamente do código ou banco, marcado com `status: generated`.

### ADR

Architecture Decision Record. Registro curto de uma decisão arquitetural, suas alternativas e consequências.

### Runbook

Procedimento operacional executável para deploy, incidente, pagamento, reembolso, check-in ou manutenção.

### Documento histórico

Registro preservado para rastreabilidade, mas que não representa o estado vigente.