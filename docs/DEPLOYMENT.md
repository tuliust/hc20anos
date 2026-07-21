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
- Variável server-side obrigatória para gerar o perfil com IA:
  - `OPENAI_API_KEY`
- Variável server-side opcional:
  - `OPENAI_PROFILE_MODEL` — padrão: `gpt-5-mini`

`OPENAI_API_KEY` nunca deve usar o prefixo `VITE_`, pois a chave precisa permanecer restrita às funções server-side da Vercel.

## Nunca versionar

- `.env`
- `.env.local`
- `dist/`
- `node_modules/`
- `supabase/.temp/`
