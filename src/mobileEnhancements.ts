const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ENHANCER_ATTRIBUTE = "data-mobile-account-actions";
const HERO_SCROLL_ATTRIBUTE = "data-mobile-hero-scroll";
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
  updateMobileHeroScrollTrigger();
  if (!window.matchMedia(MOBILE_QUERY).matches) return;

  const menu = findPublicMobileMenu();
  if (menu) buildMobileAccountActions(menu);
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
