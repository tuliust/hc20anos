const MOBILE_QUERY = "(max-width: 767px)";
const CURIOSITIES_PATHS = new Set(["/curiosidades", "/curiosities"]);
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

function isMobile() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function hasClassFilterLabels(labels: string[]) {
  const hasAll = labels.includes("todas as turmas") || labels.includes("todas");
  return hasAll && ["turma a", "turma b", "turma c", "turma d"].every(label => labels.includes(label));
}

function restorePageOffsets() {
  document.querySelectorAll<HTMLElement>('[data-mobile-page-offset="true"]').forEach(root => {
    const original = root.dataset.mobileOriginalPaddingTop ?? "";
    if (original) root.style.setProperty("padding-top", original);
    else root.style.removeProperty("padding-top");
    delete root.dataset.mobileOriginalPaddingTop;
    root.removeAttribute("data-mobile-page-offset");
  });
}

function applyPageOffset() {
  restorePageOffsets();
  if (!isMobile() || normalizePath(window.location.pathname) === "/") return;
  const main = document.querySelector<HTMLElement>("main");
  const root = main?.querySelector<HTMLElement>(":scope > div.min-h-screen")
    ?? (main?.firstElementChild instanceof HTMLElement ? main.firstElementChild : null);
  if (!root || root.querySelector('[data-home-section="hero"]')) return;
  const computedPadding = Number.parseFloat(window.getComputedStyle(root).paddingTop) || 0;
  root.dataset.mobileOriginalPaddingTop = root.style.paddingTop;
  root.setAttribute("data-mobile-page-offset", "true");
  root.style.setProperty("padding-top", `${computedPadding + 24}px`, "important");
}

function markQuestionnaireCta() {
  document.querySelectorAll<HTMLElement>('[data-mobile-questionnaire-cta="true"]')
    .forEach(element => element.removeAttribute("data-mobile-questionnaire-cta"));
  if (!isMobile() || !CURIOSITIES_PATHS.has(normalizePath(window.location.pathname))) return;
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("main button"))
    .find(candidate => normalizeText(candidate.textContent) === "ja respondeu as perguntas?");
  button?.setAttribute("data-mobile-questionnaire-cta", "true");
}

function clearDirectoryMarkers() {
  document.querySelectorAll<HTMLElement>([
    '[data-mobile-class-filter-row="true"]',
    '[data-mobile-attendance-filter-row="true"]',
    '[data-mobile-class-filter]',
    '[data-mobile-attendance-filter="true"]',
    '[data-mobile-alumni-name="true"]',
  ].join(",")).forEach(element => {
    element.removeAttribute("data-mobile-class-filter-row");
    element.removeAttribute("data-mobile-attendance-filter-row");
    element.removeAttribute("data-mobile-class-filter");
    element.removeAttribute("data-mobile-attendance-filter");
    element.removeAttribute("data-mobile-alumni-name");
  });
}

function findExAlumniFilterPanel() {
  const search = Array.from(document.querySelectorAll<HTMLInputElement>('main input[placeholder]'))
    .find(input => normalizeText(input.placeholder) === "buscar por nome...");
  if (!search) return null;
  let current: HTMLElement | null = search.parentElement;
  while (current && current !== document.body) {
    const labels = Array.from(current.querySelectorAll<HTMLButtonElement>("button"))
      .map(button => normalizeText(button.textContent));
    const hasAttendance = ["todos", "confirmados", "pre-confirmados", "cadastrados"]
      .every(label => labels.some(candidate => candidate === label || candidate.startsWith(`${label} `)));
    if (hasClassFilterLabels(labels) && hasAttendance) return current;
    current = current.parentElement;
  }
  return null;
}

function markExAlumniMobileLayout() {
  clearDirectoryMarkers();
  if (!isMobile()) return;
  const panel = findExAlumniFilterPanel();
  if (!panel) return;

  const directChildren = Array.from(panel.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  const classRow = directChildren.find(child => {
    const labels = Array.from(child.querySelectorAll<HTMLButtonElement>("button"))
      .map(button => normalizeText(button.textContent));
    return hasClassFilterLabels(labels);
  });
  const attendanceRow = directChildren.find(child => {
    const labels = Array.from(child.querySelectorAll<HTMLButtonElement>("button"))
      .map(button => normalizeText(button.textContent));
    return ["todos", "confirmados", "pre-confirmados", "cadastrados"]
      .every(label => labels.some(candidate => candidate === label || candidate.startsWith(`${label} `)));
  });

  if (classRow) {
    classRow.setAttribute("data-mobile-class-filter-row", "true");
    Array.from(classRow.querySelectorAll<HTMLButtonElement>("button")).forEach(button => {
      button.setAttribute("data-mobile-class-filter", "true");
      if (normalizeText(button.textContent) === "todas as turmas") button.textContent = "Todas";
    });
  }

  if (attendanceRow) {
    attendanceRow.setAttribute("data-mobile-attendance-filter-row", "true");
    Array.from(attendanceRow.querySelectorAll<HTMLButtonElement>("button"))
      .forEach(button => button.setAttribute("data-mobile-attendance-filter", "true"));
  }

  const resultsSection = panel.nextElementSibling instanceof HTMLElement ? panel.nextElementSibling : null;
  const cards = resultsSection ? Array.from(resultsSection.querySelectorAll<HTMLElement>('div[role="button"]')) : [];
  cards.forEach(card => {
    const name = Array.from(card.querySelectorAll<HTMLElement>("p"))
      .find(paragraph => paragraph.classList.contains("truncate") && paragraph.classList.contains("font-semibold"))
      ?? card.querySelector<HTMLElement>("p.font-semibold");
    name?.setAttribute("data-mobile-alumni-name", "true");
  });
}

function applyAll() {
  applyPageOffset();
  markQuestionnaireCta();
  markExAlumniMobileLayout();
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyAll();
  });
}

export function installMobileNavigationAndDirectoryEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcMobileNavigationAndDirectoryEnhancementsInstalled) return;
  (window as any).__hcMobileNavigationAndDirectoryEnhancementsInstalled = true;
  const media = window.matchMedia(MOBILE_QUERY);
  const start = () => {
    new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("pushstate", scheduleApply);
    media.addEventListener("change", scheduleApply);
    window.addEventListener("resize", scheduleApply);
    scheduleApply();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
