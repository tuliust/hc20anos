import { getApprovedPhotos } from "./lib/services";
import type { DbPhoto } from "./lib/database.types";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const MOBILE_QUERY = "(max-width: 767px)";
const HISTORY_ROUTES = new Set(["/nossa-historia", "/nossas-historias"]);
const INJECTED_PHOTO_ATTRIBUTE = "data-approved-photo-card";
const ORIGINAL_LABEL_ATTRIBUTE = "data-mobile-history-original-label";
const ACTIONS_ATTRIBUTE = "data-mobile-history-actions";
const YEAR_GRID_ATTRIBUTE = "data-mobile-history-year-grid";
const YEAR_BUTTON_ATTRIBUTE = "data-mobile-history-year";
const YEAR_VALUE_ATTRIBUTE = "data-mobile-history-year-value";
const YEAR_SELECTED_ATTRIBUTE = "data-mobile-history-year-selected";
const YEAR_ALL_ATTRIBUTE = "data-mobile-history-year-all";
const YEAR_CARD_FILTER_ATTRIBUTE = "data-mobile-history-year-card-filtered";
const PERSON_ALL_ATTRIBUTE = "data-mobile-history-person-all";
const PERSON_DROPDOWN_ATTRIBUTE = "data-mobile-history-person-dropdown";
const PERSON_ALL_OPTION_ATTRIBUTE = "data-mobile-history-person-all-option";

let approvedPhotosRequest: Promise<DbPhoto[]> | null = null;
let enhancementScheduled = false;
let selectedMobileYears = new Set<string>();

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isHistoryRoute() {
  return HISTORY_ROUTES.has(currentPath());
}

function isMobileViewport() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function replaceButtonLabel(button: HTMLButtonElement, label: string) {
  const textNode = Array.from(button.childNodes).find(
    node => node.nodeType === Node.TEXT_NODE && normalizeText(node.textContent),
  );

  if (textNode) {
    if (textNode.textContent !== label) textNode.textContent = label;
    return;
  }

  const textElement = Array.from(button.querySelectorAll<HTMLElement>("span"))
    .find(element => normalizeText(element.textContent));
  if (textElement && textElement.textContent !== label) textElement.textContent = label;
}

function setMobileButtonLabel(button: HTMLButtonElement, label: string) {
  if (!button.hasAttribute(ORIGINAL_LABEL_ATTRIBUTE)) {
    button.setAttribute(ORIGINAL_LABEL_ATTRIBUTE, String(button.textContent ?? "").replace(/\s+/g, " ").trim());
  }
  replaceButtonLabel(button, label);
}

function restoreResponsiveLabels() {
  document.querySelectorAll<HTMLButtonElement>(`button[${ORIGINAL_LABEL_ATTRIBUTE}]`).forEach(button => {
    const originalLabel = button.getAttribute(ORIGINAL_LABEL_ATTRIBUTE);
    if (originalLabel) replaceButtonLabel(button, originalLabel);
    button.removeAttribute(ORIGINAL_LABEL_ATTRIBUTE);
  });
}

function getApprovedPhotoList() {
  if (!approvedPhotosRequest) {
    approvedPhotosRequest = getApprovedPhotos(DEFAULT_EVENT_ID).catch(error => {
      approvedPhotosRequest = null;
      throw error;
    });
  }
  return approvedPhotosRequest;
}

function getPhotoSource(photo: DbPhoto) {
  return photo.thumbnail_url?.trim() || photo.image_url?.trim() || "";
}

function resolveSource(source: string) {
  try {
    return new URL(source, window.location.href).href;
  } catch {
    return source;
  }
}

function findPublicPhotoWallRoot() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .find(element => normalizeText(element.textContent) === "fotos da época");
  return title?.closest<HTMLElement>(".max-w-7xl") ?? null;
}

function findPhotoGallery(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>("div.grid"))
    .find(element => element.classList.contains("grid-cols-2") && element.classList.contains("md:grid-cols-3")) ?? null;
}

function getActiveYears(root: HTMLElement) {
  if (isMobileViewport()) return new Set(selectedMobileYears);

  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "todos os anos" || /^20\d{2}$/.test(normalizeText(button.textContent)));
  const active = buttons.find(button =>
    button.getAttribute("aria-pressed") === "true"
    || button.className.includes("bg-[#2d6a4f]")
    || button.className.includes("bg-[#c9a84c]"),
  );
  const label = normalizeText(active?.textContent);
  return /^20\d{2}$/.test(label) ? new Set([label]) : new Set<string>();
}

