import { supabase } from "./lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const CATALOG_UPDATED_EVENT = "hc-ticket-catalog-updated";
const SUBTITLE_ATTRIBUTE = "data-ticket-card-subtitle";
const AMENITIES_ATTRIBUTE = "data-home-ticket-amenities";
const STYLE_ID = "hc-ticket-catalog-layout-style";

type CatalogRow = {
  product_code?: string | null;
  product_name?: string | null;
  name?: string | null;
  description?: string | null;
  price_cents?: number | null;
};

type Amenity = {
  title: string;
  text: string;
  icon: string;
};

const FALLBACKS: Record<string, string> = {
  alumni: "Ingresso individual para ex-aluno da Turma 2006.",
  family: "Ingresso para o ex-aluno e seus familiares.",
  guest: "Ingresso para convidado externo aprovado por um ex-aluno.",
};

const HOME_AMENITIES: Amenity[] = [
  {
    title: "Bar e comidas",
    text: "Churrasco à vontade, com cerveja, vodka, gelo, água e refrigerante liberados durante toda a programação do evento.",
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2v7a3 3 0 0 0 3 3v10M6 2v7M9 2v7a3 3 0 0 1-3 3M15 2v20M15 2c3.5 1.5 5 4 5 7.5S18.5 15.5 15 17"/></svg>',
  },
  {
    title: "Banheiros",
    text: "Banheiros químicos estarão disponíveis no local, garantindo mais conforto e praticidade para todos os convidados.",
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17M3 21h18M9 7h6M12 11v6M9.5 14h5"/></svg>',
  },
  {
    title: "Segurança",
    text: "O evento contará com segurança na rua, com atenção especial à área de estacionamento, ajudando a reduzir o risco de furtos e roubos de veículos e pertences.",
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
  },
];

let scheduled = false;
let descriptionsRequest: Promise<Record<string, string>> | null = null;

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

