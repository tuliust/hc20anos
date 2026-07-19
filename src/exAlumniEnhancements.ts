function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
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

function enhanceExAlumniPage() {
  const pageRoot = findExAlumniPageRoot();
  if (!pageRoot) return;

  enhanceExAlumniClaimButtons(pageRoot);
  enhanceExAlumniAllFilter(pageRoot);
  enhanceExAlumniEyebrow(pageRoot);
}

export function installExAlumniEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(enhanceExAlumniPage);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceExAlumniPage();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
