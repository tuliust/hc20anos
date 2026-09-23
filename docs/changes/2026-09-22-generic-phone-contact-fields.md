---
status: historical
owner: tuliust
last_verified: 2026-09-22
last_verified_commit: 39331876c8adfc6d5cb32d0d8292b57d5898d006
source_files:
  - supabase/migrations/20260922064000_generic_phone_contact_fields.sql
  - src/lib/database.types.ts
  - src/lib/services.ts
---

# Telefone genérico nos dados cadastrais

Registro da alteração que remove a nomenclatura específica de WhatsApp dos dados cadastrais, preservando os números existentes como telefone genérico.

A migration final roda após as migrations da Etapa 3, renomeia os campos persistidos e atualiza os contratos e consumidores correspondentes. A alteração não reintroduz integração, templates, jobs ou notificações de WhatsApp.
