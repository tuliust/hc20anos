# Autenticação e Roles

## Autenticação

O projeto usa Supabase Auth. O front-end usa apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Roles administrativas

Tabela: `admin_users`.

- `superadmin`: controle total.
- `admin`: gestão de evento, lotes, enquetes, moderação e relatórios.
- `moderator`: moderação de fotos, tags, comentários, memórias e perfis.
- `checkin_staff`: acesso a check-in.
- `viewer`: leitura administrativa limitada.

## Cuidados

- RLS deve proteger tabelas sensíveis.
- Service role key nunca deve ir para Vite/front-end.
- Senha do banco só deve ser usada localmente em CLI segura.
