import { useEffect, useState } from "react";
import { ArrowRightLeft, BadgeDollarSign, Check, Clock3, ExternalLink, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./BuyerCommerceActions.css";

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

type RefundQuote = {
  gross_amount_cents: number;
  non_recoverable_fee_cents: number;
  refund_amount_cents: number;
  policy_label: string;
  policy_notice: string;
  refund_deadline: string;
  eligible: boolean;
  ineligibility_reason: string | null;
};

const transferLabels: Record<string,string> = {
  requested:"Aguardando aceite", accepted:"Aceita", completed:"Concluída",
  cancelled:"Cancelada", expired:"Expirada", rejected:"Rejeitada"
};

const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((cents||0)/100);

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
    setBusy(true);
    const { data, error: quoteError } = await supabase.rpc("calculate_refund_quote", { p_order_id: orderId });
    const quote = Array.isArray(data) ? data[0] as RefundQuote | undefined : undefined;
    if (quoteError || !quote) {
      setBusy(false);
      return onDone(`Não foi possível calcular o reembolso: ${quoteError?.message ?? "Cotação indisponível"}`);
    }
    if (!quote.eligible) {
      setBusy(false);
      return onDone(`Reembolso indisponível: ${quote.ineligibility_reason ?? "pedido não elegível"}`);
    }
    const summary = `${quote.policy_label}\n\nValor pago: ${money(quote.gross_amount_cents)}\nTaxa não recuperável: ${money(quote.non_recoverable_fee_cents)}\nValor estimado do reembolso: ${money(quote.refund_amount_cents)}\nPrazo para solicitar: ${new Date(quote.refund_deadline).toLocaleString("pt-BR")}\n\n${quote.policy_notice}`;
    if (!window.confirm(`${summary}\n\nContinuar com a solicitação?`)) {
      setBusy(false);
      return;
    }
    const reason = window.prompt("Informe o motivo da solicitação de reembolso");
    if (!reason) {
      setBusy(false);
      return;
    }
    const { error } = await supabase.rpc("request_order_refund", { p_order_id: orderId, p_reason: reason });
    setBusy(false);
    onDone(error ? `Não foi possível solicitar o reembolso: ${error.message}` : `Solicitação registrada. Valor estimado: ${money(quote.refund_amount_cents)}.`);
  }
  return <button className="buyer-refund-action" onClick={() => void requestRefund()} disabled={disabled || busy}><BadgeDollarSign size={17}/>{busy ? "Calculando..." : "Solicitar reembolso"}</button>;
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
