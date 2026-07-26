---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - src/app/App.tsx
  - src/main.tsx
  - build/buyerOrdersSharedRouteTransform.mjs
  - vercel.json
---

# Inventário de rotas

> Inventário manual do comportamento atual. Deve ser substituído por `rotas.generated.md` produzido depois dos transforms de build.

## Roteamento

O projeto usa roteamento customizado baseado em `window.location`, `history.pushState` e estado interno de página. Não existe um manifesto único de React Router que represente todo o runtime.

A configuração da Vercel reescreve qualquer caminho para `/`, permitindo que a SPA interprete a rota.

## Rotas públicas principais

| Caminho | Página/finalidade |
|---|---|
| `/` | home |
| `/evento` | informações do evento |
| `/ingressos` | catálogo público |
| `/checkout` | composição e início da compra |
| `/confirmacao` | acompanhamento do retorno do checkout |
| `/quem-vai` | participantes visíveis |
| `/turma` | experiência da turma |
| `/ex-alunos` | diretório de ex-alunos |
| `/reivindicar-perfil` | reivindicação de identidade |
| `/nossa-historia` | história e acervo |
| `/foto` | envio ou visualização de foto conforme estado da aplicação |
| `/nossa-historia/memorias` | memórias colaborativas |
| `/curiosidades` | curiosidades editoriais |
| `/mapa` | localização pública autorizada |
| `/convite` | convite compartilhável |
| `/pos-festa` | acervo pós-evento |
| `/login` | autenticação |
| `/termos` | termos de uso |
| `/privacidade` | política de privacidade |

## Rotas autenticadas de participante

| Caminho | Finalidade | Proteção esperada |
|---|---|---|
| `/minha-area` | área do ex-aluno | sessão válida |
| `/editar-perfil` | edição do próprio perfil | sessão e vínculo do perfil |
| `/meu-ingresso` | experiência legada de ingresso | sessão e acesso ao ingresso |
| `/meus-pedidos` | área compartilhada de pedidos e ingressos | sessão e propriedade dos pedidos |
| `/meus-ingressos` | alias legado para `/meus-pedidos` | mesma proteção |

`/meus-pedidos` e seu alias são injetados no `App.tsx` durante o build por `buyerOrdersSharedRouteTransform.mjs`.

## Rotas administrativas

| Caminho | Finalidade | Proteção esperada |
|---|---|---|
| `/admin` | administração geral | role administrativa |
| `/checkin` | check-in integrado ao shell principal | role operacional |
| `/admin/operacao` | página standalone de operações | role operacional/administrativa |
| `/admin/checkin` | página standalone de check-in | role operacional/administrativa |

As páginas standalone são detectadas em `src/main.tsx` antes ou fora do fluxo comum de `App.tsx`.

## Redirecionamentos legados

| Caminho | Destino atual | Motivo |
|---|---|---|
| `/convidado` | `/ingressos` | fluxo antigo de aprovação de convidado encerrado pelo modelo vigente |
| `/aprovacoes-convidados` | `/ingressos` | fluxo legado não deve continuar acessível |
| `/meus-ingressos` | experiência de `/meus-pedidos` | compatibilidade de URL |

Outros aliases podem existir em `pageFromPathname` e devem ser extraídos automaticamente.

## Proteção no frontend

O código mantém grupos equivalentes a:

- páginas protegidas de ex-aluno;
- páginas protegidas administrativas.

Essa proteção melhora navegação, mas não substitui RLS, RPCs e autorização server-side.

## Navegação

`updateBrowserPath` e listeners de `popstate` mantêm URL e estado de página sincronizados. Mudanças precisam validar:

- clique em links internos;
- botão voltar/avançar;
- acesso direto por URL;
- refresh;
- rota desconhecida;
- redirects legados;
- rotas injetadas depois do transform.

## Rotas desconhecidas

O comportamento de fallback deve ser explícito: home, página de não encontrado ou redirecionamento controlado. Não renderizar área protegida por erro de parsing.

## Testes mínimos

- todas as rotas públicas carregam por acesso direto;
- rotas protegidas redirecionam ou bloqueiam sem sessão;
- usuário comum não acessa administração;
- aliases resolvem sem loop;
- `/meus-pedidos` existe no bundle final;
- rotas standalone não montam o shell incorreto;
- refresh na Vercel funciona por causa do rewrite;
- navegação voltar/avançar preserva a página correta.

## Geração futura

O gerador deverá:

1. aplicar ou observar os transforms de build;
2. extrair `PAGE_PATHS`, aliases e grupos protegidos;
3. extrair rotas standalone de `main.tsx`;
4. extrair redirects;
5. classificar público, autenticado e administrativo;
6. comparar o resultado com este arquivo;
7. falhar no CI quando houver divergência.
