const ADMIN_TICKETS_PATH = "/admin/tickets";
const ORDERS_TAB = "orders";
const LOTS_URL = "/admin/tickets?tab=lots";

let redirecting = false;
let scheduled = false;
let observer: MutationObserver | null = null;

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isRemovedOrdersRoute(): boolean {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return pathname === ADMIN_TICKETS_PATH && (tab === null || tab === ORDERS_TAB);
}

function redirectOrdersToLots(): void {
  if (!isRemovedOrdersRoute() || redirecting) return;

  redirecting = true;
  window.history.replaceState({}, "", LOTS_URL);
  window.dispatchEvent(new PopStateEvent("popstate"));
  redirecting = false;
}

function hideOrdersNavigation(): void {
  document.querySelectorAll<HTMLButtonElement>("button").forEach(button => {
    if (normalize(button.textContent) !== "pedidos") return;

    const navigation = button.closest("nav, [data-admin-secondary-nav-compact]")
      ?? button.parentElement;

    if (!navigation) return;
    button.style.setProperty("display", "none", "important");
    button.setAttribute("aria-hidden", "true");
    button.tabIndex = -1;
  });
}

function runRemoval(): void {
  redirectOrdersToLots();
  hideOrdersNavigation();
}

function scheduleRemoval(): void {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    runRemoval();
  });
}

export function installAdminOrdersRouteRemoval(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  redirectOrdersToLots();

  observer?.disconnect();
  observer = new MutationObserver(scheduleRemoval);

  const start = () => {
    observer?.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleRemoval);
    window.addEventListener("pushstate", scheduleRemoval as EventListener);
    document.addEventListener("click", scheduleRemoval, true);
    scheduleRemoval();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