function createApprovedPhotoCard(photo: DbPhoto) {
  const imageSource = getPhotoSource(photo);
  const card = document.createElement("article");
  card.setAttribute(INJECTED_PHOTO_ATTRIBUTE, photo.id);
  card.className = "relative group overflow-hidden bg-[#1a2e1a] aspect-[4/3]";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "absolute inset-0 w-full h-full text-left";
  button.setAttribute("aria-label", `Abrir foto: ${photo.caption || "Foto antiga"}`);
  button.addEventListener("click", () => {
    if (photo.image_url) window.open(photo.image_url, "_blank", "noopener,noreferrer");
  });

  const image = document.createElement("img");
  image.src = imageSource;
  image.alt = photo.caption || "Foto antiga";
  image.loading = "lazy";
  image.className = "w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500";
  button.appendChild(image);

  const overlay = document.createElement("div");
  overlay.className = "absolute inset-0 bg-gradient-to-t from-[#080f08] via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4";

  const caption = document.createElement("p");
  caption.className = "text-[#f0ebe0] font-bold text-sm leading-tight";
  caption.textContent = photo.caption || "Foto antiga";
  overlay.appendChild(caption);

  if (photo.location_text) {
    const location = document.createElement("p");
    location.className = "text-[#7a9a7a] text-xs mt-1";
    location.textContent = photo.location_text;
    overlay.appendChild(location);
  }

  button.appendChild(overlay);
  card.appendChild(button);

  if (photo.year_approx) {
    const year = document.createElement("div");
    year.className = "absolute top-3 left-3 bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-1";
    year.textContent = String(photo.year_approx);
    card.appendChild(year);
  }

  return card;
}

function readPhotoCardYear(card: HTMLElement) {
  const yearElement = Array.from(card.children)
    .find((element): element is HTMLElement => element instanceof HTMLElement && /^20\d{2}$/.test(normalizeText(element.textContent)));
  return yearElement ? normalizeText(yearElement.textContent) : null;
}

function restoreMobilePhotoCardVisibility() {
  document.querySelectorAll<HTMLElement>(`[${YEAR_CARD_FILTER_ATTRIBUTE}]`).forEach(card => {
    card.style.removeProperty("display");
    card.removeAttribute(YEAR_CARD_FILTER_ATTRIBUTE);
  });
}

function applyMobileYearCardVisibility(root: HTMLElement) {
  const gallery = findPhotoGallery(root);
  if (!gallery) return;

  Array.from(gallery.children).forEach(element => {
    if (!(element instanceof HTMLElement)) return;
    const year = readPhotoCardYear(element);
    if (!year) return;

    const visible = selectedMobileYears.size === 0 || selectedMobileYears.has(year);
    if (visible) element.style.removeProperty("display");
    else element.style.setProperty("display", "none", "important");
    element.setAttribute(YEAR_CARD_FILTER_ATTRIBUTE, "true");
  });
}

function restoreMobileHistoryControls() {
  restoreResponsiveLabels();
  document.querySelectorAll<HTMLElement>(`[${ACTIONS_ATTRIBUTE}]`).forEach(element => element.removeAttribute(ACTIONS_ATTRIBUTE));
  document.querySelectorAll<HTMLElement>(`[${YEAR_GRID_ATTRIBUTE}]`).forEach(element => element.removeAttribute(YEAR_GRID_ATTRIBUTE));
  document.querySelectorAll<HTMLButtonElement>(`button[${YEAR_BUTTON_ATTRIBUTE}]`).forEach(button => {
    button.removeAttribute(YEAR_BUTTON_ATTRIBUTE);
    button.removeAttribute(YEAR_VALUE_ATTRIBUTE);
    button.removeAttribute(YEAR_SELECTED_ATTRIBUTE);
  });
  document.querySelectorAll<HTMLButtonElement>(`button[${YEAR_ALL_ATTRIBUTE}]`).forEach(button => {
    button.style.removeProperty("display");
    button.removeAttribute("aria-hidden");
    button.removeAttribute("tabindex");
    button.removeAttribute(YEAR_ALL_ATTRIBUTE);
  });
  document.querySelectorAll<HTMLButtonElement>(`button[${PERSON_ALL_ATTRIBUTE}]`).forEach(button => {
    button.style.removeProperty("display");
    button.removeAttribute("aria-hidden");
    button.removeAttribute("tabindex");
    button.removeAttribute(PERSON_ALL_ATTRIBUTE);
  });
  document.querySelectorAll<HTMLElement>(`[${PERSON_DROPDOWN_ATTRIBUTE}]`).forEach(element => element.removeAttribute(PERSON_DROPDOWN_ATTRIBUTE));
  document.querySelectorAll<HTMLElement>(`[${PERSON_ALL_OPTION_ATTRIBUTE}]`).forEach(element => element.remove());
  restoreMobilePhotoCardVisibility();
}

