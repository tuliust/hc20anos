import { useEffect, useState } from "react";
import { ArrowRightLeft, BadgeDollarSign, Check, Clock3, ExternalLink, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type TransferRow = {
  id: string;
  perspective: "sent" | "received";
  attendee_name: string;
  to_name: string;
  to_email: string;
  status: string;
  requested_at: string;
  expires_at: string | null;
};

const transferLabels: Record<string,string> = {
  requested:"Aguardando aceite", accepted:"Aceita", completed:"Concluída",
  cancelled:"Cancelada", expired:"Expirada", rejected:"Rejeitada"
};

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
    onDone(error ? `Não foi possível solicitar a transferência: ${error.message}` : "Transferência solicitada. O destinatário poderá aceitar na Área do Comprador.");
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
    onDone(error ? `Não foi possível solicitar o reembolso: ${error.message}` : "Solicitação registrada para análise.");
  }
  return <button className="buyer-refund-action" onClick={() => void requestRefund()} disabled={disabled || busy}><BadgeDollarSign size={17}/>{busy ? "Solicitando..." : "Solicitar reembolso"}</button>;
}

export function RetryPaymentAction({ orderId, onDone }: { orderId:string; onDone:(message:string)=>void }) {
  const [busy,setBusy]=useState(false);
  async function retry(){
    setBusy(true);
    const {data,error}=await supabase.rpc("retry_order_payment",{p_order_id:orderId});
    setBusy(false);
    if(error) return onDone(`Não foi possível retomar o pagamento: ${error.message}`);
    window.location.assign(String(data));
  }
  return <button onClick={()=>void retry()} disabled={busy}><ExternalLink size={17}/>{busy?"Abrindo...":"Retomar pagamento"}</button>;
}

export function AcceptTransfersPanel({ onDone }: { onDone: (message: string) => void }) {
  const [items,setItems]=useState<TransferRow[]>([]);
  const [busy,setBusy]=useState<string|null>(null);
  async function load(){
    const {data,error}=await supabase.rpc("get_my_ticket_transfers");
    if(error) return onDone(`Não foi possível carregar transferências: ${error.message}`);
    setItems((data??[]) as TransferRow[]);
  }
  useEffect(()=>{void load()},[]);
  async function act(id:string, action:"accept"|"reject"|"cancel"){
    setBusy(id);
    const rpc=action==="accept"?"accept_ticket_transfer":action==="reject"?"reject_ticket_transfer":"cancel_ticket_transfer";
    const {error}=await supabase.rpc(rpc,{p_transfer_id:id});
    setBusy(null);
    onDone(error?`Não foi possível atualizar: ${error.message}`:action==="accept"?"Transferência aceita. Um novo QR Code foi emitido.":action==="reject"?"Transferência rejeitada.":"Transferência cancelada.");
    if(!error) await load();
  }
  if(items.length===0) return null;
  return <section className="buyer-transfer-panel"><h2><ArrowRightLeft size={20}/> Transferências</h2>{items.map(item=><article key={item.id}><div><strong>{item.perspective==="received"?`Ingresso de ${item.attendee_name}`:`Para ${item.to_name}`}</strong><span>{item.to_email}</span><small><Clock3 size={14}/> {transferLabels[item.status]??item.status}{item.expires_at?` · até ${new Date(item.expires_at).toLocaleString("pt-BR")}`:""}</small></div>{item.status==="requested"&&<div className="buyer-ticket-actions">{item.perspective==="received"?<><button onClick={()=>void act(item.id,"accept")} disabled={busy===item.id}><Check size={16}/> Aceitar</button><button onClick={()=>void act(item.id,"reject")} disabled={busy===item.id}><X size={16}/> Rejeitar</button></>:<button onClick={()=>void act(item.id,"cancel")} disabled={busy===item.id}><X size={16}/> Cancelar</button>}</div>}</article>)}</section>;
}