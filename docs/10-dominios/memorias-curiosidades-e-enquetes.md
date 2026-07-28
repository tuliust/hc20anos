---
status: canonical
owner: tuliust
last_verified: 2026-07-28
source_files:
  - index.html
  - src/app/App.tsx
  - src/historyContentEnhancements.ts
  - src/lib/services.ts
  - src/lib/engagement.types.ts
  - supabase/migrations/20260728000001_phase2_content_storage_security.sql
  - supabase/migrations/20260728000002_phase2_moderation_concurrency.sql
  - supabase/tests/phase2_content_storage.sql
  - tests/e2e/engagement-flow.spec.ts
  - tests/e2e/engagement-fixtures.ts
  - tests/e2e/editorial-moderation-flow.spec.ts
  - tests/e2e/phase2-content-security.spec.ts
  - docs/30-contratos/testes-engajamento.generated.md
  - docs/30-contratos/testes-moderacao-editorial.generated.md
  - docs/30-contratos/fase-2-conteudo-storage.generated.md
---

# Memórias, curiosidades e enquetes

## Objetivo

Documentar as experiências colaborativas que permitem registrar lembranças, publicar conteúdo nostálgico e participar de enquetes sem transformar a plataforma em uma rede social irrestrita.

## Escopo

Este domínio inclui:

- memórias textuais;
- curiosidades editoriais;
- enquetes e opções de voto;
- resultados agregados;
- moderação e destaque;
- autoria pública ou anônima.

Curtidas e comentários de fotos pertencem ao domínio de acervo e moderação.

## Memórias

Uma memória é um relato curto associado ao evento ou à turma.

Campos funcionais esperados:

- texto da memória;
- nome do autor, quando informado;
- vínculo com usuário ou pessoa, quando disponível;
- opção de anonimato;
- status de moderação;
- destaque editorial;
- timestamps e responsável pela revisão.

## Anonimato

`is_anonymous` controla a apresentação pública, sem eliminar a autoria necessária para moderação, auditoria e resposta a incidentes.

Quando uma memória for anônima:

- a interface pública não exibe nome, e-mail, usuário ou pessoa associada;
- a RPC pública `get_public_memories` devolve `author_name`, `user_id` e `person_id` como `null`;
- a tabela `memories` não possui mais policy de leitura pública direta;
- o painel administrativo acessa somente os dados necessários para moderação;
- logs e exports públicos respeitam o anonimato;
- uma alteração posterior não pode revelar acidentalmente o autor.

O controle público permanece visível e operável por teclado e tecnologia assistiva. O componente React canônico expõe `role="switch"`, nome acessível, estado em `aria-checked` e foco visível.

## Refatoração da regressão de anonimato

A regressão vinha de `historyContentEnhancements.ts`, que ocultava o controle e executava um clique programático para desligá-lo quando estivesse ativo.

A Fase 2 removeu essa intervenção. O estado e o controle agora pertencem integralmente ao componente React de `App.tsx`:

- não há clique programático sobre a escolha do usuário;
- não há regra externa para ocultar o controle;
- o antigo `memoryAnonymityEnhancement.ts` e seu carregamento em `index.html` foram removidos;
- `historyContentEnhancements.ts` limita-se a ajustes de apresentação que não alteram o estado;
- o E2E valida mouse, teclado, persistência da escolha e atributos acessíveis.

## Moderação de memórias

Estados vigentes:

- `pending`;
- `approved`;
- `rejected`;
- `hidden`.

Somente conteúdo aprovado e não oculto aparece publicamente. O schema gerado é a autoridade final para estados e transições.

Fluxo:

1. usuário autenticado envia pela RPC `submit_memory`;
2. a RPC aplica rate limiting e sanitização;
3. o registro entra como `pending`;
4. moderador revisa pela RPC central `moderate_content_item`;
5. aprovação libera a exibição pela RPC pública mascarada;
6. destaque editorial é aplicado separadamente;
7. ocultação posterior remove a memória das páginas públicas;
8. cada decisão gera evento imutável de moderação.

Transições concorrentes usam bloqueio de linha. Duas decisões contraditórias sobre um item pendente não podem ser aceitas simultaneamente.

## Curiosidades

Curiosidades são conteúdo editorial, não necessariamente contribuição livre do usuário. Devem ser administradas pelo CMS ou por uma entidade própria com:

- título ou chamada;
- texto;
- ordem de exibição;
- status de publicação;
- referência de mídia quando aplicável.

Não usar conteúdo fixo no frontend como autoridade editorial de produção.

## Enquetes

### Entidades

- `polls`: pergunta, descrição, status e regras;
- `poll_options`: opções disponíveis e ordem;
- `poll_votes`: voto individual associado à enquete e à identidade permitida;
- `poll_results`: visão ou agregação pública de resultados.

### Estados

O modelo inclui:

- `draft`;
- `open`;
- `closed`;
- `archived`.

