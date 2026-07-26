import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  LogOut,
  Mail,
  Menu,
  Pencil,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  getHomePageContent,
  getMyProfile,
  HOME_PAGE_CONTENT_DEFAULTS,
  type HomePageContent,
} from "../lib/services";
import { getTicketQrDataUrl } from "../lib/ticket-experience";
import {
  AcceptTransfersPanel,
  OrderRefundAction,
  RetryPaymentAction,
  TicketTransferAction,
} from "./BuyerCommerceActions";
import "./BuyerOrdersPage.css";

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

type PreferenceRow = {
  order_id: string;
  status: string;
};

type HeaderContent = HomePageContent & {
  header_logo_alt?: string | null;
  header_fallback_badge_main?: string | null;
  header_fallback_badge_year?: string | null;
  nav_home_label?: string | null;
  nav_event_label?: string | null;
  nav_ex_alumni_label?: string | null;
  nav_photos_label?: string | null;
  nav_polls_label?: string | null;
  nav_archive_label?: string | null;
};

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const MEANINGFUL_WITHOUT_PREFERENCE = new Set([
  "approved",
  "in_process",
  "rejected",
  "refunded",
  "charged_back",
]);
const ACTIVE_ORDER_STATUSES = new Set(["approved", "pending", "in_process"]);
const RETRYABLE_ORDER_STATUSES = new Set(["pending", "rejected", "expired"]);

const money = (cents: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format((cents || 0) / 100);

const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "—";

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

function statusClass(status: string) {
  if (["approved", "active", "used"].includes(status)) return "is-success";
  if (["pending", "in_process"].includes(status)) return "is-pending";
  return "is-danger";
}

function ticketPayload(ticket: TicketData) {
  return ticket.qr_token || ticket.qr_code;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "HC";
}

function shortAccountName(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).join(" ") || "Minha conta";
}

