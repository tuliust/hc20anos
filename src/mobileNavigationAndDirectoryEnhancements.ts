import { getAlumniDirectoryStatuses, getPeople } from "./lib/services";

const MOBILE_QUERY = "(max-width: 767px)";
const EX_ALUMNI_PATH = "/ex-alunos";
const CURIOSITIES_PATHS = new Set(["/curiosidades", "/curiosities"]);
const EVENT_ID = "00000000-0000-0000-0000-000000000001";

const selectedClasses = new Set<string>();
const personClassByName = new Map<string, string>();
let peopleLoaded = false;
let peopleLoading: Promise<void> | null = null;
let scheduled = false;
let previousPath = "";

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

function validClassGroup(value: string | null | undefined) {
  const group = String(value ?? "").trim().toUpperCase();
  return /^[A-D]$/.test(group) ? group : null;
}

async function loadPeopleClasses() {
  if (peopleLoaded) return;
  if (peopleLoading) return peopleLoading;

  peopleLoading = Promise.all([
    getPeople(),
    getAlumniDirectoryStatuses(EVENT_ID).catch(() => []),
  ]).then(([people, directoryRows]) => {
    const displayNames = new Map<string, string>();
    directoryRows.forEach(row => {
      if (row.person_id && row.display_name) displayNames.set(row.person_id, row.display_name);
    });

    people.forEach(person => {
      const group = validClassGroup(person.class_group);
      if (!group) return;

      const aliases = [
        person.full_name,
        person.nickname_at_school,
        displayNames.get(person.id),
      ];

      aliases.forEach(alias => {
        const normalized = normalizeText(alias);
        if (normalized) personClassByName.set(normalized, group);
      });
    });

    peopleLoaded = true;
  }).catch(error => {
    console.warn("Não foi possível carregar as turmas para o filtro mobile.", error);
  }).finally(() => {
    peopleLoading = null;
    scheduleApply();
  });

  return peopleLoading;
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

function findExAlumniRoot() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2"))
    .find(element => normalizeText(element.textContent) === "ex-alunos");
  const section = title?.closest<HTMLElement>("section");
  return section?.parentElement instanceof HTMLElement ? section.parentElement : null;
}

function findFilterPanel(root: HTMLElement) {
  const search = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])'))
    .find(input => normalizeText(input.placeholder).includes("buscar por nome"));
  if (!search) return null;

  let current: HTMLElement | null = search.parentElement;
  while (current && current !== root) {
    const labels = Array.from(current.querySelectorAll<HTMLButtonElement>("button"))
      .map(button => normalizeText(button.textContent));
    const hasClasses = ["turma a", "turma b", "turma c", "turma d"].every(label => labels.includes(label));
    const hasStatuses = ["todos", "confirmados", "pre-confirmados", "cadastrados"].every(label =>
      labels.some(candidate => candidate === label || candidate.startsWith(`${label} `)),
    );
    if (hasClasses && hasStatuses) return current;
    current = current.parentElement;
  }

  return null;
}

function buttonClassGroup(button: HTMLButtonElement) {
  const match = normalizeText(button.textContent).match(/^turma\s+([a-d])$/);
  return validClassGroup(match?.[1]);
}

function findAllClassesButton(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => {
      const label = normalizeText(button.textContent);
      return label === "todas as turmas" || label === "todas";
    }) ?? null;
}

function findTightGroup(elements: HTMLButtonElement[], rejectedButtons: HTMLButtonElement[]) {
  if (!elements.length) return null;

  let current: HTMLElement | null = elements[0].parentElement;
  while (current) {
    const containsAll = elements.every(element => current?.contains(element));
    const containsRejected = rejectedButtons.some(element => current?.contains(element));
    if (containsAll && !containsRejected) return current;
    current = current.parentElement;
  }

  return null;
}

