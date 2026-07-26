const HISTORY_ROUTES = new Set([
  "/nossa-historia",
  "/nossas-historias",
  "/noss-historia",
]);
const HIDDEN_ATTRIBUTE = "data-history-empty-state-hidden";

let scheduled = false;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function findHistoryRoot() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .find(element => normalizeText(element.textContent) === "fotos da época");
  return title?.closest<HTMLElement>(".max-w-7xl") ?? null;
}

function findPhotoGallery(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>("div.grid"))
    .find(element => element.classList.contains("grid-cols-2") && element.classList.contains("md:grid-cols-3")) ?? null;
}

function findEmptyState(gallery: HTMLElement) {
  const message = Array.from(gallery.querySelectorAll<HTMLElement>("*"))
    .find(element => normalizeText(element.textContent).includes("nenhuma foto encontrada"));
  if (!message) return null;

  let container: HTMLElement | null = message;
  while (container?.parentElement && container.parentElement !== gallery) {
    container = container.parentElement;
  }
  return container?.parentElement === gallery ? container : null;
}

function isVisiblePhotoCard(element: Element, emptyState: HTMLElement) {
  if (!(element instanceof HTMLElement) || element === emptyState) return false;
  if (!element.querySelector("img")) return false;
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  return window.getComputedStyle(element).display !== "none";
}

function synchronizeHistoryEmptyState() {
  const root = findHistoryRoot();
  if (!root) return;

  const gallery = findPhotoGallery(root);
  if (!gallery) return;

  const emptyState = findEmptyState(gallery);
  if (!emptyState) return;

  const hasVisiblePhotos = Array.from(gallery.children)
    .some(element => isVisiblePhotoCard(element, emptyState));

  if (hasVisiblePhotos) {
    if (emptyState.getAttribute(HIDDEN_ATTRIBUTE) !== "true") {
      emptyState.setAttribute(HIDDEN_ATTRIBUTE, "true");
      emptyState.style.setProperty("display", "none", "important");
    }
    return;
  }

  if (emptyState.getAttribute(HIDDEN_ATTRIBUTE) === "true") {
    emptyState.style.removeProperty("display");
    emptyState.removeAttribute(HIDDEN_ATTRIBUTE);
  }
}

function scheduleSynchronization() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    if (HISTORY_ROUTES.has(currentPath()) || findHistoryRoot()) synchronizeHistoryEmptyState();
  });
}

export function installHistoryEmptyStateEnhancement() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleSynchronization);
  const start = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"],
    });
    document.addEventListener("click", scheduleSynchronization, true);
    window.addEventListener("resize", scheduleSynchronization);
    window.addEventListener("popstate", scheduleSynchronization);
    window.addEventListener("pushstate", scheduleSynchronization);
    scheduleSynchronization();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
