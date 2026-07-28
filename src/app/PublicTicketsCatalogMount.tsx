import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Ticket } from "lucide-react";
import { supabase } from "../lib/supabase";

const HOME_PATH = "/";
const TICKETS_PATH = "/ingressos";
const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const SELECTION_KEY = "hc-checkout-ticket-selected";
const CATALOG_UPDATED_EVENT = "hc-ticket-catalog-updated";

type ProductCode = "simple" | "family_full" | "family_single_parent" | "external_guest";
type TicketGroup = "alumni" | "family" | "guest";
type PageKind = "home" | "tickets";

type CatalogRow = {
  ticket_type_id: string | null;
  product_code: ProductCode;
  product_name: string;
  description?: string | null;
  price_cents: number | null;
  lot_code?: string | null;
  lot_name?: string | null;
  ticket_status?: string | null;
  status?: string | null;
  available_quantity?: number | null;
  sold_quantity?: number | null;
};

type TicketCard = CatalogRow & {
  group: TicketGroup;
  displayName: string;
  sortOrder: number;
};

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function inferProductCode(name: string, explicitCode?: string | null): ProductCode | null {
  const code = String(explicitCode ?? "").trim();
  if (["simple", "family_full", "family_single_parent", "external_guest"].includes(code)) {
    return code as ProductCode;
  }

  const normalized = normalize(name);
  if (normalized.includes("convidado")) return "external_guest";
  if (normalized.includes("sem conjuge") || normalized.includes("monoparental")) return "family_single_parent";
  if (normalized.includes("familia") || normalized.includes("casal")) return "family_full";
  if (normalized.includes("ex-aluno") || normalized.includes("ex aluno") || normalized.includes("individual")) return "simple";
  return null;
}

function toCard(row: Record<string, unknown>): TicketCard | null {
  const productName = String(row.product_name ?? row.name ?? "");
  const productCode = inferProductCode(productName, typeof row.product_code === "string" ? row.product_code : null);
  if (!productCode) return null;

  const common = {
    ticket_type_id: typeof row.ticket_type_id === "string" ? row.ticket_type_id : typeof row.id === "string" ? row.id : null,
    product_code: productCode,
    product_name: productName,
    description: typeof row.description === "string" ? row.description : null,
    price_cents: Number.isFinite(Number(row.price_cents)) ? Number(row.price_cents) : null,
    lot_code: typeof row.lot_code === "string" ? row.lot_code : null,
    lot_name: typeof row.lot_name === "string" ? row.lot_name : null,
    ticket_status: typeof row.ticket_status === "string" ? row.ticket_status : typeof row.status === "string" ? row.status : "open",
    status: typeof row.status === "string" ? row.status : null,
    available_quantity: Number.isFinite(Number(row.available_quantity)) ? Number(row.available_quantity) : null,
    sold_quantity: Number.isFinite(Number(row.sold_quantity)) ? Number(row.sold_quantity) : null,
  } satisfies CatalogRow;

  if (productCode === "simple") {
    return { ...common, displayName: "Ingresso Ex-Aluno", group: "alumni", sortOrder: 10 };
  }

  if (productCode === "family_full" || productCode === "family_single_parent") {
    return { ...common, displayName: "Ingresso Família", group: "family", sortOrder: 20 };
  }

  return { ...common, displayName: "Ingresso Convidado", group: "guest", sortOrder: 30 };
}

