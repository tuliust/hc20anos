---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 44a90e0c5ed50a48921f81743d86e031a9c6a047
generation_command: GitHub Actions / Phase 2 content and Storage
source_files:
  - supabase/functions/photo-storage/
  - supabase/functions/_shared/image-security.ts
  - supabase/migrations/
  - supabase/tests/
  - scripts/test-phase2-content-storage.mjs
  - tests/unit/image-upload-security.test.mts
  - tests/e2e/phase2-content-security.spec.ts
  - tests/e2e/engagement-flow.spec.ts
  - tests/e2e/photo-interactions-flow.spec.ts
  - tests/e2e/editorial-moderation-flow.spec.ts
  - .github/workflows/phase2-content-storage.yml
---

# Fase 2 — conteúdo e Storage

## Resultado

A Fase 2 foi executada integralmente em uma stack Supabase local reconstruída, com usuários sintéticos e sem acesso a banco remoto ou dados de produção.

| Verificação | Resultado |
|---|---|
| Validação unitária dos bytes das imagens | `success` |
| Inicialização limpa do Supabase local | `success` |
| Replay integral das migrations | `success` |
| Usuários reais no GoTrue local e roles sintéticas | `success` |
| Suítes SQL de integridade e segurança | `success` |
| Regeneração dos contratos do banco e das RPCs | `success` |
| Build TypeScript e aplicação | `success` |
| Inicialização efetiva da Edge Function `photo-storage` | `success` |
| Integração real de Auth, Storage e conteúdo | `success` |
| Instalação do Chromium | `success` |
| Regressões Playwright | `success` — 7 testes |
| Auditoria documental | `success` |

Execução de referência:

- workflow: `Phase 2 content and Storage`;
- run: `30463173986`;
- job: `90614239896`;
- commit validado: `44a90e0c5ed50a48921f81743d86e031a9c6a047`.

## Cenários integrados comprovados

1. Upload direto ao bucket privado bloqueado pelas políticas de Storage.
2. Validação de assinatura binária, MIME declarado, tamanho, dimensões, markup ativo e metadados sensíveis.
3. Upload real, deduplicação concorrente, download byte a byte e criação de tags pendentes.
4. Moderação por role, histórico de decisões e exclusão mútua de transições concorrentes.
5. Sanitização de textos e rate limiting sob concorrência.
6. Solicitação de remoção idempotente, atualização das dependências e exclusão física do objeto.
7. Upload de asset público submetido à mesma inspeção binária e servido pela origem pública correta.
8. Controle de anonimato mantido no React e preservado até a leitura pública mascarada.
9. Fluxos de memórias, enquetes, interações em fotos e moderação editorial revalidados no navegador.

## Garantias estabelecidas

- fotos privadas não dependem de URL pública permanente;
- uploads do navegador são centralizados na Edge Function;
- registros de conteúdo começam pendentes e passam por RPCs canônicas;
- autoria de memória anônima não é exposta pela RPC pública;
- solicitações simultâneas de remoção convergem para um único registro aberto;
- remoção administrativa apaga o objeto e registra histórico de moderação;
- limites e assinaturas são validados a partir dos bytes, sem confiar apenas no nome ou no MIME informado pelo cliente;
- contratos gerados refletem o schema, as RPCs, as policies e os consumidores vigentes.

## Limites da evidência

Esta evidência não comprova:

- implantação em projeto remoto de homologação ou produção;
- funcionamento de um antivírus dedicado ou serviço externo de análise de malware;
- comportamento sob carga distribuída de grande escala;
- decisões humanas ou jurídicas relacionadas à moderação e ao direito de remoção;
- integrações financeiras, webhooks, notificações e reembolsos da Fase 3.

Qualquer promoção para ambiente remoto deve seguir execução controlada, revisão das migrations, configuração de secrets e validação posterior do deploy.
