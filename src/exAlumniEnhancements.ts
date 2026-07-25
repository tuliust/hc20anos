const HOME_CLASS_CARD_ATTRIBUTE = "data-home-class-card-enhanced";
const CLASS_FILTER_APPLIED_ATTRIBUTE = "data-ex-alumni-class-filter-applied";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
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

function openClassDirectory(group: string) {
  const url = new URL("/ex-alunos", window.location.origin);
  url.searchParams.set("turma", group);
  window.location.assign(`${url.pathname}${url.search}`);
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

  const pageRoot = findExAlumniPageRoot();
  if (!pageRoot) return;

  enhanceExAlumniClaimButtons(pageRoot);
  enhanceExAlumniAllFilter(pageRoot);
  enhanceExAlumniEyebrow(pageRoot);
  applyRequestedClassFilter(pageRoot);
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
