const HOME_CLASS_CARD_ATTRIBUTE = "data-home-class-card-enhanced";
const HOME_ALUMNI_CARD_ATTRIBUTE = "data-home-alumni-card";
const HOME_ALUMNI_CARD_HANDLER_ATTRIBUTE = "data-home-alumni-card-handler";
const HOME_ALUMNI_PERSON_ATTRIBUTE = "data-home-alumni-person";
const HOME_ALUMNI_PERSON_HANDLER_ATTRIBUTE = "data-home-alumni-person-handler";
const HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE = "data-home-alumni-presence-filter";
const HOME_ALUMNI_STYLE_ID = "hc-home-alumni-clickable-style";
const CLASS_FILTER_APPLIED_ATTRIBUTE = "data-ex-alumni-class-filter-applied";
const ATTENDANCE_FILTER_APPLIED_ATTRIBUTE = "data-ex-alumni-attendance-filter-applied";
const PERSON_OPENED_ATTRIBUTE = "data-ex-alumni-person-opened";

type DirectoryAttendanceFilter = "all" | "confirmed" | "preconfirmed" | "registered";
type HomeAlumniCardKind = "sample" | "presence" | "classes" | "confirmed";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function normalizeKey(value: string | null | undefined) {
  return normalizeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function findExAlumniPageRoot(): HTMLElement | null {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .find(element => normalizeText(element.textContent) === "ex-alunos");
  const headingSection = title?.closest<HTMLElement>("section");
  return headingSection?.parentElement instanceof HTMLElement ? headingSection.parentElement : null;
}

function matchButtonToStatusBadge(button: HTMLButtonElement) {
  const actionRow = button.parentElement;
  const badge = actionRow
    ? Array.from(actionRow.children).find((element): element is HTMLElement =>
        element instanceof HTMLElement
        && element !== button
        && normalizeText(element.textContent) === "não cadastrado")
    : null;
  if (!badge) return;

  const badgeStyle = window.getComputedStyle(badge);
  const badgeHeight = badge.getBoundingClientRect().height;

  button.style.boxSizing = "border-box";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.height = badgeHeight > 0 ? `${badgeHeight}px` : badgeStyle.height;
  button.style.minHeight = "0";
  button.style.paddingTop = badgeStyle.paddingTop;
  button.style.paddingRight = badgeStyle.paddingRight;
  button.style.paddingBottom = badgeStyle.paddingBottom;
  button.style.paddingLeft = badgeStyle.paddingLeft;
  button.style.fontFamily = badgeStyle.fontFamily;
  button.style.fontSize = badgeStyle.fontSize;
  button.style.fontWeight = badgeStyle.fontWeight;
  button.style.lineHeight = badgeStyle.lineHeight;
  button.style.letterSpacing = badgeStyle.letterSpacing;
}

function enhanceExAlumniClaimButtons(pageRoot: HTMLElement) {
  const buttons = Array.from(pageRoot.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => {
      const label = normalizeText(button.textContent);
      return label === "reivindicar" || label === "sou eu!";
    });

  buttons.forEach(button => {
    if (button.textContent !== "Sou eu!") button.textContent = "Sou eu!";
    button.setAttribute("data-ex-alumni-claim-action", "true");
    button.classList.remove("px-3", "py-1.5");
    button.classList.add("px-2.5", "py-1");
    matchButtonToStatusBadge(button);
  });
}

function enhanceExAlumniAllFilter(pageRoot: HTMLElement) {
  const allFilter = Array.from(pageRoot.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => {
      const labels = Array.from(button.querySelectorAll<HTMLElement>("span"));
      return normalizeText(labels[0]?.textContent) === "todos"
        && normalizeText(labels[1]?.textContent) === "todos os pré-cadastrados";
    });
  const description = allFilter?.querySelectorAll<HTMLElement>("span")[1];
  if (description && description.textContent !== "Ex-alunos 2006") description.textContent = "Ex-alunos 2006";
}

function enhanceExAlumniEyebrow(pageRoot: HTMLElement) {
  const eyebrow = Array.from(pageRoot.querySelectorAll<HTMLElement>("p"))
    .find(element => normalizeText(element.textContent) === "turma 2006 · diretório");

  if (eyebrow && eyebrow.textContent !== "Pré HC 2006") {
    eyebrow.textContent = "Pré HC 2006";
  }
}

function requestedClassGroup() {
  const group = new URLSearchParams(window.location.search).get("turma")?.trim().toUpperCase() ?? "";
  return /^[ABCD]$/.test(group) ? group : null;
}

function applyRequestedClassFilter(pageRoot: HTMLElement) {
  const group = requestedClassGroup();
  if (!group) {
    pageRoot.removeAttribute(CLASS_FILTER_APPLIED_ATTRIBUTE);
    return;
  }

  const button = Array.from(pageRoot.querySelectorAll<HTMLButtonElement>("button"))
    .find(item => normalizeText(item.textContent) === `turma ${group.toLocaleLowerCase("pt-BR")}`);
  if (!button) return;

  const isActive = button.className.includes("bg-[#c9a84c]")
    || button.getAttribute("aria-pressed") === "true";
  if (!isActive) button.click();
  pageRoot.setAttribute(CLASS_FILTER_APPLIED_ATTRIBUTE, group);
}

function requestedAttendanceFilter(): DirectoryAttendanceFilter | null {
  const value = normalizeKey(new URLSearchParams(window.location.search).get("presenca"));
  if (!value) return null;
  if (["confirmed", "confirmados"].includes(value)) return "confirmed";
  if (["preconfirmed", "pre-confirmados", "pretendem-ir", "pretendem_ir"].includes(value)) return "preconfirmed";
  if (["registered", "cadastrados"].includes(value)) return "registered";
  if (["all", "todos"].includes(value)) return "all";
  return null;
}

function applyRequestedAttendanceFilter(pageRoot: HTMLElement) {
  const filter = requestedAttendanceFilter();
  if (!filter) {
    pageRoot.removeAttribute(ATTENDANCE_FILTER_APPLIED_ATTRIBUTE);
    return;
  }

  const expectedLabel: Record<DirectoryAttendanceFilter, string> = {
    all: "todos",
    confirmed: "confirmados",
    preconfirmed: "pre-confirmados",
    registered: "cadastrados",
  };
  const button = Array.from(pageRoot.querySelectorAll<HTMLButtonElement>("button"))
    .find(item => normalizeKey(item.querySelector("span")?.textContent) === expectedLabel[filter]);
  if (!button) return;

  const isActive = button.className.includes("bg-[#2d6a4f]")
    || button.getAttribute("aria-pressed") === "true";
  if (!isActive) button.click();
  pageRoot.setAttribute(ATTENDANCE_FILTER_APPLIED_ATTRIBUTE, filter);
}

function requestedPersonName() {
  return new URLSearchParams(window.location.search).get("pessoa")?.trim() || null;
}

function openRequestedPerson(pageRoot: HTMLElement) {
  const requestedName = requestedPersonName();
  if (!requestedName) {
    pageRoot.removeAttribute(PERSON_OPENED_ATTRIBUTE);
    return;
  }

  const normalizedName = normalizeKey(requestedName);
  if (pageRoot.getAttribute(PERSON_OPENED_ATTRIBUTE) === normalizedName) return;

  const card = Array.from(pageRoot.querySelectorAll<HTMLElement>('[role="button"][tabindex="0"]'))
    .find(item => Array.from(item.querySelectorAll<HTMLElement>("p"))
      .some(paragraph => normalizeKey(paragraph.textContent) === normalizedName));
  if (!card) return;

  pageRoot.setAttribute(PERSON_OPENED_ATTRIBUTE, normalizedName);
  card.click();
}

function openClassDirectory(group: string) {
  const url = new URL("/ex-alunos", window.location.origin);
  url.searchParams.set("turma", group);
  window.location.assign(`${url.pathname}${url.search}`);
}

function openAlumniDirectory(options: {
  classGroup?: string | null;
  attendance?: DirectoryAttendanceFilter | null;
  personName?: string | null;
} = {}) {
  const url = new URL("/ex-alunos", window.location.origin);
  if (options.classGroup && /^[ABCD]$/.test(options.classGroup)) url.searchParams.set("turma", options.classGroup);
  if (options.attendance && options.attendance !== "all") url.searchParams.set("presenca", options.attendance);
  if (options.personName) url.searchParams.set("pessoa", options.personName);
  window.location.assign(`${url.pathname}${url.search}`);
}

function hasNestedInteractiveTarget(event: Event, root: HTMLElement) {
  if (!(event.target instanceof Element)) return false;
  const interactive = event.target.closest("button, a, input, select, textarea, [role='button'], [role='link'], [data-home-alumni-person], [data-home-alumni-presence-filter]");
  return Boolean(interactive && interactive !== root && root.contains(interactive));
}

function makeDirectoryLink(element: HTMLElement, ariaLabel: string, action: () => void, handlerAttribute: string) {
  if (element.hasAttribute(handlerAttribute)) return;
  element.setAttribute(handlerAttribute, "true");

  if (!(element instanceof HTMLButtonElement) && !(element instanceof HTMLAnchorElement)) {
    element.setAttribute("role", "link");
    element.setAttribute("tabindex", "0");
  }
  element.setAttribute("aria-label", ariaLabel);

  element.addEventListener("click", event => {
    if (hasNestedInteractiveTarget(event, element)) return;
    action();
  });
  element.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target !== element) return;
    event.preventDefault();
    action();
  });
}

