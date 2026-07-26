---
status: historical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: e4e1ee05fb0bf76934fac903740fbf6fea98dc8c
period: primeiro incremento da Edge Function checkout-create
superseded_by:
  - docs/10-dominios/checkout-e-pagamentos.md
---

# Backend de criação do checkout — registro do primeiro incremento

> [!WARNING]
> Este arquivo documenta uma etapa intermediária de implementação. O frontend já migrou para `POST /api/checkout-create`, o contrato de resposta vigente usa `public_token`, e regras comerciais posteriores alteraram produtos, extras e convidados.
>
> A referência vigente está em [`../10-dominios/checkout-e-pagamentos.md`](../10-dominios/checkout-e-pagamentos.md).

## Endpoint introduzido

Edge Function: `checkout-create`

Responsabilidades planejadas e posteriormente consolidadas:

- exigir sessão Supabase válida;
- validar o payload;
- chamar `create_checkout_order` com service role;
- identificar o lote vigente;
- calcular preços no banco;
- criar pedido e participantes em transação;
- reservar o pedido por período limitado;
- criar a preferência do Checkout Pro;
- escolher `sandbox_init_point` em teste e `init_point` em produção;
- retornar URL, token público e expiração.

## Payload registrado naquele incremento

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
  "extras": []
}
```

O campo `extras` permanece no contrato técnico por compatibilidade, mas a RPC vigente é a autoridade sobre sua aceitação.

## Resposta vigente de alto nível

```json
{
  "checkout_url": "https://...",
  "public_token": "uuid",
  "expires_at": "2026-07-16T03:30:00Z",
  "reused_preference": false
}
```

O proxy e o frontend ainda toleram nomes legados para compatibilidade, mas novos consumidores devem usar esse contrato normalizado.

## Secrets relacionados

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

Nenhum valor secreto deve ser versionado ou exposto em variável `VITE_*`.

## Publicação registrada

```bash
supabase functions deploy checkout-create
```

O repositório possui scripts npm específicos, que devem ser preferidos pelo runbook vigente quando este for concluído.

## Estado da compatibilidade

A observação original dizia que o frontend continuava usando `/server/make-server-62fab262/orders`. Isso não representa mais o fluxo canônico. O caminho atual é:

```text
src/lib/checkout.ts
  -> /api/checkout-create
  -> /functions/v1/checkout-create
```

## Uso deste arquivo

Utilize este registro apenas para compreender a evolução do endpoint e comparar contratos intermediários. Não use como checklist de produção ou referência final de regras comerciais.
