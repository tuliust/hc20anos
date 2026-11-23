---
status: draft
owner: tuliust
last_verified: 2026-11-23
source_files:
  - README.md
  - package.json
  - src/lib/supabase.ts
  - supabase/migrations/
  - docs/index.md
  - docs/00-visao-geral/fontes-de-verdade.md
  - docs/30-contratos/estado-operacional-2026-09-20.md
  - docs/40-runbooks/desenvolvimento-local.md
  - docs/40-runbooks/migrations.md
  - docs/40-runbooks/procedimento-operacional-v1.0.0.md
  - docs/50-governanca/politica-de-documentacao.md
---

# STATUS E CONTINUIDADE — HC 20 Anos / EventoHC

> **Data de diagnóstico remoto:** 23/11/2026.
> **Escopo:** auditoria de leitura do GitHub, Supabase e Vercel. A inspeção da pasta Windows, do build local e dos fluxos funcionais ainda não ocorreu.
> **Segurança:** não modificar a produção, banco, pessoas, pedidos, pagamentos, reembolsos, ingressos, check-ins, webhooks ou notificações sem aprovação específica e plano de reversão.

## 1. Identidade canônica e estado atual

| Componente | Identidade e resultado verificados |
| --- | --- |
| Nome de negócio | HC 20 Anos / EventoHC (reencontro Colégio Henrique Castriciano, Turma 2006) |
| Pasta Windows informada | `C:\Users\Tulius\Documents\github\hc20anos` — diagnóstico Git local ainda pendente |
| GitHub | https://github.com/tuliust/hc20anos — repositório público, branch `main` protegida |
| Commit da main | `a4bb641788b7fcf018058a4c4453d6f0f4814f0c` |
| Vercel | Projeto `hc20anos`, ID `prj_sKstrFqpyyUdy95JoLNrp8tVm9SE`, Vite, Node 22.x |
| Deployment | `dpl_HaELDSdtP4zu3GJ1boCmSx7w8Nmj`, produção `READY`, mesmo SHA `a4bb641...` |
| Domínio principal | https://www.hc20anos.com.br (verificado) |
| Domínio raiz | https://hc20anos.com.br (verificado, redireciona para www) |
| Supabase | Projeto `EventoHC` / ref `tjnqqsbwgjcdzcxykyif`; https://supabase.com/dashboard/project/tjnqqsbwgjcdzcxykyif |
| Organização Supabase | `tuliustsangaropulos`, ID `gupklckstcjwwitbnrdo`, na conta original |
| Estado do Supabase na consulta | `ACTIVE_HEALTHY`; região `sa-east-1` |
| Versão documentada como baseline estável | Tag `v1.0.0` criada em 20/09/2026; **não mover, recriar ou substituir essa tag** |

**Observação temporal:** o Supabase foi anteriormente identificado como `INACTIVE`, mas na leitura atual do conector está `ACTIVE_HEALTHY`. Não foi feita operação de reativação nesta auditoria.

A `main` protegida tem fluxo PR-only e checks. Mudanças futuras devem respeitar `docs/index.md`, `docs/50-governanca/politica-de-documentacao.md` e os gates definidos no repositório.

## 2. Stack e operações importantes