function enhanceMobileHistoryActions(root: HTMLElement) {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
  const memoryButton = buttons.find(button => ["caixa de memórias", "memórias"].includes(normalizeText(button.textContent)));
  const uploadButton = buttons.find(button => ["enviar foto antiga", "enviar foto"].includes(normalizeText(button.textContent)));
  const container = memoryButton?.parentElement === uploadButton?.parentElement ? memoryButton?.parentElement : null;
  if (!memoryButton || !uploadButton || !container) return;

  container.setAttribute(ACTIONS_ATTRIBUTE, "true");
  setMobileButtonLabel(memoryButton, "Memórias");
  setMobileButtonLabel(uploadButton, "Enviar foto");
}

function findYearFilter(root: HTMLElement) {
  const label = Array.from(root.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent) === "filtrar por ano");
  const section = label?.parentElement;
  const grid = Array.from(section?.children ?? [])
    .find((element): element is HTMLElement => element instanceof HTMLElement && element.querySelector("button"));
  return grid ?? null;
}

function enhanceMobileYearFilters(root: HTMLElement) {
  const grid = findYearFilter(root);
  if (!grid) return;

  const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>(":scope > button"));
  const allButton = buttons.find(button => normalizeText(button.textContent) === "todos os anos");
  const yearButtons = buttons.filter(button => /^20\d{2}$/.test(normalizeText(button.textContent)));
  const availableYears = new Set(yearButtons.map(button => normalizeText(button.textContent)));
  selectedMobileYears = new Set(Array.from(selectedMobileYears).filter(year => availableYears.has(year)));

  grid.setAttribute(YEAR_GRID_ATTRIBUTE, "true");

  if (allButton) {
    allButton.setAttribute(YEAR_ALL_ATTRIBUTE, "true");
    allButton.setAttribute("aria-hidden", "true");
    allButton.setAttribute("tabindex", "-1");
    allButton.style.setProperty("display", "none", "important");
  }

  yearButtons.forEach(button => {
    const year = normalizeText(button.textContent);
    const selected = selectedMobileYears.has(year);
    button.setAttribute(YEAR_BUTTON_ATTRIBUTE, "true");
    button.setAttribute(YEAR_VALUE_ATTRIBUTE, year);
    button.setAttribute(YEAR_SELECTED_ATTRIBUTE, String(selected));
    button.setAttribute("aria-pressed", String(selected));
  });

  applyMobileYearCardVisibility(root);
}

function findPersonFilterSection(root: HTMLElement) {
  const label = Array.from(root.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent) === "filtrar por pessoa marcada");
  return label?.parentElement ?? null;
}

function createAllPeopleOption() {
  const option = document.createElement("button");
  option.type = "button";
  option.setAttribute(PERSON_ALL_OPTION_ATTRIBUTE, "true");

  const label = document.createElement("span");
  label.className = "text-xs font-mono uppercase tracking-wider";
  label.textContent = "Todas as pessoas";

  const check = document.createElement("span");
  check.setAttribute("data-mobile-history-person-all-check", "true");
  check.className = "w-4 h-4 border flex items-center justify-center";

  option.append(label, check);
  option.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const root = findPublicPhotoWallRoot();
    const section = root ? findPersonFilterSection(root) : null;
    const allButton = Array.from(section?.querySelectorAll<HTMLButtonElement>("button") ?? [])
      .find(button => normalizeText(button.textContent) === "todas as pessoas" && !button.hasAttribute(PERSON_ALL_OPTION_ATTRIBUTE));
    allButton?.click();
  });

  return option;
}

