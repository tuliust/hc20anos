const STYLE_ID = "hc-home-ticket-card-spacing-final";
const SUBTITLE_SELECTOR = "[data-ticket-card-subtitle]";

let observer: MutationObserver | null = null;
let scheduled = false;

function normalize(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function splitNearMiddle(text: string): [string, string] {
  const words = normalize(text).split(" ").filter(Boolean);
  if (words.length <= 1) return [words[0] ?? "", "\u00a0"];

  let bestIndex = 1;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(" ");
    const second = words.slice(index).join(" ");
    const difference = Math.abs(first.length - second.length);
    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = index;
    }
  }

  return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
}

function splitSubtitle(text: string, productCode: string): [string, string] {
  const clean = normalize(text);
  if (!clean) return ["", "\u00a0"];

  if (productCode === "simple") {
    const yearMatch = clean.match(/^(.*?)(\s+2006)$/i);
    if (yearMatch) return [yearMatch[1].trim(), yearMatch[2].trim()];
  }

  if (productCode === "family_full" || productCode === "family_single_parent") {
    const index = clean.toLocaleLowerCase("pt-BR").lastIndexOf(" até ");
    if (index > 0) return [clean.slice(0, index).trim(), clean.slice(index + 1).trim()];
  }

  if (productCode === "external_guest") {
    const index = clean.toLocaleLowerCase("pt-BR").lastIndexOf(" por ");
    if (index > 0) return [clean.slice(0, index).trim(), clean.slice(index + 1).trim()];
  }

  return splitNearMiddle(clean);
}

function formatSubtitles(): void {
  document.querySelectorAll<HTMLElement>(SUBTITLE_SELECTOR).forEach(subtitle => {
    const card = subtitle.closest<HTMLElement>("article[data-ticket-product-code]");
    if (!card) return;

    const text = normalize(subtitle.textContent);
    if (!text) return;

    const spans = subtitle.querySelectorAll(":scope > span[data-hc-subtitle-line]");
    if (subtitle.dataset.hcSubtitleText === text && spans.length === 2) return;

    const [firstLine, secondLine] = splitSubtitle(
      text,
      card.getAttribute("data-ticket-product-code") ?? "",
    );

    const first = document.createElement("span");
    first.dataset.hcSubtitleLine = "1";
    first.textContent = firstLine;

    const second = document.createElement("span");
    second.dataset.hcSubtitleLine = "2";
    second.textContent = secondLine;

    subtitle.replaceChildren(first, document.createTextNode(" "), second);
    subtitle.dataset.hcSubtitleText = text;
  });
}

function findSecurityPanel(): HTMLElement | null {
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return null;

  const label = Array.from(main.querySelectorAll<HTMLElement>("h1,h2,h3,p,strong,span"))
    .find(element => normalize(element.textContent).toLocaleLowerCase("pt-BR")
      .includes("compra segura via mercado pago"));
  if (!label) return null;

  let current: HTMLElement | null = label.parentElement;
  while (current && current.parentElement !== main) {
    if (String(current.className).includes("border")) return current;
    current = current.parentElement;
  }

  return current;
}

function moveSecurityPanelAboveTickets(): void {
  if (currentPath() !== "/ingressos") return;

  const catalog = document.querySelector<HTMLElement>("[data-public-ticket-catalog='true']");
  const container = catalog?.closest<HTMLElement>("[data-public-ticket-catalog-container]");
  const panel = findSecurityPanel();
  const parent = container?.parentElement;

  if (!container || !panel || !parent || panel === container || panel.nextElementSibling === container) return;
  parent.insertBefore(panel, container);
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [data-public-ticket-catalog="true"] article[data-ticket-product-code] > div:first-child > div:first-child {
      display: flex;
      min-width: 0;
      flex: 1 1 auto;
      flex-direction: column;
    }

    [data-public-ticket-catalog="true"] article[data-ticket-product-code] > div:first-child > div:first-child > p:first-child {
      order: 1;
      margin: 0 !important;
      line-height: 1.2;
    }

    [data-public-ticket-catalog="true"] ${SUBTITLE_SELECTOR} {
      order: 2;
      display: block;
      min-height: 2.7em;
      margin: 1.25rem 0 0 !important;
      line-height: 1.35 !important;
    }

    [data-public-ticket-catalog="true"] ${SUBTITLE_SELECTOR} > span[data-hc-subtitle-line] {
      display: block;
      min-height: 1.35em;
    }

    [data-public-ticket-catalog="true"] article[data-ticket-product-code] h2 {
      order: 3;
      margin-top: 0.65rem !important;
      margin-bottom: 0 !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:nth-child(2) {
      margin-top: 0.7rem !important;
      margin-bottom: 0.7rem !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > p {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      line-height: 1.1;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > button {
      margin-top: 1rem !important;
    }
  `;

  document.head.appendChild(style);
}

function applyEnhancements(): void {
  scheduled = false;
  injectStyles();
  formatSubtitles();
  moveSecurityPanelAboveTickets();
}

function scheduleEnhancements(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyEnhancements);
}

export function installHomeTicketCardSpacingEnhancements(): void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

  injectStyles();
  observer?.disconnect();
  observer = new MutationObserver(scheduleEnhancements);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  window.addEventListener("popstate", scheduleEnhancements);
  window.addEventListener("pushstate", scheduleEnhancements as EventListener);
  window.addEventListener("hc-ticket-catalog-updated", scheduleEnhancements);
  scheduleEnhancements();
}
