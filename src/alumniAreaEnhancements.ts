const ALUMNI_AREA_ROUTES = new Set(["/minha-area", "/alumni-area"]);
const HIDDEN_ATTRIBUTE = "data-alumni-area-header-exit-hidden";
const ORDERS_LINK_ATTRIBUTE = "data-buyer-orders-link";

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isAlumniAreaRoute() {
  return ALUMNI_AREA_ROUTES.has(currentPath());
}

function ensureOrdersLink() {
  document.querySelectorAll<HTMLElement>(`[${ORDERS_LINK_ATTRIBUTE}]`).forEach(element => {
    if (!isAlumniAreaRoute()) element.remove();
  });

  if (!isAlumniAreaRoute() || document.querySelector(`[${ORDERS_LINK_ATTRIBUTE}]`)) return;

  const main = document.querySelector("main");
  if (!main) return;

  const heading = Array.from(main.querySelectorAll("h1, h2")).find(element =>
    /minha área|área do ex-aluno|olá/i.test(element.textContent ?? "")
  );
  const anchor = heading?.parentElement ?? main.firstElementChild;
  if (!anchor?.parentElement) return;

  const link = document.createElement("a");
  link.href = "/meus-pedidos";
  link.setAttribute(ORDERS_LINK_ATTRIBUTE, "true");
  link.textContent = "Meus pedidos e ingressos";
  link.setAttribute("aria-label", "Abrir meus pedidos e ingressos");
  Object.assign(link.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "12px",
    padding: "11px 18px",
    borderRadius: "999px",
    background: "#173c2f",
    color: "#ffffff",
    fontWeight: "700",
    textDecoration: "none",
  });
  anchor.appendChild(link);
}

function updateHeaderExitButton() {
  document.querySelectorAll<HTMLButtonElement>(`button[${HIDDEN_ATTRIBUTE}]`).forEach(button => {
    if (!isAlumniAreaRoute()) {
      button.style.removeProperty("display");
      button.removeAttribute("aria-hidden");
      button.removeAttribute(HIDDEN_ATTRIBUTE);
    }
  });

  if (!isAlumniAreaRoute()) return;

  const button = Array.from(document.querySelectorAll<HTMLButtonElement>('main button[title="Voltar ao início"], button[title="Voltar ao início"]'))
    .find(candidate => Boolean(candidate.querySelector("svg.lucide-log-out")));

  if (!button) return;

  button.style.setProperty("display", "none", "important");
  button.setAttribute("aria-hidden", "true");
  button.setAttribute(HIDDEN_ATTRIBUTE, "true");
}

let scheduled = false;

function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    updateHeaderExitButton();
    ensureOrdersLink();
  });
}

export function installAlumniAreaEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleUpdate);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleUpdate);
    window.addEventListener("pushstate", scheduleUpdate);
    scheduleUpdate();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
