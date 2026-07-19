function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function findExAlumniPageRoot(): HTMLElement | null {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .find(element => normalizeText(element.textContent) === "ex-alunos");
  const headingSection = title?.closest<HTMLElement>("section");
  return headingSection?.parentElement instanceof HTMLElement ? headingSection.parentElement : null;
}

function enhanceExAlumniClaimButtons() {
  const pageRoot = findExAlumniPageRoot();
  if (!pageRoot) return;

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
  });
}

export function installExAlumniEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(enhanceExAlumniClaimButtons);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceExAlumniClaimButtons();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
