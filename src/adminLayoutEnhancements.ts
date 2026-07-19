const ADMIN_DESKTOP_QUERY = "(min-width: 1024px)";
const COMPACT_NAV_ATTRIBUTE = "data-admin-secondary-nav-compact";
const REJECTED_ACTION_ATTRIBUTE = "data-admin-rejected-action-hidden";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function isAdminRoute() {
  return window.location.pathname.startsWith("/admin");
}

function getDirectButtons(container: HTMLElement) {
  return Array.from(container.children).filter(
    (element): element is HTMLButtonElement => element instanceof HTMLButtonElement,
  );
}

function findAdminSecondaryNavigation(): HTMLElement | null {
  const panelTitle = Array.from(document.querySelectorAll<HTMLParagraphElement>("main p"))
    .find(element => normalizeText(element.textContent) === "painel admin");

  let topHeader = panelTitle?.parentElement ?? null;
  while (topHeader && topHeader !== document.body) {
    if (topHeader.querySelector(":scope > nav")) break;
    topHeader = topHeader.parentElement;
  }

  const secondaryNavigation = topHeader?.nextElementSibling;
  if (!(secondaryNavigation instanceof HTMLElement)) return null;
  return getDirectButtons(secondaryNavigation).length >= 2 ? secondaryNavigation : null;
}

function resetCompactNavigation(container: HTMLElement) {
  container.style.removeProperty("flex-wrap");
  container.style.removeProperty("gap");
  container.style.removeProperty("padding-top");
  container.style.removeProperty("padding-bottom");
  container.style.removeProperty("padding-left");
  container.style.removeProperty("padding-right");
  container.removeAttribute(COMPACT_NAV_ATTRIBUTE);

  getDirectButtons(container).forEach(button => {
    button.style.removeProperty("gap");
    button.style.removeProperty("padding-top");
    button.style.removeProperty("padding-bottom");
    button.style.removeProperty("padding-left");
    button.style.removeProperty("padding-right");
    button.style.removeProperty("font-size");
    button.style.removeProperty("letter-spacing");
    button.style.removeProperty("line-height");
    button.style.removeProperty("white-space");

    const icon = button.querySelector<SVGElement>("svg");
    icon?.style.removeProperty("width");
    icon?.style.removeProperty("height");
  });
}

function compactAdminSecondaryNavigation() {
  const container = findAdminSecondaryNavigation();
  if (!container) return;

  if (!window.matchMedia(ADMIN_DESKTOP_QUERY).matches) {
    resetCompactNavigation(container);
    return;
  }

  container.setAttribute(COMPACT_NAV_ATTRIBUTE, "true");
  container.style.flexWrap = "nowrap";
  container.style.gap = "3px";
  container.style.paddingTop = "7px";
  container.style.paddingBottom = "7px";
  container.style.paddingLeft = "14px";
  container.style.paddingRight = "14px";

  getDirectButtons(container).forEach(button => {
    button.style.gap = "5px";
    button.style.paddingTop = "7px";
    button.style.paddingBottom = "7px";
    button.style.paddingLeft = "9px";
    button.style.paddingRight = "9px";
    button.style.fontSize = "10px";
    button.style.letterSpacing = "0.07em";
    button.style.lineHeight = "1.1";
    button.style.whiteSpace = "nowrap";

    const icon = button.querySelector<SVGElement>("svg");
    if (icon) {
      icon.style.width = "12px";
      icon.style.height = "12px";
    }
  });
}

function findPhotosAdminRoot(): HTMLElement | null {
  const automaticApprovalLabel = Array.from(document.querySelectorAll<HTMLElement>("label"))
    .find(element => normalizeText(element.textContent).includes("aprovar novas fotos automaticamente"));

  let current = automaticApprovalLabel?.parentElement ?? null;
  while (current && current !== document.body) {
    const labels = Array.from(current.querySelectorAll<HTMLButtonElement>("button"))
      .map(button => normalizeText(button.textContent));

    if (labels.includes("pendente") && labels.includes("aprovado") && labels.includes("rejeitado") && labels.includes("todos")) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function isFilterActive(button: HTMLButtonElement | undefined) {
  if (!button) return false;
  return button.getAttribute("aria-pressed") === "true"
    || button.getAttribute("data-state") === "active"
    || button.className.includes("bg-[#2d6a4f]");
}

function updateRejectedPhotoActions() {
  const root = findPhotosAdminRoot();
  if (!root) return;

  const rejectedTab = Array.from(root.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalizeText(button.textContent) === "rejeitado");
  const rejectedIsActive = isFilterActive(rejectedTab);

  root.querySelectorAll<HTMLButtonElement>(`button[${REJECTED_ACTION_ATTRIBUTE}]`).forEach(button => {
    if (!rejectedIsActive) {
      button.style.removeProperty("display");
      button.removeAttribute(REJECTED_ACTION_ATTRIBUTE);
    }
  });

  if (!rejectedIsActive) return;

  Array.from(root.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => {
      const hasXIcon = Boolean(button.querySelector("svg.lucide-x"));
      const isDangerButton = button.className.includes("bg-[#c0392b]");
      return hasXIcon && isDangerButton;
    })
    .forEach(button => {
      button.style.setProperty("display", "none", "important");
      button.setAttribute(REJECTED_ACTION_ATTRIBUTE, "true");
    });
}

let scheduled = false;

function runEnhancements() {
  if (!isAdminRoute()) return;
  compactAdminSecondaryNavigation();
  updateRejectedPhotoActions();
}

function scheduleEnhancements() {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    runEnhancements();
  });
}

export function installAdminLayoutEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleEnhancements);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", scheduleEnhancements, true);
    window.addEventListener("resize", scheduleEnhancements);
    window.addEventListener("popstate", scheduleEnhancements);
    window.addEventListener("pushstate", scheduleEnhancements);
    scheduleEnhancements();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
