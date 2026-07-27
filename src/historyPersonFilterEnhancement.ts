import { getApprovedPhotos } from "./lib/services";
import type { DbPhoto } from "./lib/photo.types";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const HISTORY_ROUTES = new Set(["/nossa-historia", "/nossas-historias"]);
const STYLE_ID = "hc-history-person-filter-style";
const CUSTOM_OPTIONS_ATTRIBUTE = "data-history-person-options";
const NATIVE_HIDDEN_ATTRIBUTE = "data-history-person-native-hidden";
const PERSON_HIDDEN_ATTRIBUTE = "data-history-person-hidden";
const PHOTO_TAGS_ATTRIBUTE = "data-history-photo-tags";
const ALL_BUTTON_BOUND_ATTRIBUTE = "data-history-all-people-bound";
const UPLOAD_EVENT = "hc-photo-uploaded";

let photosRequest: Promise<DbPhoto[]> | null = null;
let scheduled = false;
let selectedNames = new Set<string>();

type PhotoTagLike = {
  tagged_name_snapshot?: string | null;
  status?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isHistoryRoute() {
  return HISTORY_ROUTES.has(currentPath());
}

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${PERSON_HIDDEN_ATTRIBUTE}="true"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function getPhotoTags(photo: DbPhoto) {
  const tags = ((photo as DbPhoto & { photo_tags?: PhotoTagLike[] }).photo_tags ?? []);
  return Array.from(new Set(
    tags
      .filter(tag => !["rejected", "removed"].includes(String(tag.status ?? "").toLocaleLowerCase("pt-BR")))
      .map(tag => tag.tagged_name_snapshot?.trim() ?? "")
      .filter(Boolean),
  ));
}

function loadPhotos(force = false) {
  if (force) photosRequest = null;
  if (!photosRequest) {
    photosRequest = getApprovedPhotos(DEFAULT_EVENT_ID).catch(error => {
      photosRequest = null;
      console.warn("[História] Não foi possível carregar as marcações das fotos.", error);
      return [];
    });
  }
  return photosRequest;
}

function normalizeSource(value: string | null | undefined) {
  const source = String(value ?? "").trim();
  if (!source) return "";
  try {
    const url = new URL(source, window.location.href);
    url.hash = "";
    return url.href;
  } catch {
    return source;
  }
}

function findRoot() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .find(element => normalizeText(element.textContent) === "fotos da época");
  return title?.closest<HTMLElement>(".max-w-7xl") ?? null;
}

function findGallery(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>("div.grid"))
    .find(element => element.classList.contains("grid-cols-2") && element.classList.contains("md:grid-cols-3")) ?? null;
}

function findPersonSection(root: HTMLElement) {
  const label = Array.from(root.querySelectorAll<HTMLElement>("p"))
    .find(element => normalizeText(element.textContent) === "filtrar por pessoa marcada");
  return label?.parentElement ?? null;
}

function findTrigger(section: HTMLElement) {
  return Array.from(section.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => {
      const label = normalizeText(button.textContent);
      return label === "selecionar pessoas"
        || label.includes("pessoa selecionada")
        || label.includes("pessoas selecionadas");
    }) ?? null;
}

function findDropdown(trigger: HTMLButtonElement | null) {
  const wrapper = trigger?.parentElement;
  return wrapper
    ? Array.from(wrapper.children).find((element): element is HTMLElement => (
        element instanceof HTMLElement && element.classList.contains("absolute")
      )) ?? null
    : null;
}

function isDropdownOpen(dropdown: HTMLElement | null) {
  if (!dropdown || dropdown.hidden || dropdown.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(dropdown);
  if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return false;
  return dropdown.getClientRects().length > 0;
}

function getOpenDropdownContext() {
  if (!isHistoryRoute()) return null;
  const root = findRoot();
  if (!root) return null;
  const section = findPersonSection(root);
  if (!section) return null;
  const trigger = findTrigger(section);
  const dropdown = findDropdown(trigger);
  if (!trigger || !isDropdownOpen(dropdown)) return null;
  return { trigger, dropdown: dropdown as HTMLElement, wrapper: trigger.parentElement };
}

function closeDropdownFromOutside(event: PointerEvent) {
  const context = getOpenDropdownContext();
  if (!context) return;

  const target = event.target;
  if (target instanceof Node && context.wrapper?.contains(target)) return;

  context.trigger.click();
  scheduleEnhancement();
}

function closeDropdownWithEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const context = getOpenDropdownContext();
  if (!context) return;

  event.preventDefault();
  context.trigger.click();
  context.trigger.focus({ preventScroll: true });
  scheduleEnhancement();
}

function setTriggerLabel(trigger: HTMLButtonElement, count: number) {
  const label = trigger.querySelector<HTMLElement>("span");
  if (!label) return;
  const next = count === 0
    ? "Selecionar pessoas"
    : count === 1
      ? "1 pessoa selecionada"
      : `${count} pessoas selecionadas`;
  if (label.textContent !== next) label.textContent = next;

  trigger.setAttribute("aria-label", count === 0 ? "Selecionar pessoas marcadas" : `${count} pessoas selecionadas`);
}

function createOption(name: string | null) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-[#2d6a4f]/10 last:border-b-0 transition-colors";
  button.dataset.historyPersonName = name ?? "";

  const label = document.createElement("span");
  label.className = "text-xs font-mono uppercase tracking-wider";
  label.textContent = name ?? "Todas as pessoas";

  const check = document.createElement("span");
  check.className = "w-4 h-4 border flex items-center justify-center";
  check.setAttribute("aria-hidden", "true");

  button.append(label, check);
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    if (!name) selectedNames.clear();
    else if (selectedNames.has(name)) selectedNames.delete(name);
    else selectedNames.add(name);
    scheduleEnhancement();
  });
  return button;
}

