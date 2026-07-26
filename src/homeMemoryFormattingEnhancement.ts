const STYLE_ID = "hc-home-memory-formatting-style";
const HOME_PATH = "/";
const CAROUSEL_SELECTOR = '[data-home-section="about"] [data-home-memory-carousel]';
const FORMATTED_ATTRIBUTE = "data-home-memory-formatted";
const BODY_ATTRIBUTE = "data-home-memory-text";

let observer: MutationObserver | null = null;
let scheduled = false;

function normalizeText(value: string | null | undefined) {
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

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    ${CAROUSEL_SELECTOR}[${FORMATTED_ATTRIBUTE}="true"] {
      min-width: 0;
    }

    ${CAROUSEL_SELECTOR}[${FORMATTED_ATTRIBUTE}="true"] [${BODY_ATTRIBUTE}="true"] {
      position: relative;
      margin: 0 !important;
      padding-left: 1.4rem;
      max-width: 58rem;
      color: #172218 !important;
      font-family: Georgia, "Times New Roman", ui-serif, serif !important;
      font-size: clamp(1rem, 1.2vw, 1.2rem) !important;
      font-style: normal !important;
      font-weight: 400 !important;
      letter-spacing: 0 !important;
      line-height: 1.6 !important;
      overflow-wrap: anywhere;
      text-wrap: pretty;
      white-space: pre-wrap;
    }

    ${CAROUSEL_SELECTOR}[${FORMATTED_ATTRIBUTE}="true"] [${BODY_ATTRIBUTE}="true"]::before {
      content: "“";
      position: absolute;
      top: -0.08em;
      left: 0;
      color: #8a6d13;
      font-family: Georgia, "Times New Roman", ui-serif, serif;
      font-size: 2rem;
      line-height: 1;
    }

    ${CAROUSEL_SELECTOR}[${FORMATTED_ATTRIBUTE}="true"] [data-memory-author] {
      margin-top: 1.15rem !important;
      color: #172218 !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      font-size: 0.78rem !important;
      font-style: normal !important;
      font-weight: 700 !important;
      letter-spacing: 0 !important;
      line-height: 1.4 !important;
      overflow-wrap: anywhere;
    }

    ${CAROUSEL_SELECTOR}[${FORMATTED_ATTRIBUTE}="true"] [data-memory-class] {
      margin-top: 0.25rem !important;
      color: #536158 !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      font-size: 0.72rem !important;
      font-style: normal !important;
      font-weight: 500 !important;
      letter-spacing: 0.04em !important;
      line-height: 1.35 !important;
    }

    @media (max-width: 767px) {
      ${CAROUSEL_SELECTOR}[${FORMATTED_ATTRIBUTE}="true"] [${BODY_ATTRIBUTE}="true"] {
        padding-left: 1.15rem;
        font-size: 1rem !important;
        line-height: 1.55 !important;
      }

      ${CAROUSEL_SELECTOR}[${FORMATTED_ATTRIBUTE}="true"] [${BODY_ATTRIBUTE}="true"]::before {
        font-size: 1.7rem;
      }
    }
  `;
  document.head.appendChild(style);
}

function findMemoryBody(carousel: HTMLElement) {
  const candidates = Array.from(carousel.querySelectorAll<HTMLElement>("p, blockquote, q"))
    .filter(element => {
      if (element.closest("button")) return false;
      if (element.matches("[data-memory-author], [data-memory-class]")) return false;
      if (element.querySelector("p, blockquote, q")) return false;

      const text = String(element.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.length < 20) return false;
      if (normalizeText(text) === "memorias") return false;
      return true;
    })
    .sort((left, right) => (right.textContent?.trim().length ?? 0) - (left.textContent?.trim().length ?? 0));

  return candidates[0] ?? null;
}

function normalizeOuterQuotes(element: HTMLElement) {
  const text = String(element.textContent ?? "").trim();
  const matchingQuotes = (
    (text.startsWith("“") && text.endsWith("”"))
    || (text.startsWith("\"") && text.endsWith("\""))
    || (text.startsWith("‘") && text.endsWith("’"))
  );

  if (matchingQuotes && text.length > 2) {
    element.textContent = text.slice(1, -1).trim();
  }
}

function applyFormatting() {
  scheduled = false;
  if (currentPath() !== HOME_PATH) return;

  const carousel = document.querySelector<HTMLElement>(CAROUSEL_SELECTOR);
  if (!carousel) return;

  carousel.setAttribute(FORMATTED_ATTRIBUTE, "true");

  const label = Array.from(carousel.querySelectorAll<HTMLElement>("p, span"))
    .find(element => normalizeText(element.textContent) === "memorias");
  label?.setAttribute("data-home-memory-label", "true");

  const body = findMemoryBody(carousel);
  if (!body) return;

  body.setAttribute(BODY_ATTRIBUTE, "true");
  normalizeOuterQuotes(body);
}

function scheduleFormatting() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyFormatting);
}

export function installHomeMemoryFormattingEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcHomeMemoryFormatting === "true") return;
  document.documentElement.dataset.hcHomeMemoryFormatting = "true";

  injectStyle();
  observer?.disconnect();
  observer = new MutationObserver(scheduleFormatting);

  const start = () => {
    if (!document.body) return;
    observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("popstate", scheduleFormatting);
    window.addEventListener("pushstate", scheduleFormatting as EventListener);
    scheduleFormatting();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
