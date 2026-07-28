---
status: canonical
owner: tuliust
last_verified: 2026-07-28
last_verified_commit: eb956992069e064ce5589d42b630137b2a21649e
source_files:
  - index.html
  - src/app/App.tsx
  - src/historyContentEnhancements.ts
  - src/memoryAnonymityEnhancement.ts
  - src/lib/services.ts
  - src/lib/engagement.types.ts
  - tests/e2e/engagement-flow.spec.ts
  - tests/e2e/engagement-fixtures.ts
  - tests/e2e/editorial-moderation-flow.spec.ts
  - docs/30-contratos/testes-engajamento.generated.md
  - docs/30-contratos/testes-moderacao-editorial.generated.md
  - supabase/migrations/
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

`is_anonymous` controla a apresentação pública, não necessariamente a inexistência de dados administrativos.

Quando uma memória for anônima:

- a interface pública não deve exibir nome, e-mail, usuário ou pessoa associada;
- o painel administrativo deve mostrar apenas os dados necessários para moderação;
- logs e exports públicos devem respeitar o anonimato;
- uma alteração posterior não deve revelar acidentalmente o autor.

O controle público de anonimato deve permanecer visível e operável por teclado e tecnologia assistiva. O runtime expõe o controle como `switch`, com nome acessível e estado em `aria-checked`.

## Correção da regressão de anonimato

A regressão funcional encontrada pelos testes vinha de `historyContentEnhancements.ts`, que ocultava o controle e executava um clique programático para desligá-lo quando estivesse ativo.

A correção vigente usa `memoryAnonymityEnhancement.ts`, carregado depois do runtime principal, para:

- restaurar a visibilidade do controle com uma regra de precedência explícita;
- expor `role="switch"`, nome acessível e `aria-checked`;
- preservar cliques reais do usuário;
- bloquear somente o clique programático legado que tentava desligar uma escolha já ativa.

Essa camada é uma correção de compatibilidade. O caminho preferencial futuro é remover o comportamento contraditório do enhancement legado quando o arquivo puder ser refatorado sem risco para os demais ajustes da página histórica.

## Moderação de memórias

Estados históricos incluem:

- `pending`;
- `approved`;
- `rejected`;
- `hidden`.

Somente conteúdo aprovado e não oculto deve aparecer publicamente. O schema gerado é a autoridade final para estados e transições.

Fluxo:

1. usuário envia a memória;
2. serviço valida tamanho e campos mínimos;
3. registro entra no estado definido pela política editorial;
4. moderador revisa o conteúdo;
5. aprovação libera a exibição;
6. destaque editorial é aplicado separadamente;
7. ocultação posterior remove a memória das páginas públicas.

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

O modelo histórico inclui:

- `draft`;
- `open`;
- `closed`;
- `archived`.

Uma enquete em `draft` não é pública. Uma enquete fechada pode exibir resultados, mas não aceitar novos votos.

### Regras de voto

A função ou trigger de validação deve ser a autoridade para:

- confirmar que a enquete está aberta;
- confirmar que a opção pertence à enquete;
- impedir votos duplicados quando a regra for voto único;
- permitir múltiplas opções apenas quando configurado;
- impedir alteração direta de contadores agregados pelo cliente.

O frontend deve apresentar as regras, mas não é responsável por garanti-las.

## Resultados

Resultados públicos devem ser agregados a partir de votos válidos. Não persistir totais no frontend nem confiar em contagens enviadas pelo navegador.

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

### Moderação editorial

O workflow `Editorial moderation functional tests` aprovou a fila de memórias anônimas e as transições administrativas. Consulte [`../30-contratos/testes-moderacao-editorial.generated.md`](../30-contratos/testes-moderacao-editorial.generated.md).

Os testes isolados não substituem RLS, triggers, constraints, rate limiting, proteção contra abuso ou moderação humana em ambiente integrado.

## Segurança de conteúdo

- Limitar comprimento de memórias e textos.
- Escapar HTML e não renderizar conteúdo executável.
- Aplicar rate limiting ou controles de abuso quando necessário.
- Restringir moderação por role.
- Não expor e-mails ou identificadores internos.
- Manter trilha de decisões administrativas relevantes.

## Privacidade

Contribuições podem conter nomes ou fatos sobre terceiros. A moderação deve rejeitar ou editar conteúdo que exponha dados pessoais indevidos, acusações, contatos privados ou material incompatível com a finalidade do evento.

## Testes mínimos

### Memórias

- memória pendente não aparece publicamente;
- memória aprovada aparece;
- memória anônima não revela autor em nenhuma página pública;
- memória ocultada deixa de aparecer;
- usuário comum não altera status de moderação;
- texto executável é neutralizado.

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

- Validar votos, unicidade, opções pertencentes à enquete e estados fechados contra triggers e constraints reais.
- Executar testes de rate limiting, sanitização e abuso em ambiente integrado.
- Testar concorrência entre votos e consistência da visão agregada de resultados.
- Remover a intervenção contraditória de `historyContentEnhancements.ts` e absorver a correção no componente canônico em refatoração futura.
- Alguns fluxos e layouts continuam distribuídos entre React e enhancements, exigindo regressão E2E permanente.
