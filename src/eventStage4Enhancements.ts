const BAND_COPY = "A definir, dependendo do número de participantes";

let frameId: number | null = null;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findSectionByHeading(fragment: string) {
  const normalizedFragment = normalizeText(fragment);
  return Array.from(document.querySelectorAll<HTMLElement>("main section"))
    .find(section => normalizeText(section.querySelector("h2")?.textContent).includes(normalizedFragment)) ?? null;
}

function findCardTitle(card: HTMLElement) {
  return Array.from(card.querySelectorAll<HTMLElement>("p,h3"))
    .find(item => String(item.className).includes("font-semibold")) ?? null;
}

function ensureDescription(card: HTMLElement, copy: string) {
  const title = findCardTitle(card);
  if (!title) return;

  const description = Array.from(card.querySelectorAll<HTMLParagraphElement>("p"))
    .find(item => item !== title && String(item.className).includes("text-sm"));

  if (description) {
    if (description.textContent !== copy) description.textContent = copy;
    return;
  }

  const paragraph = document.createElement("p");
  paragraph.className = "text-[#7a9a7a] text-sm leading-relaxed";
  paragraph.textContent = copy;
  title.insertAdjacentElement("afterend", paragraph);
}

function applyProgramAdjustments() {
  const section = findSectionByHeading("Horários e atrações");
  if (!section) return;

  section.dataset.eventStage4Program = "true";

  const programGrid = Array.from(section.querySelectorAll<HTMLElement>("div"))
    .find(item => String(item.className).includes("lg:grid-cols-[0.9fr_1.1fr]"));
  if (!programGrid) return;

  const scheduleColumn = programGrid.children.item(0);
  const attractionsColumn = programGrid.children.item(1);

  [scheduleColumn, attractionsColumn].forEach(column => {
    if (!(column instanceof HTMLElement)) return;

    Array.from(column.children).forEach(child => {
      if (!(child instanceof HTMLElement)) return;
      const title = findCardTitle(child);
      const normalizedTitle = normalizeText(title?.textContent);

      if (normalizedTitle === "dj") {
        child.remove();
        return;
      }

      if (normalizedTitle === "banda") {
        ensureDescription(child, BAND_COPY);
      }
    });
  });
}

function findStructureSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("main section"))
    .find(section => {
      const heading = normalizeText(section.querySelector("h2")?.textContent);
      if (heading.includes("bar, comidas, banheiros e seguranca") || heading === "bar e comidas") return true;

      return Array.from(section.querySelectorAll<HTMLElement>("p"))
        .some(item => normalizeText(item.textContent) === "estrutura");
    }) ?? null;
}

function applyServiceAdjustments() {
  const section = findStructureSection();
  if (!section) return;

  section.dataset.eventServiceSection = "true";

  const heading = section.querySelector<HTMLElement>("h2");
  if (heading && heading.textContent !== "Bar e comidas") {
    heading.textContent = "Bar e comidas";
  }

  const titledCards = Array.from(section.querySelectorAll<HTMLElement>("p,h3"))
    .filter(item => String(item.className).includes("font-semibold"));

  titledCards.forEach(title => {
    const normalizedTitle = normalizeText(title.textContent);
    const card = title.parentElement;
    if (!(card instanceof HTMLElement)) return;

    if (normalizedTitle === "banheiros" || normalizedTitle === "seguranca") {
      card.remove();
      return;
    }

    if (normalizedTitle === "bar e comidas") {
      card.dataset.eventServiceCard = "true";
      const grid = card.parentElement;
      if (grid instanceof HTMLElement) grid.dataset.eventServiceGrid = "true";
    }
  });
}

function applyStage4EventAdjustments() {
  if (currentPath() !== "/evento") return;
  applyProgramAdjustments();
  applyServiceAdjustments();
}

function scheduleApply() {
  if (frameId !== null) return;
  frameId = window.requestAnimationFrame(() => {
    frameId = null;
    applyStage4EventAdjustments();
  });
}

export function installEventStage4Enhancements() {
  if ((window as any).__hcEventStage4EnhancementsInstalled) return;
  (window as any).__hcEventStage4EnhancementsInstalled = true;

  scheduleApply();

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) startObserver();
  else window.addEventListener("DOMContentLoaded", startObserver, { once: true });

  window.addEventListener("popstate", scheduleApply);
}
