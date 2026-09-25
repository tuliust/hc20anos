import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Ticket,
  UserCheck,
  Users,
  Webhook,
} from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "../lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

type Participant = {
  id: string;
  person_id?: string | null;
  user_id?: string | null;
  participant_type?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  relationship_to_alumni?: string | null;
  unit_price_cents?: number | null;
  status?: string | null;
};

type CommerceTicket = {
  id: string;
  order_participant_id?: string | null;
  person_id?: string | null;
  attendee_name?: string | null;
  attendee_email?: string | null;
  attendee_phone?: string | null;
  guest_name?: string | null;
  qr_code: string;
  status?: string | null;
  checked_in?: boolean | null;
  checked_in_at?: string | null;
  created_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
};

type PaymentEvent = {
  id: string;
  event_type?: string | null;
  payment_id?: string | null;
  signature_valid?: boolean | null;
  processing_status?: string | null;
  processing_error?: string | null;
  attempt_count?: number | null;
  received_at?: string | null;
  processed_at?: string | null;
};

type NotificationJob = {
  id: string;
  event_type?: string | null;
  ticket_id?: string | null;
  channel?: string | null;
  recipient_email?: string | null;
  status?: string | null;
  attempts?: number | null;
  processed_at?: string | null;
  provider_message_id?: string | null;
  last_error?: string | null;
  created_at?: string | null;
};

type CommerceOrder = {
  id: string;
  event_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  buyer_name?: string | null;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  buyer_user_id?: string | null;
  person_id?: string | null;
  ticket_type_id?: string | null;
  ticket_type_name?: string | null;
  product_code?: string | null;
  lot_id?: string | null;
  lot_name?: string | null;
  quantity?: number | null;
  subtotal_amount_cents?: number | null;
  extras_amount_cents?: number | null;
  total_amount_cents?: number | null;
  currency_id?: string | null;
  payment_provider?: string | null;
  payment_provider_order_id?: string | null;
  payment_provider_merchant_order_id?: string | null;
  payment_provider_preference_id?: string | null;
  payment_status?: string | null;
  payment_status_detail?: string | null;
  payment_method?: string | null;
  payment_type?: string | null;
  installments?: number | null;
  payment_environment?: string | null;
  paid_at?: string | null;
  expires_at?: string | null;
  reservation_status?: string | null;
  reservation_released_at?: string | null;
  refunded_at?: string | null;
  cancelled_at?: string | null;
  participants: Participant[];
  tickets: CommerceTicket[];
  payment_events: PaymentEvent[];
  notifications: NotificationJob[];
};

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isOrdersRoute() {
  const path = normalizedPath();
  const tab = new URLSearchParams(window.location.search).get("tab");
  return (path === "/admin/tickets" || path === "/admin") && (tab === "orders" || (path === "/admin/tickets" && tab === null));
}

function findAdminContentHost() {
  const adminRoot = document.querySelector<HTMLElement>("main > div.min-h-screen");
  if (!adminRoot) return null;

  return Array.from(adminRoot.children).find((child): child is HTMLElement => {
    if (!(child instanceof HTMLElement)) return false;
    const classes = String(child.className);
    return classes.includes("max-w-7xl") && classes.includes("mx-auto") && classes.includes("p-4");
  }) ?? null;
}

function formatCurrency(cents?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(cents ?? 0) / 100);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalize(value?: string | null) {
  return String(value ?? "").trim().toLocaleLowerCase("pt-BR");
}

function paymentLabel(status?: string | null) {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    in_process: "Em processamento",
    authorized: "Autorizado",
    rejected: "Rejeitado",
    cancelled: "Cancelado",
    expired: "Expirado",
    refunded: "Reembolsado",
    charged_back: "Contestado",
  };
  return labels[normalize(status)] ?? status ?? "Não informado";
}

function statusClasses(status?: string | null) {
  const value = normalize(status);
  if (["approved", "active", "sent", "processed", "valid"].includes(value)) {
    return "border-[#2d6a4f]/55 bg-[#2d6a4f]/20 text-[#74c69d]";
  }
  if (["rejected", "cancelled", "failed", "error", "charged_back"].includes(value)) {
    return "border-[#c0392b]/45 bg-[#c0392b]/15 text-[#ff9b8f]";
  }
  if (["pending", "in_process", "authorized", "processing"].includes(value)) {
    return "border-[#c9a84c]/45 bg-[#c9a84c]/12 text-[#e4cb84]";
  }
  return "border-[#2d6a4f]/30 bg-[#1a2e1a] text-[#9bb09f]";
}

