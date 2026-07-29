-- ================================================================
-- Phase 2 — remove legacy public-memory defaults
-- ================================================================

-- A historical public-page migration forced every new memory to be public,
-- non-anonymous and immediately approved. The moderated Phase 2 contract must
-- preserve the user's anonymity choice and always enqueue new submissions.
drop trigger if exists trg_force_public_memory_defaults on public.memories;
drop function if exists public.force_public_memory_defaults();

-- Existing records are intentionally preserved. This migration only changes
-- the behavior of future submissions and the final replayed schema.

notify pgrst, 'reload schema';
