const ADMIN_DESKTOP_QUERY = "(min-width: 1024px)";
const COMPACT_NAV_ATTRIBUTE = "data-admin-secondary-nav-compact";
const REJECTED_ACTION_ATTRIBUTE = "data-admin-rejected-action-hidden";

const CONTENT_NAV_LABELS = new Set([
  "header",
  "home",
  "evento",
  "seções",
  "pós-festa",
  "labels",
  "timeline",
  "faq",
  "rodapé",
  "memórias",
  "enquetes",
  "fotos",
  "comentários",
]);

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

function findContentSecondaryNavigation(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("main div"));

  return candidates.find(container => {
    const buttons = getDirectButtons(container);
    if (buttons.length < 6) return false;

    const labels = buttons.map(button => normalizeText(button.textContent));
    const matchingLabels = labels.filter(label => CONTENT_NAV_LABELS.has(label));

    return matchingLabels.length >= 6
      && labels.includes("header")
      && labels.includes("fotos")
      && labels.includes("comentários");
  }) ?? null;
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

function compactContentSecondaryNavigation() {
  const container = findContentSecondaryNavigation();
  if (!container) return;

  if (!window.matchMedia(ADMIN_DESKTOP_QUERY).matches) {
    resetCompactNavigation(container);
    return;
  }

  container.setAttribute(COMPACT_NAV_ATTRIBUTE, "true");
  container.style.flexWrap = "nowrap";
  container.style.gap = "2px";
  container.style.paddingTop = "6px";
  container.style.paddingBottom = "6px";
  container.style.paddingLeft = "12px";
  container.style.paddingRight = "12px";

  getDirectButtons(container).forEach(button => {
    button.style.gap = "4px";
    button.style.paddingTop = "6px";
    button.style.paddingBottom = "6px";
    button.style.paddingLeft = "7px";
    button.style.paddingRight = "7px";
    button.style.fontSize = "9px";
    button.style.letterSpacing = "0.06em";
    button.style.lineHeight = "1";
    button.style.whiteSpace = "nowrap";

    const icon = button.querySelector<SVGElement>("svg");
    if (icon) {
      icon.style.width = "11px";
      icon.style.height = "11px";
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
  compactContentSecondaryNavigation();
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
