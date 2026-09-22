-- Histórico reconciliado com a migration aplicada no Supabase em 2026-09-21.
-- O trigger de ingresso via WhatsApp foi desabilitado antes da remoção definitiva do canal.

drop trigger if exists tickets_enqueue_whatsapp_notification on public.tickets;

notify pgrst, 'reload schema';
