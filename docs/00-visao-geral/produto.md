---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - src/app/App.tsx
  - src/main.tsx
  - src/app/OperationsPage.tsx
  - src/lib/publicTicketCatalog.ts
  - supabase/migrations
---

# Produto

## Propósito

O **HC 20 Anos** é a plataforma digital do reencontro de 20 anos da Turma 2006 do Colégio Henrique Castriciano.

O sistema reúne experiência pública, relacionamento entre ex-alunos, gestão de conteúdo, venda e emissão de ingressos e ferramentas operacionais para o evento.

## Públicos

| Público | Necessidade principal |
|---|---|
| Visitante | Conhecer o evento e visualizar conteúdo público autorizado. |
| Ex-aluno | Reivindicar perfil, atualizar dados, interagir com a turma e comprar ingresso elegível. |
| Convidado | Comprar ingresso individual conforme as regras vigentes. |
| Comprador | Consultar pedidos, pagamentos e ingressos vinculados à conta. |
| Administração | Configurar conteúdo, pessoas, lotes, moderação, relatórios e acessos. |
| Equipe operacional | Realizar check-in, controlar entregas operacionais e tratar reembolsos autorizados. |

## Capacidades vigentes

### Experiência pública

- Home administrada por CMS.
- Página do evento.
- Catálogo de ingressos do lote vigente.
- Diretório de ex-alunos e confirmados conforme privacidade.
- Acervo de fotos, memórias, curiosidades, enquetes e mapa de localização autorizada.
- Termos de uso e política de privacidade.

### Identidade e área autenticada

- Autenticação pelo Supabase Auth.
- Reivindicação de perfil pré-cadastrado.
- Continuidade do cadastro após confirmação de e-mail.
- Edição de perfil e preferências de privacidade.
- Geração assistida de mini bio por IA.
- Área do ex-aluno, pedidos e ingressos.

### Ingressos e pagamentos

O modelo comercial vigente possui três produtos públicos:

- **Individual**: exclusivo para ex-aluno pré-cadastrado e vinculado à conta.
- **Família**: ex-aluno pré-cadastrado, um cônjuge e um ou mais filhos, respeitando o limite operacional do pedido.
- **Convidado**: ingresso individual para participante adulto que não é ex-aluno.

O preço e a disponibilidade são determinados pelo lote vigente no banco. O frontend não deve manter preços canônicos próprios.

### Conteúdo e comunidade

- Perfis públicos condicionados às preferências de privacidade.
- Fotos com autorização e moderação.
- Marcações, curtidas e comentários.
- Memórias com opção de anonimato.
- Enquetes e resultados.
- Solicitações de remoção e disputas de perfil.

### Operação do evento

- Consulta operacional de ingressos.
- Leitura de QR Code e busca textual.
- Registro e reversão de check-in.
- Controle de itens físicos associados ao participante quando aplicável.
- Revisão e processamento de reembolsos.
- Relatórios e trilha de auditoria.

## Princípios de produto

1. **Banco como fonte de verdade operacional**: catálogo, permissões, pedidos e ingressos não podem depender de textos ou mocks do frontend.
2. **Privacidade por regra explícita**: campos pessoais só aparecem quando a flag e o contexto permitem.
3. **Operações financeiras server-side**: criação de pedidos, precificação, emissão e processamento financeiro não são confiados ao navegador.
4. **Conteúdo administrável**: textos editoriais e imagens públicas devem ser gerenciáveis pelo CMS.
5. **Rastreabilidade**: ações administrativas e transições sensíveis devem possuir evidência em logs, eventos ou registros de domínio.
6. **Compatibilidade controlada**: rotas e dados antigos podem ser suportados temporariamente, mas não devem ser confundidos com o modelo vigente.

## Limites atuais

- O sistema está orientado a um evento principal identificado por UUID fixo em diferentes pontos do código.
- O frontend ainda contém uma aplicação monolítica e várias camadas de enhancements e transforms de build.
- Alguns documentos e tipos TypeScript não representam integralmente o estado final das migrations.
- Funcionalidades históricas podem permanecer no banco ou no código por compatibilidade, sem fazer parte do catálogo público vigente.

## Critério de vigência

Uma capacidade só deve ser descrita como vigente quando estiver sustentada por pelo menos um dos itens abaixo:

- fluxo executável no código atual;
- migration aplicada e validada no replay;
- teste automatizado vigente;
- contrato público ou RPC efetivamente consumido;
- operação documentada e confirmada em ambiente apropriado.