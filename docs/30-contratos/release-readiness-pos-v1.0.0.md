---
status: canonical
owner: tuliust
last_verified: 2026-09-20
source_files:
  - package.json
  - package-lock.json
  - .nvmrc
  - .github/workflows/pr-gate.yml
  - docs/30-contratos/release-v1.0.0.md
  - docs/40-runbooks/procedimento-operacional-v1.0.0.md
  - docs/40-runbooks/checklist-homologacao-final.md
  - docs/30-contratos/advisors-batch4-2026-09-20.md
---

# Readiness pós-release v1.0.0

## Objetivo

Separar a release estável já publicada das mudanças de hardening posteriores e manter uma matriz única para a homologação final antes do evento.

A tag `v1.0.0` permanece a baseline estável publicada em 20/09/2026 e aponta para o commit `fb9bda2209e22d6cdac8fc4718480cc75226397e`. Mudanças posteriores em `main` não devem mover essa tag nem reescrever a release existente.

## Baseline imutável

- release: `HC 20 Anos v1.0.0`;
- tag: `v1.0.0`;
- commit da tag: `fb9bda2209e22d6cdac8fc4718480cc75226397e`;
- Node.js: `22.23.2`;
- npm: `10.9.8`;
- Supabase CLI congelada: `2.109.1`;
- lockfile: npm v3.

## Hardening posterior

Depois da criação da v1.0.0, a `main` recebeu rodadas incrementais de Supabase Advisors e segurança. Essas mudanças devem ser tratadas como evolução pós-release e precisam passar pelos mesmos gates antes de serem consideradas nova baseline operacional.

O workflow `.github/workflows/release-stable.yml` deixou de reagir automaticamente a novos pushes em `main`. A v1.0.0 já está publicada e não deve ser recriada nem retargetada. O workflow agora é uma verificação manual da tag/release imutável e executa os checks a partir do próprio `v1.0.0`.

O comando `npm run ci:verify` consolida a verificação reproduzível de:

- toolchain e lockfile;
- migrations;
- documentação;
- contratos estáticos;
- rotas;
- compatibilidade e consumidores de tipos;
- RPCs consumidas;
- testes dos transforms de build;
- build da aplicação.

Os workflows integrados de banco, segurança, Storage e E2E continuam complementares ao gate central.

## Estado das evidências

### Automatizado

Antes de promover um novo commit como candidato operacional:

- PR gate verde;
- build verde;
- auditoria de reprodutibilidade verde;
- migrations reproduzíveis;
- contratos gerados sincronizados;
- testes SQL aplicáveis verdes;
- workflows funcionais sem regressões relevantes.

### Manual / físico

A baseline técnica não substitui:

- check-in em dispositivo e câmera reais;
- primeira leitura e tentativa de reutilização do mesmo QR;
- contingência de rede/câmera/participante sem QR;
- iPhone/Safari e Android/Chrome;
- ciclo financeiro real controlado quando autorizado;
- transferência/reembolso/cancelamento com transação identificada;
- homologação de WhatsApp/templates quando o canal for ativado.

## Pendências aceitas

Enquanto não houver evidência física, esses itens devem continuar marcados como homologação pendente, mesmo que a implementação automatizada esteja concluída.

A existência de uma release ou de um PR verde não autoriza:

- forçar estado financeiro;
- reprocessar notificações históricas;
- ativar WhatsApp sem validar templates;
- editar migrations aplicadas;
- considerar contingência presencial ensaiada sem execução real.

## Próxima release

Uma eventual `v1.0.1` ou versão posterior só deve ser criada quando houver decisão explícita de promover uma nova baseline.

Nesse momento:

1. escolher o SHA de `main`;
2. confirmar gates e replay;
3. registrar pendências aceitas;
4. executar o checklist de homologação final;
5. criar nova tag sem alterar `v1.0.0`;
6. publicar release vinculada exatamente ao SHA aprovado.

## Referências

- [`release-v1.0.0.md`](./release-v1.0.0.md)
- [`../40-runbooks/procedimento-operacional-v1.0.0.md`](../40-runbooks/procedimento-operacional-v1.0.0.md)
- [`../40-runbooks/checklist-homologacao-final.md`](../40-runbooks/checklist-homologacao-final.md)
- [`../50-governanca/divida-tecnica-2026-09-20.md`](../50-governanca/divida-tecnica-2026-09-20.md)
