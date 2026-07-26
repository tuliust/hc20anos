import { supabase } from "./lib/supabase";

const HOME_PATH = "/";
const EVENT_ID = "00000000-0000-0000-0000-000000000001";
const CAROUSEL_SELECTOR = '[data-home-section="about"] [data-home-memory-carousel]';
const AVATAR_ATTRIBUTE = "data-home-memory-avatar";
const SLOT_ATTRIBUTE = "data-home-memory-avatar-slot";

type MemoryRow = {
  person_id: string | null;
  author_name: string | null;
  memory_text: string;
};

type ProfileCardRow = {
  person_id: string;
  display_name: string | null;
  full_name: string;
  avatar_url: string | null;
};

type MemoryAvatar = {
  authorName: string;
  avatarUrl: string;
};

let installed = false;
let scheduled = false;
let lookupPromise: Promise<Map<string, MemoryAvatar>> | null = null;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”‘’"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

async function loadMemoryAvatarLookup() {
  if (lookupPromise) return lookupPromise;

  lookupPromise = (async () => {
    const [{ data: memories, error: memoriesError }, { data: cards, error: cardsError }] = await Promise.all([
      (supabase as any)
        .from("memories")
        .select("person_id,author_name,memory_text")
        .eq("event_id", EVENT_ID)
        .eq("status", "approved"),
      (supabase as any)
        .from("public_profile_cards")
        .select("person_id,display_name,full_name,avatar_url"),
    ]);

    if (memoriesError) throw memoriesError;
    if (cardsError) throw cardsError;

    const cardsByPerson = new Map<string, ProfileCardRow>();
    const cardsByName = new Map<string, ProfileCardRow>();
    ((cards ?? []) as ProfileCardRow[]).forEach(card => {
      cardsByPerson.set(card.person_id, card);
      [card.display_name, card.full_name].forEach(name => {
        const normalized = normalizeText(name);
        if (normalized) cardsByName.set(normalized, card);
      });
    });

    const lookup = new Map<string, MemoryAvatar>();
    ((memories ?? []) as MemoryRow[]).forEach(memory => {
      const card = (memory.person_id ? cardsByPerson.get(memory.person_id) : null)
        ?? cardsByName.get(normalizeText(memory.author_name));
      if (!card?.avatar_url) return;

      const memoryKey = normalizeText(memory.memory_text);
      if (!memoryKey) return;
      lookup.set(memoryKey, {
        authorName: card.display_name || card.full_name || memory.author_name || "Ex-aluno",
        avatarUrl: card.avatar_url,
      });
    });

    return lookup;
  })().catch(error => {
    console.warn("[Home/Memórias] Não foi possível carregar a foto do autor.", error);
    lookupPromise = null;
    return new Map<string, MemoryAvatar>();
  });

  return lookupPromise;
}

function findAvatarSlot(carousel: HTMLElement) {
  const existing = carousel.querySelector<HTMLElement>(`[${SLOT_ATTRIBUTE}]`);
  if (existing) return existing;

  const candidates = Array.from(carousel.querySelectorAll<HTMLElement>("div,figure"))
    .filter(element => {
      if (element.closest("button")) return false;
      if (!element.querySelector("svg")) return false;
      if (element.querySelector(`[${AVATAR_ATTRIBUTE}]`)) return true;

      const className = String(element.className ?? "");
      if (className.includes("rounded-full")) return true;

      const rect = element.getBoundingClientRect();
      if (rect.width < 56 || rect.height < 56) return false;
      const ratio = rect.width / Math.max(rect.height, 1);
      return ratio > 0.8 && ratio < 1.2;
    })
    .sort((left, right) => {
      const leftRect = left.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      return (rightRect.width * rightRect.height) - (leftRect.width * leftRect.height);
    });

  const slot = candidates[0] ?? null;
  slot?.setAttribute(SLOT_ATTRIBUTE, "true");
  return slot;
}

function clearAvatar(slot: HTMLElement) {
  slot.querySelector<HTMLElement>(`[${AVATAR_ATTRIBUTE}]`)?.remove();
  slot.querySelectorAll<HTMLElement>("svg").forEach(icon => icon.style.removeProperty("display"));
}

function renderAvatar(slot: HTMLElement, memory: MemoryAvatar) {
  let image = slot.querySelector<HTMLImageElement>(`img[${AVATAR_ATTRIBUTE}]`);
  if (!image) {
    image = document.createElement("img");
    image.setAttribute(AVATAR_ATTRIBUTE, "true");
    image.decoding = "async";
    image.loading = "lazy";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";
    image.style.borderRadius = "9999px";
    image.style.display = "block";
    slot.appendChild(image);
  }

  if (image.src !== memory.avatarUrl) image.src = memory.avatarUrl;
  image.alt = `Foto de ${memory.authorName}`;
  slot.querySelectorAll<HTMLElement>("svg").forEach(icon => icon.style.setProperty("display", "none", "important"));
}

async function applyAvatar() {
  scheduled = false;
  if (currentPath() !== HOME_PATH) return;

  const carousel = document.querySelector<HTMLElement>(CAROUSEL_SELECTOR);
  const body = carousel?.querySelector<HTMLElement>("[data-home-memory-text]");
  if (!carousel || !body) return;

  const slot = findAvatarSlot(carousel);
  if (!slot) return;

  const lookup = await loadMemoryAvatarLookup();
  if (currentPath() !== HOME_PATH || !document.contains(carousel)) return;

  const memory = lookup.get(normalizeText(body.textContent));
  if (memory) renderAvatar(slot, memory);
  else clearAvatar(slot);
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => void applyAvatar());
}

export function installHomeMemoryAvatarEnhancement() {
  if (installed || typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  installed = true;

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
