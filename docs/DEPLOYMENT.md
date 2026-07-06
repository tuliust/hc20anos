# Deployment

## Build local

```bash
npm run build
```

O aviso de chunk acima de 500 kB é conhecido e não bloqueia deploy.

## Vite + Tailwind

Arquivos obrigatórios:

- `vite.config.js` com `@vitejs/plugin-react` e `@tailwindcss/vite`.
- `src/styles.css` com `@import "tailwindcss";`.
- `src/main.tsx` importando `./styles.css`.

Se o CSS não for importado, a página carrega desformatada.

## Vercel

- Deploy a partir da branch `main`.
- Variáveis públicas necessárias:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DEV_MODE=false`

## Nunca versionar

- `.env`
- `.env.local`
- `dist/`
- `node_modules/`
- `supabase/.temp/`
