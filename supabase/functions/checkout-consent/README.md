# checkout-consent

Função legada mantida temporariamente para compatibilidade com links de reservas criados durante o hotfix de 16/09/2026.

O fluxo atual não depende desta função: o frontend exige o aceite dos Termos de Uso e da Política de Privacidade, e `checkout-create` valida e registra o aceite autenticado em `checkout_terms_acceptances` antes de retornar a URL do Mercado Pago.

Não usar em novas integrações. Pode ser removida depois que não houver reservas antigas ativas apontando para este endpoint.