- React 18, TypeScript, Vite, Supabase Auth/Postgres/RLS/Storage/RPC/Edge Functions, Vercel Functions, Mercado Pago, notificações transacionais e recursos de IA.
- Há funcionalidades com **efeitos financeiros e operacionais reais**: catálogo de ingressos, pedidos, checkout, webhooks, pagamento, reembolso, emissão, transferência, check-in e mensagens.
- O domínio público pode abrir mesmo quando determinadas APIs não funcionam; `READY` na Vercel apenas confirma o estado do deployment.
- Os contratos de dados e políticas devem ser avaliados pelas fontes indicadas em `docs/00-visao-geral/fontes-de-verdade.md`, não por mocks ou dados históricos.
- O código em `src/lib/supabase.ts` utiliza `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. `VITE_DEV_MODE=true` habilita comportamentos de desenvolvimento/fallback; para testar a integração real deve estar `false`.
- A Vercel tem variáveis com os nomes `VITE_SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_DEV_MODE` na produção; o conector não revelou os valores. A URL/ref correta e `VITE_DEV_MODE=false` **precisam ser confirmados sem expor chaves**.
- `OPENAI_API_KEY` foi observada em Preview; nenhuma conclusão foi feita sobre a necessidade ou disponibilidade em Production.
- O `package.json` exige Node.js `22.23.2` e npm `10.9.8`. O Node configurado na Vercel é 22.x. **Não instalar dependências nem alterar engine antes de verificar o ambiente Windows**.

## 3. Inventário atual do Supabase — leitura

### Banco, Auth e Storage

- **49 tabelas** de aplicação no schema `public`, todas com RLS habilitado.
- **180 migrations** registradas no remoto e **180 arquivos SQL** em `supabase/migrations/`. As 180 versões e nomes foram comparados e coincidiram integralmente em 23/11/2026.
- Última migration: `20261005033522_harden_public_write_rpcs_20261005`.
- Supabase Auth: **29 usuários**.
- Supabase Storage: **3 buckets** e **100 objetos**.
- Edge Functions: **9 ativas**: `make-server-62fab262`, `server`, `whatsapp-template-probe`, `payment-webhook`, `refund-processor`, `checkout-consent`, `photo-storage`, `checkout-create`, `notification-worker`.

### Contagens agregadas observadas

| Entidade | Registros |
| --- | ---: |
| events | 1 |
| people | 187 |
| profiles | 27 |
| auth.users | 29 |
| admin_users | 1 |
| orders | 7 |
| order_participants | 8 |
| tickets | 8 |
| payment_events | 47 |
| ticket_types | 14 |
| ticket_lots | 4 |
| refund_requests | 7 |
| ticket_transfers | 0 |
| notification_jobs | 38 |
| checkin_events | 0 |
| faq_items | 67 |
| photos | 29 |

Essas são contagens atuais do banco, **não** confirmação de que todos os pedidos estejam aprovados ou que haja novos pagamentos. Não consultar nem divulgar dados pessoais, cartões, tokens ou identificadores de transações nas próximas etapas.

### Supabase Advisor — sinalizações de segurança

- `rls_enabled_no_policy` (INFO): verificar se a ausência de política é deliberada para tabelas inacessíveis.
- `anon_security_definer_function_executable` (WARN): revisar funções `SECURITY DEFINER` executáveis por `anon`.
- `authenticated_security_definer_function_executable` (WARN): revisar funções `SECURITY DEFINER` executáveis por `authenticated`.
- `auth_leaked_password_protection` (WARN): proteção contra senhas vazadas desativada.
- Não houve análise de exploração nem mudanças em grants/RLS/Auth.

Referência: https://supabase.com/docs/guides/database/database-linter.

## 4. Documentação histórica versus estado atual

O documento canônico `docs/30-contratos/estado-operacional-2026-09-20.md` registrava **133 migrations** e evidências de pagamentos, ingressos e notificações em 20/09/2026. Esse é um snapshot histórico, não uma medição atual: agora há **180 migrations** alinhadas. Não aplicar novamente os scripts já executados.

A documentação registra em setembro que a homologação física, ciclos controlados de pagamento, reembolso, notificações e dispositivos móveis ainda eram pendentes. Esses critérios continuam pendentes **até surgirem novas evidências específicas**.

O `README.md` e `docs/40-runbooks/` indicam procedimentos de deploy, incidentes, pagamentos, operação do evento, migrations e rollback. Antes de mudar fluxo financeiro, obedecer a `docs/40-runbooks/procedimento-operacional-v1.0.0.md` e documentação canônica correspondente.

## 5. Diagnóstico inicial da pasta Windows — ainda pendente

**Pasta canônica informada:** `C:\Users\Tulius\Documents\github\hc20anos`.

Executar **somente** verificações de leitura e `git fetch origin`, que atualiza referências remotas sem alterar a worktree:

```powershell
$Pasta = 'C:\Users\Tulius\Documents\github\hc20anos'

