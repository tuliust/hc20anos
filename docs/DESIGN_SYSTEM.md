# Design System — Evento Ex-Alunos HC

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

- Títulos: `Playfair Display`, fallback `Georgia`, peso alto, caixas editoriais.
- Interface/texto: system UI, legível em mobile.
- Metadados/códigos: monoespaçada via `font-mono`.

## Componentes

### Botões

- Altura mínima confortável em mobile: 44–48px.
- Variantes: `primary`, `outline`, `ghost`, `gold`, `danger`.
- Usar largura total em formulários mobile e largura natural no desktop.

### Cards

- Base: `bg-[#141f14]`, borda `border-[#2d6a4f]/30`, padding 24–32px.
- Cards de ingresso: preço em destaque, status visível, CTA à direita no desktop e empilhado no mobile.
- Cards de foto: proporção 4:3, imagem `object-cover`, legenda e ano.
- Cards de perfil: iniciais/foto, nome, apelido e status.

### Badges

- Status de pagamento: `approved`, `pending`, `in_process`, `rejected`, `cancelled`, `refunded`, `expired`, `charged_back`.
- Status de ingresso/check-in: `checked_in`, `valid`, `used`, `invalid`.
- Status de moderação: `pending`, `approved`, `rejected`, `hidden`, `removed`, `featured`.

### Inputs e formulários

- Inputs escuros, borda verde translúcida, foco verde.
- Labels monoespaçadas em caixa alta.
- Formulários curtos, blocos empilhados no mobile.

### Upload de imagem

- Área retangular com borda tracejada.
- Mostrar consentimento antes do envio.
- Estado pendente pós-upload.
- Preview quando possível.

### QR Code e check-in

- QR real gerado por código textual do ingresso.
- Código textual sempre visível como fallback.
- Check-in deve aceitar câmera, QR/código, nome, e-mail e telefone.
- Estados obrigatórios: válido, já utilizado, pagamento pendente, não encontrado e não autorizado.

### Navegação mobile

- Header compacto.
- Menu simplificado.
- CTA principal `Comprar ingresso` sempre fácil de acessar.
- Cards empilhados e botões full-width.

### Tabelas e admin

- Tabelas com overflow horizontal em mobile.
- Ações por linha devem ficar agrupadas e com botões pequenos.
- Dashboard administrativo deve privilegiar cards de KPI.

## QA mobile obrigatório

Validar manualmente:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px

Checklist:

- Header sem quebra visual.
- CTA visível e tocável.
- Cards empilhados corretamente.
- Formulários sem campos esmagados.
- Tabelas com rolagem horizontal.
- Modais e áreas de upload sem overflow.
- QR e câmera legíveis em mobile.
