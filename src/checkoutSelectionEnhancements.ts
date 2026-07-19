const CHECKOUT_PATH = "/checkout";
const TICKETS_PATH = "/ingressos";
const SELECTION_KEY = "hc-checkout-ticket-selected";
const LOCK_ATTRIBUTE = "data-checkout-category-locked";
const SELECTION_MAX_AGE_MS = 10 * 60 * 1000;

type ProductCode = "simple" | "family_full" | "family_single_parent" | "external_guest";
type StoredSelection = {
  selectedAt: number;
  productCode?: ProductCode | null;
  ticketTypeId?: string | null;
};

const PRODUCT_LABELS: Record<ProductCode, string> = {
  simple: "ingresso ex-aluno",
  family_full: "familia completa",
  family_single_parent: "familia sem conjuge",
  external_guest: "ingresso convidado",
};

let scheduled = false;
let redirectingToTickets = false;
let lastAppliedProductCode: ProductCode | null = null;

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

function isCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("checkout");
  const publicToken = params.get("token") ?? params.get("order");
  return Boolean(status && publicToken);
}

function isProductCode(value: unknown): value is ProductCode {
  return ["simple", "family_full", "family_single_parent", "external_guest"].includes(String(value));
}

function saveTicketSelection(productCode?: ProductCode | null, ticketTypeId?: string | null) {
  const selection: StoredSelection = {
    selectedAt: Date.now(),
    productCode: productCode ?? null,
    ticketTypeId: ticketTypeId ?? null,
  };
  window.sessionStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
}

function clearTicketSelection() {
  window.sessionStorage.removeItem(SELECTION_KEY);
  lastAppliedProductCode = null;
}

function readTicketSelection(): StoredSelection | null {
  const raw = window.sessionStorage.getItem(SELECTION_KEY);
  if (!raw) return null;

  let selection: StoredSelection | null = null;
  const legacyTimestamp = Number(raw);

  if (Number.isFinite(legacyTimestamp) && legacyTimestamp > 0) {
    selection = { selectedAt: legacyTimestamp };
  } else {
    try {
      const parsed = JSON.parse(raw) as Partial<StoredSelection>;
      const selectedAt = Number(parsed.selectedAt);
      if (Number.isFinite(selectedAt) && selectedAt > 0) {
        selection = {
          selectedAt,
          productCode: isProductCode(parsed.productCode) ? parsed.productCode : null,
          ticketTypeId: typeof parsed.ticketTypeId === "string" ? parsed.ticketTypeId : null,
        };
      }
    } catch {
      selection = null;
    }
  }

  if (!selection || Date.now() - selection.selectedAt > SELECTION_MAX_AGE_MS) {
    clearTicketSelection();
    return null;
  }

  return selection;
}

function isPurchaseButton(button: HTMLButtonElement) {
  const label = normalize(button.textContent);
  return label === "comprar agora" || label === "comprar ingresso" || label === "garantir minha vaga";
}

function inferProductCode(button: HTMLButtonElement): ProductCode | null {
  const attributedCard = button.closest<HTMLElement>("[data-ticket-product-code]");
  const attributedCode = attributedCard?.getAttribute("data-ticket-product-code");
  if (isProductCode(attributedCode)) return attributedCode;

  let card: HTMLElement | null = button.parentElement;
  while (card && card.tagName !== "MAIN") {
    const text = normalize(card.textContent);
    if (text.includes("ingresso convidado")) return "external_guest";
    if (text.includes("ingresso familia") || text.includes("ingresso família")) return "family_full";
    if (text.includes("ingresso ex-aluno") || text.includes("ingresso ex aluno")) return "simple";
    card = card.parentElement;
  }

  return null;
}

function handleClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest<HTMLButtonElement>("button");
  if (!button) return;

  const path = currentPath();
  if ((path === "/" || path === TICKETS_PATH) && isPurchaseButton(button)) {
    const card = button.closest<HTMLElement>("[data-ticket-type-id]");
    saveTicketSelection(inferProductCode(button), card?.getAttribute("data-ticket-type-id") ?? null);
    return;
  }

  if (path === CHECKOUT_PATH && normalize(button.textContent).includes("voltar aos ingressos")) {
    clearTicketSelection();
  }
}

function findCategorySection() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("main h2"))
    .find(element => normalize(element.textContent) === "categoria");
  return heading?.closest<HTMLElement>("section") ?? null;
}

function restoreCategorySection() {
  document.querySelectorAll<HTMLElement>(`[${LOCK_ATTRIBUTE}]`).forEach(section => {
    section.style.removeProperty("display");
    section.removeAttribute("aria-hidden");
    section.removeAttribute(LOCK_ATTRIBUTE);
  });
}

function redirectToTicketSelection() {
  if (redirectingToTickets) return;
  redirectingToTickets = true;
  window.location.replace(TICKETS_PATH);
}

function applySelectedProduct(section: HTMLElement, productCode?: ProductCode | null) {
  if (!productCode || lastAppliedProductCode === productCode) return true;

  const expectedLabel = PRODUCT_LABELS[productCode];
  const productButton = Array.from(section.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalize(button.textContent) === expectedLabel);

  if (!productButton) return false;

  lastAppliedProductCode = productCode;
  productButton.click();
  return false;
}

function applyCheckoutSelection() {
  if (currentPath() !== CHECKOUT_PATH) {
    redirectingToTickets = false;
    lastAppliedProductCode = null;
    restoreCategorySection();
    return;
  }

  if (isCheckoutReturn()) {
    restoreCategorySection();
    return;
  }

  const selection = readTicketSelection();
  if (!selection) {
    redirectToTicketSelection();
    return;
  }

  const section = findCategorySection();
  if (!section) return;

  if (!applySelectedProduct(section, selection.productCode)) {
    schedule();
    return;
  }

  section.style.setProperty("display", "none", "important");
  section.setAttribute("aria-hidden", "true");
  section.setAttribute(LOCK_ATTRIBUTE, "true");
}

function schedule() {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    applyCheckoutSelection();
  });
}

export function installCheckoutSelectionEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcCheckoutSelectionEnhancementsInstalled) return;
  (window as any).__hcCheckoutSelectionEnhancementsInstalled = true;

  const start = () => {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", schedule);
    window.addEventListener("pushstate", schedule);
    schedule();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
