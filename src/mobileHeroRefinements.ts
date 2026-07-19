const MOBILE_QUERY = "(max-width: 767px)";

let scheduled = false;

function formatMobileDateLabel(value: string) {
  return value.replace(/\bde\s+([a-záàâãéêíóôõúç]+)/i, (_match, month: string) => {
    const formattedMonth = `${month.charAt(0).toLocaleUpperCase("pt-BR")}${month.slice(1)}`;
    return `de ${formattedMonth}`;
  });
}

function splitEventRemainder(value: string) {
  const clean = value.trim();
  if (!clean) return { separator: "", rest: "" };

  const match = clean.match(/^([·•|—–-]+)\s*(.*)$/);
  if (!match) return { separator: "·", rest: clean };

  return {
    separator: match[1] || "·",
    rest: (match[2] || "").trim(),
  };
}

function findHeroElements() {
  const hero = document.querySelector<HTMLElement>('[data-home-section="hero"]');
  const title = hero?.querySelector<HTMLElement>("h1");
  const content = title?.parentElement;
  if (!hero || !title || !content) return null;

  const eyebrow = title.previousElementSibling instanceof HTMLElement
    ? title.previousElementSibling
    : null;
  const tagline = title.nextElementSibling instanceof HTMLElement
    ? title.nextElementSibling
    : null;

  const eventLine = Array.from(content.children).find((element): element is HTMLElement =>
    element instanceof HTMLElement
    && element.tagName === "P"
    && element !== eyebrow
    && element !== tagline
    && element.classList.contains("font-mono")
    && element.classList.contains("uppercase"),
  ) ?? null;

  if (!eventLine) return null;
  return { hero, title, content, eyebrow, tagline, eventLine };
}

function buildEventLine(eventLine: HTMLElement) {
  const existingDate = eventLine.querySelector<HTMLElement>('[data-mobile-hero-event-date="true"]');
  const existingRest = eventLine.querySelector<HTMLElement>('[data-mobile-hero-event-rest="true"]');

  let dateText = existingDate?.dataset.mobileHeroDateOriginal
    || existingDate?.textContent?.trim()
    || "";
  let remainderText = existingRest?.textContent?.trim() || "";

  if (!dateText) {
    const originalText = String(eventLine.textContent ?? "").replace(/\s+/g, " ").trim();
    const match = originalText.match(/^(.+?\b20\d{2}\b)(.*)$/);
    if (!match) return null;
    dateText = match[1].trim();
    remainderText = match[2].trim();
  }

  const remainder = splitEventRemainder(remainderText);
  const date = document.createElement("span");
  date.setAttribute("data-mobile-hero-event-date", "true");
  date.dataset.mobileHeroDateOriginal = dateText;

  const separator = document.createElement("span");
  separator.setAttribute("data-mobile-hero-event-separator", "true");
  separator.textContent = remainder.rest ? ` ${remainder.separator || "·"} ` : "";

  const rest = document.createElement("span");
  rest.setAttribute("data-mobile-hero-event-rest", "true");
  rest.textContent = remainder.rest;

  eventLine.replaceChildren(date, separator, rest);
  eventLine.setAttribute("data-mobile-hero-event-prepared", "true");

  return { date, separator, rest };
}

function syncResponsiveText(date: HTMLElement) {
  const original = date.dataset.mobileHeroDateOriginal || date.textContent?.trim() || "";
  const nextText = window.matchMedia(MOBILE_QUERY).matches
    ? formatMobileDateLabel(original)
    : original;

  if (date.textContent !== nextText) date.textContent = nextText;
}

function applyMobileHeroRefinements() {
  const elements = findHeroElements();
  if (!elements) return;

  const { content, title, eyebrow, tagline, eventLine } = elements;
  content.setAttribute("data-mobile-hero-content", "true");
  title.setAttribute("data-mobile-hero-title", "true");
  if (eyebrow) eyebrow.setAttribute("data-mobile-hero-eyebrow", "true");
  if (tagline) tagline.setAttribute("data-mobile-hero-tagline", "true");
  eventLine.setAttribute("data-mobile-hero-event-line", "true");

  let date = eventLine.querySelector<HTMLElement>('[data-mobile-hero-event-date="true"]');
  const separator = eventLine.querySelector<HTMLElement>('[data-mobile-hero-event-separator="true"]');
  const rest = eventLine.querySelector<HTMLElement>('[data-mobile-hero-event-rest="true"]');

  if (!date || !separator || !rest) {
    const prepared = buildEventLine(eventLine);
    date = prepared?.date ?? null;
  }

  if (date) syncResponsiveText(date);
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyMobileHeroRefinements();
  });
}

export function installMobileHeroRefinements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcMobileHeroRefinementsInstalled) return;
  (window as any).__hcMobileHeroRefinementsInstalled = true;

  const start = () => {
    scheduleApply();
    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
    });
    window.matchMedia(MOBILE_QUERY).addEventListener("change", scheduleApply);
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("pushstate", scheduleApply);
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
