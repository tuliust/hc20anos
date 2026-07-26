---
status: draft
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: 4f87125631c15d3f24187f1fabc5381e27610997
source_files:
  - src/styles.css
  - src/app/App.tsx
---

# Design System — Evento Ex-Alunos HC

> Referência visual ainda não validada integralmente contra todas as páginas, mounts e enhancements. Deve permanecer `draft` até revisão visual do runtime compilado.

## Princípios

- Mobile-first: projetar primeiro para 320–430px e expandir com `sm`, `md` e `lg`.
- Interface editorial, nostálgica e funcional: verde HC como base, dourado para acentos e off-white para contraste.
- Ações primárias sempre grandes, retangulares e fáceis de tocar.
- Estados explícitos: loading, vazio, sucesso, erro, pendente, aprovado, rejeitado, usado e indisponível.

## Cores

| Token | Hex | Uso |
|---|---:|---|
| `hc.background` | `#0d1a0f` | fundo principal |
| `hc.deep` | `#080f08` | áreas profundas |
| `hc.surface` | `#141f14` | cards e painéis |
| `hc.surfaceAlt` | `#1a2e1a` | inputs e blocos secundários |
| `hc.green` | `#2d6a4f` | CTA primário, sucesso e navegação ativa |
| `hc.greenLight` | `#74c69d` | feedback positivo |
| `hc.muted` | `#7a9a7a` | texto secundário |
| `hc.gold` | `#c9a84c` | destaque premium, data e preço |
| `hc.paper` | `#f0ebe0` | texto claro e cards de convite/ingresso |
| `hc.error` | `#c0392b` | erro, recusado e ação destrutiva |

## Tipografia

- Títulos: `Playfair Display`, fallback `Georgia`, peso alto e tratamento editorial.
- Interface e texto: system UI legível em mobile.
- Metadados e códigos: monoespaçada via `font-mono`.

## Componentes

### Botões

- Altura mínima confortável em mobile: 44–48px.
- Variantes: `primary`, `outline`, `ghost`, `gold`, `danger`.
- Usar largura total em formulários mobile e largura natural no desktop.

### Cards

- Base escura, borda verde translúcida e padding de 24–32px.
- Cards de ingresso: preço em destaque, status visível, CTA lateral no desktop e empilhado no mobile.
- Cards de foto: proporção 4:3, imagem `object-cover`, legenda e ano.
- Cards de perfil: iniciais ou foto, nome, apelido e status.

### Badges

- Pagamento: `approved`, `pending`, `in_process`, `rejected`, `cancelled`, `refunded`, `expired`, `charged_back`.
- Ingresso/check-in: válido, utilizado, inválido e estados financeiros relacionados.
- Moderação: `pending`, `approved`, `rejected`, `hidden`, `removed`, `featured`.

Os códigos reais devem vir dos contratos do domínio, não do design system.

### Inputs e formulários

- Inputs escuros, borda verde translúcida e foco visível.
- Labels legíveis e consistentes.
- Formulários curtos, agrupados e empilhados no mobile.
- Erros associados ao campo e resumo quando necessário.

### Upload de imagem

- Área retangular com borda tracejada.
- Consentimento apresentado antes do envio.
- Preview quando possível.
- Estados de upload, processamento, pendência e falha explícitos.

### QR Code e check-in

- Código textual sempre disponível como fallback.
- Check-in compatível com câmera e entrada manual permitida pela operação.
- Estados obrigatórios: válido, já utilizado, pagamento pendente, não encontrado, cancelado, reembolsado e não autorizado.

### Navegação mobile

- Header compacto.
- Menu simplificado.
- CTA principal fácil de acessar.
- Cards empilhados e botões full-width quando apropriado.

### Tabelas e administração

- Overflow horizontal em mobile.
- Ações agrupadas por linha.
- KPIs priorizados em cards.
- Dados sensíveis minimizados.
- Ações financeiras ou destrutivas exigem confirmação.

## Acessibilidade

- Contraste verificável entre texto e fundo.
- Foco visível em controles.
- Alvos de toque de pelo menos 44px.
- Labels e nomes acessíveis.
- Não comunicar estado somente por cor.
- Modais com foco controlado e fechamento por teclado.
- QR Code acompanhado de alternativa textual.
- Imagens com texto alternativo adequado ao contexto.

## QA visual obrigatório

Validar manualmente:

- 320px;
- 375px;
- 390px;
- 430px;
- 768px;
- 1024px;
- 1440px.

Checklist:

- header sem quebra;
- CTA visível e tocável;
- cards empilhados corretamente;
- formulários sem campos comprimidos;
- tabelas com rolagem horizontal;
- modais e uploads sem overflow;
- QR e câmera legíveis;
- foco e navegação por teclado;
- estados de erro, vazio e loading.

## Critério para `canonical`

- tokens comparados com CSS e componentes reais;
- páginas públicas e administrativas revisadas;
- mounts e enhancements incluídos na inspeção;
- testes visuais executados;
- contraste e navegação por teclado verificados;
- divergências entre token e uso direto registradas e corrigidas.