if (-not (Test-Path -LiteralPath "$Pasta\.git")) {
    throw "Pasta Git não encontrada; verificar caminho."
}

Set-Location -LiteralPath $Pasta

Write-Output "`n=== GIT ==="
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git remote -v
git branch -vv

Write-Output "`n=== REFERENCIAS REMOTAS ==="
git fetch origin
git rev-parse main
git rev-parse origin/main
git rev-list --left-right --count main...origin/main

Write-Output "`n=== ALTERACOES LOCAIS ==="
git diff --stat
git diff --cached --stat
git ls-files --others --exclude-standard

Write-Output "`n=== AMBIENTE ==="
node --version
npm --version
Test-Path -LiteralPath '.env.local'
git check-ignore .env.local
Test-Path -LiteralPath 'node_modules'
```

**Interpretação:** o primeiro número de `main...origin/main` conta commits locais exclusivos; o segundo, remotos exclusivos. Somente `0 0` confirma alinhamento de commits. Se houver alterações locais, preservar; nunca executar `git reset --hard` nem `git push --force`. Não executar `git pull` ou checkout antes de analisar o relatório.

## 5.1. Diagnóstico Git local recebido — 23/11/2026

**Fonte:** saída PowerShell apresentada pelo usuário; não houve acesso direto ao sistema de arquivos Windows.

- Diretório Git correto: `C:/Users/Tulius/Documents/github/hc20anos`; branch `main`.
- Origin fetch/push: `https://github.com/tuliust/hc20anos.git`.
- HEAD local e `origin/main`: `a4bb641788b7fcf018058a4c4453d6f0f4814f0c`; divergência `0 0`. A `main` e a Vercel usam o mesmo SHA.
- `git status --short --branch` mostrou `## main...origin/main` e `?? .codex/`: **existe arquivo não rastreado**, `.codex/config.toml`. Não considerar o working tree completamente limpo; o arquivo pode conter configuração local do agente e **não foi inspecionado**.
- `git diff --stat` e `git diff --cached --stat`: sem diferenças em arquivos rastreados. `git ls-files --others --exclude-standard`: `.codex/config.toml`.
- O arquivo `.env.local` existe (`True`) e `git check-ignore .env.local` confirmou que é ignorado pelo Git. Nenhum valor de variável ou segredo foi exposto; destino real e `VITE_DEV_MODE` ainda precisam de validação mascarada.
- `node_modules` existe (`True`); não executar `npm ci` automaticamente nem apagar dependências existentes.
- Node instalado: **v24.22.1**; npm: **11.19.1**. O projeto está fixado em **Node 22.23.2** e **npm 10.9.8** por `.nvmrc`, `package.json` e `scripts/check-reproducibility.mjs`. Esse script rejeita Node diferente da versão fixada; mudar toolchain apenas no escopo do projeto.
- Nenhum `git pull`, checkout, reset, merge, instalação, teste, SQL ou deploy foi executado pela auditoria.

**Decisão operacional:** preservar `.codex/config.toml` e `.env.local`, não alterar `main`, não executar `git clean` ou `reset --hard`. Confirmar gerenciador de versões Node no Windows (`nvm`, `volta` ou `fnm`) antes de definir troca reversível para Node 22.23.2; a instalação existente Node 24 atende outros projetos e não deve ser substituída permanentemente. Conferir envs sem revelar valores e somente depois prosseguir para build e testes não mutáveis.

## 5.2. Validação mascarada do ambiente — retorno PowerShell em 23/11/2026

O usuário executou verificações locais sem mostrar segredos:

