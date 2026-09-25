import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Ticket,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { reconcileMercadoPagoPayment } from "../lib/checkout";
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
  active: "Emitido",
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
  if (["approved", "active", "used", "refunded"].includes(status)) return "is-success";
  if (["pending", "in_process"].includes(status)) return "is-pending";
  return "is-danger";
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

function OrderStatus({ status }: { status: string }) {
  return (
    <div className={`buyer-status ${statusClass(status)}`}>
      {status === "refunded" || status === "approved" ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
      {paymentLabels[status] ?? status}
    </div>
  );
}

function refundCopy(order: BuyerOrder) {
  if (order.payment_status === "refunded") {
    return {
      title: "Reembolso concluído",
      body: "O Mercado Pago confirmou a devolução deste pagamento. O prazo para o crédito aparecer depende do meio de pagamento e da instituição financeira.",
      status: "refunded",
    };
  }
  if (order.payment_status === "approved") {
    return {
      title: "Reembolso integral em processamento",
      body: "O evento foi cancelado e a organização está processando a devolução integral deste pagamento pelo Mercado Pago. Não é necessário solicitar o reembolso.",
      status: "approved",
    };
  }
  if (order.payment_status === "in_process") {
    return {
      title: "Pagamento em análise",
      body: "Não haverá nova cobrança. Caso o Mercado Pago confirme este pagamento, a organização fará a devolução integral.",
      status: "in_process",
    };
  }
  return {
    title: "Sem cobrança adicional",
    body: "O evento foi cancelado e novas compras estão encerradas. Este registro permanece disponível apenas para consulta.",
    status: order.payment_status,
  };
}

function OrderCard({ order }: { order: BuyerOrder }) {
  const refund = refundCopy(order);

  return (
    <article className="buyer-order">
      <div className="buyer-order-top">
        <div className="buyer-order-title">
          <p>Pedido</p>
          <h2>{order.ticket_type.name}</h2>
          <small>#{order.id.slice(0, 8).toUpperCase()} · {dateTime(order.created_at)}</small>
        </div>
        <OrderStatus status={order.payment_status} />
      </div>

      <dl className="buyer-order-meta">
        <div><dt>Total pago</dt><dd>{money(order.total_amount_cents, order.currency_id)}</dd></div>
        <div><dt>Pagamento</dt><dd>{paymentMethodLabel(order.payment_method)}</dd></div>
        <div><dt>Pago em</dt><dd>{dateTime(order.paid_at)}</dd></div>
      </dl>

      <div className="buyer-payment-state">
        {refund.status === "refunded" ? <CheckCircle2 size={22} /> : <RefreshCw size={22} className={refund.status === "approved" ? "spin" : ""} />}
        <div>
          <strong>{refund.title}</strong>
          <p>{refund.body}</p>
        </div>
      </div>

      {order.participants.length > 0 && (
        <section className="buyer-order-tickets">
          <div className="buyer-participants-title">
            <Ticket size={18} />
            <h3>Ingressos vinculados ao pedido</h3>
          </div>

          <div className="buyer-participants">
            {order.participants.map(participant => (
              <article className="buyer-participant" key={participant.id}>
                <div className="buyer-participant-info">
                  <strong>{participant.full_name}</strong>
                  <span>{participantLabels[participant.participant_type] ?? participant.participant_type.replaceAll("_", " ")}</span>
                </div>

                {participant.ticket ? (
                  <div className="buyer-ticket-card">
                    <div className="buyer-ticket-details">
                      <div className={`buyer-status ${statusClass(participant.ticket.status)}`}>
                        {ticketLabels[participant.ticket.status] ?? participant.ticket.status}
                      </div>
                      <p>Código <strong>{participant.ticket.qr_code}</strong></p>
                      <p className="buyer-transfer-note">O ingresso permanece registrado como histórico da compra. Não haverá check-in porque o evento foi cancelado.</p>
                    </div>
                  </div>
                ) : (
                  <div className="buyer-ticket-waiting">Não há ingresso emitido para este participante.</div>
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
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.assign(`/login?next=${encodeURIComponent("/meus-pedidos")}`);
      return;
    }

    const returnParams = new URLSearchParams(window.location.search);
    const paymentId = returnParams.get("payment_id") ?? returnParams.get("collection_id");
    const publicToken = returnParams.get("token");
    if (paymentId && /^\d+$/.test(paymentId)) {
      try {
        await reconcileMercadoPagoPayment(paymentId, publicToken);
        setNotice("Pagamento conferido diretamente no Mercado Pago.");
        for (const key of [
          "payment_id",
          "collection_id",
          "collection_status",
          "status",
          "merchant_order_id",
          "preference_id",
          "payment_type",
          "site_id",
          "processing_mode",
          "merchant_account_id",
        ]) returnParams.delete(key);
        const nextQuery = returnParams.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
      } catch (reconcileError) {
        console.warn("[BuyerOrders] Payment reconciliation deferred", reconcileError);
        setNotice("O pagamento ainda está sendo conciliado com o Mercado Pago. Use Atualizar em instantes.");
      }
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
              <p>Consulte o pagamento original e acompanhe a devolução após o cancelamento do evento.</p>
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
              <FileText size={24} />
              <div>
                <strong>Evento cancelado · reembolso integral</strong>
                <span>Os pagamentos aprovados estão sendo devolvidos pela organização por meio do Mercado Pago.</span>
              </div>
            </div>
          </div>

          {notice && <div className="buyer-notice" role="status">{notice}</div>}
          {loading && <div className="buyer-empty"><RefreshCw className="spin" />Carregando pedidos...</div>}
          {error && <div className="buyer-error"><XCircle />{error}</div>}

          {!loading && !error && orders.length === 0 && (
            <div className="buyer-empty buyer-empty-orders">
              <Ticket size={38} />
              <h2>Nenhum pagamento encontrado</h2>
              <p>Não localizamos pedidos com tentativa de pagamento vinculados a esta conta.</p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <section className="buyer-order-section">
              <div className="buyer-section-heading">
                <div>
                  <p>Pagamentos e reembolsos</p>
                  <h2>Histórico da sua compra</h2>
                </div>
                <span>{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</span>
              </div>
              <div className="buyer-order-list">
                {orders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
