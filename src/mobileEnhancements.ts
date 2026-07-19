const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ENHANCER_ATTRIBUTE = "data-mobile-account-actions";
const HERO_SCROLL_ATTRIBUTE = "data-mobile-hero-scroll";
const MOBILE_MENU_ATTRIBUTE = "data-mobile-public-menu";
const MOBILE_NAV_GRID_ATTRIBUTE = "data-mobile-nav-grid";
const MOBILE_NAV_CARD_ATTRIBUTE = "data-mobile-nav-card";
const MOBILE_HEADER_OFFSET = 64;

function normalizeLabel(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function findPublicMobileMenu(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>("div.fixed.inset-0.z-40"))
    .find(element => element.querySelector("nav") || element.textContent?.includes("Minha área")) ?? null;
}

function findDesktopAccountTrigger(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('.public-header-desktop-action button[aria-label="Abrir menu da conta"]');
}

function getDesktopAccountActions(): HTMLButtonElement[] {
  const trigger = findDesktopAccountTrigger();
  if (!trigger) return [];

  const wrapper = trigger.closest<HTMLElement>(".public-header-desktop-action");
  if (!wrapper) return [];

  let actions = Array.from(wrapper.querySelectorAll<HTMLButtonElement>("div.pt-3.flex.flex-col > button"));
  if (actions.length === 0) {
    trigger.click();
    actions = Array.from(wrapper.querySelectorAll<HTMLButtonElement>("div.pt-3.flex.flex-col > button"));
  }
  return actions;
}

function closeMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-public-header-menu]");
  if (toggle?.getAttribute("aria-label") === "Fechar menu") toggle.click();
}

function executeDesktopAccountAction(label: string) {
  const trigger = findDesktopAccountTrigger();
  if (!trigger) return;

  let action = getDesktopAccountActions().find(button => normalizeLabel(button.textContent) === normalizeLabel(label));
  if (!action) {
    trigger.click();
    action = getDesktopAccountActions().find(button => normalizeLabel(button.textContent) === normalizeLabel(label));
  }
  if (!action) return;

  action.click();
  closeMobileMenu();
}

function buildMobileAccountActions(menu: HTMLElement) {
  if (menu.querySelector(`[${ENHANCER_ATTRIBUTE}]`)) return;

  const authArea = Array.from(menu.querySelectorAll<HTMLElement>("div"))
    .find(element => element.classList.contains("mt-auto") && normalizeLabel(element.textContent).includes("minha área"));
  if (!authArea) return;

  const desktopActions = getDesktopAccountActions();
  if (desktopActions.length === 0) return;

  authArea.setAttribute("data-mobile-original-auth-actions", "true");

  const container = document.createElement("div");
  container.setAttribute(ENHANCER_ATTRIBUTE, "true");
  container.className = "mobile-account-actions-grid";

  desktopActions.forEach(desktopButton => {
    const label = String(desktopButton.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!label) return;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = `mobile-account-action ${normalizeLabel(label) === "sair" ? "mobile-account-action-danger" : ""}`;
    button.addEventListener("click", () => executeDesktopAccountAction(label));
    container.appendChild(button);
  });

  authArea.appendChild(container);

  const trigger = findDesktopAccountTrigger();
  const wrapper = trigger?.closest<HTMLElement>(".public-header-desktop-action");
  const dropdown = wrapper?.querySelector<HTMLElement>("div.absolute.right-0.top-full");
  if (dropdown && trigger) trigger.click();
}

function createMobileNavIcon(label: string, index: number) {
  const normalized = normalizeLabel(label);
  const iconKey = normalized.includes("evento")
    ? "calendar"
    : normalized.includes("ex-aluno")
      ? "users"
      : normalized.includes("hist")
        ? "history"
        : normalized.includes("curios")
          ? "star"
          : normalized.includes("festa") || normalized.includes("arquivo")
            ? "clock"
            : normalized.includes("home") || normalized.includes("início") || normalized.includes("inicio")
              ? "home"
              : ["home", "calendar", "users", "history", "star", "clock"][index] ?? "home";

  const paths: Record<string, string> = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    history: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.7");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("mobile-nav-card-icon");
  svg.innerHTML = paths[iconKey];
  return svg;
}

function buildMobileNavigationCards(menu: HTMLElement) {
  menu.setAttribute(MOBILE_MENU_ATTRIBUTE, "true");

  const navContainer = Array.from(menu.children)
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .find(element => Array.from(element.children).filter(child => child instanceof HTMLButtonElement).length >= 4);
  if (!navContainer) return;

  navContainer.setAttribute(MOBILE_NAV_GRID_ATTRIBUTE, "true");
  const buttons = Array.from(navContainer.children).filter((element): element is HTMLButtonElement => element instanceof HTMLButtonElement);

  buttons.forEach((button, index) => {
    if (button.hasAttribute(MOBILE_NAV_CARD_ATTRIBUTE)) return;
    const label = String(button.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!label) return;

    button.setAttribute(MOBILE_NAV_CARD_ATTRIBUTE, "true");
    button.textContent = "";
    button.appendChild(createMobileNavIcon(label, index));

    const text = document.createElement("span");
    text.className = "mobile-nav-card-label";
    text.textContent = label;
    button.appendChild(text);
  });
}