function markDirectoryFilters(panel: HTMLElement) {
  const allButtons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
  const nativeAllButton = findAllClassesButton(panel);
  const classButtons = allButtons.filter(button => Boolean(buttonClassGroup(button)));
  const classFilterButtons = nativeAllButton ? [nativeAllButton, ...classButtons] : classButtons;
  const attendanceLabels = new Set(["todos", "confirmados", "pre-confirmados", "cadastrados"]);
  const attendanceButtons = allButtons.filter(button => {
    if (button === nativeAllButton) return false;
    const firstLine = normalizeText(button.querySelector("span")?.textContent || button.textContent).split(" ").slice(0, 2).join(" ");
    const full = normalizeText(button.textContent);
    return Array.from(attendanceLabels).some(label => full === label || full.startsWith(`${label} `) || firstLine === label);
  });

  const classRow = findTightGroup(classFilterButtons, attendanceButtons);
  const attendanceRow = findTightGroup(attendanceButtons, classFilterButtons);
  classRow?.setAttribute("data-mobile-class-filter-row", "true");
  attendanceRow?.setAttribute("data-mobile-attendance-filter-row", "true");

  if (nativeAllButton) {
    nativeAllButton.hidden = false;
    nativeAllButton.style.removeProperty("display");
    nativeAllButton.setAttribute("data-mobile-all-classes-filter", "true");
    nativeAllButton.setAttribute("data-mobile-class-filter", "ALL");
    nativeAllButton.setAttribute("data-mobile-class-selected", selectedClasses.size === 0 ? "true" : "false");
    nativeAllButton.setAttribute("aria-pressed", selectedClasses.size === 0 ? "true" : "false");
    if (normalizeText(nativeAllButton.textContent) !== "todas") nativeAllButton.textContent = "Todas";
  }

  classButtons.forEach(button => {
    const group = buttonClassGroup(button);
    if (!group) return;
    button.setAttribute("data-mobile-class-filter", group);
    button.setAttribute("data-mobile-class-selected", selectedClasses.has(group) ? "true" : "false");
    button.setAttribute("aria-pressed", selectedClasses.has(group) ? "true" : "false");
  });

  attendanceButtons.forEach(button => button.setAttribute("data-mobile-attendance-filter", "true"));
}

function cardName(card: HTMLElement) {
  const imageAlt = card.querySelector<HTMLImageElement>("img[alt]")?.alt;
  if (imageAlt && personClassByName.has(normalizeText(imageAlt))) return imageAlt;

  const paragraphs = Array.from(card.querySelectorAll<HTMLElement>("p"));
  return paragraphs.map(element => element.textContent ?? "")
    .find(value => personClassByName.has(normalizeText(value))) ?? null;
}

function markCardName(card: HTMLElement, name: string) {
  const normalizedName = normalizeText(name);
  const candidate = Array.from(card.querySelectorAll<HTMLElement>("p, h2, h3, h4, span"))
    .find(element => normalizeText(element.textContent) === normalizedName);
  candidate?.setAttribute("data-mobile-alumni-name", "true");
}

function applyClassCardFilter(root: HTMLElement) {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('div[role="button"]'));
  cards.forEach(card => {
    const name = cardName(card);
    const group = name ? personClassByName.get(normalizeText(name)) : null;
    if (!group || !name) return;

    card.setAttribute("data-mobile-alumni-class-card", group);
    markCardName(card, name);
    const visible = selectedClasses.size === 0 || selectedClasses.has(group);
    card.style.setProperty("display", visible ? "" : "none", visible ? "" : "important");
  });
}

function restoreDirectoryCards() {
  document.querySelectorAll<HTMLElement>('[data-mobile-alumni-class-card]')
    .forEach(card => {
      card.style.removeProperty("display");
      card.removeAttribute("data-mobile-alumni-class-card");
    });
  document.querySelectorAll<HTMLElement>('[data-mobile-alumni-name="true"]')
    .forEach(name => name.removeAttribute("data-mobile-alumni-name"));
}

function applyDirectoryFilters() {
  if (!isMobile() || normalizePath(window.location.pathname) !== EX_ALUMNI_PATH) {
    restoreDirectoryCards();
    return;
  }

  const root = findExAlumniRoot();
  if (!root) return;
  const panel = findFilterPanel(root);
  if (!panel) return;

  markDirectoryFilters(panel);
  applyClassCardFilter(root);
  if (!peopleLoaded) void loadPeopleClasses();
}

function handleClassFilterClick(event: MouseEvent) {
  if (!isMobile() || normalizePath(window.location.pathname) !== EX_ALUMNI_PATH) return;
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest<HTMLButtonElement>("button");
  if (!button) return;

  const root = findExAlumniRoot();
  const panel = root ? findFilterPanel(root) : null;
  if (!panel || !panel.contains(button)) return;

  const isAllButton = button.hasAttribute("data-mobile-all-classes-filter")
    || ["todas", "todas as turmas"].includes(normalizeText(button.textContent));
  const group = buttonClassGroup(button);
  if (!isAllButton && !group) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (isAllButton) selectedClasses.clear();
  else if (group && selectedClasses.has(group)) selectedClasses.delete(group);
  else if (group) selectedClasses.add(group);

  markDirectoryFilters(panel);
  applyClassCardFilter(root!);
}

function syncPathState() {
  const path = normalizePath(window.location.pathname);
  if (previousPath && previousPath !== path && previousPath === EX_ALUMNI_PATH) {
    selectedClasses.clear();
    restoreDirectoryCards();
  }
  previousPath = path;
}

function applyAll() {
  syncPathState();
  applyPageOffset();
  markQuestionnaireCta();
  applyDirectoryFilters();
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
    document.addEventListener("click", handleClassFilterClick, true);
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("pushstate", scheduleApply);
    media.addEventListener("change", scheduleApply);
    window.addEventListener("resize", scheduleApply);
    scheduleApply();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
