import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  Mail,
  RefreshCw,
  ShoppingBag,
  Ticket,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getTicketQrDataUrl } from "../lib/ticket-experience";
import {
  AcceptTransfersPanel,
  OrderRefundAction,
  RetryPaymentAction,
  TicketTransferAction,
} from "./BuyerCommerceActions";
import "./BuyerOrdersPage.css";

type BuyerOrdersDestination = "alumni-area" | "tickets";

type TicketData = {
  id: string;
  attendee_name: string;
  attendee_email: string;
  qr_code: string;
  qr_token: string;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  transferred_from_ticket_id: string | null;
  created_at: string;
};

type Participant = {
  id: string;
  participant_type: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship_to_alumni: string | null;
  status: string;
  unit_price_cents: number;
  extras: Array<{
    id: string;
    extra_type: string;
    quantity: number;
    units_per_package: number;
    total_price_cents: number;
    physical_vouchers_delivered_at: string | null;
  }>;
  ticket: TicketData | null;
};

type BuyerOrder = {
  id: string;
  public_token: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  quantity: number;
  subtotal_amount_cents: number;
  extras_amount_cents: number;
  total_amount_cents: number;
  currency_id: string;
  payment_status: string;
  payment_status_detail: string | null;
  payment_method: string | null;
  paid_at: string | null;
  expires_at: string | null;
  reservation_status: string;
  has_payment_attempt?: boolean;
  ticket_type: {
    id: string;
    name: string;
    description: string | null;
    product_code: string | null;
    package_kind: string | null;
  };
  lot: { id: string; code: string; name: string } | null;
  participants: Participant[];
};

const MEANINGFUL_WITHOUT_PAYMENT_ATTEMPT = new Set([
  "approved",
  "in_process",
  "rejected",
  "refunded",
  "charged_back",
]);
const ACTIVE_ORDER_STATUSES = new Set(["approved", "pending", "in_process"]);
const RETRYABLE_ORDER_STATUSES = new Set(["pending", "rejected", "expired"]);

const paymentLabels: Record<string, string> = {
  pending: "Pagamento pendente",
  in_process: "Pagamento em análise",
  approved: "Pagamento aprovado",
  rejected: "Pagamento não aprovado",
  expired: "Pagamento expirado",
  cancelled: "Pedido cancelado",
  refunded: "Pagamento reembolsado",
  charged_back: "Pagamento contestado",
};

const ticketLabels: Record<string, string> = {
  active: "Válido",
  used: "Utilizado",
  transferred: "Transferido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  chargeback: "Contestado",
};

const participantLabels: Record<string, string> = {
  alumni: "Ex-aluno",
  spouse: "Cônjuge",
  child: "Filho(a)",
  external_guest: "Convidado(a)",
};