Uma enquete em `draft` não é pública. Uma enquete fechada pode exibir resultados, mas não aceitar novos votos.

### Regras de voto

A função ou trigger de validação é a autoridade para:

- confirmar que a enquete está aberta;
- confirmar que a opção pertence à enquete;
- impedir votos duplicados quando a regra for voto único;
- permitir múltiplas opções apenas quando configurado;
- impedir alteração direta de contadores agregados pelo cliente.

O frontend apresenta as regras, mas não é responsável por garanti-las.

## Resultados

Resultados públicos são agregados a partir de votos válidos. Não persistir totais no frontend nem confiar em contagens enviadas pelo navegador.

Durante uma votação, a política do produto pode ocultar resultados parciais. Essa decisão deve ser configurável e documentada no contrato da enquete.

## Evidências funcionais automatizadas

### Experiência pública

O workflow `Engagement functional tests` aprovou build, Chromium e dois E2E. A evidência versionada está em [`../30-contratos/testes-engajamento.generated.md`](../30-contratos/testes-engajamento.generated.md).

A execução com fixtures HTTP isoladas comprova:

- leitura pública limitada a memórias aprovadas;
- memória anônima sem exposição do nome administrativo;
- controle de anonimato visível e acessível como `switch`;
- rejeição de memória com menos de dez caracteres antes da escrita;
- nova memória persistida como `pending`;
- enquete aberta disponível para usuário autenticado;
- substituição do voto anterior no modelo de voto único;
- resultados ocultos antes da participação;
- enquete fechada sem aceitação de novo voto.

### Fase 2 integrada

O workflow `Phase 2 content and Storage` adiciona Supabase Auth, Postgres, Storage e Edge Runtime locais. A evidência está em [`../30-contratos/fase-2-conteudo-storage.generated.md`](../30-contratos/fase-2-conteudo-storage.generated.md).

A suíte integrada comprova:

- sanitização server-side;
- limite de tamanho dos textos;
- rate limiting atômico;
- anonimato mascarado no contrato público do banco;
- bloqueio de inserções diretas que contornem as RPCs;
- decisões concorrentes serializadas;
- trilha de moderação;
- refatoração do switch sem enhancement externo.

### Moderação editorial

O workflow `Editorial moderation functional tests` cobre a fila de memórias anônimas e as transições administrativas. Consulte [`../30-contratos/testes-moderacao-editorial.generated.md`](../30-contratos/testes-moderacao-editorial.generated.md).

## Segurança de conteúdo

- Comprimento de memórias e textos é limitado no banco.
- HTML é removido e conteúdo executável não é renderizado.
- Envios passam por rate limiting por usuário e ação.
- Escritas colaborativas passam por RPCs específicas.
- Moderação é restrita a `moderator`, `admin` ou `superadmin`.
- E-mails e identificadores internos não são devolvidos por contratos públicos anônimos.
- Decisões administrativas mantêm trilha imutável.

Essas medidas reduzem classes conhecidas de abuso, mas não substituem moderação humana do conteúdo e das alegações sobre terceiros.

## Privacidade

Contribuições podem conter nomes ou fatos sobre terceiros. A moderação deve rejeitar ou editar conteúdo que exponha dados pessoais indevidos, acusações, contatos privados ou material incompatível com a finalidade do evento.

## Testes mínimos

### Memórias

- memória pendente não aparece publicamente;
- memória aprovada aparece;
- memória anônima não revela autor no frontend nem na RPC pública;
- memória ocultada deixa de aparecer;
- usuário comum não altera status de moderação;
- texto executável é neutralizado;
- rate limit é aplicado sob concorrência;
- decisões contraditórias não são aceitas simultaneamente.

### Enquetes

- enquete `draft` não é pública;
- enquete aberta aceita voto válido;
- enquete fechada rejeita voto;
- opção de outra enquete é rejeitada;
- voto duplicado é impedido conforme a regra;
- resultados correspondem aos votos válidos;
- usuário não altera resultado agregado diretamente.

## Operação editorial

O painel administrativo deve permitir:

- fila de memórias pendentes;
- aprovação, rejeição, ocultação e destaque;
- criação e ordenação de curiosidades;
- criação de enquetes e opções;
- abertura e encerramento explícitos;
- consulta de resultados sem expor dados privados desnecessários.

## Relações

- CMS e conteúdo institucional: [`evento-e-cms.md`](./evento-e-cms.md)
- Fotos, comentários e marcações: [`acervo-fotos-e-moderacao.md`](./acervo-fotos-e-moderacao.md)
- Autorização administrativa: [`autenticacao-autorizacao-e-roles.md`](./autenticacao-autorizacao-e-roles.md)

## Dívidas conhecidas

- Executar a mesma matriz em homologação remota antes da implantação produtiva.
- Validar volume e thresholds de rate limiting com tráfego representativo.
- Manter regressão E2E permanente quando layouts e enhancements da página histórica forem alterados.
