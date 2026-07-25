import { supabase } from "./lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const CATALOG_UPDATED_EVENT = "hc-ticket-catalog-updated";
const SUBTITLE_ATTRIBUTE = "data-ticket-card-subtitle";

type CatalogRow = {
  product_code?: string | null;
  product_name?: string | null;
  name?: string | null;
  description?: string | null;
  price_cents?: number | null;
};

const FALLBACKS: Record<string, string> = {
  alumni: "Ingresso individual para ex-aluno da Turma 2006.",
  family: "Ingresso para o ex-aluno e seus familiares.",
  guest: "Ingresso para convidado externo aprovado por um ex-aluno.",
};

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
  const expanded = await (supabase as any).rpc("get_public_ticket_catalog", {
    p_event_id: DEFAULT_EVENT_ID,
    p_at: new Date().toISOString(),
  });
  if (!expanded.error) return Array.isArray(expanded.data) ? expanded.data as CatalogRow[] : [];

  const compatibility = await (supabase as any).rpc("get_current_ticket_catalog", {
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

  const catalog = document.querySelector<HTMLElement>("[data-public-ticket-catalog='true']");
  if (!catalog) return;

  moveSecurityPanelAboveCatalog(catalog);
  const descriptions = await loadDescriptions();

  catalog.querySelectorAll<HTMLElement>("article[data-ticket-product-code]").forEach(card => {
    const group = productGroupFromCard(card);
    if (!group) return;
    const heading = card.querySelector<HTMLElement>("h2");
    if (!heading) return;

    let subtitle = card.querySelector<HTMLParagraphElement>(`p[${SUBTITLE_ATTRIBUTE}]`);
    if (!subtitle) {
      subtitle = document.createElement("p");
      subtitle.setAttribute(SUBTITLE_ATTRIBUTE, "true");
      subtitle.className = "mt-2 text-sm leading-relaxed text-[#7a9a7a]";
      heading.insertAdjacentElement("afterend", subtitle);
    }
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
