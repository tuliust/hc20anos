# Deployment

## Build local

```bash
npm run build
```

O aviso de chunk acima de 500 kB é conhecido e não bloqueia deploy.

## Vite + Tailwind

Arquivos obrigatórios:

- `vite.config.ts` com `@vitejs/plugin-react`, `@tailwindcss/vite` e as transformações de build registradas.
- `src/styles.css` com `@import "tailwindcss";`.
- `src/main.tsx` importando `./styles.css`.

Se o CSS não for importado, a página carrega desformatada.

## Vercel

- Deploy a partir da branch `main`.
- Variáveis públicas necessárias:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DEV_MODE=false`
- A geração do perfil com IA aceita uma das configurações server-side abaixo, nesta ordem:
  1. `OPENAI_API_KEY` para chamada direta à OpenAI;
  2. `AI_GATEWAY_API_KEY` para chamada pelo Vercel AI Gateway;
  3. `VERCEL_OIDC_TOKEN`, fornecido automaticamente em deployments Vercel compatíveis com AI Gateway.
- Variável server-side opcional:
  - `OPENAI_PROFILE_MODEL` — padrão: `gpt-5-mini`; pelo AI Gateway o prefixo `openai/` é acrescentado automaticamente quando necessário.

Credenciais server-side nunca devem usar o prefixo `VITE_`, pois precisam permanecer restritas às funções da Vercel.

## Nunca versionar

- `.env`
- `.env.local`
- `dist/`
- `node_modules/`
- `supabase/.temp/`
