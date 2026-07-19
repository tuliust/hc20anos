const HISTORY_ROUTES = new Set(["/nossa-historia", "/nossas-historias"]);
const HIDDEN_COUNTER_ATTRIBUTE = "data-history-photo-counter-hidden";

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

function restoreHiddenCounters() {
  document.querySelectorAll<HTMLElement>(`[${HIDDEN_COUNTER_ATTRIBUTE}]`).forEach(element => {
    element.style.removeProperty("display");
    element.removeAttribute(HIDDEN_COUNTER_ATTRIBUTE);
  });
}

function removeHistoryPhotoCounter() {
  if (!HISTORY_ROUTES.has(currentPath())) {
    restoreHiddenCounters();
    return;
  }

  const title = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2"))
    .find(element => normalize(element.textContent) === "fotos da epoca");
  const root = title?.closest<HTMLElement>(".max-w-7xl") ?? title?.parentElement;
  if (!root) return;

  Array.from(root.querySelectorAll<HTMLParagraphElement>("p"))
    .filter(element => /^\d+\s+fotos?\s+selecionadas?\s+pela\s+organizacao$/.test(normalize(element.textContent)))
    .forEach(element => {
      element.style.setProperty("display", "none", "important");
      element.setAttribute(HIDDEN_COUNTER_ATTRIBUTE, "true");
    });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    removeHistoryPhotoCounter();
  });
}

export function installHistoryHeaderEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcHistoryHeaderEnhancementsInstalled) return;
  (window as any).__hcHistoryHeaderEnhancementsInstalled = true;

  const start = () => {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
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
