---
status: canonical
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 6b73969e40f7495997b703be245b7f73f06ae41c
source_files:
  - src/app/App.tsx
  - src/lib/services.ts
  - src/lib/photo.types.ts
  - tests/e2e/photo-interactions-flow.spec.ts
  - tests/e2e/photo-interactions-fixtures.ts
  - tests/e2e/editorial-moderation-flow.spec.ts
  - tests/e2e/editorial-moderation-fixtures.ts
  - docs/30-contratos/testes-interacoes-fotos.generated.md
  - docs/30-contratos/testes-moderacao-editorial.generated.md
  - supabase/migrations/
---

# Acervo, fotos e moderação

## Objetivo

Documentar o ciclo de envio, autorização, moderação, marcação, interação e remoção de imagens do HC 20 Anos.

## Entidades do domínio

### `photos`

Representa uma imagem enviada para o mural ou acervo. O registro deve manter, conforme o contrato vigente:

- referência do arquivo no Storage;
- evento relacionado;
- autor ou remetente quando disponível;
- autorização declarada;
- status de moderação;
- destaque editorial;
- timestamps de criação e revisão.

### `photo_tags`

Relaciona pessoas reconhecidas a uma foto. Uma marcação não altera a propriedade da imagem e deve respeitar moderação, visibilidade e solicitações de remoção.

### `photo_likes`

Registra interações de curtida, normalmente associadas a usuários autenticados e protegidas contra duplicidade.

### `photo_comments`

Armazena comentários sujeitos a validação e moderação. Comentários pendentes ou rejeitados não são públicos.

### `photo_removal_requests`

Registra solicitações de retirada ou ocultação preventiva de uma imagem.

## Upload

O upload deve ocorrer somente depois de:

1. validar tipo e tamanho do arquivo;
2. confirmar o evento ou contexto de destino;
3. registrar a autorização exigida;
4. gerar caminho de Storage que não permita sobrescrever arquivo de outro usuário;
5. criar o registro de foto com estado não público até a moderação, quando aplicável.

O frontend não deve considerar o upload concluído apenas porque o arquivo foi enviado. Arquivo e registro precisam permanecer consistentes.

## Autorização

`authorization_given` registra a declaração feita no envio. Essa flag não substitui análise de direitos de imagem nem impede posterior solicitação de remoção.

O texto de autorização apresentado ao usuário deve ser versionado ou rastreável quando sofrer alterações relevantes.

## Estados de moderação

O modelo histórico utiliza estados como:

- `pending`;
- `approved`;
- `rejected`;
- `removed`.

A leitura pública deve retornar apenas imagens aprovadas e não removidas. O schema gerado é a autoridade final para enums e transições permitidas.

## Fluxo de moderação

1. Foto é enviada e registrada.
2. A equipe autorizada revisa imagem, contexto e autorização.
3. A decisão é registrada com responsável e timestamp.
4. A aprovação libera a leitura pública.
5. Rejeição mantém o arquivo fora do mural.
6. Remoção posterior retira a imagem da experiência pública e preserva a trilha necessária.

## Destaques e acervo pós-evento

Fotos aprovadas podem ser marcadas como destaque ou vinculadas às configurações do acervo oficial.

A seleção editorial não muda o status de privacidade. Uma foto removida ou não aprovada não pode permanecer em destaques por referência residual.

## Marcações de pessoas

- A pessoa marcada deve existir na base ou seguir o contrato de marcação livre definido pelo produto.
- Marcações pendentes não devem aparecer como confirmadas.
- Pessoas invisíveis não devem ser expostas indiretamente por tags públicas.
- Uma solicitação de remoção pode exigir ocultar a foto inteira ou retirar uma marcação, conforme o caso.

## Curtidas

Curtidas devem ser idempotentes por usuário e foto. A contagem pública não deve permitir múltiplos registros equivalentes pela mesma identidade.

## Comentários

Comentários devem:

- exigir os dados mínimos definidos pelo contrato;
- limitar tamanho;
- neutralizar conteúdo executável;
- passar por moderação quando configurado;
- respeitar estados de remoção;
- não expor e-mail ou identificadores internos do autor.