function groupForCode(code: string) {
  if (code === "simple") return "alumni";
  if (code === "family_full" || code === "family_single_parent") return "family";
  if (code === "external_guest") return "guest";
  return "";
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

function loadDescriptions(force = false) {
  if (force) descriptionsRequest = null;
  if (!descriptionsRequest) {
    descriptionsRequest = fetchCatalogRows()
      .then(rows => {
        const grouped = new Map<string, CatalogRow>();
        rows.forEach(row => {
          const code = inferProductCode(row);
          const group = groupForCode(code);
          if (!group) return;
          const current = grouped.get(group);
          if (!current || (group === "family" && Number(row.price_cents ?? Infinity) < Number(current.price_cents ?? Infinity))) {
            grouped.set(group, row);
          }
        });

        return Object.fromEntries(["alumni", "family", "guest"].map(group => [
          group,
          grouped.get(group)?.description?.trim() || FALLBACKS[group],
        ]));
      })
      .catch(error => {
        descriptionsRequest = null;
        console.warn("[Ingressos] Não foi possível carregar os subtítulos dos cards.", error);
        return { ...FALLBACKS };
      });
  }
  return descriptionsRequest;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${AMENITIES_ATTRIBUTE}] {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0;
      margin: 2.75rem 0 3.25rem;
      color: #0d1a0f;
    }

    [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity] {
      min-width: 0;
      padding: 0 2.25rem;
    }

    [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:first-child {
      padding-left: 0;
    }

    [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:not(:first-child) {
      border-left: 1px solid rgba(13, 26, 15, 0.24);
    }

    [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:last-child {
      padding-right: 0;
    }

    [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity-icon] {
      width: 2.5rem;
      height: 2.5rem;
      margin-bottom: 1rem;
      color: #173c2a;
    }

    [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity-icon] svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    [${AMENITIES_ATTRIBUTE}] h3 {
      margin: 0;
      color: #0d1a0f;
      font-family: "Playfair Display", Georgia, serif;
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1.2;
    }

    [${AMENITIES_ATTRIBUTE}] p {
      margin: 0.75rem 0 0;
      color: #294634;
      font-size: 0.95rem;
      line-height: 1.65;
    }

    [data-public-ticket-catalog-home="true"] {
      align-items: stretch;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] {
      height: 100%;
      min-height: 22rem;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child {
      min-height: 8.75rem;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child > div:first-child {
      display: flex;
      min-width: 0;
      flex: 1 1 auto;
      flex-direction: column;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child > div:first-child > p:first-child {
      margin-bottom: 1.1rem;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] h2 {
      margin-top: 0 !important;
      line-height: 1.25;
    }

    [data-public-ticket-catalog-home="true"] [${SUBTITLE_ATTRIBUTE}] {
      min-height: 2.75rem;
      margin-top: 0.65rem !important;
      line-height: 1.45;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:nth-child(2) {
      margin-top: 1.5rem !important;
      margin-bottom: 1.5rem !important;
    }

    @media (max-width: 767px) {
      [${AMENITIES_ATTRIBUTE}] {
        grid-template-columns: minmax(0, 1fr);
        margin: 2rem 0 2.5rem;
      }

      [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity],
      [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:first-child,
      [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:last-child {
        padding: 1.5rem 0;
      }

      [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:first-child {
        padding-top: 0;
      }

      [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:not(:first-child) {
        border-top: 1px solid rgba(13, 26, 15, 0.24);
        border-left: 0;
      }

      [${AMENITIES_ATTRIBUTE}] [data-home-ticket-amenity]:last-child {
        padding-bottom: 0;
      }

      [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child {
        min-height: 0;
      }

      [data-public-ticket-catalog-home="true"] [${SUBTITLE_ATTRIBUTE}] {
        min-height: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

function createAmenitiesBlock() {
  const block = document.createElement("section");
  block.setAttribute(AMENITIES_ATTRIBUTE, "true");
  block.setAttribute("aria-label", "Estrutura incluída no evento");

  HOME_AMENITIES.forEach(amenity => {
    const item = document.createElement("article");
    item.setAttribute("data-home-ticket-amenity", "true");

    const icon = document.createElement("div");
    icon.setAttribute("data-home-ticket-amenity-icon", "true");
    icon.innerHTML = amenity.icon;

    const title = document.createElement("h3");
    title.textContent = amenity.title;

    const text = document.createElement("p");
    text.textContent = amenity.text;

    item.append(icon, title, text);
    block.appendChild(item);
  });

  return block;
}

function ensureHomeAmenities(catalog: HTMLElement) {
  const existing = document.querySelector<HTMLElement>(`[${AMENITIES_ATTRIBUTE}]`);
  if (currentPath() !== "/") {
    existing?.remove();
    return;
  }

  if (existing?.isConnected) {
    if (existing.nextElementSibling !== catalog) catalog.parentElement?.insertBefore(existing, catalog);
    return;
  }

  catalog.parentElement?.insertBefore(createAmenitiesBlock(), catalog);
}

function findSecurityPanel(catalog: HTMLElement) {
  const parent = catalog.parentElement;
  if (!parent) return null;

  const securityText = Array.from(parent.querySelectorAll<HTMLElement>("h1, h2, h3, p, strong"))
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

function productGroupFromCard(card: HTMLElement) {
  const code = card.getAttribute("data-ticket-product-code") ?? "";
  return groupForCode(code);
}

async function enhanceTicketCards() {
  scheduled = false;
  const path = currentPath();
  if (path !== "/" && path !== "/ingressos") return;

  injectStyles();

  const catalog = document.querySelector<HTMLElement>("[data-public-ticket-catalog='true']");
  if (!catalog) return;

  ensureHomeAmenities(catalog);
  moveSecurityPanelAboveCatalog(catalog);
  const descriptions = await loadDescriptions();

  catalog.querySelectorAll<HTMLElement>("article[data-ticket-product-code]").forEach(card => {
    const group = productGroupFromCard(card);
    if (!group) return;
    card.setAttribute("data-hc-ticket-card-enhanced", "true");

    const heading = card.querySelector<HTMLElement>("h2");
    if (!heading) return;

    let subtitle = card.querySelector<HTMLParagraphElement>(`p[${SUBTITLE_ATTRIBUTE}]`);
    if (!subtitle) {
      subtitle = document.createElement("p");
      subtitle.setAttribute(SUBTITLE_ATTRIBUTE, "true");
      heading.insertAdjacentElement("afterend", subtitle);
    } else if (subtitle.previousElementSibling !== heading) {
      heading.insertAdjacentElement("afterend", subtitle);
    }

    subtitle.className = "text-sm text-[#7a9a7a]";
    const nextText = descriptions[group] || FALLBACKS[group];
    if (subtitle.textContent !== nextText) subtitle.textContent = nextText;
  });
}

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => void enhanceTicketCards());
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
      void loadDescriptions(true).then(() => scheduleEnhancement());
    });
    scheduleEnhancement();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