function isMeaningfulOrder(order: BuyerOrder, preferenceOrderIds: Set<string>) {
  if (order.has_payment_attempt === true) return true;
  if (preferenceOrderIds.has(order.id)) return true;
  if (MEANINGFUL_WITHOUT_PREFERENCE.has(order.payment_status)) return true;
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

function BuyerSiteHeader({
  content,
  accountName,
  accountAvatar,
}: {
  content: HeaderContent;
  accountName: string;
  accountAvatar: string | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const shortName = shortAccountName(accountName);

  const navItems = [
    [content.nav_home_label || "Home", "/"],
    [content.nav_event_label || "Evento", "/evento"],
    [content.nav_ex_alumni_label || "Ex-alunos", "/ex-alunos"],
    [content.nav_photos_label || "Nossa história", "/nossa-historia"],
    [content.nav_polls_label || "Curiosidades", "/curiosidades"],
    [content.nav_archive_label || "Pós-festa", "/pos-festa"],
  ] as const;

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (profileRef.current && event.target instanceof Node && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <>
      <header data-public-header className="buyer-site-header">
        <div className="buyer-site-header-inner">
          <a className="buyer-brand" href="/" aria-label={`Início — ${content.header_logo_alt || "HC 20 Anos"}`}>
            {content.header_logo_url ? (
              <img src={content.header_logo_url} alt={content.header_logo_alt || "HC 20 Anos"} />
            ) : (
              <span className="buyer-brand-fallback">
                <small>{content.header_fallback_badge_year || "20"}</small>
                <strong>{content.header_fallback_badge_main || "HC"}</strong>
              </span>
            )}
          </a>

          <nav className="buyer-primary-nav" aria-label="Navegação principal">
            {navItems.map(([label, href]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>

          <div className="buyer-header-actions">
            <div className="buyer-profile-menu" ref={profileRef}>
              <button
                type="button"
                className="buyer-account"
                aria-expanded={profileOpen}
                aria-label="Abrir menu da conta"
                onClick={() => setProfileOpen(open => !open)}
              >
                {accountAvatar ? (
                  <img src={accountAvatar} alt={shortName} />
                ) : (
                  <span className="buyer-account-initials">{initials(shortName)}</span>
                )}
                <strong>{shortName}</strong>
                <ChevronDown size={15} aria-hidden="true" />
              </button>

              {profileOpen && (
                <div className="buyer-profile-dropdown">
                  <div className="buyer-profile-summary">
                    {accountAvatar ? (
                      <img src={accountAvatar} alt="" />
                    ) : (
                      <span className="buyer-account-initials">{initials(shortName)}</span>
                    )}
                    <strong>{shortName}</strong>
                  </div>
                  <a href="/minha-area"><Users size={15} />Minha área</a>
                  <a href="/editar-perfil"><Pencil size={15} />Editar perfil</a>
                  <button type="button" onClick={() => void logout()}><LogOut size={15} />Sair</button>
                </div>
              )}
            </div>

            <button
              className="buyer-mobile-menu-button"
              type="button"
              onClick={() => setMobileOpen(open => !open)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="buyer-mobile-menu">
          <nav aria-label="Navegação móvel">
            {navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <a href="/minha-area">Minha área</a>
          <button type="button" onClick={() => void logout()}>Sair da conta</button>
        </div>
      )}
    </>
  );
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
          <span>{order.ticket_type.product_code === "external_guest" ? "Ingresso" : "Pedido"}</span>
          <h2>{order.ticket_type.name}</h2>
          <small>#{order.id.slice(0, 8).toUpperCase()} · {dateTime(order.created_at)}</small>
        </div>
        <OrderStatus status={order.payment_status} />
      </div>

      <div className="buyer-order-meta">
        <div><span>Lote</span><strong>{order.lot?.name ?? "Lote vigente"}</strong></div>
        <div><span>Total</span><strong>{money(order.total_amount_cents, order.currency_id)}</strong></div>
        <div><span>Pagamento</span><strong>{paymentMethodLabel(order.payment_method)}</strong></div>
      </div>

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
          <Clock3 size={21} />
          <div>
            <strong>{paymentLabels[order.payment_status] ?? order.payment_status}</strong>
            <p>
              {isProcessing
                ? "O pagamento foi enviado e está sendo analisado. A página será atualizada após a confirmação."
                : "A compra foi iniciada no Mercado Pago, mas o pagamento ainda não foi concluído."}
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
        <>
          <div className="buyer-participants-title">
            <Ticket size={18} />
            <h3>Ingressos deste pedido</h3>
          </div>
          <div className="buyer-participants">
            {order.participants.map(participant => (
              <div className="buyer-participant" key={participant.id}>
                <div className="buyer-participant-info">
                  <strong>{participant.full_name}</strong>
                  <span>{participantLabels[participant.participant_type] ?? participant.participant_type.replaceAll("_", " ")}</span>
                </div>

                {!participant.ticket ? (
                  <div className="buyer-ticket-waiting">O ingresso está sendo emitido.</div>
                ) : (
                  <div className={`buyer-ticket-card ${statusClass(participant.ticket.status)}`}>
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
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

export function BuyerOrdersPage() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("Minha área");
  const [accountAvatar, setAccountAvatar] = useState<string | null>(null);
  const [headerContent, setHeaderContent] = useState<HeaderContent>(HOME_PAGE_CONTENT_DEFAULTS as HeaderContent);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      window.location.assign(`/entrar?next=${encodeURIComponent("/meus-pedidos")}`);
      return;
    }

    const [ordersResult, profile, content] = await Promise.all([
      supabase.rpc("get_my_commerce_orders"),
      getMyProfile(session.user.id).catch(() => null),
      getHomePageContent(DEFAULT_EVENT_ID).catch(() => HOME_PAGE_CONTENT_DEFAULTS),
    ]);

    if (ordersResult.error) {
      setError(ordersResult.error.message);
      setOrders([]);
    } else {
      const rawOrders = Array.isArray(ordersResult.data) ? ordersResult.data as BuyerOrder[] : [];
      let preferenceOrderIds = new Set<string>();

      if (rawOrders.length > 0) {
        const { data: preferences } = await supabase
          .from("payment_preferences")
          .select("order_id,status")
          .in("order_id", rawOrders.map(order => order.id));
        preferenceOrderIds = new Set(((preferences ?? []) as PreferenceRow[]).map(preference => preference.order_id));
      }

      setOrders(rawOrders.filter(order => isMeaningfulOrder(order, preferenceOrderIds)));
    }

    const fallbackName = String(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Minha área");
    setAccountName(profile?.display_name || profile?.people?.display_name || profile?.people?.full_name || fallbackName);
    setAccountAvatar(profile?.current_photo_url || profile?.people?.avatar_url || null);
    setHeaderContent(content as HeaderContent);
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
        : "Reenvio solicitado. O ingresso será enviado por e-mail e, quando configurado, por WhatsApp.",
    );
  }

  const actionDone = (message: string) => {
    setNotice(message);
    void load();
  };

  return (
    <div className="buyer-orders-shell">
      <BuyerSiteHeader content={headerContent} accountName={accountName} accountAvatar={accountAvatar} />

      <main className="buyer-orders-page">
        <div className="buyer-orders-container">
          <a href="/minha-area" className="buyer-back"><ArrowLeft size={17} />Minha área</a>

          <header className="buyer-orders-header">
            <div>
              <p className="buyer-eyebrow">Área do ex-aluno</p>
              <h1>Meus pedidos e ingressos</h1>
              <p>Consulte somente compras iniciadas no Mercado Pago e acesse os QR Codes já emitidos.</p>
            </div>
            <button type="button" onClick={() => void load()} className="buyer-refresh" disabled={loading}>
              <RefreshCw size={17} />Atualizar
            </button>
          </header>

          <section className="buyer-orders-overview" aria-label="Resumo dos ingressos">
            <div>
              <Ticket size={22} />
              <div>
                <strong>{ticketsCount === 0 ? "Nenhum ingresso emitido" : `${ticketsCount} ${ticketsCount === 1 ? "ingresso emitido" : "ingressos emitidos"}`}</strong>
                <span>Pedidos apenas são exibidos depois que o pagamento é realmente iniciado.</span>
              </div>
            </div>
            <a href="/ingressos"><ShoppingBag size={17} />{ticketsCount > 0 ? "Comprar outro ingresso" : "Comprar ingresso"}</a>
          </section>

          <AcceptTransfersPanel onDone={actionDone} />

          {notice && <div className="buyer-notice" role="status">{notice}</div>}
          {loading && <div className="buyer-empty"><RefreshCw className="spin" />Carregando pedidos...</div>}
          {error && <div className="buyer-error"><XCircle />{error}</div>}

          {!loading && !error && orders.length === 0 && (
            <div className="buyer-empty buyer-empty-orders">
              <Ticket size={36} />
              <h2>Nenhuma compra iniciada</h2>
              <p>Reservas criadas antes da abertura do Mercado Pago não são consideradas transações e não aparecem nesta página.</p>
              <a href="/ingressos">Comprar ingresso</a>
            </div>
          )}

          {!loading && !error && activeOrders.length > 0 && (
            <section className="buyer-order-section">
              <div className="buyer-section-heading">
                <p>Compras e ingressos</p>
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
              <summary>Histórico de pagamentos não concluídos ({historyOrders.length})</summary>
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
      </main>
    </div>
  );
}
