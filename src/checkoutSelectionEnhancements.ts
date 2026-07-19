const CHECKOUT_PATH = "/checkout";
const TICKETS_PATH = "/ingressos";
const SELECTION_KEY = "hc-checkout-ticket-selected";
const LOCK_ATTRIBUTE = "data-checkout-category-locked";
const SELECTION_MAX_AGE_MS = 10 * 60 * 1000;

let scheduled = false;

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

function saveTicketSelection() {
  window.sessionStorage.setItem(SELECTION_KEY, String(Date.now()));
}

function clearTicketSelection() {
  window.sessionStorage.removeItem(SELECTION_KEY);
}

function hasRecentTicketSelection() {
  const storedAt = Number(window.sessionStorage.getItem(SELECTION_KEY) ?? "");
  if (!Number.isFinite(storedAt) || storedAt <= 0) return false;

  const isRecent = Date.now() - storedAt <= SELECTION_MAX_AGE_MS;
  if (!isRecent) clearTicketSelection();
  return isRecent;
}

function isPurchaseButton(button: HTMLButtonElement) {
  const label = normalize(button.textContent);
  return label === "comprar agora" || label === "comprar ingresso" || label === "garantir minha vaga";
}

function handleClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest<HTMLButtonElement>("button");
  if (!button) return;

  const path = currentPath();
  if ((path === "/" || path === TICKETS_PATH) && isPurchaseButton(button)) {
    saveTicketSelection();
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

function applyCheckoutSelection() {
  if (currentPath() !== CHECKOUT_PATH || !hasRecentTicketSelection()) {
    restoreCategorySection();
    return;
  }

  const section = findCategorySection();
  if (!section) return;

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
