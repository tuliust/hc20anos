import { supabase } from "./lib/supabase";

const PROFILE_MODAL_TITLE = "perfil da turma";
const PROFILE_MODAL_LAYOUT_ATTRIBUTE = "data-profile-modal-layout";
const PROFILE_MODAL_BIO_ATTRIBUTE = "data-profile-modal-bio";
const PROFILE_MODAL_BIO_LABEL_ATTRIBUTE = "data-profile-modal-bio-label";
const PROFILE_MODAL_BIO_TEXT_ATTRIBUTE = "data-profile-modal-bio-text";
const PROFILE_MODAL_BIO_KEY_ATTRIBUTE = "data-profile-modal-bio-key";

let scheduled = false;
const bioLookup = new Map<string, Promise<string | null>>();

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function normalizeBio(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && typeof (parsed as { bio?: unknown }).bio === "string") {
      return (parsed as { bio: string }).bio.trim();
    }
  } catch {
    // Mantém compatibilidade com bios antigas armazenadas como texto simples.
  }

  const legacyMatch = raw.match(/^\s*\{\s*["']bio["']\s*:\s*["']([\s\S]*)["']\s*\}\s*$/i);
  if (!legacyMatch) return raw;

  return legacyMatch[1]
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .trim();
}

function findProfileModals() {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-modal-root='true']"))
    .filter(modal => {
      const panel = modal.firstElementChild;
      const header = panel?.firstElementChild;
      const title = header?.querySelector<HTMLElement>("p");
      return normalizeText(title?.textContent) === PROFILE_MODAL_TITLE;
    });
}

function findFullName(modal: HTMLElement) {
  const label = Array.from(modal.querySelectorAll<HTMLElement>("p"))
    .find(element => normalizeText(element.textContent) === "nome completo");

  const card = label?.parentElement;
  const cardValue = card
    ? Array.from(card.querySelectorAll<HTMLElement>("p"))
      .find(element => element !== label && Boolean(element.textContent?.trim()))
      ?.textContent
      ?.trim()
    : "";

  return cardValue || modal.querySelector<HTMLImageElement>("img[alt]")?.alt.trim() || "";
}

function findPhotoColumn(modal: HTMLElement) {
  const panel = modal.firstElementChild;
  const content = panel?.lastElementChild;
  const layout = content?.firstElementChild;
  const photoColumn = layout?.firstElementChild;

  if (!(layout instanceof HTMLElement) || !(photoColumn instanceof HTMLElement)) return null;

  layout.setAttribute(PROFILE_MODAL_LAYOUT_ATTRIBUTE, "true");
  return photoColumn;
}

async function loadProfileBio(fullName: string) {
  const lookupKey = normalizeText(fullName);
  if (!lookupKey) return null;

  const cached = bioLookup.get(lookupKey);
  if (cached) return cached;

  const request = (async () => {
    const { data: cards, error: cardsError } = await (supabase as any)
      .from("public_profile_cards")
      .select("person_id,full_name")
      .eq("full_name", fullName)
      .limit(1);

    if (cardsError) throw cardsError;
    const personId = cards?.[0]?.person_id as string | undefined;
    if (!personId) return null;

    const { data: profiles, error: profilesError } = await (supabase as any)
      .from("profiles")
      .select("bio,updated_at")
      .eq("person_id", personId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (profilesError) throw profilesError;
    const bio = normalizeBio(profiles?.[0]?.bio);
    return bio || null;
  })().catch(error => {
    console.warn("[Perfil da turma] Não foi possível carregar a mini bio pública.", error);
    bioLookup.delete(lookupKey);
    return null;
  });

  bioLookup.set(lookupKey, request);
  return request;
}

function removeBioBlock(photoColumn: HTMLElement) {
  photoColumn.querySelector<HTMLElement>(`[${PROFILE_MODAL_BIO_ATTRIBUTE}]`)?.remove();
}

function renderBioBlock(photoColumn: HTMLElement, fullName: string, bio: string) {
  let block = photoColumn.querySelector<HTMLElement>(`[${PROFILE_MODAL_BIO_ATTRIBUTE}]`);
  if (!block) {
    block = document.createElement("section");
    block.setAttribute(PROFILE_MODAL_BIO_ATTRIBUTE, "true");

    const label = document.createElement("p");
    label.setAttribute(PROFILE_MODAL_BIO_LABEL_ATTRIBUTE, "true");
    label.textContent = "Perfil";

    const text = document.createElement("p");
    text.setAttribute(PROFILE_MODAL_BIO_TEXT_ATTRIBUTE, "true");

    block.append(label, text);
    photoColumn.appendChild(block);
  }

  block.setAttribute(PROFILE_MODAL_BIO_KEY_ATTRIBUTE, normalizeText(fullName));
  const text = block.querySelector<HTMLElement>(`[${PROFILE_MODAL_BIO_TEXT_ATTRIBUTE}]`);
  if (text) text.textContent = bio;
}

async function enhanceModal(modal: HTMLElement) {
  const fullName = findFullName(modal);
  const photoColumn = findPhotoColumn(modal);
  if (!fullName || !photoColumn) return;

  const lookupKey = normalizeText(fullName);
  const existing = photoColumn.querySelector<HTMLElement>(`[${PROFILE_MODAL_BIO_ATTRIBUTE}]`);
  if (existing?.getAttribute(PROFILE_MODAL_BIO_KEY_ATTRIBUTE) === lookupKey) return;

  removeBioBlock(photoColumn);
  const bio = await loadProfileBio(fullName);
  if (!bio || !document.contains(modal)) return;

  const currentFullName = findFullName(modal);
  if (normalizeText(currentFullName) !== lookupKey) return;

  renderBioBlock(photoColumn, fullName, bio);
}

function applyEnhancements() {
  scheduled = false;
  findProfileModals().forEach(modal => void enhanceModal(modal));
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyEnhancements);
}

export function installProfileModalBioEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcProfileModalBio === "true") return;
  document.documentElement.dataset.hcProfileModalBio = "true";

  const start = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    window.addEventListener("popstate", schedule);
    window.addEventListener("pushstate", schedule as EventListener);
    schedule();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
