import { supabase } from "./lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const CATALOG_UPDATED_EVENT = "hc-ticket-catalog-updated";
const SUBTITLE_ATTRIBUTE = "data-ticket-card-subtitle";
const OVERVIEW_ATTRIBUTE = "data-home-ticket-amenities";
const STYLE_ID = "hc-ticket-catalog-layout-style";

type CatalogRow = {
  product_code?: string | null;
  product_name?: string | null;
  name?: string | null;
  description?: string | null;
  price_cents?: number | null;
  lot_name?: string | null;
  lot_code?: string | null;
};

type HomeSummary = {
  lotTitle: string;
  lotText: string;
  includedText: string;
  valuesText: string;
};

const FALLBACK_DESCRIPTION = "Ingresso individual para o reencontro da Turma 2006.";
let scheduled = false;
let rowsRequest: Promise<CatalogRow[]> | null = null;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function setText(element: HTMLElement | null, text: string) {
  if (element && element.textContent !== text) element.textContent = text;
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function fetchCatalogRows() {
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

function loadRows(force = false) {
  if (force) rowsRequest = null;
  if (!rowsRequest) {
    rowsRequest = fetchCatalogRows().catch(error => {
      rowsRequest = null;
      console.warn("[Ingressos] Não foi possível carregar o resumo comercial.", error);
      return [];
    });
  }
  return rowsRequest;
}

function simpleRow(rows: CatalogRow[]) {
  return rows.find(row => String(row.product_code ?? "") === "simple") ?? rows[0] ?? null;
}

function homeSummary(rows: CatalogRow[]): HomeSummary {
  const row = simpleRow(rows);
  const adultPrice = Number(row?.price_cents ?? 12_000);
  const halfPrice = Math.round(adultPrice / 2);
  const lotName = String(row?.lot_name ?? row?.lot_code ?? "Lote único").trim() || "Lote único";
  return {
    lotTitle: lotName.toLocaleLowerCase("pt-BR") === "single" ? "Lote único" : lotName,
    lotText: "Vendas abertas até o início do evento, enquanto houver disponibilidade.",
    includedText: "Churrasco à vontade incluído. Bebidas não estão incluídas: cada participante leva o que quiser beber.",
    valuesText: `Adultos e cônjuges: ${formatMoney(adultPrice)}. Crianças até 8 anos: grátis; de 9 a 12 anos: ${formatMoney(halfPrice)}; a partir de 13 anos: valor integral.`,
  };
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${OVERVIEW_ATTRIBUTE}] {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      margin: 2.5rem 0 1.5rem;
      color: #0d1a0f;
    }
    [${OVERVIEW_ATTRIBUTE}] [data-home-ticket-overview-card] {
      min-width: 0;
      border: 1px solid rgba(13,26,15,.28);
      background: rgba(240,235,224,.13);
      padding: 1.5rem;
    }
    [${OVERVIEW_ATTRIBUTE}] [data-home-ticket-overview-kicker] {
      margin: 0 0 .7rem;
      color: #173c2a;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: .67rem;
      font-weight: 800;
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    [${OVERVIEW_ATTRIBUTE}] h3 {
      margin: 0;
      color: #0d1a0f;
      font-family: "Playfair Display", Georgia, serif;
      font-size: 1.45rem;
      font-weight: 700;
      line-height: 1.2;
    }
    [${OVERVIEW_ATTRIBUTE}] p[data-home-ticket-overview-copy] {
      margin: .8rem 0 0;
      color: #294634;
      font-size: .95rem;
      line-height: 1.65;
    }
    [data-public-ticket-catalog-home="true"] {
      display: block !important;
      margin-top: 1rem !important;
    }
    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] {
      min-height: 0 !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto minmax(14rem, auto);
      align-items: center;
      gap: 1.5rem;
      padding: 1.6rem 1.75rem !important;
      border-color: rgba(13,26,15,.32) !important;
      background: #f6f5f0 !important;
      box-shadow: 0 12px 28px rgba(13,26,15,.12);
    }
    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child {
      min-height: 0 !important;
    }
    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child > div:first-child > p:first-child {
      color: #173c2a !important;
    }
    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] h2 {
      margin-top: .45rem !important;
      color: #0d1a0f !important;
      font-size: 1.65rem !important;
    }
    [data-public-ticket-catalog-home="true"] [${SUBTITLE_ATTRIBUTE}] {
      min-height: 0 !important;
      margin-top: .45rem !important;
      color: #294634 !important;
      line-height: 1.45;
    }
    [data-public-ticket-catalog-home="true"] [data-home-ticket-redundant="true"] {
      display: none !important;
    }
    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > p {
      min-width: 9rem;
      margin: 0 !important;
      color: #0d1a0f !important;
      font-size: 2rem !important;
      line-height: 1.05 !important;
      text-align: right;
      white-space: nowrap;
    }
    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > button {
      width: auto !important;
      min-width: 14rem;
      min-height: 3.75rem;
      margin-top: 0 !important;
      padding: 1rem 1.75rem !important;
      background: #2d6a4f !important;
      color: #f0ebe0 !important;
      font-weight: 900 !important;
      box-shadow: 0 8px 24px rgba(13,26,15,.18);
    }
    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > button:hover:not(:disabled) {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }
    @media (max-width: 767px) {
      [${OVERVIEW_ATTRIBUTE}] { grid-template-columns: 1fr; margin-top: 1.75rem; }
      [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > p {
        min-width: 0;
        text-align: left;
      }
      [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > button {
        width: 100% !important;
        min-width: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

function overviewCard(kicker: string, title: string, text: string) {
  const card = document.createElement("article");
  card.dataset.homeTicketOverviewCard = "true";
  const eyebrow = document.createElement("p");
  eyebrow.dataset.homeTicketOverviewKicker = "true";
  eyebrow.textContent = kicker;
  const heading = document.createElement("h3");
  heading.textContent = title;
  const copy = document.createElement("p");
  copy.dataset.homeTicketOverviewCopy = "true";
  copy.textContent = text;
  card.append(eyebrow, heading, copy);
  return card;
}

function createOverview(summary: HomeSummary) {
  const block = document.createElement("section");
  block.setAttribute(OVERVIEW_ATTRIBUTE, "true");
  block.setAttribute("aria-label", "Resumo dos ingressos");
  block.append(
    overviewCard("Disponibilidade", "Lote único", summary.lotText),
    overviewCard("Evento", "O que está incluído", summary.includedText),
    overviewCard("Por participante", "Valores", summary.valuesText),
  );
  return block;
}

function updateOverview(block: HTMLElement, summary: HomeSummary) {
  const cards = Array.from(block.querySelectorAll<HTMLElement>("[data-home-ticket-overview-card]"));
  const content = [
    ["Disponibilidade", "Lote único", summary.lotText],
    ["Evento", "O que está incluído", summary.includedText],
    ["Por participante", "Valores", summary.valuesText],
  ];
  cards.forEach((card, index) => {
    const item = content[index];
    if (!item) return;
    const [kicker, title, text] = item;
    setText(card.querySelector<HTMLElement>("[data-home-ticket-overview-kicker]"), kicker);
    setText(card.querySelector<HTMLElement>("h3"), title);
    setText(card.querySelector<HTMLElement>("[data-home-ticket-overview-copy]"), text);
  });
}

function updateHomeHeading(catalog: HTMLElement) {
  const section = catalog.closest("section") ?? catalog.parentElement?.closest("section");
  if (!section) return;
  const headings = Array.from(section.querySelectorAll<HTMLElement>("h1,h2,h3"));
  const heading = headings.find(item => {
    if (catalog.contains(item)) return false;
    const text = normalize(item.textContent);
    return text.includes("ingresso unico") && (text.includes("r$ 120") || text.includes("por pessoa"));
  });
  if (heading) setText(heading, "Garanta sua presença");
}

function ensureHomeOverview(catalog: HTMLElement, summary: HomeSummary) {
  const existing = document.querySelector<HTMLElement>(`[${OVERVIEW_ATTRIBUTE}]`);
  if (currentPath() !== "/") {
    existing?.remove();
    return;
  }
  updateHomeHeading(catalog);
  if (existing?.isConnected) {
    updateOverview(existing, summary);
    if (existing.nextElementSibling !== catalog) catalog.parentElement?.insertBefore(existing, catalog);
    return;
  }
  catalog.parentElement?.insertBefore(createOverview(summary), catalog);
}

function findSecurityPanel(catalog: HTMLElement) {
  const parent = catalog.parentElement;
  if (!parent) return null;
  const securityText = Array.from(parent.querySelectorAll<HTMLElement>("h1,h2,h3,p,strong"))
    .find(element => normalize(element.textContent).includes("compra segura via mercado pago"));
  if (!securityText) return null;
  let current: HTMLElement | null = securityText;
  while (current && current.parentElement !== parent) current = current.parentElement;
  return current;
}

function moveSecurityPanelAboveCatalog(catalog: HTMLElement) {
  if (currentPath() !== "/ingressos") return;
  const panel = findSecurityPanel(catalog);
  if (!panel || panel.nextElementSibling === catalog) return;
  catalog.parentElement?.insertBefore(panel, catalog);
}

function enhanceCard(card: HTMLElement, row: CatalogRow | null, isHome: boolean) {
  const heading = card.querySelector<HTMLElement>("h2");
  if (!heading) return;
  let subtitle = card.querySelector<HTMLParagraphElement>(`p[${SUBTITLE_ATTRIBUTE}]`);
  if (!subtitle) {
    subtitle = document.createElement("p");
    subtitle.setAttribute(SUBTITLE_ATTRIBUTE, "true");
    heading.insertAdjacentElement("afterend", subtitle);
  }
  subtitle.className = "text-sm text-[#7a9a7a]";

  if (isHome) {
    setText(heading, "Ingresso");
    const lotLabel = card.querySelector<HTMLElement>("div:first-child > div:first-child > p:first-child");
    setText(lotLabel, "LOTE ÚNICO");
    if (normalize(subtitle.textContent) !== normalize("Compra segura pelo Mercado Pago.")) subtitle.textContent = "Compra segura pelo Mercado Pago.";
    Array.from(card.children).forEach(child => {
      if (!(child instanceof HTMLElement)) return;
      if (String(child.className).includes("h-px")) child.dataset.homeTicketRedundant = "true";
      else child.removeAttribute("data-home-ticket-redundant");
    });
    const button = Array.from(card.querySelectorAll<HTMLButtonElement>("button"))
      .find(item => normalize(item.textContent).includes("comprar"));
    if (button && !button.disabled && normalize(button.textContent) !== "comprar agora") button.textContent = "Comprar agora";
  } else {
    const description = row?.description?.trim() || FALLBACK_DESCRIPTION;
    if (normalize(subtitle.textContent) !== normalize(description)) subtitle.textContent = description;
    if (String(row?.product_code ?? "") === "simple" && normalize(heading.textContent).includes("ex-aluno")) setText(heading, "Ingresso");
  }
}

async function enhanceTicketLayout() {
  scheduled = false;
  const path = currentPath();
  if (path !== "/" && path !== "/ingressos") return;
  injectStyles();
  const catalog = document.querySelector<HTMLElement>("[data-public-ticket-catalog='true']");
  if (!catalog) return;
  const rows = await loadRows();
  const simple = simpleRow(rows);
  if (path === "/") ensureHomeOverview(catalog, homeSummary(rows));
  else moveSecurityPanelAboveCatalog(catalog);
  catalog.querySelectorAll<HTMLElement>("article[data-ticket-product-code]").forEach(card => enhanceCard(card, simple, path === "/"));
}

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => void enhanceTicketLayout());
}

export function installTicketsCatalogLayoutEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  injectStyles();
  const observer = new MutationObserver(scheduleEnhancement);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleEnhancement);
    window.addEventListener("pushstate", scheduleEnhancement);
    window.addEventListener(CATALOG_UPDATED_EVENT, () => {
      void loadRows(true).then(() => scheduleEnhancement());
    });
    scheduleEnhancement();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