function enhanceMobileHeroTypography() {
  const hero = document.querySelector<HTMLElement>('[data-home-section="hero"]');
  const title = hero?.querySelector<HTMLElement>("h1");
  const container = title?.parentElement;
  if (!hero || !title || !container) return;

  title.setAttribute("data-mobile-hero-title", "true");

  const eyebrow = title.previousElementSibling;
  if (eyebrow instanceof HTMLElement && eyebrow.tagName === "P") eyebrow.setAttribute("data-mobile-hero-eyebrow", "true");

  const tagline = title.nextElementSibling;
  if (tagline instanceof HTMLElement && tagline.tagName === "P") tagline.setAttribute("data-mobile-hero-tagline", "true");

  const eventLine = Array.from(container.children).find(element =>
    element instanceof HTMLElement
    && element.tagName === "P"
    && element !== eyebrow
    && element !== tagline
    && element.classList.contains("font-mono")
    && element.classList.contains("uppercase"));
  if (!(eventLine instanceof HTMLElement)) return;

  eventLine.setAttribute("data-mobile-hero-event-line", "true");
  if (eventLine.hasAttribute("data-mobile-hero-event-prepared")) return;
  eventLine.setAttribute("data-mobile-hero-event-prepared", "true");

  const originalText = String(eventLine.textContent ?? "").replace(/\s+/g, " ").trim();
  const separatorMatch = originalText.match(/^(.+?\b20\d{2}\b)(.*)$/);
  if (!separatorMatch) return;

  const dateText = separatorMatch[1].trim();
  const remainder = separatorMatch[2].trim();
  eventLine.textContent = "";

  const date = document.createElement("span");
  date.setAttribute("data-mobile-hero-event-date", "true");
  date.textContent = dateText;
  eventLine.appendChild(date);

  if (remainder) {
    eventLine.appendChild(document.createTextNode(" "));
    const rest = document.createElement("span");
    rest.setAttribute("data-mobile-hero-event-rest", "true");
    rest.textContent = remainder;
    eventLine.appendChild(rest);
  }
}

function findMobileHeroScrollTrigger(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-home-section="hero"] .animate-bounce');
}

function updateMobileHeroScrollTrigger() {
  const trigger = findMobileHeroScrollTrigger();
  if (!trigger) return;

  if (window.matchMedia(MOBILE_QUERY).matches) {
    trigger.setAttribute(HERO_SCROLL_ATTRIBUTE, "true");
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", "Ir para a próxima seção");
    trigger.style.cursor = "pointer";
    return;
  }

  if (!trigger.hasAttribute(HERO_SCROLL_ATTRIBUTE)) return;
  trigger.removeAttribute(HERO_SCROLL_ATTRIBUTE);
  trigger.removeAttribute("role");
  trigger.removeAttribute("tabindex");
  trigger.removeAttribute("aria-label");
  trigger.style.removeProperty("cursor");
}

function scrollToSectionAfterHero(trigger: Element) {
  if (!window.matchMedia(MOBILE_QUERY).matches) return;

  const hero = trigger.closest<HTMLElement>('[data-home-section="hero"]');
  const explicitTarget = document.querySelector<HTMLElement>('[data-home-section="about"]');
  const adjacentTarget = hero?.nextElementSibling instanceof HTMLElement ? hero.nextElementSibling : null;
  const target = explicitTarget ?? adjacentTarget;
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - MOBILE_HEADER_OFFSET;
  const behavior: ScrollBehavior = window.matchMedia(REDUCED_MOTION_QUERY).matches ? "auto" : "smooth";
  window.scrollTo({ top: Math.max(0, top), behavior });
}

function handleMobileHeroClick(event: MouseEvent) {
  if (!window.matchMedia(MOBILE_QUERY).matches) return;
  const target = event.target;
  if (!(target instanceof Element)) return;

  const trigger = target.closest(`[${HERO_SCROLL_ATTRIBUTE}]`);
  if (!trigger) return;

  event.preventDefault();
  scrollToSectionAfterHero(trigger);
}

function handleMobileHeroKeyDown(event: KeyboardEvent) {
  if (!window.matchMedia(MOBILE_QUERY).matches || (event.key !== "Enter" && event.key !== " ")) return;
  const target = event.target;
  if (!(target instanceof Element)) return;

  const trigger = target.closest(`[${HERO_SCROLL_ATTRIBUTE}]`);
  if (!trigger) return;

  event.preventDefault();
  scrollToSectionAfterHero(trigger);
}

function enhanceMobileUi() {
  enhanceMobileHeroTypography();
  updateMobileHeroScrollTrigger();
  if (!window.matchMedia(MOBILE_QUERY).matches) return;

  const menu = findPublicMobileMenu();
  if (menu) {
    buildMobileNavigationCards(menu);
    buildMobileAccountActions(menu);
  }
}

export function installMobileEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(enhanceMobileUi);
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleMobileHeroClick);
    document.addEventListener("keydown", handleMobileHeroKeyDown);
    mobileMedia.addEventListener("change", enhanceMobileUi);
    enhanceMobileUi();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
