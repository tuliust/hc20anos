const TITLE_BY_CODE: Record<string, string> = {
  simple: "Individual",
  family_full: "Família",
  external_guest: "Convidado",
};

let scheduled = false;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function applyTicketProductTitles() {
  scheduled = false;
  const path = currentPath();
  if (path !== "/" && path !== "/ingressos") return;

  document.querySelectorAll<HTMLElement>("article[data-ticket-product-code]").forEach(card => {
    const code = card.getAttribute("data-ticket-product-code") ?? "";
    const title = TITLE_BY_CODE[code];
    if (!title) return;
    const heading = card.querySelector<HTMLElement>("h2");
    if (heading && heading.textContent?.trim() !== title) heading.textContent = title;
  });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyTicketProductTitles);
}

export function installTicketProductModelEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcTicketProductModel === "true") return;
  document.documentElement.dataset.hcTicketProductModel = "true";

  const start = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", schedule);
    window.addEventListener("pushstate", schedule as EventListener);
    window.addEventListener("hc-ticket-catalog-updated", schedule);
    schedule();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
