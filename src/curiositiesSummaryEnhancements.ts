const REMOVED_LABELS = new Set([
  "cadastrados",
  "pre-confirmados",
  "confirmados",
  "com filhos",
]);

const RENAMED_LABELS: Record<string, string> = {
  "pre-cadastrados": "Ex-alunos 2006",
  "cidades": "Cidades onde estão hoje",
  "filhos declarados": "Total de filhos dos ex-alunos",
};

let scheduled = false;

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isCuriositiesPage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/curiosidades" || path === "/curiosities") return true;

  return Array.from(document.querySelectorAll<HTMLElement>("h1,h2"))
    .some(element => normalizeText(element.textContent).includes("raio-x da turma 2006"));
}

function cardLabelElement(card: HTMLElement) {
  return Array.from(card.querySelectorAll<HTMLElement>("p"))
    .find(element => {
      const text = normalizeText(element.textContent);
      return REMOVED_LABELS.has(text)
        || Object.prototype.hasOwnProperty.call(RENAMED_LABELS, text)
        || text === "areas profissionais"
        || text === "ex-alunos 2006"
        || text === "cidades onde estao hoje"
        || text === "total de filhos dos ex-alunos";
    }) ?? null;
}

function findSummaryGrid() {
  const candidateLabel = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .find(element => {
      const text = normalizeText(element.textContent);
      return text === "pre-cadastrados"
        || text === "ex-alunos 2006"
        || text === "cidades"
        || text === "cidades onde estao hoje";
    });

  const card = candidateLabel?.parentElement?.parentElement;
  const grid = card?.parentElement;
  if (!(grid instanceof HTMLElement)) return null;

  const directCards = Array.from(grid.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement);
  const recognizedCards = directCards.filter(child => cardLabelElement(child));

  return recognizedCards.length >= 4 ? grid : null;
}

function applySummaryChanges() {
  if (!isCuriositiesPage()) return;

  const grid = findSummaryGrid();
  if (!grid) return;

  const cards = Array.from(grid.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement);

  cards.forEach(card => {
    const labelElement = cardLabelElement(card);
    if (!labelElement) return;

    const normalizedLabel = normalizeText(labelElement.textContent);

    if (REMOVED_LABELS.has(normalizedLabel)) {
      card.remove();
      return;
    }

    const renamedLabel = RENAMED_LABELS[normalizedLabel];
    if (renamedLabel) labelElement.textContent = renamedLabel;

    if (normalizedLabel === "cidades" || normalizedLabel === "cidades onde estao hoje") {
      Array.from(card.querySelectorAll<HTMLElement>("p"))
        .find(element => normalizeText(element.textContent) === "com exibicao autorizada")
        ?.remove();
    }
  });

  grid.dataset.curiositiesSummaryAdjusted = "true";
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applySummaryChanges();
  });
}

export function installCuriositiesSummaryEnhancements() {
  if ((window as any).__hcCuriositiesSummaryEnhancementsInstalled) return;
  (window as any).__hcCuriositiesSummaryEnhancementsInstalled = true;

  scheduleApply();

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  if (document.body) startObserver();
  else window.addEventListener("DOMContentLoaded", startObserver, { once: true });

  window.addEventListener("popstate", scheduleApply);
}