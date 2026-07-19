import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

const TICKETS_PATH = "/ingressos";
const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const SELECTION_KEY = "hc-checkout-ticket-selected";

type ProductCode = "simple" | "family_full" | "family_single_parent" | "external_guest";
type TicketGroup = "alumni" | "family" | "guest";

type CatalogRow = {
  ticket_type_id: string | null;
  product_code: ProductCode;
  product_name: string;
  description?: string | null;
  price_cents: number | null;
  lot_code?: string | null;
  lot_name?: string | null;
  status?: string | null;
};

type TicketCard = CatalogRow & {
  group: TicketGroup;
  displayName: string;
  sortOrder: number;
};

const STATIC_FALLBACK: TicketCard[] = [
  {
    ticket_type_id: null,
    product_code: "simple",
    product_name: "Ingresso Ex-Aluno",
    displayName: "Ingresso Ex-Aluno",
    group: "alumni",
    sortOrder: 10,
    price_cents: null,
    status: "open",
  },
  {
    ticket_type_id: null,
    product_code: "family_full",
    product_name: "Ingresso Família",
    displayName: "Ingresso Família",
    group: "family",
    sortOrder: 20,
    price_cents: null,
    status: "open",
  },
  {
    ticket_type_id: null,
    product_code: "external_guest",
    product_name: "Ingresso Convidado",
    displayName: "Ingresso Convidado",
    group: "guest",
    sortOrder: 30,
    price_cents: null,
    status: "open",
  },
];

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

function toCard(row: any): TicketCard | null {
  const productCode = inferProductCode(row.product_name ?? row.name ?? "", row.product_code);
  if (!productCode) return null;

  if (productCode === "simple") {
    return {
      ticket_type_id: row.ticket_type_id ?? row.id ?? null,
      product_code: productCode,
      product_name: row.product_name ?? row.name ?? "Ingresso Ex-Aluno",
      displayName: "Ingresso Ex-Aluno",
      group: "alumni",
      sortOrder: 10,
      description: row.description ?? null,
      price_cents: Number.isFinite(Number(row.price_cents)) ? Number(row.price_cents) : null,
      lot_code: row.lot_code ?? null,
      lot_name: row.lot_name ?? null,
      status: row.status ?? "open",
    };
  }

  if (productCode === "family_full" || productCode === "family_single_parent") {
    return {
      ticket_type_id: row.ticket_type_id ?? row.id ?? null,
      product_code: productCode,
      product_name: row.product_name ?? row.name ?? "Ingresso Família",
      displayName: "Ingresso Família",
      group: "family",
      sortOrder: 20,
      description: row.description ?? null,
      price_cents: Number.isFinite(Number(row.price_cents)) ? Number(row.price_cents) : null,
      lot_code: row.lot_code ?? null,
      lot_name: row.lot_name ?? null,
      status: row.status ?? "open",
    };
  }

  return {
    ticket_type_id: row.ticket_type_id ?? row.id ?? null,
    product_code: productCode,
    product_name: row.product_name ?? row.name ?? "Ingresso Convidado",
    displayName: "Ingresso Convidado",
    group: "guest",
    sortOrder: 30,
    description: row.description ?? null,
    price_cents: Number.isFinite(Number(row.price_cents)) ? Number(row.price_cents) : null,
    lot_code: row.lot_code ?? null,
    lot_name: row.lot_name ?? null,
    status: row.status ?? "open",
  };
}

