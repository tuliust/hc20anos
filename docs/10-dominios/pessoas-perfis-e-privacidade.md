---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/app/App.tsx
  - src/lib/services.ts
  - src/lib/database.types.ts
  - src/editProfileQuestionnaireBioEnhancement.ts
  - supabase/migrations/
---

# Pessoas, perfis e privacidade

## Objetivo

Documentar a separação entre a base institucional de ex-alunos, a identidade autenticada e o perfil público editável.

## Entidades principais

### `people`

Representa a pessoa conhecida pela organização antes ou independentemente de uma conta autenticada.

Exemplos de atributos:

- nome completo;
- turma, ano ou grupo;
- apelido da época escolar;
- estado de reivindicação;
- usuário que reivindicou a identidade;
- visibilidade pública.

`people` não é uma tabela de autenticação. A existência de uma pessoa na base não concede acesso ao sistema.

### `auth.users`

Representa a identidade autenticada administrada pelo Supabase Auth.

O usuário autenticado pode ser associado a uma pessoa pré-cadastrada depois que o fluxo de reivindicação for concluído.

### `profiles`

Armazena informações atuais e preferências públicas do participante, como:

- nome de exibição;
- foto atual;
- cidade, estado e país;
- profissão;
- biografia;
- links sociais;
- preferências de exibição por campo.

O perfil pertence simultaneamente à identidade autenticada e à pessoa reconhecida na base.

## Regra de vinculação

A relação esperada é:

```text
people ← perfil reconhecido → profiles ← edição pelo usuário → auth.users
```

Uma conta não deve assumir uma pessoa apenas porque nomes ou e-mails são semelhantes. A associação depende do fluxo de reivindicação e das regras vigentes no banco.

## Visibilidade pública

A exibição pública depende de duas camadas:

1. a pessoa precisa estar elegível para aparecer publicamente;
2. cada campo do perfil precisa respeitar sua flag de exibição.

Exemplos:

- cidade somente quando `show_city` permitir;
- foto atual somente quando a preferência correspondente permitir;
- links sociais somente quando autorizados;
- pessoa inteira omitida quando `is_visible=false`.

A ausência de um controle visual no frontend não autoriza exposição. A consulta pública e as policies devem aplicar a mesma regra.

## Localização

Localizações públicas devem ser derivadas de uma view ou consulta que aplique as preferências de privacidade. Não consultar diretamente todos os campos de `profiles` para construir mapas ou listas públicas.

## Foto de perfil

O bucket de avatares pode ser publicamente endereçável, mas upload, substituição e exclusão devem ser restritos ao proprietário da pasta ou a administradores autorizados.

Uma URL tecnicamente pública não significa autorização editorial para exibição. A aplicação ainda deve conferir a preferência do perfil.

## Edição do perfil

O usuário autenticado pode editar apenas o perfil associado à própria identidade.

O formulário de edição pode reunir respostas estruturadas e oferecer geração assistida de mini bio. Antes de persistir:

- normalizar campos textuais;
- limitar comprimentos;
- validar URLs;
- não armazenar secrets;
- não inferir consentimento de exibição;
- manter as flags de privacidade explícitas.

## Dados pessoais e minimização

O sistema deve coletar apenas dados necessários para:

- identificar o ex-aluno;
- operar o evento e os ingressos;
- permitir participação voluntária no diretório e no acervo;
- atender solicitações de moderação, acesso ou remoção.

Dados de identidade usados para validação não devem ser reaproveitados automaticamente como conteúdo público.

## Dados sensíveis

Não incluir em perfil público:

- documentos pessoais;
- credenciais;
- respostas privadas de verificação;
- evidências administrativas;
- dados financeiros;
- informações médicas;
- endereço residencial completo;
- qualquer campo não expressamente destinado à publicação.

## Administração

Administradores podem precisar consultar dados ampliados para moderação ou suporte. Esse acesso deve:

- exigir autenticação;
- ser limitado por role;
- usar consultas/RPCs autorizadas;
- evitar exposição em logs;
- registrar ações sensíveis quando aplicável.

## Exclusão, ocultação e correção

Quando uma pessoa solicitar correção ou retirada:

1. verificar a identidade do solicitante;
2. identificar dados públicos e operacionais relacionados;
3. ocultar imediatamente quando houver risco de exposição indevida;
4. preservar apenas registros que possuam obrigação operacional, financeira ou de auditoria;
5. registrar a decisão administrativa sem copiar dados desnecessários.

Ocultar um perfil público não deve apagar pedidos, pagamentos ou trilhas financeiras que precisem ser preservados.

## Estados relevantes

O estado de pessoa pode incluir condições como não reivindicada, reivindicada ou confirmada. O contrato exato deve ser obtido do banco reproduzido; documentos manuais não substituem os enums e constraints finais.

## Testes mínimos

- pessoa invisível não aparece em busca pública;
- campo privado não aparece em perfil, mapa ou lista;
- usuário não edita perfil de outra pessoa;
- administrador autorizado acessa o fluxo de suporte;
- upload de avatar não permite escrever na pasta de outro usuário;
- mudança de flag de privacidade é refletida nas páginas públicas;
- dados de reivindicação não são expostos no perfil.

## Relações com outros domínios

- [`reivindicacao-de-perfil.md`](./reivindicacao-de-perfil.md)
- [`mini-bio-por-ia.md`](./mini-bio-por-ia.md)
- [`acervo-fotos-e-moderacao.md`](./acervo-fotos-e-moderacao.md)
- [`autenticacao-autorizacao-e-roles.md`](./autenticacao-autorizacao-e-roles.md)

## Dívidas conhecidas

- `src/lib/database.types.ts` precisa ser regenerado após replay integral das migrations.
- Parte das regras ainda está distribuída entre `App.tsx`, serviços, transforms e enhancements.
- A matriz final de policies de leitura e edição será produzida nos contratos gerados.