const money = (cents: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format((cents || 0) / 100);

const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "—";

function statusClass(status: string) {
  if (["approved", "active", "used"].includes(status)) return "is-success";
  if (["pending", "in_process"].includes(status)) return "is-pending";
  return "is-danger";
}

function ticketPayload(ticket: TicketData) {
  return ticket.qr_token || ticket.qr_code;
}

function isMeaningfulOrder(order: BuyerOrder) {
  if (order.has_payment_attempt === true) return true;
  if (MEANINGFUL_WITHOUT_PAYMENT_ATTEMPT.has(order.payment_status)) return true;
  return order.participants.some(participant => Boolean(participant.ticket));
}

function paymentMethodLabel(value: string | null) {
  if (!value) return "Não informado";
  const labels: Record<string, string> = {
    pix: "Pix",
    credit_card: "Cartão de crédito",
    debit_card: "Cartão de débito",
    account_money: "Saldo Mercado Pago",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function TicketQrImage({ ticket, name, size = 180 }: { ticket: TicketData; name: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    void getTicketQrDataUrl(ticketPayload(ticket), size)
      .then(value => { if (active) setSrc(value); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [ticket.qr_token, ticket.qr_code, size]);

  if (error) return <div className="buyer-ticket-waiting">Não foi possível gerar o QR Code. Use o código textual.</div>;
  if (!src) return <div className="buyer-ticket-waiting">Gerando QR Code...</div>;
  return <img src={src} alt={`QR Code de ${name}`} width={size} height={size} />;
}

async function downloadTicket(order: BuyerOrder, participant: Participant) {
  if (!participant.ticket) return;
  const ticket = participant.ticket;
  const qrDataUrl = await getTicketQrDataUrl(ticketPayload(ticket), 260);
  const safeName = participant.full_name.replace(/[<>&"']/g, "");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Ingresso ${safeName}</title><style>body{font-family:Arial,sans-serif;background:#f5f2ea;margin:0;padding:32px;color:#183c2f}.card{max-width:540px;margin:auto;background:white;border:1px solid #d8d2c3;padding:28px;text-align:center}.qr{width:260px;height:260px}.muted{color:#66746e}.status{font-weight:700;text-transform:uppercase;letter-spacing:.08em}</style></head><body><main class="card"><h1>HC 20 Anos</h1><p class="muted">24 de outubro de 2026</p><h2>${safeName}</h2><p>${order.ticket_type.name}${order.lot ? ` · ${order.lot.name}` : ""}</p><img class="qr" src="${qrDataUrl}" alt="QR Code do ingresso"><p class="status">${ticketLabels[ticket.status] ?? ticket.status}</p><p>Código: <strong>${ticket.qr_code}</strong></p><p class="muted">Pedido ${order.id.slice(0, 8).toUpperCase()}</p></main></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ingresso-${participant.full_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function OrderStatus({ status }: { status: string }) {
  return (
    <div className={`buyer-status ${statusClass(status)}`}>
      {status === "approved" ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
      {paymentLabels[status] ?? status}
    </div>
  );
}

function OrderCard({
  order,
  compact,
  resending,
  onResend,
  onDone,
}: {
  order: BuyerOrder;
  compact?: boolean;
  resending: string | null;
  onResend: (ticketId: string) => Promise<void>;
  onDone: (message: string) => void;
}) {
  const isApproved = order.payment_status === "approved";
  const isProcessing = order.payment_status === "in_process";
  const canRetry = RETRYABLE_ORDER_STATUSES.has(order.payment_status);

  return (
    <article className={`buyer-order ${compact ? "is-compact" : ""}`}>
      <div className="buyer-order-top">
        <div className="buyer-order-title">
          <p>{order.ticket_type.product_code === "external_guest" ? "Ingresso" : "Pedido"}</p>
          <h2>{order.ticket_type.name}</h2>
          <small>#{order.id.slice(0, 8).toUpperCase()} · {dateTime(order.created_at)}</small>
        </div>
        <OrderStatus status={order.payment_status} />
      </div>

      <dl className="buyer-order-meta">
        <div><dt>Lote</dt><dd>{order.lot?.name ?? "Lote vigente"}</dd></div>
        <div><dt>Total</dt><dd>{money(order.total_amount_cents, order.currency_id)}</dd></div>
        <div><dt>Pagamento</dt><dd>{paymentMethodLabel(order.payment_method)}</dd></div>
      </dl>

      {isApproved && (
        <div className="buyer-ticket-actions buyer-order-actions">
          <OrderRefundAction
            orderId={order.id}
            disabled={order.participants.some(participant => participant.ticket?.checked_in)}
            onDone={onDone}
          />
        </div>
      )}

      {!isApproved && !compact && (
        <div className="buyer-payment-state">
          <Clock3 size={22} />
          <div>
            <strong>{paymentLabels[order.payment_status] ?? order.payment_status}</strong>
            <p>
              {isProcessing
                ? "O pagamento foi enviado e está sendo analisado. Esta página será atualizada após a confirmação."
                : "A compra foi aberta no Mercado Pago, mas o pagamento ainda não foi concluído."}
            </p>
            {order.expires_at && <small>Reserva válida até {dateTime(order.expires_at)}</small>}
            {canRetry && (
              <div className="buyer-ticket-actions">
                <RetryPaymentAction orderId={order.id} onDone={onDone} />
              </div>
            )}
          </div>
        </div>
      )}

      {compact && canRetry && (
        <div className="buyer-ticket-actions buyer-compact-actions">
          <RetryPaymentAction orderId={order.id} onDone={onDone} />
        </div>
      )}

      {isApproved && !compact && (
        <section className="buyer-order-tickets">
          <div className="buyer-participants-title">
            <Ticket size={18} />
            <h3>Ingressos deste pedido</h3>
          </div>

          <div className="buyer-participants">
            {order.participants.map(participant => (
              <article className="buyer-participant" key={participant.id}>
                <div className="buyer-participant-info">
                  <strong>{participant.full_name}</strong>
                  <span>{participantLabels[participant.participant_type] ?? participant.participant_type.replaceAll("_", " ")}</span>
                </div>

                {!participant.ticket ? (
                  <div className="buyer-ticket-waiting">O ingresso está sendo emitido.</div>
                ) : (
                  <div className="buyer-ticket-card">
                    <div className="buyer-qr-wrap">
                      <TicketQrImage ticket={participant.ticket} name={participant.full_name} />
                      {participant.ticket.status !== "active" && (
                        <div className="buyer-qr-blocked">{ticketLabels[participant.ticket.status] ?? participant.ticket.status}</div>
                      )}
                    </div>
                    <div className="buyer-ticket-details">
                      <div className={`buyer-status ${statusClass(participant.ticket.status)}`}>
                        {ticketLabels[participant.ticket.status] ?? participant.ticket.status}
                      </div>
                      <p>Código <strong>{participant.ticket.qr_code}</strong></p>
                      {participant.ticket.transferred_from_ticket_id && (
                        <p className="buyer-transfer-note">Este ingresso substitui um QR Code anterior, que foi invalidado.</p>
                      )}
                      {participant.ticket.cancelled_at && <p>Cancelado em {dateTime(participant.ticket.cancelled_at)}</p>}
                      {participant.ticket.checked_in && <p>Check-in realizado em {dateTime(participant.ticket.checked_in_at)}</p>}
                      <div className="buyer-ticket-actions">
                        <button type="button" onClick={() => void downloadTicket(order, participant)}>
                          <Download size={16} />Baixar
                        </button>
                        <button
                          type="button"
                          onClick={() => void onResend(participant.ticket!.id)}
                          disabled={participant.ticket.status !== "active" || resending === participant.ticket.id}
                        >
                          <Mail size={16} />
                          {resending === participant.ticket.id ? "Solicitando..." : "Reenviar"}
                        </button>
                        <TicketTransferAction
                          ticketId={participant.ticket.id}
                          disabled={participant.ticket.status !== "active" || participant.ticket.checked_in}
                          onDone={onDone}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export function BuyerOrdersPage({ navigate }: { navigate: (page: BuyerOrdersDestination) => void }) {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.assign(`/entrar?next=${encodeURIComponent("/meus-pedidos")}`);
      return;
    }

    const { data, error: ordersError } = await supabase.rpc("get_my_commerce_orders");
    if (ordersError) {
      setError(ordersError.message);
      setOrders([]);
    } else {
      const rawOrders = Array.isArray(data) ? data as BuyerOrder[] : [];
      setOrders(rawOrders.filter(isMeaningfulOrder));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeOrders = useMemo(
    () => orders.filter(order => ACTIVE_ORDER_STATUSES.has(order.payment_status)),
    [orders],
  );
  const historyOrders = useMemo(
    () => orders.filter(order => !ACTIVE_ORDER_STATUSES.has(order.payment_status)),
    [orders],
  );
  const ticketsCount = useMemo(
    () => orders.reduce((sum, order) => sum + order.participants.filter(participant => participant.ticket).length, 0),
    [orders],
  );

  async function resend(ticketId: string) {
    setResending(ticketId);
    setNotice(null);
    const { error: resendError } = await supabase.rpc("request_ticket_resend", { p_ticket_id: ticketId });
    setResending(null);
    setNotice(
      resendError
        ? `Não foi possível reenviar: ${resendError.message}`
        : "Reenvio solicitado. O ingresso será enviado pelos canais configurados.",
    );
  }

  const actionDone = (message: string) => {
    setNotice(message);
    void load();
  };

  return (
    <div className="buyer-orders-page">
      <section className="buyer-orders-hero">
        <div className="buyer-orders-container">
          <button type="button" className="buyer-back" onClick={() => navigate("alumni-area")}>
            <ArrowLeft size={17} />Minha área
          </button>

          <div className="buyer-orders-heading-row">
            <div>
              <p className="buyer-eyebrow">Área do ex-aluno</p>
              <h1>Meus pedidos e ingressos</h1>
              <p>Consulte compras realmente iniciadas e acesse os QR Codes já emitidos.</p>
            </div>
            <button type="button" onClick={() => void load()} className="buyer-refresh" disabled={loading}>
              <RefreshCw size={17} />Atualizar
            </button>
          </div>
        </div>
      </section>

      <section className="buyer-orders-content">
        <div className="buyer-orders-container">
          <div className="buyer-orders-overview">
            <div>
              <Ticket size={24} />
              <div>
                <strong>{ticketsCount === 0 ? "Nenhum ingresso emitido" : `${ticketsCount} ${ticketsCount === 1 ? "ingresso emitido" : "ingressos emitidos"}`}</strong>
                <span>Reservas técnicas sem acesso ao Mercado Pago não aparecem nesta página.</span>
              </div>
            </div>
            <button type="button" onClick={() => navigate("tickets")}>
              <ShoppingBag size={17} />{ticketsCount > 0 ? "Comprar outro ingresso" : "Comprar ingresso"}
            </button>
          </div>

          <AcceptTransfersPanel onDone={actionDone} />

          {notice && <div className="buyer-notice" role="status">{notice}</div>}
          {loading && <div className="buyer-empty"><RefreshCw className="spin" />Carregando pedidos...</div>}
          {error && <div className="buyer-error"><XCircle />{error}</div>}

          {!loading && !error && orders.length === 0 && (
            <div className="buyer-empty buyer-empty-orders">
              <Ticket size={38} />
              <h2>Nenhuma compra iniciada</h2>
              <p>Quando o Mercado Pago for aberto para uma compra, o pedido aparecerá aqui.</p>
              <button type="button" onClick={() => navigate("tickets")}>Comprar ingresso</button>
            </div>
          )}

          {!loading && !error && activeOrders.length > 0 && (
            <section className="buyer-order-section">
              <div className="buyer-section-heading">
                <div>
                  <p>Compras e ingressos</p>
                  <h2>Pedidos em andamento</h2>
                </div>
                <span>{activeOrders.length} {activeOrders.length === 1 ? "pedido" : "pedidos"}</span>
              </div>
              <div className="buyer-order-list">
                {activeOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    resending={resending}
                    onResend={resend}
                    onDone={actionDone}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && !error && historyOrders.length > 0 && (
            <details className="buyer-history">
              <summary>Histórico de pagamentos ({historyOrders.length})</summary>
              <div className="buyer-order-list">
                {historyOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    compact
                    resending={resending}
                    onResend={resend}
                    onDone={actionDone}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      </section>
    </div>
  );
}