function groupCards(rows: any[]): TicketCard[] {
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

async function fetchCatalogForEvent(eventId: string) {
  const { data, error } = await (supabase as any).rpc("get_current_ticket_catalog", {
    p_event_id: eventId,
    p_at: new Date().toISOString(),
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function loadCatalog(): Promise<TicketCard[]> {
  let rows: any[] = [];

  try {
    rows = await fetchCatalogForEvent(DEFAULT_EVENT_ID);
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
        rows = await fetchCatalogForEvent(publishedEvent.id);
      } catch (error) {
        console.warn("[Ingressos] Falha no catálogo do evento publicado.", error);
      }
    }
  }

  if (!rows.length) {
    const { data } = await (supabase as any)
      .from("ticket_types")
      .select("*")
      .in("status", ["open", "sold_out"])
      .order("price_cents", { ascending: true });
    rows = Array.isArray(data) ? data : [];
  }

  const cards = groupCards(rows);
  const byGroup = new Map(cards.map(card => [card.group, card]));

  return STATIC_FALLBACK.map(fallback => byGroup.get(fallback.group) ?? fallback);
}

function formatPrice(priceCents: number | null) {
  if (priceCents === null) return "Valor no checkout";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
}

function formatLot(card: TicketCard) {
  const source = `${card.lot_code ?? ""} ${card.lot_name ?? ""}`;
  const number = source.match(/(\d+)/)?.[1];
  return number ? `LOTE ${number}` : "LOTE ATUAL";
}

function findMountTarget() {
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

function TicketCatalog({ cards }: { cards: TicketCard[] }) {
  function buy(card: TicketCard) {
    window.sessionStorage.setItem(SELECTION_KEY, JSON.stringify({
      selectedAt: Date.now(),
      productCode: card.product_code,
      ticketTypeId: card.ticket_type_id,
    }));
    window.location.assign("/checkout");
  }

  return (
    <section data-public-ticket-catalog="true" className="mb-12 mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {cards.map(card => {
        const soldOut = card.status === "sold_out";
        return (
          <article key={card.group} data-ticket-product-code={card.product_code} className="flex min-h-[330px] flex-col border border-[#2d6a4f]/35 bg-[#141f14] p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">{formatLot(card)}</p>
                <h2 className="mt-4 font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0]">{card.displayName}</h2>
              </div>
              <span className="border border-[#2d6a4f]/45 bg-[#173322] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#74c69d]">
                {soldOut ? "Esgotado" : "Disponível"}
              </span>
            </div>

            <div className="my-8 h-px bg-[#2d6a4f]/20" />
            <p className="font-['Playfair_Display'] text-4xl font-bold text-[#f0ebe0]">{formatPrice(card.price_cents)}</p>

            <button
              type="button"
              disabled={soldOut}
              onClick={() => buy(card)}
              className="mt-auto flex min-h-14 w-full items-center justify-center bg-[#2d6a4f] px-6 py-4 text-base font-medium uppercase tracking-[0.16em] text-[#f0ebe0] disabled:cursor-not-allowed disabled:opacity-50"
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
  const [cards, setCards] = useState<TicketCard[]>(STATIC_FALLBACK);
  const [loading, setLoading] = useState(false);
  const [routeVersion, setRouteVersion] = useState(0);
  const isTicketsPage = useMemo(() => currentPath() === TICKETS_PATH, [routeVersion]);

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
    if (!isTicketsPage) {
      setMountNode(null);
      return;
    }

    let container = document.querySelector<HTMLElement>("[data-public-ticket-catalog-container]");

    const ensureMount = () => {
      if (container?.isConnected) return;
      const target = findMountTarget();
      if (!target) return;

      container = document.createElement("div");
      container.setAttribute("data-public-ticket-catalog-container", "true");
      target.parent.insertBefore(container, target.before ?? null);
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
        setCards(STATIC_FALLBACK);
      })
      .finally(() => setLoading(false));

    return () => {
      observer.disconnect();
      container?.remove();
    };
  }, [isTicketsPage]);

  if (!isTicketsPage || !mountNode) return null;

  return createPortal(
    loading ? (
      <div className="my-12 flex items-center justify-center gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-8 font-mono text-xs uppercase tracking-wider text-[#7a9a7a]">
        <RefreshCw size={18} className="animate-spin" /> Carregando ingressos...
      </div>
    ) : <TicketCatalog cards={cards} />,
    mountNode,
  );
}
