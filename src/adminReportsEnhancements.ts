const GUEST_LINK_ID = "hc-guest-approval-link";

const REPORT_LABELS: Record<string, string> = {
  "mercado pago orders total": "Total de pedidos no Mercado Pago",
  "mercado pago orders approved": "Pedidos aprovados no Mercado Pago",
  "mercado pago revenue cents": "Receita aprovada no Mercado Pago",
  "mercado pago tickets sold": "Ingressos emitidos pelo Mercado Pago",
  "mercado pago participants": "Participantes do fluxo Mercado Pago",
  "pix orders": "Pedidos via Pix",
  "card orders": "Pedidos via cartão",
  "preferences active": "Preferências de pagamento ativas",
  "preferences expired": "Preferências de pagamento expiradas",
  "payment events total": "Eventos de pagamento",
  "payment events failed": "Falhas em eventos de pagamento",
  "notification jobs pending": "Notificações pendentes",
  "notification jobs failed": "Falhas no envio de notificações",
  "legacy orders total": "Total de pedidos legados",
  "legacy orders approved": "Pedidos legados aprovados",
  "legacy revenue cents": "Receita histórica aprovada",
  "legacy tickets sold": "Ingressos históricos emitidos",
  "legacy active reservations": "Reservas legadas ativas",
  "orders total": "Total de pedidos",
  "orders pending": "Pedidos pendentes",
  "orders approved": "Pedidos aprovados",
  "orders rejected": "Pedidos rejeitados",
  "orders cancelled": "Pedidos cancelados",
  "orders expired": "Pedidos expirados",
  "orders refunded": "Pedidos reembolsados",
  "orders charged back": "Pedidos contestados (chargeback)",
  "reservations active": "Reservas ativas",
  "reservations converted": "Reservas convertidas",
  "reservations expired": "Reservas expiradas",
  "revenue cents": "Receita total",
  "subtotal cents": "Subtotal",
  "extras revenue cents": "Receita com extras",
  "average order cents": "Ticket médio",
  "drinks packages": "Pacotes de bebidas",
  "barbecue packages": "Pacotes de churrasco",
  "vouchers delivered": "Vouchers enviados",
  "refund requests open": "Solicitações de reembolso abertas",
  "refund amount cents": "Valor reembolsado",
  "transfers open": "Transferências em aberto",
  "tickets sold": "Ingressos vendidos",
  "participants approved": "Participantes aprovados",
  "checkins done": "Check-ins realizados",
  "checkins pending": "Check-ins pendentes",
  "people confirmed": "Pessoas confirmadas",
  "people claimed": "Perfis reivindicados",
  "people unclaimed": "Perfis não reivindicados",
  "photos total": "Total de fotos",
  "photos approved": "Fotos aprovadas",
  "photos pending": "Fotos pendentes",
  "photos rejected": "Fotos rejeitadas",
  "claims pending": "Reivindicações pendentes",
  "disputes pending": "Contestações pendentes",
  "removals pending": "Remoções pendentes",
  "commerce data quality alerts": "Alertas de qualidade dos dados",
};

let scheduled = false;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function isAdminRoute() {
  return window.location.pathname.startsWith("/admin");
}

function isReportsRoute() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return path === "/admin/reports" || (path === "/admin" && tab === "reports");
}

function parseCurrency(value: string) {
  const cleaned = value.replace(/[^0-9,.-]/g, "");
  if (!cleaned) return 0;
  if (cleaned.includes(",")) return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(cleaned) || 0;
}

function formatCurrencyValue(label: HTMLParagraphElement, rawLabel: string) {
  if (!rawLabel.includes("cents")) return;
  const value = label.previousElementSibling;
  if (!(value instanceof HTMLElement)) return;
  value.textContent = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(parseCurrency(value.textContent ?? "0"));
}

function enhanceReports() {
  if (!isAdminRoute()) return;

  document.getElementById(GUEST_LINK_ID)?.remove();
  if (!isReportsRoute()) return;

  document.querySelectorAll<HTMLParagraphElement>("main p").forEach(label => {
    const rawLabel = normalizeText(label.textContent);
    const translated = REPORT_LABELS[rawLabel];
    if (!translated) return;
    formatCurrencyValue(label, rawLabel);
    if (label.textContent !== translated) label.textContent = translated;
  });
}

function scheduleEnhancements() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    enhanceReports();
  });
}

export function installAdminReportsEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleEnhancements);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", scheduleEnhancements, true);
    window.addEventListener("popstate", scheduleEnhancements);
    window.addEventListener("pushstate", scheduleEnhancements);
    scheduleEnhancements();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
