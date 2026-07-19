const CURIOSITIES_PATHS = new Set(["/curiosidades", "/curiosities"]);
const CARD_ATTRIBUTE = "data-curiosities-poll-card";
const HEADER_ATTRIBUTE = "data-curiosities-poll-header";
const CONTENT_ATTRIBUTE = "data-curiosities-poll-content";
const LABEL_ATTRIBUTE = "data-curiosities-poll-label";
const BADGE_ATTRIBUTE = "data-curiosities-poll-badge";
const QUESTION_ATTRIBUTE = "data-curiosities-poll-question";

let scheduled = false;

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function isCuriositiesPage() {
  return CURIOSITIES_PATHS.has(normalizePath(window.location.pathname));
}

function clearMarkers() {
  [
    CARD_ATTRIBUTE,
    HEADER_ATTRIBUTE,
    CONTENT_ATTRIBUTE,
    LABEL_ATTRIBUTE,
    BADGE_ATTRIBUTE,
    QUESTION_ATTRIBUTE,
  ].forEach(attribute => {
    document.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach(element => {
      element.removeAttribute(attribute);
    });
  });
}

function findBadge(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("span, div, p"))
    .filter(element => {
      const text = normalizeText(element.textContent);
      return text === "aberto" || text === "encerrado" || text === "fechado";
    })
    .sort((a, b) => a.children.length - b.children.length)[0] ?? null;
}

function findPollHeader(label: HTMLElement) {
  let current: HTMLElement | null = label.parentElement;

  while (current && current.tagName !== "SECTION" && current.tagName !== "MAIN") {
    const badge = findBadge(current);
    const question = current.querySelector<HTMLElement>("h2, h3, h4");

    if (badge && question && normalizeText(question.textContent) !== "vote nas memorias da turma") {
      return { header: current, badge, question };
    }

    current = current.parentElement;
  }

  return null;
}

function applyPollMarkers() {
  clearMarkers();
  if (!isCuriositiesPage()) return;

  const labels = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .filter(element => normalizeText(element.textContent) === "enquete");

  labels.forEach(label => {
    const match = findPollHeader(label);
    if (!match) return;

    const content = label.parentElement;
    const card = match.header.parentElement;
    if (!content || !card) return;

    card.setAttribute(CARD_ATTRIBUTE, "true");
    match.header.setAttribute(HEADER_ATTRIBUTE, "true");
    content.setAttribute(CONTENT_ATTRIBUTE, "true");
    label.setAttribute(LABEL_ATTRIBUTE, "true");
    match.badge.setAttribute(BADGE_ATTRIBUTE, "true");
    match.question.setAttribute(QUESTION_ATTRIBUTE, "true");
  });
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    applyPollMarkers();
  });
}

export function installCuriositiesPollMobileEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcCuriositiesPollMobileEnhancementsInstalled) return;
  (window as any).__hcCuriositiesPollMobileEnhancementsInstalled = true;

  const start = () => {
    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("pushstate", scheduleApply);
    scheduleApply();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
