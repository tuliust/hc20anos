import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const PAGE_VIEW_ACTION = "site_page_view";
const CATALOG_UPDATED_EVENT = "hc-ticket-catalog-updated";

type DashboardData = {
  registrations: number;
  uniqueVisitors: number;
  mobilePercentage: number;
  approvedRevenueCents: number;
  ticketsIssued: number;
  approvedOrders: number;
  tickets: DashboardTicket[];
};

type DashboardTicket = {
  key: string;
  label: string;
  sold: number;
  total: number;
};

type CatalogRow = {
  product_code?: string | null;
  product_name?: string | null;
  name?: string | null;
  price_cents?: number | null;
  available_quantity?: number | null;
  sold_quantity?: number | null;
};

type AuditRow = {
  metadata_json?: Record<string, unknown> | null;
};

const EMPTY_DATA: DashboardData = {
  registrations: 0,
  uniqueVisitors: 0,
  mobilePercentage: 0,
  approvedRevenueCents: 0,
  ticketsIssued: 0,
  approvedOrders: 0,
  tickets: [],
};

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isDashboardRoute() {
  const path = normalizedPath();
  const tab = new URLSearchParams(window.location.search).get("tab");
  return path === "/admin/dashboard" || (path === "/admin" && (!tab || tab === "dashboard"));
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

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function inferProductCode(row: CatalogRow) {
  const explicit = String(row.product_code ?? "").trim();
  if (explicit) return explicit;
  const name = normalize(row.product_name ?? row.name);
  if (name.includes("convidado")) return "external_guest";
  if (name.includes("sem conjuge") || name.includes("monoparental")) return "family_single_parent";
  if (name.includes("familia") || name.includes("casal")) return "family_full";
  if (name.includes("ex-aluno") || name.includes("ex aluno") || name.includes("individual")) return "simple";
  return "";
}

function ticketGroup(code: string) {
  if (code === "simple") return "alumni";
  if (code === "family_full" || code === "family_single_parent") return "family";
  if (code === "external_guest") return "guest";
  return "";
}

function ticketLabel(group: string) {
  if (group === "alumni") return "Ingresso Ex-Aluno";
  if (group === "family") return "Ingresso Família";
  return "Ingresso Convidado";
}

function groupCatalogRows(rows: CatalogRow[]): DashboardTicket[] {
  const grouped = new Map<string, CatalogRow>();

  rows.forEach(row => {
    const code = inferProductCode(row);
    const group = ticketGroup(code);
    if (!group) return;
    const current = grouped.get(group);
    if (!current || (group === "family" && Number(row.price_cents ?? Infinity) < Number(current.price_cents ?? Infinity))) {
      grouped.set(group, row);
    }
  });

  return ["alumni", "family", "guest"].flatMap(group => {
    const row = grouped.get(group);
    if (!row) return [];
    return [{
      key: group,
      label: ticketLabel(group),
      sold: Math.max(0, Number(row.sold_quantity ?? 0)),
      total: Math.max(0, Number(row.available_quantity ?? 0)),
    }];
  });
}

async function fetchCatalog() {
  const expanded = await supabase.rpc("get_public_ticket_catalog", {
    p_event_id: DEFAULT_EVENT_ID,
    p_at: new Date().toISOString(),
  });
  if (!expanded.error) return Array.isArray(expanded.data) ? expanded.data as CatalogRow[] : [];

  const compatibility = await supabase.rpc("get_current_ticket_catalog", {
    p_event_id: DEFAULT_EVENT_ID,
    p_at: new Date().toISOString(),
  });
  if (compatibility.error) throw compatibility.error;
  return Array.isArray(compatibility.data) ? compatibility.data as CatalogRow[] : [];
}

function readSiteMetrics(rows: AuditRow[]) {
  const visitors = new Set<string>();
  const mobileVisitors = new Set<string>();

  rows.forEach(row => {
    const metadata = row.metadata_json ?? {};
    if (String(metadata.event_id ?? DEFAULT_EVENT_ID) !== DEFAULT_EVENT_ID) return;
    const visitorId = String(metadata.visitor_id ?? "").trim();
    if (!visitorId) return;
    visitors.add(visitorId);
    if (metadata.is_mobile === true) mobileVisitors.add(visitorId);
  });

  return {
    uniqueVisitors: visitors.size,
    mobilePercentage: visitors.size ? Math.round((mobileVisitors.size / visitors.size) * 100) : 0,
  };
}

async function loadDashboardData(): Promise<DashboardData> {
  const [reportResult, profileResult, auditResult, catalogRows] = await Promise.all([
    supabase.rpc("get_event_reports", { p_event_id: DEFAULT_EVENT_ID }),
    (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
    (supabase as any).from("audit_logs").select("metadata_json").eq("action", PAGE_VIEW_ACTION).order("created_at", { ascending: false }).limit(10000),
    fetchCatalog().catch(() => []),
  ]);

  if (reportResult.error) throw reportResult.error;
  const reports = (reportResult.data ?? {}) as Record<string, number>;
  const siteMetrics = auditResult.error ? { uniqueVisitors: 0, mobilePercentage: 0 } : readSiteMetrics((auditResult.data ?? []) as AuditRow[]);

  return {
    registrations: Number(profileResult.count ?? 0),
    uniqueVisitors: siteMetrics.uniqueVisitors,
    mobilePercentage: siteMetrics.mobilePercentage,
    approvedRevenueCents: Number(reports.mercado_pago_revenue_cents ?? reports.revenue_cents ?? 0),
    ticketsIssued: Number(reports.mercado_pago_tickets_sold ?? reports.tickets_sold ?? 0),
    approvedOrders: Number(reports.mercado_pago_orders_approved ?? reports.orders_approved ?? 0),
    tickets: groupCatalogRows(catalogRows),
  };
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function AdminOverviewDashboard() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await loadDashboardData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os indicadores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener(CATALOG_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, refresh);
  }, []);

  if (loading) {
    return <div className="flex min-h-56 items-center justify-center gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-8 font-mono text-xs uppercase tracking-wider text-[#7a9a7a]"><RefreshCw size={18} className="animate-spin" />Carregando visão geral...</div>;
  }

  if (error) {
    return <div role="alert" className="flex items-start gap-3 border border-[#c0392b]/45 bg-[#c0392b]/10 p-5 text-sm text-[#f0ebe0]"><AlertCircle size={18} className="mt-0.5 shrink-0 text-[#e74c3c]" /><div><p>{error}</p><button type="button" onClick={() => void load()} className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">Tentar novamente</button></div></div>;
  }

  const cards = [
    [String(data.registrations), "Cadastros no site", "Perfis concluídos"],
    [String(data.uniqueVisitors), "Acessos na página (únicos)", "Visitantes identificados"],
    [formatCurrency(data.approvedRevenueCents), "Receita aprovada", "Mercado Pago"],
    [`${data.mobilePercentage}%`, "Acessos pelo mobile", "Percentual de visitantes únicos"],
    [String(data.ticketsIssued), "Ingressos emitidos", "Pagamentos aprovados"],
    [String(data.approvedOrders), "Pedidos aprovados", "Fluxo transacional"],
  ] as const;

  return (
    <section data-admin-overview-dashboard="true" className="flex flex-col gap-6">
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-[#7a9a7a]">Visão geral</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {cards.map(([value, label, hint]) => (
            <article key={label} className="border border-[#2d6a4f]/25 bg-[#141f14] p-6">
              <p className="font-['Playfair_Display'] text-3xl font-black text-[#f0ebe0]">{value}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">{label}</p>
              <p className="mt-2 text-xs text-[#c9a84c]">{hint}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6">
        <p className="mb-4 font-mono text-xs uppercase tracking-wider text-[#7a9a7a]">Ingressos por tipo</p>
        {!data.tickets.length ? (
          <p className="border border-dashed border-[#2d6a4f]/25 p-6 text-sm text-[#7a9a7a]">Nenhum tipo de ingresso publicado no lote vigente.</p>
        ) : data.tickets.map((ticket, index) => {
          const percentage = ticket.total > 0 ? Math.min((ticket.sold / ticket.total) * 100, 100) : 0;
          return (
            <div key={ticket.key} className="mb-4 flex items-center gap-4 last:mb-0">
              <span className="w-36 truncate font-mono text-xs text-[#7a9a7a]">{ticket.label}</span>
              <div className="h-2 flex-1 bg-[#1a2e1a]"><div className="h-full" style={{ width: `${percentage}%`, background: ["#2d6a4f", "#40916c", "#c9a84c"][index % 3] }} /></div>
              <span className="font-mono text-xs text-[#f0ebe0]">{ticket.sold}/{ticket.total}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AdminOverviewDashboardMount() {
  const [routeVersion, setRouteVersion] = useState(0);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const active = useMemo(() => isDashboardRoute(), [routeVersion]);

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

    let container = document.querySelector<HTMLElement>("[data-admin-overview-dashboard-container]");
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
        container.setAttribute("data-admin-overview-dashboard-container", "true");
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
  return createPortal(<AdminOverviewDashboard />, mountNode);
}
