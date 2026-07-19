import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, Search, TicketCheck, Utensils, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./OperationsPage.css";

type CheckinRow = {
  ticket_id: string;
  attendee_name: string;
  attendee_email: string;
  qr_code: string;
  ticket_status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  order_id: string;
  extras: Array<{ id: string; type: string; quantity: number; units: number; delivered_at: string | null }>;
};

type RefundRow = {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  gross_amount_cents: number;
  non_recoverable_fee_cents: number;
  refund_amount_cents: number;
  requested_at: string;
};

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value || 0) / 100);

export function OperationsPage() {
  const [tab, setTab] = useState<"checkin" | "refunds">("checkin");
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<CheckinRow[]>([]);
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_checkin_dashboard", { p_search: search || null });
    setLoading(false);
    if (error) return setNotice(error.message);
    setTickets((data ?? []) as CheckinRow[]);
  }, [search]);

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_admin_refund_requests");
    setLoading(false);
    if (error) return setNotice(error.message);
    setRefunds((data ?? []) as RefundRow[]);
  }, []);

  useEffect(() => {
    void (tab === "checkin" ? loadTickets() : loadRefunds());
  }, [tab, loadTickets, loadRefunds]);

  async function checkin(ticketId: string, undo = false) {
    setNotice(null);
    const { error } = await supabase.rpc("perform_ticket_checkin", { p_ticket_id: ticketId, p_undo: undo, p_notes: null });
    if (error) setNotice(error.message);
    else {
      setNotice(undo ? "Check-in desfeito." : "Check-in registrado.");
      await loadTickets();
    }
  }

  async function vouchers(ticketId: string, delivered: boolean) {
    const { error } = await supabase.rpc("set_participant_vouchers_delivered", { p_ticket_id: ticketId, p_delivered: delivered, p_notes: null });
    if (error) setNotice(error.message);
    else {
      setNotice(delivered ? "Fichas registradas como entregues." : "Entrega de fichas desfeita.");
      await loadTickets();
    }
  }

  async function reviewRefund(requestId: string, approve: boolean) {
    const notes = window.prompt(approve ? "Observação da aprovação (opcional)" : "Motivo da rejeição") ?? "";
    const { error } = await supabase.rpc("review_refund_request", { p_request_id: requestId, p_approve: approve, p_notes: notes || null });
    if (error) return setNotice(error.message);
    if (approve) {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refund-processor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ request_id: requestId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setNotice(body.error ?? "Falha ao processar reembolso.");
      else setNotice("Reembolso processado no Mercado Pago.");
    } else setNotice("Solicitação rejeitada.");
    await loadRefunds();
  }

  const checkedInCount = useMemo(() => tickets.filter(ticket => ticket.checked_in).length, [tickets]);

  return <main className="operations-page">
    <header className="operations-header">
      <button onClick={() => window.location.assign("/admin")}><ArrowLeft size={18}/> Painel</button>
      <div><p>Operação do evento</p><h1>Check-in e reembolsos</h1></div>
    </header>

    <nav className="operations-tabs">
      <button className={tab === "checkin" ? "active" : ""} onClick={() => setTab("checkin")}>Check-in</button>
      <button className={tab === "refunds" ? "active" : ""} onClick={() => setTab("refunds")}>Reembolsos</button>
    </nav>

    {notice && <div className="operations-notice">{notice}</div>}

    {tab === "checkin" ? <>
      <section className="operations-summary"><strong>{checkedInCount}</strong><span>check-ins de {tickets.length} resultados</span></section>
      <form className="operations-search" onSubmit={event => { event.preventDefault(); void loadTickets(); }}>
        <Search size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, e-mail ou código"/><button>Buscar</button>
      </form>
      <section className="operations-list">
        {tickets.map(ticket => {
          const hasExtras = ticket.extras.length > 0;
          const allDelivered = hasExtras && ticket.extras.every(extra => Boolean(extra.delivered_at));
          return <article key={ticket.ticket_id} className="operations-card">
            <div><strong>{ticket.attendee_name}</strong><span>{ticket.attendee_email}</span><code>{ticket.qr_code}</code></div>
            <div className={`operations-status ${ticket.checked_in ? "ok" : "pending"}`}>{ticket.checked_in ? <CheckCircle2/> : <TicketCheck/>}{ticket.checked_in ? "Entrada registrada" : ticket.ticket_status}</div>
            {hasExtras && <div className="operations-extras"><Utensils size={17}/>{ticket.extras.map(extra => `${extra.quantity}× ${extra.type === "drinks" ? "bebidas" : "churrasco"}`).join(" · ")}</div>}
            <div className="operations-actions">
              <button disabled={ticket.ticket_status !== "active" || ticket.checked_in} onClick={() => void checkin(ticket.ticket_id)}>Registrar entrada</button>
              <button disabled={!ticket.checked_in} onClick={() => void checkin(ticket.ticket_id, true)}><RotateCcw size={16}/> Desfazer</button>
              {hasExtras && <button onClick={() => void vouchers(ticket.ticket_id, !allDelivered)}>{allDelivered ? "Desfazer fichas" : "Entregar fichas"}</button>}
            </div>
          </article>;
        })}
        {!loading && tickets.length === 0 && <div className="operations-empty">Nenhum ingresso encontrado.</div>}
      </section>
    </> : <section className="operations-list">
      {refunds.map(refund => <article key={refund.id} className="operations-card">
        <div><strong>Pedido #{refund.order_id.slice(0, 8).toUpperCase()}</strong><span>{refund.reason}</span><small>{new Date(refund.requested_at).toLocaleString("pt-BR")}</small></div>
        <div><span>Bruto {money(refund.gross_amount_cents)}</span><span>Taxa {money(refund.non_recoverable_fee_cents)}</span><strong>Reembolso {money(refund.refund_amount_cents)}</strong></div>
        <div className="operations-status">{refund.status}</div>
        {refund.status === "requested" && <div className="operations-actions"><button onClick={() => void reviewRefund(refund.id, true)}><CheckCircle2 size={16}/> Aprovar e processar</button><button onClick={() => void reviewRefund(refund.id, false)}><XCircle size={16}/> Rejeitar</button></div>}
      </article>)}
      {!loading && refunds.length === 0 && <div className="operations-empty">Nenhuma solicitação de reembolso.</div>}
    </section>}
  </main>;
}