function StatusPill({ value, label }: { value?: string | null; label?: string }) {
  return (
    <span className={`inline-flex border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${statusClasses(value)}`}>
      {label ?? paymentLabel(value)}
    </span>
  );
}

function Detail({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  const text = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="min-w-0 border border-[#2d6a4f]/20 bg-[#0d1a0f] p-3">
      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#7a9a7a]">{label}</p>
      <p className={`break-words text-sm text-[#f0ebe0] ${mono ? "font-mono text-xs" : ""}`}>{text}</p>
    </div>
  );
}

function TicketQr({ value }: { value: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    setSrc("");
    QRCode.toDataURL(value, { width: 196, margin: 1, errorCorrectionLevel: "M" })
      .then(url => { if (active) setSrc(url); })
      .catch(() => { if (active) setSrc(""); });
    return () => { active = false; };
  }, [value]);

  if (!src) {
    return <div className="flex aspect-square w-36 items-center justify-center border border-[#2d6a4f]/25 bg-white text-[#0d1a0f]"><QrCode size={32} /></div>;
  }

  return <img src={src} alt="QR Code do ingresso" className="aspect-square w-36 bg-white p-2" />;
}

function AdminCommerceOrdersPanel() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const [refundNotice, setRefundNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("admin_get_commerce_orders", {
        p_event_id: DEFAULT_EVENT_ID,
        p_status: status === "all" ? null : status,
      });
      if (rpcError) throw rpcError;
      setOrders(Array.isArray(data) ? data as CommerceOrder[] : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    const term = normalize(search);
    if (!term) return orders;
    return orders.filter(order => {
      const haystack = [
        order.id,
        order.buyer_name,
        order.buyer_email,
        order.buyer_phone,
        order.payment_provider_order_id,
        order.payment_provider_preference_id,
        order.ticket_type_name,
        order.lot_name,
        ...order.participants.flatMap(person => [person.full_name, person.email, person.phone]),
        ...order.tickets.flatMap(ticket => [ticket.attendee_name, ticket.attendee_email, ticket.qr_code]),
      ].map(value => normalize(value)).join(" ");
      return haystack.includes(term);
    });
  }, [orders, search]);

  const approvedOrders = orders.filter(order => normalize(order.payment_status) === "approved");
  const issuedTickets = approvedOrders.flatMap(order => order.tickets);
  const checkedIn = issuedTickets.filter(ticket => ticket.checked_in).length;
  const approvedRevenue = approvedOrders.reduce((sum, order) => sum + Number(order.total_amount_cents ?? 0), 0);

  function toggle(orderId: string) {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  async function refundCancelledEventOrder(order: CommerceOrder) {
    if (normalize(order.payment_status) !== "approved") return;
    const amount = formatCurrency(order.total_amount_cents);
    const buyer = order.buyer_name || order.buyer_email || "este comprador";
    const confirmed = window.confirm(
      `Confirmar reembolso integral de ${amount} para ${buyer}?\n\nA operação será enviada ao Mercado Pago e não deve ser repetida manualmente.`
    );
    if (!confirmed) return;

    setRefundingOrderId(order.id);
    setRefundNotice("");
    setError("");

    try {
      const { data: requestId, error: prepareError } = await supabase.rpc(
        "admin_prepare_event_cancellation_refund",
        { p_order_id: order.id },
      );
      if (prepareError) throw prepareError;
      if (!requestId) throw new Error("Não foi possível criar a solicitação de reembolso.");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão administrativa expirada. Entre novamente.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refund-processor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ request_id: requestId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail?.message || payload?.detail?.error || payload?.error;
        throw new Error(detail || "O Mercado Pago não confirmou o reembolso.");
      }

      setRefundNotice(`Reembolso de ${amount} processado para ${buyer}.`);
      await load();
    } catch (refundError) {
      setError(refundError instanceof Error ? refundError.message : "Não foi possível processar o reembolso.");
    } finally {
      setRefundingOrderId(null);
    }
  }

  return (
    <section data-admin-commerce-orders="true" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[#c9a84c]">Financeiro e ingressos</p>
          <h2 className="font-['Playfair_Display'] text-3xl font-black text-[#f0ebe0] md:text-4xl">Pedidos, participantes e QR Codes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7a9a7a]">Visão administrativa consolidada do comprador, pagamento Mercado Pago, participantes vinculados, ingressos emitidos, check-in, webhooks e envio de notificações.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 border border-[#2d6a4f]/40 px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#f0ebe0] hover:border-[#c9a84c] disabled:opacity-50">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [String(approvedOrders.length), "Pedidos aprovados", CreditCard],
          [String(issuedTickets.length), "Ingressos emitidos", Ticket],
          [String(checkedIn), "Check-ins realizados", UserCheck],
          [formatCurrency(approvedRevenue), "Receita aprovada", CheckCircle2],
        ].map(([value, label, Icon]) => {
          const IconComponent = Icon as typeof CreditCard;
          return (
            <article key={String(label)} className="border border-[#2d6a4f]/25 bg-[#141f14] p-4 md:p-5">
              <IconComponent size={18} className="mb-4 text-[#c9a84c]" />
              <p className="font-['Playfair_Display'] text-2xl font-black text-[#f0ebe0] md:text-3xl">{value as string}</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#7a9a7a]">{label as string}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar comprador, participante, Payment ID, pedido ou QR..." className="w-full border border-[#2d6a4f]/30 bg-[#0d1a0f] py-3 pl-11 pr-4 text-sm text-[#f0ebe0] outline-none placeholder:text-[#536158] focus:border-[#c9a84c]" />
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Todos"],
            ["approved", "Aprovados"],
            ["pending", "Pendentes"],
            ["rejected", "Rejeitados"],
            ["refunded", "Reembolsados"],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setStatus(value)} className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-wider ${status === value ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#c9a84c]/60"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 border border-[#c0392b]/45 bg-[#c0392b]/10 p-5 text-sm text-[#f0ebe0]">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#e74c3c]" />
          <div><p>{error}</p><button type="button" onClick={() => void load()} className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">Tentar novamente</button></div>
        </div>
      )}

      {refundNotice && (
        <div role="status" className="flex items-start gap-3 border border-[#2d6a4f]/55 bg-[#2d6a4f]/10 p-5 text-sm text-[#f0ebe0]">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#8ab89a]" />
          <p>{refundNotice}</p>
        </div>
      )}

      {!error && !loading && filteredOrders.length === 0 && (
        <div className="border border-dashed border-[#2d6a4f]/30 p-10 text-center text-sm text-[#7a9a7a]">Nenhum pedido encontrado com os filtros atuais.</div>
      )}

      <div className="flex flex-col gap-4">
        {filteredOrders.map(order => {
          const isOpen = expanded.has(order.id);
          const orderTickets = order.tickets ?? [];
          const orderParticipants = order.participants ?? [];
          return (
            <article key={order.id} className="overflow-hidden border border-[#2d6a4f]/25 bg-[#141f14]">
              <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusPill value={order.payment_status} />
                    <StatusPill value={order.reservation_status} label={order.reservation_status ? `Reserva: ${order.reservation_status}` : "Sem reserva"} />
                    {orderTickets.some(ticket => ticket.checked_in) && <StatusPill value="approved" label="Check-in iniciado" />}
                  </div>
                  <h3 className="truncate text-lg font-bold text-[#f0ebe0]">{order.buyer_name || "Comprador não informado"}</h3>
                  <p className="mt-1 break-all font-mono text-[10px] text-[#7a9a7a]">{order.id}</p>
                  <p className="mt-2 text-xs text-[#9bb09f]">{order.buyer_email || "Sem e-mail"}{order.buyer_phone ? ` · ${order.buyer_phone}` : ""}</p>
                </div>
                <div>
                  <p className="font-['Playfair_Display'] text-2xl font-black text-[#f0ebe0]">{formatCurrency(order.total_amount_cents)}</p>
                  <p className="mt-1 text-xs text-[#7a9a7a]">{order.ticket_type_name || "Ingresso"}{order.lot_name ? ` · ${order.lot_name}` : ""}</p>
                  <p className="mt-2 font-mono text-[10px] text-[#c9a84c]">Payment ID: {order.payment_provider_order_id || "—"}</p>
                </div>
<div className="flex flex-col gap-2">
                {normalize(order.payment_status) === "approved" && (
                  <button
                    type="button"
                    onClick={() => void refundCancelledEventOrder(order)}
                    disabled={refundingOrderId === order.id}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#c9a84c]/55 bg-[#c9a84c]/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f0ebe0] hover:bg-[#c9a84c]/15 disabled:cursor-wait disabled:opacity-55"
                  >
                    <RotateCcw size={15} className={refundingOrderId === order.id ? "animate-spin" : ""} />
                    {refundingOrderId === order.id ? "Reembolsando..." : "Reembolsar integral"}
                  </button>
                )}
                <button type="button" onClick={() => toggle(order.id)} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#2d6a4f]/35 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f0ebe0] hover:border-[#c9a84c]">
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}{isOpen ? "Ocultar detalhes" : "Ver tudo"}
                </button>
              </div>
              </div>

              {isOpen && (
                <div className="border-t border-[#2d6a4f]/20 bg-[#0a120a] p-5">
                  <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Detail label="Comprador" value={order.buyer_name} />
                    <Detail label="E-mail" value={order.buyer_email} />
                    <Detail label="Telefone" value={order.buyer_phone} />
                    <Detail label="Criado em" value={formatDateTime(order.created_at)} />
                    <Detail label="Pagamento" value={paymentLabel(order.payment_status)} />
                    <Detail label="Detalhe do pagamento" value={order.payment_status_detail} />
                    <Detail label="Pago em" value={formatDateTime(order.paid_at)} />
                    <Detail label="Forma" value={[order.payment_type, order.payment_method, order.installments ? `${order.installments}x` : ""].filter(Boolean).join(" · ")} />
                    <Detail label="Payment ID" value={order.payment_provider_order_id} mono />
                    <Detail label="Merchant Order" value={order.payment_provider_merchant_order_id} mono />
                    <Detail label="Preference ID" value={order.payment_provider_preference_id} mono />
                    <Detail label="Ambiente" value={order.payment_environment} />
                  </div>

                  <section className="mb-7">
                    <div className="mb-3 flex items-center gap-2"><Users size={16} className="text-[#c9a84c]" /><h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f0ebe0]">Participantes ({orderParticipants.length})</h4></div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {orderParticipants.length === 0 ? <p className="text-sm text-[#7a9a7a]">Nenhum participante vinculado ao pedido.</p> : orderParticipants.map(person => (
                        <div key={person.id} className="border border-[#2d6a4f]/20 bg-[#141f14] p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-[#f0ebe0]">{person.full_name || "Participante"}</p>
                            <StatusPill value={person.status} label={person.status || "Sem status"} />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Detail label="Tipo" value={person.participant_type} />
                            <Detail label="Valor" value={formatCurrency(person.unit_price_cents)} />
                            <Detail label="E-mail" value={person.email} />
                            <Detail label="Telefone" value={person.phone} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="mb-7">
                    <div className="mb-3 flex items-center gap-2"><QrCode size={16} className="text-[#c9a84c]" /><h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f0ebe0]">Ingressos e QR Codes ({orderTickets.length})</h4></div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {orderTickets.length === 0 ? <p className="text-sm text-[#7a9a7a]">Nenhum ingresso emitido para este pedido.</p> : orderTickets.map(ticket => (
                        <div key={ticket.id} className="grid gap-4 border border-[#2d6a4f]/20 bg-[#141f14] p-4 sm:grid-cols-[auto_1fr]">
                          <TicketQr value={ticket.qr_code} />
                          <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap gap-2">
                              <StatusPill value={ticket.status} label={ticket.status || "Ingresso"} />
                              <StatusPill value={ticket.checked_in ? "approved" : "pending"} label={ticket.checked_in ? "Check-in realizado" : "Check-in pendente"} />
                            </div>
                            <p className="font-semibold text-[#f0ebe0]">{ticket.attendee_name || ticket.guest_name || "Participante"}</p>
                            <p className="mt-1 text-xs text-[#7a9a7a]">{ticket.attendee_email || "Sem e-mail"}{ticket.attendee_phone ? ` · ${ticket.attendee_phone}` : ""}</p>
                            <p className="mt-3 break-all border border-[#2d6a4f]/20 bg-[#0d1a0f] p-2 font-mono text-[10px] text-[#c9a84c]">{ticket.qr_code}</p>
                            <p className="mt-3 text-xs text-[#7a9a7a]">{ticket.checked_in ? `Entrada registrada em ${formatDateTime(ticket.checked_in_at)}` : "Ainda não utilizado no check-in."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <section>
                      <div className="mb-3 flex items-center gap-2"><Webhook size={16} className="text-[#c9a84c]" /><h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f0ebe0]">Webhooks ({order.payment_events.length})</h4></div>
                      <div className="flex flex-col gap-2">
                        {order.payment_events.length === 0 ? <p className="text-sm text-[#7a9a7a]">Nenhum evento de pagamento registrado.</p> : order.payment_events.map(event => (
                          <div key={event.id} className="border border-[#2d6a4f]/20 bg-[#141f14] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-mono text-xs text-[#f0ebe0]">{event.event_type || "payment"}</p>
                              <StatusPill value={event.processing_status} label={event.processing_status || "Sem status"} />
                            </div>
                            <p className="mt-2 font-mono text-[10px] text-[#7a9a7a]">Payment ID {event.payment_id || "—"} · assinatura {event.signature_valid === true ? "válida" : event.signature_valid === false ? "inválida" : "não informada"}</p>
                            <p className="mt-1 text-[10px] text-[#536158]">{formatDateTime(event.processed_at || event.received_at)}</p>
                            {event.processing_error && <p className="mt-2 text-xs text-[#ff9b8f]">{event.processing_error}</p>}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="mb-3 flex items-center gap-2"><Mail size={16} className="text-[#c9a84c]" /><h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f0ebe0]">Notificações ({order.notifications.length})</h4></div>
                      <div className="flex flex-col gap-2">
                        {order.notifications.length === 0 ? <p className="text-sm text-[#7a9a7a]">Nenhuma notificação registrada.</p> : order.notifications.map(job => (
                          <div key={job.id} className="border border-[#2d6a4f]/20 bg-[#141f14] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-mono text-xs text-[#f0ebe0]">{job.event_type || "notificação"} · {job.channel || "canal não informado"}</p>
                              <StatusPill value={job.status} label={job.status || "Sem status"} />
                            </div>
                            <p className="mt-2 break-all text-xs text-[#7a9a7a]">{job.recipient_email || "Destinatário não informado"}</p>
                            <p className="mt-1 text-[10px] text-[#536158]">{job.processed_at ? `Processada em ${formatDateTime(job.processed_at)}` : `Criada em ${formatDateTime(job.created_at)}`}</p>
                            {job.last_error && <p className="mt-2 text-xs text-[#ff9b8f]">{job.last_error}</p>}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function AdminCommerceOrdersMount() {
  const [routeVersion, setRouteVersion] = useState(0);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const active = useMemo(() => isOrdersRoute(), [routeVersion]);

  useEffect(() => {
    const onRouteChange = () => setRouteVersion(version => version + 1);
    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("pushstate", onRouteChange);
    return () => {
      window.removeEventListener("popstate", onRouteChange);
      window.removeEventListener("pushstate", onRouteChange);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setMountNode(null);
      return;
    }

    let container = document.querySelector<HTMLElement>("[data-admin-commerce-orders-container]");
    const hidden = new Map<HTMLElement, string>();

    const hideOriginalChildren = (host: HTMLElement) => {
      Array.from(host.children).forEach(child => {
        if (!(child instanceof HTMLElement) || child === container) return;
        if (!hidden.has(child)) hidden.set(child, child.style.display);
        child.style.setProperty("display", "none", "important");
      });
    };

    const ensureMount = () => {
      const host = findAdminContentHost();
      if (!host) return;
      if (!container?.isConnected) {
        container = document.createElement("div");
        container.setAttribute("data-admin-commerce-orders-container", "true");
        host.appendChild(container);
        setMountNode(container);
      }
      hideOriginalChildren(host);
    };

    ensureMount();
    const observer = new MutationObserver(ensureMount);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      hidden.forEach((display, element) => { element.style.display = display; });
      container?.remove();
    };
  }, [active]);

  if (!active || !mountNode) return null;
  return createPortal(<AdminCommerceOrdersPanel />, mountNode);
}
