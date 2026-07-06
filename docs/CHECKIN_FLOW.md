# Fluxo de Check-in

## Modelo

Não há tabela `checkins`. O check-in usa campos da tabela `tickets`:

- `checked_in`
- `checked_in_at`
- `checked_in_by_admin_id`

## Fluxo

1. Equipe busca QR/código ou participante.
2. Sistema valida ticket e status do pedido.
3. Se aprovado e não utilizado, marca `checked_in=true`.
4. Registra data/hora e admin responsável.
5. Se já usado, exibe alerta de duplicidade.

## Permissões

- `superadmin`, `admin` e `checkin_staff` podem operar check-in.
