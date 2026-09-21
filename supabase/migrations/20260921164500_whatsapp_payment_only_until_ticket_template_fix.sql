-- O template hc20_ingresso aprovado na Meta em 2026-09-21 possui o mesmo
-- texto de pagamento aprovado. Até existir um conteúdo próprio de ingresso,
-- o envio de ticket_issued_whatsapp permanece desabilitado para evitar
-- mensagem semanticamente incorreta e duplicidade com payment_approved_whatsapp.

drop trigger if exists tickets_enqueue_whatsapp_notification on public.tickets;

comment on function public.enqueue_ticket_whatsapp_notification() is
  'Preparado para uso futuro, mas sem trigger ativo enquanto hc20_ingresso repetir o texto do template de pagamento aprovado.';

notify pgrst, 'reload schema';