function updateOptionAppearance(button: HTMLButtonElement) {
  const name = button.dataset.historyPersonName ?? "";
  const selected = name ? selectedNames.has(name) : selectedNames.size === 0;
  button.className = `w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-[#2d6a4f]/10 last:border-b-0 transition-colors ${selected ? "bg-[#1a2e1a] text-[#f0ebe0]" : "text-[#7a9a7a] hover:bg-[#141f14] hover:text-[#f0ebe0]"}`;
  button.setAttribute("aria-pressed", String(selected));
  const check = button.querySelector<HTMLElement>("span:last-child");
  if (check) {
    check.className = `w-4 h-4 border flex items-center justify-center ${selected ? "bg-[#c9a84c] border-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/50"}`;
    check.textContent = selected ? "✓" : "";
  }
}

function ensureCustomDropdown(section: HTMLElement, names: string[]) {
  const trigger = findTrigger(section);
  if (trigger) setTriggerLabel(trigger, selectedNames.size);

  const allButton = Array.from(section.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalizeText(button.textContent) === "todas as pessoas" && !button.closest(`[${CUSTOM_OPTIONS_ATTRIBUTE}]`));
  if (allButton && !allButton.hasAttribute(ALL_BUTTON_BOUND_ATTRIBUTE)) {
    allButton.setAttribute(ALL_BUTTON_BOUND_ATTRIBUTE, "true");
    allButton.addEventListener("click", () => {
      selectedNames.clear();
      scheduleEnhancement();
    });
  }

  const dropdown = findDropdown(trigger);
  if (!dropdown) return;

  Array.from(dropdown.children).forEach(child => {
    if (!(child instanceof HTMLElement) || child.hasAttribute(CUSTOM_OPTIONS_ATTRIBUTE)) return;
    child.setAttribute(NATIVE_HIDDEN_ATTRIBUTE, "true");
    child.style.setProperty("display", "none", "important");
  });

  let container = dropdown.querySelector<HTMLElement>(`[${CUSTOM_OPTIONS_ATTRIBUTE}]`);
  if (!container) {
    container = document.createElement("div");
    container.setAttribute(CUSTOM_OPTIONS_ATTRIBUTE, "true");
    dropdown.appendChild(container);
  }

  const expected = ["", ...names];
  const current = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
    .map(button => button.dataset.historyPersonName ?? "");
  if (current.length !== expected.length || current.some((name, index) => name !== expected[index])) {
    container.replaceChildren(...expected.map(name => createOption(name || null)));
  }
  container.querySelectorAll<HTMLButtonElement>("button").forEach(updateOptionAppearance);
}

function annotateCards(root: HTMLElement, photos: DbPhoto[]) {
  const gallery = findGallery(root);
  if (!gallery) return;

  const tagsBySource = new Map<string, string[]>();
  photos.forEach(photo => {
    const tags = getPhotoTags(photo);
    [photo.thumbnail_url, photo.image_url].forEach(source => {
      const normalized = normalizeSource(source);
      if (normalized) tagsBySource.set(normalized, tags);
    });
  });

  Array.from(gallery.children).forEach(card => {
    if (!(card instanceof HTMLElement)) return;
    const image = card.querySelector<HTMLImageElement>("img");
    const sources = [image?.getAttribute("src"), image?.src].map(normalizeSource).filter(Boolean);
    const tags = sources.map(source => tagsBySource.get(source)).find(Boolean) ?? [];
    card.setAttribute(PHOTO_TAGS_ATTRIBUTE, JSON.stringify(tags));
  });
}

function applyCardFilter(root: HTMLElement) {
  const gallery = findGallery(root);
  if (!gallery) return;

  Array.from(gallery.children).forEach(card => {
    if (!(card instanceof HTMLElement)) return;
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(card.getAttribute(PHOTO_TAGS_ATTRIBUTE) ?? "[]");
      if (Array.isArray(parsed)) tags = parsed.filter(value => typeof value === "string");
    } catch {
      tags = [];
    }
    const visible = selectedNames.size === 0 || tags.some(name => selectedNames.has(name));
    if (visible) card.removeAttribute(PERSON_HIDDEN_ATTRIBUTE);
    else card.setAttribute(PERSON_HIDDEN_ATTRIBUTE, "true");
  });
}

async function enhanceHistoryPersonFilter() {
  scheduled = false;
  if (!isHistoryRoute()) {
    selectedNames.clear();
    return;
  }

  const root = findRoot();
  if (!root) return;
  const photos = await loadPhotos();
  if (!isHistoryRoute()) return;

  annotateCards(root, photos);
  const names = Array.from(new Set(photos.flatMap(getPhotoTags))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const validNames = new Set(names);
  selectedNames = new Set(Array.from(selectedNames).filter(name => validNames.has(name)));

  const section = findPersonSection(root);
  if (section) ensureCustomDropdown(section, names);
  applyCardFilter(root);
}

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => void enhanceHistoryPersonFilter());
}

export function installHistoryPersonFilterEnhancement() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  injectStyle();

  const observer = new MutationObserver(scheduleEnhancement);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener("pointerdown", closeDropdownFromOutside, true);
    document.addEventListener("keydown", closeDropdownWithEscape, true);
    document.addEventListener("click", scheduleEnhancement, true);
    window.addEventListener("popstate", scheduleEnhancement);
    window.addEventListener("pushstate", scheduleEnhancement as EventListener);
    window.addEventListener(UPLOAD_EVENT, () => {
      void loadPhotos(true).then(() => scheduleEnhancement());
    });
    scheduleEnhancement();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
