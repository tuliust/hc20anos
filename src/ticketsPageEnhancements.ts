const TICKETS_PATH = "/ingressos";
const ALLOWED_TICKET_NAMES = new Set([
  "ingresso ex-aluno",
  "ingresso familia",
  "ingresso convidado",
]);

const MONTHS_PATTERN = /(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/;
let scheduled = false;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function isTicketsPage() {
  return currentPath() === TICKETS_PATH;
}

function restore() {
  document.querySelectorAll<HTMLElement>("[data-tickets-page-hidden]").forEach(element => {
    element.style.removeProperty("display");
    element.removeAttribute("aria-hidden");
    element.removeAttribute("data-tickets-page-hidden");
  });

  document.querySelectorAll<HTMLElement>("[data-tickets-page-grid]").forEach(element => {
    element.removeAttribute("data-tickets-page-grid");
  });

  document.querySelectorAll<HTMLElement>("[data-tickets-page-card]").forEach(element => {
    element.removeAttribute("data-tickets-page-card");
  });
}

function hide(element: HTMLElement) {
  element.style.setProperty("display", "none", "important");
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("data-tickets-page-hidden", "true");
}

function findTicketsHeading() {
  return Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2"))
    .find(element => normalize(element.textContent) === "ingressos") ?? null;
}

function removeHeaderContext() {
  const heading = findTicketsHeading();
  if (!heading) return;

  const header = heading.parentElement;
  if (!header) return;

  header.querySelectorAll<HTMLElement>("p, span").forEach(element => {
    const text = normalize(element.textContent);
    const isDateLocation = MONTHS_PATTERN.test(text) && (text.includes("natal") || /\b20\d{2}\b/.test(text));
    const isVenueLine = text.includes("espaco cultural ponta negra") || text.includes("portas as") || text.includes("portas a s");
    if (isDateLocation || isVenueLine) hide(element);
  });
}

function closestTicketCard(button: HTMLButtonElement) {
  let current: HTMLElement | null = button.parentElement;
  while (current && current.tagName !== "MAIN") {
    const text = normalize(current.textContent);
    const hasPrice = text.includes("r$");
    const hasBorder = typeof current.className === "string" && current.className.includes("border");
    if (hasPrice && hasBorder) return current;
    current = current.parentElement;
  }
  return null;
}

function ticketName(card: HTMLElement) {
  const candidates = Array.from(card.querySelectorAll<HTMLElement>("h2, h3, h4, p"));
  const exact = candidates.find(element => ALLOWED_TICKET_NAMES.has(normalize(element.textContent)));
  if (exact) return normalize(exact.textContent);

  const likelyTitle = candidates.find(element => {
    const text = normalize(element.textContent);
    return text.startsWith("ingresso ") || text.includes("filho adicional");
  });
  return normalize(likelyTitle?.textContent);
}

function findTicketCards() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("main button"))
    .filter(button => {
      const text = normalize(button.textContent);
      return text.includes("comprar") || text.includes("esgotado") || text.includes("indisponivel");
    });

  return Array.from(new Set(buttons.map(closestTicketCard).filter((card): card is HTMLElement => Boolean(card))));
}

function configureCards() {
  const cards = findTicketCards();
  if (!cards.length) return;

  const grid = cards[0].parentElement;
  if (grid) grid.setAttribute("data-tickets-page-grid", "true");

  cards.forEach(card => {
    const name = ticketName(card);
    if (!ALLOWED_TICKET_NAMES.has(name)) {
      hide(card);
      return;
    }

    card.style.removeProperty("display");
    card.removeAttribute("aria-hidden");
    card.removeAttribute("data-tickets-page-hidden");
    card.setAttribute("data-tickets-page-card", name);
  });
}

function apply() {
  if (!isTicketsPage()) {
    restore();
    return;
  }

  removeHeaderContext();
  configureCards();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    apply();
  });
}

export function installTicketsPageEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcTicketsPageEnhancementsInstalled) return;
  (window as any).__hcTicketsPageEnhancementsInstalled = true;

  const start = () => {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
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