function injectHomeAlumniClickableStyles() {
  if (document.getElementById(HOME_ALUMNI_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HOME_ALUMNI_STYLE_ID;
  style.textContent = `
    [${HOME_ALUMNI_CARD_ATTRIBUTE}] {
      cursor: pointer;
      outline: none;
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }
    [${HOME_ALUMNI_CARD_ATTRIBUTE}]:hover,
    [${HOME_ALUMNI_CARD_ATTRIBUTE}]:focus-visible {
      border-color: rgba(201, 168, 76, 0.72) !important;
      box-shadow: 0 12px 28px rgba(4, 10, 5, 0.28);
      transform: translateY(-2px);
    }
    [${HOME_ALUMNI_PERSON_ATTRIBUTE}],
    [${HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE}] {
      cursor: pointer;
      outline: none;
      transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease, color 150ms ease;
    }
    [${HOME_ALUMNI_PERSON_ATTRIBUTE}]:hover,
    [${HOME_ALUMNI_PERSON_ATTRIBUTE}]:focus-visible {
      background: rgba(45, 106, 79, 0.16);
      box-shadow: 0 0 0 1px rgba(201, 168, 76, 0.52);
      transform: translateY(-2px);
    }
    [${HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE}]:hover,
    [${HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE}]:focus-visible {
      border-color: rgba(201, 168, 76, 0.72) !important;
      background: rgba(26, 46, 26, 0.92) !important;
      transform: translateY(-1px);
    }
    @media (prefers-reduced-motion: reduce) {
      [${HOME_ALUMNI_CARD_ATTRIBUTE}],
      [${HOME_ALUMNI_PERSON_ATTRIBUTE}],
      [${HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE}] {
        transition: none;
      }
      [${HOME_ALUMNI_CARD_ATTRIBUTE}]:hover,
      [${HOME_ALUMNI_CARD_ATTRIBUTE}]:focus-visible,
      [${HOME_ALUMNI_PERSON_ATTRIBUTE}]:hover,
      [${HOME_ALUMNI_PERSON_ATTRIBUTE}]:focus-visible,
      [${HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE}]:hover,
      [${HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE}]:focus-visible {
        transform: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function getPersonName(element: HTMLElement) {
  return element.getAttribute("title")?.trim()
    || element.querySelector<HTMLImageElement>("img[alt]")?.alt.trim()
    || element.querySelector<HTMLElement>('[role="img"][aria-label]')?.getAttribute("aria-label")?.trim()
    || Array.from(element.querySelectorAll<HTMLElement>("p")).map(item => item.textContent?.trim() ?? "").find(Boolean)
    || "";
}

function activeHomeClassGroup(root: HTMLElement) {
  const activeButton = root.querySelector<HTMLButtonElement>('[data-home-class-tabs] button[aria-pressed="true"]');
  const match = activeButton?.textContent?.match(/turma\s+([A-D])\b/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function enhanceHomePerson(element: HTMLElement, root: HTMLElement, context: "sample" | "classes" | "confirmed") {
  const personName = getPersonName(element);
  if (!personName) return;

  element.setAttribute(HOME_ALUMNI_PERSON_ATTRIBUTE, personName);
  if (!element.getAttribute("title")) element.setAttribute("title", `Abrir perfil de ${personName}`);

  makeDirectoryLink(element, `Abrir perfil de ${personName}`, () => {
    openAlumniDirectory({
      personName,
      classGroup: context === "classes" ? activeHomeClassGroup(root) : null,
      attendance: context === "confirmed" ? "confirmed" : null,
    });
  }, HOME_ALUMNI_PERSON_HANDLER_ATTRIBUTE);
}

function enhanceHomePeopleContainer(container: HTMLElement | null, root: HTMLElement, context: "sample" | "classes" | "confirmed") {
  if (!container) return;
  Array.from(container.children).forEach(child => {
    if (child instanceof HTMLElement) enhanceHomePerson(child, root, context);
  });
}

function enhanceHomePresenceFilters(presenceCard: HTMLElement) {
  const statsGrid = Array.from(presenceCard.children).find((child): child is HTMLElement =>
    child instanceof HTMLElement && String(child.className).includes("grid-cols-2"));
  if (!statsGrid) return;

  const filters: DirectoryAttendanceFilter[] = ["confirmed", "preconfirmed"];
  Array.from(statsGrid.children).forEach((child, index) => {
    if (!(child instanceof HTMLElement) || !filters[index]) return;
    const filter = filters[index];
    const label = child.textContent?.replace(/\s+/g, " ").trim() || (filter === "confirmed" ? "Confirmados" : "Pretendem ir");
    child.setAttribute(HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE, filter);
    makeDirectoryLink(child, `Ver ${label} em Ex-alunos`, () => openAlumniDirectory({ attendance: filter }), `${HOME_ALUMNI_PRESENCE_FILTER_ATTRIBUTE}-handler`);
  });
}

function findHomeAlumniCards(root: HTMLElement) {
  const classTabs = root.querySelector<HTMLElement>("[data-home-class-tabs]");
  const classCard = classTabs?.parentElement instanceof HTMLElement ? classTabs.parentElement : null;
  const confirmedGrid = root.querySelector<HTMLElement>("[data-home-confirmed-grid]");
  const confirmedCard = confirmedGrid?.parentElement instanceof HTMLElement ? confirmedGrid.parentElement : null;
  const cardsContainer = classCard?.parentElement instanceof HTMLElement ? classCard.parentElement : null;
  const cards = cardsContainer ? Array.from(cardsContainer.children).filter((child): child is HTMLElement => child instanceof HTMLElement) : [];
  if (cards.length < 4) return null;

  return {
    sampleCard: cards[0],
    presenceCard: cards[1],
    classesCard: classCard ?? cards[2],
    confirmedCard: confirmedCard ?? cards[3],
  };
}

function enhanceHomeAlumniCard(card: HTMLElement, kind: HomeAlumniCardKind, action: () => void) {
  card.setAttribute(HOME_ALUMNI_CARD_ATTRIBUTE, kind);
  const labels: Record<HomeAlumniCardKind, string> = {
    sample: "Ver todos os ex-alunos",
    presence: "Ver presença dos ex-alunos",
    classes: "Ver ex-alunos por turma",
    confirmed: "Ver ex-alunos confirmados",
  };
  makeDirectoryLink(card, labels[kind], action, HOME_ALUMNI_CARD_HANDLER_ATTRIBUTE);
}

function enhanceHomeAlumniOverview() {
  if (currentPath() !== "/") return;
  const root = document.querySelector<HTMLElement>("[data-home-alumni-overview]");
  if (!root) return;

  injectHomeAlumniClickableStyles();
  const cards = findHomeAlumniCards(root);
  if (!cards) return;

  enhanceHomeAlumniCard(cards.sampleCard, "sample", () => openAlumniDirectory());
  enhanceHomeAlumniCard(cards.presenceCard, "presence", () => openAlumniDirectory());
  enhanceHomeAlumniCard(cards.classesCard, "classes", () => openAlumniDirectory());
  enhanceHomeAlumniCard(cards.confirmedCard, "confirmed", () => openAlumniDirectory({ attendance: "confirmed" }));

  const sampleGrid = Array.from(cards.sampleCard.children).find((child): child is HTMLElement =>
    child instanceof HTMLElement && String(child.className).includes("grid-cols-4"));
  enhanceHomePeopleContainer(sampleGrid ?? null, root, "sample");
  enhanceHomePeopleContainer(root.querySelector<HTMLElement>("[data-home-class-people]"), root, "classes");
  enhanceHomePeopleContainer(root.querySelector<HTMLElement>("[data-home-confirmed-grid]"), root, "confirmed");
  enhanceHomePresenceFilters(cards.presenceCard);
}

function enhanceHomeClassCards() {
  if (currentPath() !== "/") return;

  document.querySelectorAll<HTMLElement>("[data-home-about-stats] [data-class-group]").forEach(card => {
    const group = card.getAttribute("data-class-group")?.trim().toUpperCase() ?? "";
    if (!/^[ABCD]$/.test(group) || card.hasAttribute(HOME_CLASS_CARD_ATTRIBUTE)) return;

    card.setAttribute(HOME_CLASS_CARD_ATTRIBUTE, "true");
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Ver ex-alunos da Turma ${group}`);
    card.style.cursor = "pointer";
    card.style.transition = "transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease";

    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 8px 22px rgba(13, 26, 15, 0.10)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.boxShadow = "";
    });
    card.addEventListener("click", () => openClassDirectory(group));
    card.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openClassDirectory(group);
    });
  });
}

function enhanceExAlumniPage() {
  enhanceHomeClassCards();
  enhanceHomeAlumniOverview();

  const pageRoot = findExAlumniPageRoot();
  if (!pageRoot) return;

  enhanceExAlumniClaimButtons(pageRoot);
  enhanceExAlumniAllFilter(pageRoot);
  enhanceExAlumniEyebrow(pageRoot);
  applyRequestedClassFilter(pageRoot);
  applyRequestedAttendanceFilter(pageRoot);
  openRequestedPerson(pageRoot);
}

export function installExAlumniEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(enhanceExAlumniPage);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", enhanceExAlumniPage);
    window.addEventListener("pushstate", enhanceExAlumniPage as EventListener);
    enhanceExAlumniPage();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
