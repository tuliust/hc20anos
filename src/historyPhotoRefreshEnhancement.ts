import { getApprovedPhotos } from "./lib/services";
import type { DbPhoto } from "./lib/photo.types";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const HISTORY_ROUTES = new Set(["/nossa-historia", "/nossas-historias"]);
const UPLOAD_EVENT = "hc-photo-uploaded";
const INJECTED_ATTRIBUTE = "data-history-uploaded-photo";
const TAGS_ATTRIBUTE = "data-history-photo-tags";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function findRoot() {
  if (!HISTORY_ROUTES.has(currentPath())) return null;
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .find(element => normalizeText(element.textContent) === "fotos da época");
  return title?.closest<HTMLElement>(".max-w-7xl") ?? null;
}

function findGallery(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>("div.grid"))
    .find(element => element.classList.contains("grid-cols-2") && element.classList.contains("md:grid-cols-3")) ?? null;
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

function getTags(photo: DbPhoto) {
  const tags = ((photo as DbPhoto & { photo_tags?: Array<{ tagged_name_snapshot?: string | null; status?: string | null }> }).photo_tags ?? []);
  return Array.from(new Set(tags
    .filter(tag => !["rejected", "removed"].includes(String(tag.status ?? "").toLocaleLowerCase("pt-BR")))
    .map(tag => tag.tagged_name_snapshot?.trim() ?? "")
    .filter(Boolean)));
}

function createPhotoCard(photo: DbPhoto) {
  const card = document.createElement("article");
  card.setAttribute(INJECTED_ATTRIBUTE, photo.id);
  card.setAttribute(TAGS_ATTRIBUTE, JSON.stringify(getTags(photo)));
  card.className = "relative group overflow-hidden bg-[#1a2e1a] aspect-[4/3]";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "absolute inset-0 w-full h-full text-left";
  button.setAttribute("aria-label", `Abrir foto: ${photo.caption || "Foto antiga"}`);
  button.addEventListener("click", () => {
    if (photo.image_url) window.open(photo.image_url, "_blank", "noopener,noreferrer");
  });

  const image = document.createElement("img");
  image.src = photo.thumbnail_url || photo.image_url;
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
  const tags = getTags(photo);
  if (tags.length > 0) {
    const tagged = document.createElement("p");
    tagged.className = "text-[#c9a84c] text-[10px] font-mono mt-2";
    tagged.textContent = `Na foto: ${tags.slice(0, 3).join(", ")}`;
    overlay.appendChild(tagged);
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

async function refreshWall() {
  const root = findRoot();
  if (!root) return;
  const gallery = findGallery(root);
  if (!gallery) return;

  const photos = await getApprovedPhotos(DEFAULT_EVENT_ID).catch(() => []);
  const existingSources = new Set(
    Array.from(gallery.querySelectorAll<HTMLImageElement>("img"))
      .flatMap(image => [normalizeSource(image.getAttribute("src")), normalizeSource(image.src)])
      .filter(Boolean),
  );

  photos.forEach(photo => {
    const sources = [normalizeSource(photo.thumbnail_url), normalizeSource(photo.image_url)].filter(Boolean);
    if (!sources.length || sources.some(source => existingSources.has(source))) return;
    gallery.appendChild(createPhotoCard(photo));
    sources.forEach(source => existingSources.add(source));
  });
}

export function installHistoryPhotoRefreshEnhancement() {
  if (typeof window === "undefined") return;
  window.addEventListener(UPLOAD_EVENT, () => {
    window.setTimeout(() => void refreshWall(), 100);
    window.setTimeout(() => void refreshWall(), 900);
  });
}