export function groupPublicCatalogRows(rows: Record<string, unknown>[]): TicketCard[] {
  const grouped = new Map<TicketGroup, TicketCard>();

  rows.map(toCard).filter((card): card is TicketCard => Boolean(card)).forEach(card => {
    const current = grouped.get(card.group);
    if (!current) {
      grouped.set(card.group, card);
      return;
    }

    const currentPrice = current.price_cents ?? Number.MAX_SAFE_INTEGER;
    const nextPrice = card.price_cents ?? Number.MAX_SAFE_INTEGER;
    if (card.group === "family" && nextPrice < currentPrice) grouped.set(card.group, card);
  });

  return Array.from(grouped.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function fetchCatalogRpc(eventId: string) {
  const expanded = await supabase.rpc("get_public_ticket_catalog", {
    p_event_id: eventId,
    p_at: new Date().toISOString(),
  });

  if (!expanded.error) return Array.isArray(expanded.data) ? expanded.data : [];

  const compatibility = await supabase.rpc("get_current_ticket_catalog", {
    p_event_id: eventId,
    p_at: new Date().toISOString(),
  });
  if (compatibility.error) throw compatibility.error;
  return Array.isArray(compatibility.data) ? compatibility.data : [];
}

async function loadCatalog(): Promise<TicketCard[]> {
  let rows: Record<string, unknown>[] = [];

  try {
    rows = await fetchCatalogRpc(DEFAULT_EVENT_ID);
  } catch (error) {
    console.warn("[Ingressos] Falha no catálogo do evento padrão.", error);
  }

  if (!rows.length) {
    const { data: publishedEvent } = await (supabase as any)
      .from("events")
      .select("id")
      .eq("event_status", "published")
      .order("event_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (publishedEvent?.id && publishedEvent.id !== DEFAULT_EVENT_ID) {
      try {
        rows = await fetchCatalogRpc(publishedEvent.id);
      } catch (error) {
        console.warn("[Ingressos] Falha no catálogo do evento publicado.", error);
      }
    }
  }

  return groupPublicCatalogRows(rows);
}

function formatPrice(priceCents: number | null) {
  if (priceCents === null) return "Valor indisponível";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
}

function formatLot(card: TicketCard) {
  const lotName = String(card.lot_name ?? "").trim();
  if (lotName) return lotName.toLocaleUpperCase("pt-BR");

  const lotCode = String(card.lot_code ?? "").trim();
  if (lotCode) return lotCode.replace(/[_-]+/g, " ").toLocaleUpperCase("pt-BR");

  return "LOTE VIGENTE";
}

function isSoldOut(card: TicketCard) {
  if ((card.ticket_status ?? card.status) === "sold_out") return true;
  if (card.available_quantity === null || card.available_quantity === undefined) return false;
  return Math.max(0, card.available_quantity - Number(card.sold_quantity ?? 0)) <= 0;
}

function findTicketsPageTarget() {
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return null;

  const securityText = Array.from(main.querySelectorAll<HTMLElement>("h1, h2, h3, p, strong"))
    .find(element => normalize(element.textContent).includes("compra segura via mercado pago"));

  let securityPanel = securityText?.parentElement ?? null;
  while (securityPanel && securityPanel.parentElement !== main && !String(securityPanel.className).includes("border")) {
    securityPanel = securityPanel.parentElement;
  }

  const parent = securityPanel?.parentElement ?? main;
  return { parent, before: securityPanel };
}

function findHomeTicketsTarget() {
  const explicitSection = document.querySelector<HTMLElement>("main [data-home-section=\'tickets\']");
  const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
  const section = explicitSection ?? sections.find(candidate => {
    const headings = Array.from(candidate.querySelectorAll<HTMLElement>("h1, h2, h3, p"));
    const hasTicketHeading = headings.some(element => normalize(element.textContent).includes("ingress"));
    const hasCommercialContent = Array.from(candidate.querySelectorAll<HTMLButtonElement>("button"))
      .some(button => /comprar|esgotado|indisponivel/.test(normalize(button.textContent)))
      || /r\$\s*\d/i.test(candidate.textContent ?? "");
    return hasTicketHeading && hasCommercialContent;
  });

  if (!section) return null;
  const wrapper = Array.from(section.children).find((child): child is HTMLElement => {
    return child instanceof HTMLElement && String(child.className).includes("max-w-7xl");
  }) ?? section;

  return { section, wrapper };
}

function TicketCatalog({ cards, pageKind }: { cards: TicketCard[]; pageKind: PageKind }) {
  function buy(card: TicketCard) {
    if (!card.ticket_type_id) return;
    window.sessionStorage.setItem(SELECTION_KEY, JSON.stringify({
      selectedAt: Date.now(),
      productCode: card.product_code,
      ticketTypeId: card.ticket_type_id,
    }));
    window.location.assign("/checkout");
  }

  if (!cards.length) {
    return (
      <div data-public-ticket-catalog-empty="true" className="my-8 flex flex-col items-center justify-center border border-[#2d6a4f]/25 bg-[#141f14] p-8 text-center">
        <Ticket size={34} className="mb-4 text-[#c9a84c]" />
        <p className="font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0]">Nenhum lote vigente</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7a9a7a]">Os valores serão exibidos quando a organização abrir ou agendar um lote com produtos ativos.</p>
      </div>
    );
  }

  return (
    <section
      data-public-ticket-catalog="true"
      data-public-ticket-catalog-home={pageKind === "home" ? "true" : undefined}
      className={`${pageKind === "tickets" ? "mb-12 mt-8" : "mt-8"} grid grid-cols-1 gap-6 md:grid-cols-3`}
    >
      {cards.map(card => {
        const soldOut = isSoldOut(card);
        return (
          <article key={card.group} data-ticket-product-code={card.product_code} className={`flex min-h-[300px] flex-col border bg-[#141f14] p-8 ${soldOut ? "border-[#c0392b]/25 opacity-65" : "border-[#2d6a4f]/35"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">{formatLot(card)}</p>
                <h2 className="mt-4 font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0]">{card.displayName}</h2>
              </div>
              <span className={`border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider ${soldOut ? "border-[#c0392b]/40 bg-[#c0392b]/10 text-[#e74c3c]" : "border-[#2d6a4f]/45 bg-[#173322] text-[#74c69d]"}`}>
                {soldOut ? "Esgotado" : "Disponível"}
              </span>
            </div>

            <div className="my-7 h-px bg-[#2d6a4f]/20" />
            <p className="font-['Playfair_Display'] text-4xl font-bold text-[#f0ebe0]">{formatPrice(card.price_cents)}</p>

            <button
              type="button"
              disabled={soldOut || !card.ticket_type_id}
              onClick={() => buy(card)}
              className="mt-auto flex min-h-14 w-full items-center justify-center bg-[#2d6a4f] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#f0ebe0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {soldOut ? "Esgotado" : "Comprar agora"}
            </button>
          </article>
        );
      })}
    </section>
  );
}

export function PublicTicketsCatalogMount() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [cards, setCards] = useState<TicketCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeVersion, setRouteVersion] = useState(0);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const path = useMemo(() => currentPath(), [routeVersion]);
  const pageKind: PageKind | null = path === HOME_PATH ? "home" : path === TICKETS_PATH ? "tickets" : null;

  useEffect(() => {
    const onRouteChange = () => setRouteVersion(version => version + 1);
    const onCatalogUpdated = () => setCatalogVersion(version => version + 1);
    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("pushstate", onRouteChange);
    window.addEventListener(CATALOG_UPDATED_EVENT, onCatalogUpdated);
    return () => {
      window.removeEventListener("popstate", onRouteChange);
      window.removeEventListener("pushstate", onRouteChange);
      window.removeEventListener(CATALOG_UPDATED_EVENT, onCatalogUpdated);
    };
  }, []);

  useEffect(() => {
    if (!pageKind) {
      setMountNode(null);
      return;
    }

    let container = document.querySelector<HTMLElement>("[data-public-ticket-catalog-container]");
    let hiddenElements: Array<{ element: HTMLElement; display: string }> = [];

    const hide = (element: HTMLElement) => {
      if (hiddenElements.some(item => item.element === element)) return;
      hiddenElements.push({ element, display: element.style.display });
      element.style.setProperty("display", "none", "important");
      element.setAttribute("aria-hidden", "true");
    };

    const ensureMount = () => {
      if (container?.isConnected) return;

      if (pageKind === "home") {
        const target = findHomeTicketsTarget();
        if (!target) return;
        Array.from(target.wrapper.children).forEach((child, index) => {
          if (index > 0 && child instanceof HTMLElement) hide(child);
        });
        container = document.createElement("div");
        container.setAttribute("data-public-ticket-catalog-container", "true");
        container.setAttribute("data-public-ticket-catalog-home-container", "true");
        target.wrapper.appendChild(container);
      } else {
        const target = findTicketsPageTarget();
        if (!target) return;
        const legacyGrid = document.querySelector<HTMLElement>("[data-tickets-page-grid='true']");
        if (legacyGrid) hide(legacyGrid);
        container = document.createElement("div");
        container.setAttribute("data-public-ticket-catalog-container", "true");
        target.parent.insertBefore(container, target.before ?? null);
      }

      setMountNode(container);
    };

    ensureMount();
    const observer = new MutationObserver(ensureMount);
    observer.observe(document.body, { childList: true, subtree: true });

    setLoading(true);
    loadCatalog()
      .then(setCards)
      .catch(error => {
        console.error("[Ingressos] Não foi possível carregar o catálogo público.", error);
        setCards([]);
      })
      .finally(() => setLoading(false));

    return () => {
      observer.disconnect();
      hiddenElements.forEach(({ element, display }) => {
        element.style.display = display;
        element.removeAttribute("aria-hidden");
      });
      container?.remove();
    };
  }, [pageKind, catalogVersion]);

  if (!pageKind || !mountNode) return null;

  return createPortal(
    loading ? (
      <div className="my-8 flex items-center justify-center gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-8 font-mono text-xs uppercase tracking-wider text-[#7a9a7a]">
        <RefreshCw size={18} className="animate-spin" />Carregando ingressos...
      </div>
    ) : <TicketCatalog cards={cards} pageKind={pageKind} />,
    mountNode,
  );
}
