---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/app/App.tsx
  - src/lib/profileClaimIdentity.ts
  - build/profileClaimIdentityTransform.mjs
  - build/profileClaimProfileAiTransform.mjs
  - tests/e2e/profile-claim-flow.spec.ts
  - tests/e2e/profile-claim-fixtures.ts
  - supabase/migrations/
---

# Reivindicação e disputa de perfil

## Objetivo

Permitir que uma pessoa autenticada reivindique com segurança um registro pré-cadastrado de ex-aluno, preservando evidências para análise e evitando associações indevidas.

## Princípios

- A conta autenticada e a pessoa da base são entidades distintas até a aprovação.
- Correspondência por nome não é prova suficiente.
- Respostas e evidências de identidade não são conteúdo público.
- O fluxo deve sobreviver à confirmação de e-mail e retomar o ponto correto.
- Decisões administrativas sensíveis devem ser rastreáveis.

## Fluxo principal

1. O visitante localiza o próprio registro em `people`.
2. Inicia a reivindicação e informa os dados solicitados.
3. O sistema valida o payload e persiste o contexto necessário.
4. Quando a conta ainda não está confirmada, o fluxo orienta a autenticação ou confirmação de e-mail.
5. Depois da sessão válida, a solicitação é retomada sem perder a pessoa selecionada e os dados permitidos.
6. A RPC de reivindicação registra solicitação, respostas e evidências.
7. O resultado pode ser aprovado automaticamente conforme regras vigentes ou encaminhado à moderação.
8. Quando aprovado, `people`, `profiles` e `auth.users` passam a estar associados.

## Persistência temporária

`profileClaimIdentity.ts` mantém o estado necessário para retomar a reivindicação depois de etapas de autenticação.

A persistência temporária deve:

- conter somente o necessário para retomar o fluxo;
- possuir versão de contrato;
- ser removida depois do sucesso, cancelamento ou expiração;
- não incluir secrets ou evidências administrativas completas;
- não ser usada como prova definitiva de identidade.

## Transform de identidade

`profileClaimIdentityTransform.mjs` altera partes do código-fonte durante o build para instalar o contrato mais recente de identidade e retomada.

Consequências:

- o comportamento compilado pode diferir do texto aparente de `App.tsx`;
- mudanças no fluxo precisam validar o transform e o bundle final;
- substituições textuais exatas são frágeis e devem falhar quando o trecho esperado não é encontrado;
- documentação e testes devem considerar o código após transformação.

## Dados declarados

O fluxo atual evoluiu de ano de nascimento isolado para data de nascimento declarada. A data declarada é usada como evidência de verificação e não deve ser publicada no perfil.

Qualquer comparação deve ocorrer no backend ou em RPC autorizada. O frontend não deve receber dados da base que permitam descobrir a resposta correta.

## Pontuação e decisão

A existência de `score` ou respostas compatíveis não deve ser interpretada isoladamente fora da função/RPC responsável. O banco vigente define:

- quais respostas são avaliadas;
- limites de aprovação;
- quando encaminhar para revisão;
- quando recusar ou expirar;
- como tratar uma pessoa já reivindicada.

## Estados

O modelo histórico inclui estados como:

- `pending`;
- `approved`;
- `rejected`;
- `disputed`;
- `expired`.

O contrato exato deve ser confirmado pelo schema gerado após replay integral das migrations.

## Disputa

Uma disputa ocorre quando existe conflito sobre a vinculação de uma pessoa.

Procedimento esperado:

1. impedir alteração silenciosa do vínculo existente;
2. registrar o solicitante e o motivo;
3. restringir evidências à equipe autorizada;
4. permitir decisão administrativa explícita;
5. registrar notas e timestamps;
6. atualizar o vínculo somente pela operação transacional aprovada;
7. preservar auditoria do estado anterior.

## Administração

A tela administrativa deve mostrar somente informações necessárias para decidir:

- pessoa reivindicada;
- usuário solicitante;
- respostas normalizadas;
- evidências permitidas;
- score ou resultado da validação;
- histórico de decisões;
- conflito existente, quando houver.

Não exibir credenciais, tokens de sessão ou dados de outros usuários não relacionados.

## Segurança

- RPCs de reivindicação devem validar `auth.uid()`.
- Usuários comuns só podem consultar a própria solicitação.
- Aprovação e rejeição exigem role administrativa adequada.
- A vinculação deve impedir que a mesma conta assuma múltiplas pessoas incompatíveis.
- A mesma pessoa não deve ficar vinculada a duas contas ativas.
- Logs não devem copiar respostas completas sem necessidade.
- Rate limiting e proteção contra enumeração devem ser considerados nas buscas públicas.

## Privacidade

Respostas de verificação, data declarada, notas de disputa e evidências administrativas são privadas. Após a decisão, reter apenas o necessário para segurança, suporte e auditoria.

## Testes automatizados existentes

O fluxo E2E cobre retomada depois da autenticação e apresentação das evidências administrativas. Mudanças devem executar:

```bash
npm run test:e2e -- tests/e2e/profile-claim-flow.spec.ts
npm run build
```

O build também executa verificação específica do bundle de reivindicação.

## Cenários mínimos adicionais

- usuário não autenticado inicia e retoma após confirmação;
- solicitação duplicada é idempotente ou rejeitada de forma clara;
- pessoa já vinculada abre disputa, não sobrescrita silenciosa;
- conta tenta reivindicar outra pessoa depois de vínculo aprovado;
- respostas incorretas não revelam qual campo falhou;
- administrador sem role suficiente não decide a solicitação;
- cancelamento remove o estado temporário;
- dados privados não aparecem nas páginas públicas.

## Dívidas conhecidas

- O fluxo depende de transforms de build e de trechos concentrados em `App.tsx`.
- O inventário automático das RPCs, policies e estados ainda não foi gerado.
- A lógica deve ser modularizada para reduzir substituições textuais no build.
