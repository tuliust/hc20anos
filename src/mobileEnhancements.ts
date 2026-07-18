const MOBILE_QUERY = "(max-width: 767px)";
const ENHANCER_ATTRIBUTE = "data-mobile-account-actions";

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

function enhanceMobileUi() {
  if (!window.matchMedia(MOBILE_QUERY).matches) return;
  const menu = findPublicMobileMenu();
  if (menu) buildMobileAccountActions(menu);
}

export function installMobileEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(enhanceMobileUi);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceMobileUi();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
