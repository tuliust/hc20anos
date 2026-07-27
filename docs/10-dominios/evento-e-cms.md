---
status: canonical
owner: tuliust
last_verified: 2026-07-27
last_verified_commit: 032971abf43fc1729227ca9013f4331ecf6d724c
source_files:
  - src/app/PublicCmsStrictGuard.tsx
  - src/app/CmsAdminPanels.tsx
  - src/app/App.tsx
  - src/lib/neutralCmsDefaults.ts
  - src/lib/services.ts
  - tests/e2e/editorial-moderation-flow.spec.ts
  - tests/e2e/editorial-moderation-fixtures.ts
  - docs/30-contratos/testes-moderacao-editorial.generated.md
  - scripts/audit-strict-cms.mjs
  - scripts/audit-home-cms-production.mjs
  - supabase/migrations/
---

# Evento e CMS

## Objetivo

Descrever como informações institucionais, editoriais e comerciais do HC 20 Anos são carregadas, publicadas e protegidas contra conteúdo demonstrativo ou incompleto.

## Princípio central

O Supabase e o CMS administrativo são a fonte de verdade do conteúdo público. Textos, pessoas, ingressos e configurações demonstrativas presentes no código não devem ser tratados como conteúdo publicável.

O runtime instala neutralizações editoriais e uma guarda estrita para impedir que páginas públicas pareçam válidas quando o CMS não contém os registros mínimos necessários.

## Componentes

### Evento

O registro de evento concentra identidade e configuração operacional, incluindo, conforme o estado final das migrations:

- título, slug e descrição;
- data, horário e localização;
- status de publicação;
- status de vendas;
- contatos e regras gerais;
- políticas de acompanhante e reembolso;
- configuração de acervo pós-evento.

As páginas públicas devem consumir o evento publicado. Registros em `draft`, cancelados ou incompletos não devem ser apresentados como evento vigente.

### Conteúdo editorial

A camada de serviços expõe blocos editoriais usados pela home e demais páginas. O CMS administrativo é responsável por editar e persistir esse conteúdo.

Conteúdo editorial inclui, entre outros:

- títulos e textos da home;
- informações do evento;
- destaques e chamadas;
- perguntas frequentes;
- textos de políticas e instruções;
- conteúdo do acervo pós-evento.

### Pessoas visíveis

A base de pessoas não é automaticamente pública. Uma pessoa só pode aparecer em listas públicas quando as regras de visibilidade e privacidade permitirem.

A guarda estrita considera a disponibilidade de pessoas visíveis em páginas que dependem desse conteúdo.

### Catálogo de ingressos

O catálogo comercial não deve ser preenchido por textos fixos do CMS. Nome, descrição, disponibilidade e preço devem refletir o lote e os produtos vigentes no banco. Consulte [`catalogo-de-ingressos.md`](./catalogo-de-ingressos.md).

## Guarda estrita do CMS

`PublicCmsStrictGuard` verifica se páginas públicas dependentes de CMS possuem dados mínimos. Quando a configuração necessária está ausente, o sistema apresenta um estado de “CMS pendente” em vez de publicar conteúdo demonstrativo como se fosse real.

A guarda deve permanecer instalada em `src/main.tsx` enquanto existirem defaults, mocks ou conteúdo de compatibilidade no bundle.

## Defaults neutros

`neutralCmsDefaults.ts` neutraliza textos e coleções que poderiam mascarar ausência de conteúdo real. Esse mecanismo existe para:

- evitar a publicação acidental de textos de protótipo;
- impedir que `MOCK_PEOPLE` seja exibido como base real;
- tornar falhas de configuração visíveis;
- forçar a administração do conteúdo pelo CMS.

Defaults neutros são salvaguardas técnicas, não uma segunda fonte editorial.

## Fluxo editorial

1. Um usuário autorizado acessa o painel administrativo.
2. O conteúdo é criado ou atualizado no Supabase.
3. O registro é validado e marcado para publicação conforme o modelo da tabela.
4. A aplicação pública consulta a camada de serviços.
5. A guarda estrita confirma que os dados mínimos existem.
6. A página apresenta somente conteúdo publicado e permitido.

## Estados e publicação

Sempre que uma entidade possuir status editorial, a leitura pública deve filtrar estados aprovados ou publicados. Registros pendentes, rejeitados, ocultos ou removidos permanecem acessíveis somente aos fluxos administrativos autorizados.

## Administração

A capacidade de editar CMS depende de autenticação, registro em `admin_users` e policies/RPCs vigentes. Ocultar controles no frontend não substitui autorização no banco.

Toda alteração administrativa relevante deve produzir `updated_at` e, quando aplicável, trilha em `audit_logs`.

## Evidência funcional de moderação

O workflow `Editorial moderation functional tests` executou build, Chromium e dois E2E com resultado `success`. O relatório gerado está em [`../30-contratos/testes-moderacao-editorial.generated.md`](../30-contratos/testes-moderacao-editorial.generated.md).

A execução com fixtures HTTP isoladas comprova:

- entrada administrativa nas filas de moderação;
- memória anônima sem exposição do nome protegido na interface editorial;
- aprovação de memória com status, administrador e timestamp;
- rejeição de comentário com limpeza de aprovação anterior;
- remoção do item da fila pendente após a transição;
- criação de registro de auditoria com ação, entidade e identificador.

A evidência não substitui RLS, grants, constraints, revisão humana ou validação integrada das políticas do banco.

## Auditorias disponíveis

```bash
npm run audit:cms-strict
npm run audit:cms-production
```

A auditoria estrita procura regressões que reintroduzam conteúdo demonstrativo ou removam as proteções do CMS. A auditoria de produção verifica condições específicas da home e da configuração publicada.

## Regras de segurança editorial

- Não publicar nomes, fotos ou localização sem respeitar flags de visibilidade.
- Não usar mocks como fallback silencioso em produção.
- Não usar texto do frontend como autoridade comercial.
- Não liberar conteúdo pendente de moderação.
- Não remover a guarda estrita sem substituir suas garantias por validação equivalente.
- Não guardar secrets ou dados sensíveis em registros de CMS.

## Falhas esperadas

### Página exibe “CMS pendente”

Verificar:

1. se existe evento publicado;
2. se os blocos necessários foram persistidos;
3. se o catálogo vigente está disponível;
4. se existem pessoas visíveis quando a página depende delas;
5. se as policies permitem a leitura pública correta.

### Conteúdo antigo continua aparecendo

Verificar cache do navegador, dados persistidos no Supabase, status de publicação e se existe transformação/enhancement sobrescrevendo o DOM após a renderização inicial.

### Conteúdo demonstrativo reapareceu

Executar as auditorias de CMS e revisar alterações em `services.ts`, `neutralCmsDefaults.ts`, `PublicCmsStrictGuard.tsx` e `src/main.tsx`.

## Critérios de aceite para mudanças

Uma mudança de CMS está completa quando:

- o conteúdo pode ser administrado sem alterar código;
- o estado sem dados é explícito;
- a leitura pública respeita publicação, moderação e privacidade;
- os defaults continuam neutros;
- as auditorias de CMS passam;
- o documento é atualizado quando o contrato editorial mudar.

## Dívidas conhecidas

- Validar as filas editoriais contra RLS e grants reais em ambiente integrado.
- Executar cenários de concorrência, ações em lote e falha parcial de auditoria.
- Parte dos contratos editoriais e defaults ainda está concentrada em `src/lib/services.ts`.
- O frontend combina renderização React, mounts e enhancements; uma alteração visual pode não estar limitada a um único componente.
