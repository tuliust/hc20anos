import { useState } from "react";
import { ArrowRightLeft, BadgeDollarSign } from "lucide-react";
import { supabase } from "../lib/supabase";

export function TicketTransferAction({ ticketId, disabled, onDone }: { ticketId: string; disabled: boolean; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function requestTransfer() {
    const name = window.prompt("Nome completo do novo participante");
    if (!name) return;
    const email = window.prompt("E-mail do novo participante");
    if (!email) return;
    const phone = window.prompt("WhatsApp do novo participante (opcional)") ?? "";
    setBusy(true);
    const { error } = await supabase.rpc("request_ticket_transfer", { p_ticket_id: ticketId, p_to_name: name, p_to_email: email, p_to_phone: phone || null });
    setBusy(false);
    onDone(error ? `Não foi possível solicitar a transferência: ${error.message}` : "Transferência solicitada. O novo participante deve entrar com o e-mail informado e aceitar a transferência.");
  }
  return <button onClick={() => void requestTransfer()} disabled={disabled || busy}><ArrowRightLeft size={17}/>{busy ? "Solicitando..." : "Transferir"}</button>;
}

export function OrderRefundAction({ orderId, disabled, onDone }: { orderId: string; disabled: boolean; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function requestRefund() {
    const reason = window.prompt("Informe o motivo da solicitação de reembolso");
    if (!reason) return;
    if (!window.confirm("Confirmar a solicitação de reembolso deste pedido?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("request_order_refund", { p_order_id: orderId, p_reason: reason });
    setBusy(false);
    onDone(error ? `Não foi possível solicitar o reembolso: ${error.message}` : "Solicitação registrada. A organização fará a análise e, quando aprovada, o Mercado Pago processará a devolução.");
  }
  return <button className="buyer-refund-action" onClick={() => void requestRefund()} disabled={disabled || busy}><BadgeDollarSign size={17}/>{busy ? "Solicitando..." : "Solicitar reembolso"}</button>;
}

export function AcceptTransfersPanel({ onDone }: { onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function acceptPending() {
    setBusy(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email ?? "";
    const { data, error } = await supabase.from("ticket_transfers").select("id,to_name,status,expires_at").eq("to_email", email.toLowerCase()).eq("status", "requested").order("requested_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !data) {
      setBusy(false);
      onDone(error ? error.message : "Nenhuma transferência pendente encontrada para este e-mail.");
      return;
    }
    if (!window.confirm(`Aceitar o ingresso transferido para ${data.to_name}? O QR Code anterior será invalidado.`)) {
      setBusy(false);
      return;
    }
    const { error: acceptError } = await supabase.rpc("accept_ticket_transfer", { p_transfer_id: data.id });
    setBusy(false);
    onDone(acceptError ? `Não foi possível aceitar: ${acceptError.message}` : "Transferência aceita. Um novo QR Code foi emitido para você.");
  }
  return <button className="buyer-accept-transfer" onClick={() => void acceptPending()} disabled={busy}><ArrowRightLeft size={17}/>{busy ? "Consultando..." : "Aceitar transferência"}</button>;
}