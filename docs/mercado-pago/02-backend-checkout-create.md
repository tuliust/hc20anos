# Backend de criação do checkout

## Novo endpoint

Edge Function: `checkout-create`

Responsabilidades:

- exigir sessão Supabase válida;
- validar o payload básico;
- chamar `create_checkout_order` com service role;
- identificar o lote vigente;
- calcular preços exclusivamente no banco;
- criar pedido, participantes e extras em uma transação;
- reservar o pedido por 30 minutos;
- criar a preferência do Checkout Pro;
- escolher `sandbox_init_point` em teste e `init_point` em produção;
- retornar somente a URL selecionada, o token público do pedido e a expiração.

## Payload

```json
{
  "buyer_name": "Nome do comprador",
  "buyer_email": "email@example.com",
  "buyer_phone": "84999999999",
  "product_code": "family_full",
  "idempotency_key": "uuid-ou-chave-aleatoria-do-cliente",
  "participants": [
    {
      "client_key": "alumni-1",
      "participant_type": "alumni",
      "full_name": "Nome do ex-aluno",
      "user_id": "uuid",
      "person_id": "uuid"
    },
    {
      "client_key": "spouse-1",
      "participant_type": "spouse",
      "full_name": "Nome do cônjuge",
      "relationship_to_alumni": "spouse"
    },
    {
      "client_key": "child-1",
      "participant_type": "child",
      "full_name": "Nome do filho",
      "birth_date": "2018-05-10",
      "relationship_to_alumni": "child"
    }
  ],
  "extras": [
    {
      "participant_key": "alumni-1",
      "extra_type": "drinks",
      "quantity": 2
    }
  ]
}
```

## Resposta

```json
{
  "checkout_url": "https://...",
  "order_public_token": "uuid",
  "expires_at": "2026-07-16T03:30:00Z",
  "reused": false
}
```

## Secrets necessários

```text
SITE_URL=https://hc20anos.com.br
MERCADO_PAGO_ENV=test
MERCADO_PAGO_ACCESS_TOKEN=...
MERCADO_PAGO_WEBHOOK_SECRET=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_FUNCTIONS_URL=...
```

Nenhum desses valores deve ser versionado.

## Publicação

```bash
supabase functions deploy checkout-create
```

A função deve receber o cabeçalho `Authorization: Bearer <access_token_da_sessao>`.

## Compatibilidade

O endpoint legado `/server/make-server-62fab262/orders` ainda não foi removido. O frontend continuará usando o fluxo anterior até a etapa de migração da interface. Isso permite validar banco e Edge Function isoladamente antes da troca.

## Pendências antes da ativação

- aplicar migrations no ambiente Supabase de teste;
- publicar `checkout-create`;
- configurar secrets;
- validar preferência com usuário de teste do Mercado Pago;
- migrar o frontend;
- endurecer o webhook legado antes de processar pagamentos reais.