## Solicitação de remoção

Fluxo recomendado:

1. receber a solicitação com foto, contato e motivo;
2. validar dados mínimos sem exigir exposição excessiva;
3. aplicar ocultação preventiva quando houver risco plausível;
4. encaminhar para equipe autorizada;
5. decidir como `approved`, `rejected` ou outro estado vigente;
6. remover a imagem de listas, destaques e páginas públicas quando aprovado;
7. avaliar exclusão do arquivo no Storage conforme retenção e obrigação de auditoria;
8. comunicar o resultado ao solicitante quando houver canal disponível.

## Segurança de Storage

- Não aceitar nomes de caminho controlados integralmente pelo usuário.
- Restringir escrita por pasta, usuário ou operação server-side.
- Validar MIME type e extensão.
- Não confiar apenas no atributo `accept` do navegador.
- Não publicar service role.
- Não registrar URLs assinadas temporárias em documentos ou logs persistentes.

## Dados pessoais

Fotos e marcações podem identificar pessoas. A aplicação deve considerar:

- consentimento e finalidade;
- visibilidade da pessoa;
- solicitações de remoção;
- exposição de menores;
- dados embutidos no arquivo, como metadados EXIF;
- retenção mínima necessária.

## Evidências funcionais automatizadas

### Interações públicas

O workflow `Photo interactions functional tests` aprovou build, Chromium e o E2E de interações em fotos. A evidência versionada está em [`../30-contratos/testes-interacoes-fotos.generated.md`](../30-contratos/testes-interacoes-fotos.generated.md).

A execução comprova, com fixtures HTTP isoladas:

- carregamento de foto aprovada e selecionada pela organização;
- exibição de comentário aprovado e contadores agregados;
- curtida autenticada vinculada à foto e ao usuário;
- novo comentário persistido como `pending`;
- nova marcação persistida como `pending` para pessoa elegível;
- solicitação de remoção com motivo e identidade autenticada;
- ausência de publicação direta nas escritas colaborativas.

### Moderação editorial

O workflow `Editorial moderation functional tests` aprovou dois E2E. A evidência versionada está em [`../30-contratos/testes-moderacao-editorial.generated.md`](../30-contratos/testes-moderacao-editorial.generated.md).

A execução comprova:

- acesso administrativo às filas editoriais;
- preservação da autoria protegida de memória anônima;
- aprovação de memória com administrador e timestamp;
- rejeição de comentário com limpeza da aprovação anterior;
- retirada do item da fila pendente após a decisão;
- criação de auditoria com ação, entidade e identificador.

Esses testes não substituem Storage real, RLS, grants, antivírus, inspeção de arquivos, decisão humana ou tratamento operacional de solicitações de remoção.

## Testes mínimos

- upload inválido é rejeitado;
- foto pendente não aparece publicamente;
- foto aprovada aparece uma única vez;
- foto removida desaparece de mural e destaques;
- pessoa invisível não é exposta por marcação;
- curtida duplicada não aumenta contagem;
- comentário pendente não é público;
- solicitação de remoção pode ocultar preventivamente;
- usuário comum não modera conteúdo;
- exclusão ou falha de Storage não deixa registro público quebrado.

## Operação administrativa

Painéis de moderação devem oferecer filtros por status, data e evento, além de acesso claro às solicitações de remoção. Ações em lote devem exigir confirmação e preservar auditoria.

## Dívidas conhecidas

- Validar upload, bucket, MIME type, limites, RLS e falhas parciais contra Storage controlado.
- Comprovar idempotência de curtidas e exposição pública de tags por testes integrados do banco.
- Validar o fluxo administrativo completo de solicitações de remoção e ocultação preventiva.
- Avaliar antivírus, metadados EXIF e política de retenção dos arquivos.
- Parte das operações continua concentrada na camada ampla de serviços e no `App.tsx`.
- O runbook específico de resposta a solicitações de remoção ainda deve ser validado em operação real.
