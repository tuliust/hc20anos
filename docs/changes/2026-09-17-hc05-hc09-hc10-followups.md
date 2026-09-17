# Follow-ups HC-05, HC-09 e HC-10

## HC-05 — cards Data / Horário / Local

Na rota `/evento`, os três cards de informações operacionais continuam destacados por borda, tipografia e ícones, mas deixam de usar fundo preto sólido.

## HC-09 — composição para Usuário Externo

O checkout de Usuário Externo deixa de esconder os controles de acompanhantes. O participante principal continua vinculado à conta externa; é permitido adicionar um adulto/pessoa adicional e filhos, respeitando o limite global de seis participantes. A precificação de filhos permanece calculada pela idade na data do evento: até 8 anos grátis, de 9 a 12 anos meia e a partir de 13 anos valor integral.

A migration `20260917150000_external_checkout_companions_hc09.sql` remove somente a trava `external_single_ticket_required`; as demais validações de composição, capacidade, identidade, idade e preço permanecem no RPC existente.

## HC-10 — logout e troca de usuário

A Home passa a neutralizar imediatamente os estados `Compra feita!` e `Já confirmado` ao receber logout. Em uma troca de conta, o estado visual é restaurado para o padrão enquanto os dados do novo usuário são recarregados, evitando herdar a confirmação do usuário anterior.
