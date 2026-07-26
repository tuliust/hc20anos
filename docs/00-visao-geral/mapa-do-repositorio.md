---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
source_files:
  - package.json
  - vite.config.ts
  - src
  - api
  - build
  - scripts
  - supabase
  - tests
  - .github/workflows
---

# Mapa do repositório

Este mapa descreve a responsabilidade arquitetural dos principais diretórios e arquivos.

## Raiz

| Caminho | Responsabilidade |
|---|---|
| `package.json` | Scripts, dependências e comandos de build, auditoria e testes. |
| `vite.config.ts` | Pipeline de build, plugins Vite, transforms e resolução de assets do Figma. |
| `vercel.json` | Rewrite SPA para encaminhar caminhos públicos ao shell da aplicação. |
| `playwright.config.ts` | Configuração dos testes E2E e visuais. |
| `index.html` | Documento HTML base carregado pelo Vite. |
| `README.md` | Portal rápido para instalação e documentação. Não deve conter toda a especificação. |

## `src/`

Código do frontend e módulos executados no navegador.

### Arquivos centrais

| Caminho | Responsabilidade |
|---|---|
| `src/main.tsx` | Composição final do runtime, mounts adicionais, guards, enhancements e CSS. |
| `src/app/App.tsx` | Shell principal, navegação, autenticação e grande parte das páginas. |
| `src/lib/supabase.ts` | Inicialização do cliente Supabase e configuração pública. |
| `src/lib/services.ts` | Camada extensa de acesso ao Supabase, normalização e fallbacks. |
| `src/lib/database.types.ts` | Tipos TypeScript manuais relacionados ao banco. Contrato auxiliar. |
| `src/lib/checkout.ts` | Cliente do checkout seguro e consulta de status. |
| `src/lib/publicTicketCatalog.ts` | Seleção e apresentação dos três produtos públicos vigentes. |

### `src/app/`

Componentes e páginas React.

Inclui:

- experiência pública;
- checkout;
- pedidos e ingressos;
- administração;
- CMS;
- operação e scanner de check-in;
- componentes de interface reutilizáveis.

### `src/lib/`

Contratos, acesso a dados, normalizadores e utilitários de domínio.

Novas regras de negócio compartilhadas devem preferencialmente entrar nessa camada ou no backend, e não em enhancements de DOM.

### Enhancements

Arquivos com nomes como:

- `*Enhancement.ts`;
- `*Enhancements.ts`;
- `*Refinements.ts`;
- `*Mount.tsx`.

Esses módulos corrigem, complementam ou substituem partes do shell principal.

Antes de alterar uma tela, verificar se ela também é afetada por um enhancement ou mount adicional instalado em `src/main.tsx`.

### CSS

O projeto possui:

- `src/styles.css` e estilos-base;
- estilos de tema;
- arquivos CSS específicos de páginas;
- refinamentos responsivos e mobile;
- correções de acessibilidade.

A ordem de importação em `src/main.tsx` pode alterar precedência e comportamento visual.

## `build/`

Transforms executados pelo Vite antes da compilação.

Eles podem modificar arquivos TypeScript/TSX sem alterar diretamente a fonte armazenada.

### Regra de manutenção

- toda transformação deve falhar quando o trecho-alvo não for encontrado;
- cada transform deve ter teste ou verificação de bundle correspondente;
- alterações em arquivos-alvo precisam considerar o código transformado;
- transforms devem ser removidos quando a mudança puder ser incorporada definitivamente à fonte.

## `api/`

Funções server-side da Vercel.

| Caminho | Responsabilidade |
|---|---|
| `api/checkout-create.ts` | Proxy autenticado e normalizador para a Edge Function de checkout. |
| `api/generate-profile-bio.ts` | Geração segura de mini bio por OpenAI ou Vercel AI Gateway. |

Segredos usados aqui nunca devem possuir prefixo `VITE_`.

## `supabase/`

Backend persistente e operacional.

### `supabase/migrations/`

Histórico ordenado de alterações do banco.

É a fonte primária para reconstruir:

- tabelas;
- enums;
- views;
- funções e RPCs;
- triggers;
- RLS e grants;
- seeds e configurações adicionadas por migration.

Não interpretar uma migration isolada como estado final.

### `supabase/functions/`

Edge Functions e processos server-side.

Principais fluxos:

- checkout;
- webhook de pagamento;
- notificações;
- reembolsos.

### `supabase/tests/`

Testes SQL de integridade, segurança, catálogo, checkout, relatórios e outros contratos do banco.

### `supabase/manual/`

Scripts operacionais e procedimentos que não fazem parte do replay automático normal.

Qualquer script potencialmente destrutivo deve declarar claramente:

- finalidade;
- ambiente permitido;
- pré-condições;
- efeito;
- rollback ou recuperação.

### `supabase/config.toml`

Configuração mínima para a stack local usada no replay e nos testes.

## `scripts/`

Auditorias, validações, migrações auxiliares e verificações de bundle.

Scripts podem ser classificados como:

- auditoria segura e repetível;
- geração de artefato;
- migração pontual;
- aplicação de patch histórico;
- reparo operacional.

Scripts pontuais não devem ser apresentados como parte normal do desenvolvimento depois que sua função tiver sido incorporada ao código.

## `tests/`

### `tests/e2e/`

Testes Playwright de:

- fluxos públicos;
- rotas protegidas;
- catálogo;
- mobile;
- acessibilidade;
- reivindicação de perfil;
- regressões visuais e de interação.

### `tests/unit/`

Testes unitários para regras isoladas, como apresentação de FAQ.

## `.github/workflows/`

Automação do GitHub Actions.

O workflow de migrations atualmente:

- instala dependências;
- audita migrations;
- executa build;
- roda E2E de reivindicação de perfil;
- inicia Supabase local;
- reaplica todas as migrations;
- instala fixtures autenticadas;
- executa todos os testes SQL;
- publica logs de diagnóstico.

## `docs/`

Documentação técnica e funcional.

A nova organização canônica usa prefixos numéricos para diferenciar:

- visão geral;
- domínios;
- arquitetura;
- contratos gerados;
- runbooks;
- governança;
- histórico.

Documentos existentes fora dessa estrutura devem ser revisados antes de serem movidos ou classificados.

## Checklist para localizar uma regra

Ao procurar uma funcionalidade:

1. localizar a página ou componente em `src/app`;
2. verificar imports e instalações em `src/main.tsx`;
3. procurar enhancements relacionados pelo nome da funcionalidade;
4. verificar transforms em `build/` e `vite.config.ts`;
5. localizar chamadas em `src/lib/services.ts` ou módulos específicos de domínio;
6. localizar RPC, tabela ou policy nas migrations;
7. verificar Edge Functions e APIs envolvidas;
8. procurar testes SQL, unitários e E2E;
9. consultar a documentação canônica do domínio.