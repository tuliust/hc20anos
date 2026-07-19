const ALUMNI_AREA_ROUTES = new Set(["/minha-area", "/alumni-area"]);
const HIDDEN_ATTRIBUTE = "data-alumni-area-header-exit-hidden";

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isAlumniAreaRoute() {
  return ALUMNI_AREA_ROUTES.has(currentPath());
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