- `nvm: False`, `volta: False`, `fnm: False`: nenhum gerenciador de Node presente.
- `where.exe node` apontou somente para `C:\Program Files\nodejs\node.exe`, isto é, a instalação global Node 24.
- URL Supabase local = `https://tjnqqsbwgjcdzcxykyif.supabase.co`: **True**.
- Chave `VITE_SUPABASE_ANON_KEY` presente: **True**.
- Chave não começa com `sb_secret_`: **True**. Isso NÃO prova, isoladamente, que seja publicável; uma JWT legada com papel `service_role` também não possui esse prefixo. Verificar tipo/papel sem exibir o valor, se necessário.
- `VITE_DEV_MODE` não é `true`: **True**. Teste local visa dados reais, não mocks.
- Nenhum download, substituição de Node, `npm ci`, build, SQL ou deploy foi realizado como parte do diagnóstico.

A distribuição oficial **Node.js v22.23.2 para Windows contém npm v10.9.8**, coincidindo com o pin do projeto e dispensando instalação adicional de npm. Recomenda-se a distribuição portátil ZIP x64, armazenada fora do repositório, por exemplo em `$env:LOCALAPPDATA\NodePortatil`, com checksum SHA-256 conferido contra o `SHASUMS256.txt` oficial da mesma release. Acrescentar o diretório do Node portátil somente ao `PATH` da sessão PowerShell corrente e executar `node --version`, `npm.cmd --version` e `npm.cmd run audit:reproducibility` antes do build.

Não executar instalador MSI para substituir `C:\Program Files\nodejs`, não apagar `.codex/config.toml` e não executar `npm ci` inicialmente, pois `node_modules` já existe. Testar `npm.cmd run build` com Node 22; se a instalação anterior tiver incompatibilidades nativas, planejar reconstrução reproduzível pelo lockfile sem modificar os dados do projeto.

Referência oficial: https://nodejs.org/en/download/archive/v22.23.2/


## 6. Continuidade após o diagnóstico Git

1. Validar Node 22.23.2 e npm 10.9.8 previstos em `package.json`. Se as versões forem diferentes, analisar compatibilidade antes da instalação.
2. Confirmar, **sem imprimir credenciais**, que `.env.local` aponta para `https://tjnqqsbwgjcdzcxykyif.supabase.co` e usa a chave pública correta. Nenhuma service role ou secret key em variáveis `VITE_`.
3. Conferir que `VITE_DEV_MODE` não está `true` nos testes de integração real. O valor em produção precisa ser validado pela Vercel em procedimento seguro.
4. Quando o Git estiver reconciliado e o ambiente correto, usar `npm ci` se as dependências estiverem ausentes ou for necessária instalação reproduzível; `npm run build` e `npm run dev` para validação local.
5. Validar páginas e login com dados existentes **somente por leitura**, sem realizar checkout, pagamento, notificação, mudança de ingressos ou check-in.
6. Conferir contrato de APIs/Edge Functions, Vercel e credenciais sem divulgar segredos; não testar webhooks ou gerar transações reais.
7. Registrar evidências no documento de continuidade e tratar novos ajustes via branch/PR gate, sem alteração direta da main.

## 7. Limites e preservação

- `main` protegida e tag `v1.0.0`: preservar.
- GitHub, Vercel e Supabase existentes: não duplicar nem recriar.
- Dados pessoais, registros financeiros e históricos: preservar integralmente.
- Migrations: não rodar scripts já registrados, `supabase db reset`, `db push` ou `repair` sobre o projeto remoto como rotina.
- Edge Functions de pagamento, notificações, check-in, reembolso e Storage: não implantar nem disparar sem autorização específica.
- Testes de IA/WhatsApp/e-mail/pagamentos podem gerar custos e efeitos reais. Não executar automaticamente.
- Alterações documentais desta auditoria só devem ocorrer em branch separada; nenhuma mudança na `main` ou produção foi solicitada.
- Ao retomar depois, verificar primeiro `git status` e seguir `docs/index.md` + `docs/40-runbooks/`.

**Situação atual:** auditoria remota concluída, banco ativo e 180 migrations alinhadas. Pasta local e Git inventariados; verificação mascarada confirmou URL Supabase original, chave presente e modo demo desativado. Node/npm globais divergem do pin; plano de Node portátil preparado. Build e testes funcionais ainda pendentes. Preservar `.codex/config.toml`.