function enhanceMobilePersonFilter(root: HTMLElement) {
  const section = findPersonFilterSection(root);
  if (!section) return;

  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>("button"));
  const allButton = buttons.find(button => normalizeText(button.textContent) === "todas as pessoas" && !button.hasAttribute(PERSON_ALL_OPTION_ATTRIBUTE));
  const trigger = buttons.find(button => {
    const label = normalizeText(button.textContent);
    return label === "selecionar pessoas" || label.includes("pessoa selecionada") || label.includes("pessoas selecionadas");
  });
  const dropdownWrapper = trigger?.parentElement;

  if (allButton) {
    allButton.setAttribute(PERSON_ALL_ATTRIBUTE, "true");
    allButton.setAttribute("aria-hidden", "true");
    allButton.setAttribute("tabindex", "-1");
    allButton.style.setProperty("display", "none", "important");
  }

  if (dropdownWrapper) dropdownWrapper.setAttribute(PERSON_DROPDOWN_ATTRIBUTE, "true");

  const dropdown = dropdownWrapper
    ? Array.from(dropdownWrapper.children).find((element): element is HTMLElement => (
        element instanceof HTMLElement && element.classList.contains("absolute")
      ))
    : null;
  if (!dropdown) return;

  let option = dropdown.querySelector<HTMLButtonElement>(`button[${PERSON_ALL_OPTION_ATTRIBUTE}]`);
  if (!option) {
    option = createAllPeopleOption();
    dropdown.prepend(option);
  }

  const noPeopleSelected = normalizeText(trigger?.textContent) === "selecionar pessoas";
  option.className = `w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-[#2d6a4f]/10 transition-colors ${noPeopleSelected ? "bg-[#1a2e1a] text-[#f0ebe0]" : "text-[#7a9a7a] hover:bg-[#141f14] hover:text-[#f0ebe0]"}`;
  const check = option.querySelector<HTMLElement>('[data-mobile-history-person-all-check="true"]');
  if (check) {
    check.className = `w-4 h-4 border flex items-center justify-center ${noPeopleSelected ? "bg-[#c9a84c] border-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/50"}`;
    const nextCheck = noPeopleSelected ? "✓" : "";
    if (check.textContent !== nextCheck) check.textContent = nextCheck;
  }
}

function enhanceMobilePublicHistory() {
  if (!isHistoryRoute() || !isMobileViewport()) {
    if (!isHistoryRoute()) selectedMobileYears.clear();
    restoreMobileHistoryControls();
    return;
  }

  const root = findPublicPhotoWallRoot();
  if (!root) return;
  enhanceMobileHistoryActions(root);
  enhanceMobileYearFilters(root);
  enhanceMobilePersonFilter(root);
}

async function enhancePublicPhotoWall() {
  if (!isHistoryRoute()) return;

  const root = findPublicPhotoWallRoot();
  if (!root) return;

  const gallery = findPhotoGallery(root);
  if (!gallery) return;

  let approvedPhotos: DbPhoto[];
  try {
    approvedPhotos = await getApprovedPhotoList();
  } catch {
    return;
  }

  const countLabel = `${approvedPhotos.length} fotos selecionadas pela organização`;
  const counter = Array.from(root.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent).includes("fotos selecionadas pela organização"));
  if (counter && counter.textContent !== countLabel) counter.textContent = countLabel;

  const activeYears = getActiveYears(root);
  const visiblePhotos = approvedPhotos.filter(photo => activeYears.size === 0 || activeYears.has(String(photo.year_approx ?? "")));

  const reactSources = new Set(
    Array.from(gallery.children)
      .filter(element => element instanceof HTMLElement && !element.hasAttribute(INJECTED_PHOTO_ATTRIBUTE))
      .flatMap(element => Array.from(element.querySelectorAll<HTMLImageElement>("img")))
      .flatMap(image => [image.getAttribute("src") ?? "", image.src])
      .filter(Boolean),
  );

  const photosToInject = visiblePhotos.filter(photo => {
    const source = getPhotoSource(photo);
    return source && !reactSources.has(source) && !reactSources.has(resolveSource(source));
  });
  const desiredIds = new Set(photosToInject.map(photo => photo.id));

  gallery.querySelectorAll<HTMLElement>(`[${INJECTED_PHOTO_ATTRIBUTE}]`).forEach(element => {
    const id = element.getAttribute(INJECTED_PHOTO_ATTRIBUTE) ?? "";
    if (!desiredIds.has(id)) element.remove();
  });

  const injectedIds = new Set(
    Array.from(gallery.querySelectorAll<HTMLElement>(`[${INJECTED_PHOTO_ATTRIBUTE}]`))
      .map(element => element.getAttribute(INJECTED_PHOTO_ATTRIBUTE) ?? "")
      .filter(Boolean),
  );

  photosToInject
    .filter(photo => !injectedIds.has(photo.id))
    .forEach(photo => gallery.appendChild(createApprovedPhotoCard(photo)));

  if (isMobileViewport()) applyMobileYearCardVisibility(root);
}

