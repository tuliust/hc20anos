const STYLE_ID = "hc-claim-profile-date-style";
const PAGE_ATTRIBUTE = "data-hc-claim-profile-page";
const CLAIM_ROUTES = new Set(["/reivindicar-perfil", "/reinvidicar-perfil"]);

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isClaimProfilePage() {
  if (CLAIM_ROUTES.has(currentPath())) return true;
  return Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .some(element => normalizeText(element.textContent) === "criar meu perfil");
}

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html[${PAGE_ATTRIBUTE}="true"] input[type="date"] {
      color-scheme: dark;
    }

    html[${PAGE_ATTRIBUTE}="true"] input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1) brightness(2);
      opacity: 1;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function updatePageState() {
  if (isClaimProfilePage()) document.documentElement.setAttribute(PAGE_ATTRIBUTE, "true");
  else document.documentElement.removeAttribute(PAGE_ATTRIBUTE);
}

export function installClaimProfileVisualEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  injectStyle();

  const observer = new MutationObserver(updatePageState);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", updatePageState);
    window.addEventListener("pushstate", updatePageState as EventListener);
    updatePageState();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
