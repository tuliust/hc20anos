const POST_EVENT_PATHS = new Set(["/pos-festa", "/archive"]);
const TARGET_TEXT = "depois do evento, esta página reunirá os registros e lembranças aprovados pela organização.";
let scheduled = false;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function apply() {
  if (!POST_EVENT_PATHS.has(normalizePath(window.location.pathname))) return;

  const target = Array.from(document.querySelectorAll<HTMLElement>("main h2, main p"))
    .find(element => normalize(element.textContent) === normalize(TARGET_TEXT));
  if (!target) return;

  target.setAttribute("data-post-event-closed-message", "true");
  target.style.setProperty("font-size", "1rem", "important");
  target.style.setProperty("line-height", "1.6", "important");
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    apply();
  });
}

export function installPostEventClosedMessageEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcPostEventClosedMessageEnhancementsInstalled) return;
  (window as any).__hcPostEventClosedMessageEnhancementsInstalled = true;

  const start = () => {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", schedule);
    window.addEventListener("resize", schedule);
    schedule();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