function enhancePhotoUploadModal() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2, h3"))
    .find(element => normalizeText(element.textContent) === "enviar foto antiga");
  const modal = title?.closest<HTMLElement>("[data-modal-root]") ?? title?.closest<HTMLElement>(".fixed");
  if (!modal) return;

  const moderationNote = Array.from(modal.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent).startsWith("todas as fotos passam por moderação antes de aparecerem no mural"));
  const noteContainer = moderationNote?.parentElement;
  if (noteContainer && noteContainer.style.display !== "none") noteContainer.style.display = "none";

  Array.from(modal.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "enviar para moderação")
    .forEach(button => replaceButtonLabel(button, "Enviar"));
}

function enhanceAdminApprovedPhotos() {
  const searchParams = new URLSearchParams(window.location.search);
  const isPhotosArea = window.location.pathname.startsWith("/admin")
    && (searchParams.get("tab") === "photos" || normalizeText(document.body.textContent).includes("aprovar novas fotos automaticamente"));
  if (!isPhotosArea) return;

  const approvedTab = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalizeText(button.textContent) === "aprovado");
  const approvedIsActive = Boolean(approvedTab && (
    approvedTab.getAttribute("aria-pressed") === "true"
    || approvedTab.getAttribute("data-state") === "active"
    || approvedTab.className.includes("bg-[#2d6a4f]")
  ));

  Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-admin-approved-hidden="true"]'))
    .forEach(button => {
      if (!approvedIsActive) {
        button.style.removeProperty("display");
        button.removeAttribute("data-admin-approved-hidden");
      }
    });

  if (!approvedIsActive) return;

  Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "aprovar")
    .forEach(button => {
      if (button.style.display !== "none") button.style.display = "none";
      button.setAttribute("data-admin-approved-hidden", "true");
    });
}

function enhanceMemoriesForm() {
  if ((window.location.pathname.replace(/\/+$/, "") || "/") !== "/nossa-historia/memorias") return;

  const sectionLabel = Array.from(document.querySelectorAll<HTMLElement>("p"))
    .find(element => normalizeText(element.textContent) === "enviar memória");
  const formCard = sectionLabel?.parentElement;
  if (!formCard) return;

  const anonymousText = Array.from(formCard.querySelectorAll<HTMLElement>("span"))
    .find(element => normalizeText(element.textContent) === "enviar sem mostrar meu nome");
  const anonymousControl = anonymousText?.closest<HTMLElement>("label");
  if (anonymousControl) {
    const toggle = anonymousControl.querySelector<HTMLButtonElement>("button");
    if (toggle?.className.includes("bg-[#2d6a4f]")) toggle.click();
    if (anonymousControl.style.display !== "none") anonymousControl.style.display = "none";
  }

  Array.from(formCard.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "enviar para moderação")
    .forEach(button => replaceButtonLabel(button, "Enviar"));
}

function runEnhancements() {
  enhanceMobilePublicHistory();
  enhancePhotoUploadModal();
  enhanceAdminApprovedPhotos();
  enhanceMemoriesForm();
  void enhancePublicPhotoWall();
}

function scheduleEnhancements() {
  if (enhancementScheduled) return;
  enhancementScheduled = true;
  window.requestAnimationFrame(() => {
    enhancementScheduled = false;
    runEnhancements();
  });
}

function handleMobileHistoryClick(event: MouseEvent) {
  if (!isHistoryRoute() || !isMobileViewport()) return;
  const target = event.target;
  if (!(target instanceof Element)) return;

  const yearButton = target.closest<HTMLButtonElement>(`button[${YEAR_BUTTON_ATTRIBUTE}="true"]`);
  if (!yearButton) return;

  const year = yearButton.getAttribute(YEAR_VALUE_ATTRIBUTE);
  if (!year) return;

  event.preventDefault();
  event.stopPropagation();
  if (selectedMobileYears.has(year)) selectedMobileYears.delete(year);
  else selectedMobileYears.add(year);
  scheduleEnhancements();
}

export function installHistoryContentEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleEnhancements);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleMobileHistoryClick, true);
    document.addEventListener("click", scheduleEnhancements, true);
    window.addEventListener("resize", scheduleEnhancements);
    window.addEventListener("popstate", scheduleEnhancements);
    window.addEventListener("pushstate", scheduleEnhancements);
    scheduleEnhancements();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
