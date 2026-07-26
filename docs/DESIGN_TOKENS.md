---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 0bbc5066f1509456a926b99610ee1381d0c6e54e
source_files:
  - src/styles.css
  - src/app/App.tsx
---

# Design tokens

> Inventário visual manual. Ainda precisa ser comparado automaticamente com CSS, classes Tailwind e componentes do runtime compilado.

## Cores

| Token conceitual | Valor | Uso esperado |
|---|---:|---|
| `hc.background` | `#0d1a0f` | fundo principal |
| `hc.deep` | `#080f08` | áreas profundas |
| `hc.surface` | `#141f14` | cards e painéis |
| `hc.surfaceAlt` | `#1a2e1a` | inputs e superfícies secundárias |
| `hc.green` | `#2d6a4f` | CTA e navegação ativa |
| `hc.greenLight` | `#74c69d` | feedback positivo |
| `hc.muted` | `#7a9a7a` | texto secundário |
| `hc.paper` | `#f0ebe0` | texto claro e superfícies editoriais |
| `hc.gold` | `#c9a84c` | acento, data e preço |
| `hc.error` | `#c0392b` | erro e ação destrutiva |

Valores escritos diretamente em componentes devem ser reconciliados com esses tokens antes de promover o documento para `canonical`.

## Breakpoints

- mobile: 320–767px;
- tablet: 768–1023px;
- desktop: 1024px ou mais.

Os breakpoints efetivos são os configurados pelo Tailwind/Vite e pelas media queries do código. A tabela é uma convenção de projeto, não substitui a configuração compilada.

## Componentes conceituais

- `Btn`: `primary`, `outline`, `ghost`, `gold`, `danger`;
- `StatusBadge`: pagamento, moderação, roles e check-in;
- `EmptyState`;
- `ErrorState`;
- `LoadingState`;
- `PermissionState`;
- cards de ingresso, foto, perfil e KPI;
- modais com overlay e layout mobile-first.

A presença desses nomes no documento não garante que exista um componente React único com o mesmo nome. O runtime ainda contém componentes locais, bibliotecas de UI e enhancements imperativos.

## Tipografia

- interface: system UI ou DM Sans quando carregada;
- títulos editoriais: Playfair Display ou fallback Georgia;
- metadados: fonte monoespaçada via `font-mono`.

## Espaçamento e interação

- alvos de toque: mínimo recomendado de 44px;
- botões principais: 44–48px de altura;
- formulários mobile: largura total;
- cards: padding conceitual de 24–32px;
- foco: visível e consistente;
- animação: não pode impedir uso com preferência de movimento reduzido.

## Estados semânticos

Tokens visuais não definem a máquina de estados. Códigos como `approved`, `refunded`, `used` ou `removed` devem vir dos contratos funcionais e ser mapeados para aparência.

Cada estado precisa possuir:

- texto;
- cor ou ícone;
- contraste;
- comportamento permitido;
- fallback acessível que não dependa apenas de cor.

## Critério para `canonical`

- valores extraídos ou comparados com o CSS real;
- classes diretas divergentes inventariadas;
- tipografia carregada confirmada;
- componentes e variantes reais mapeados;
- contraste validado;
- testes visuais em breakpoints principais;
- gerador ou auditoria de tokens planejado para impedir drift.
