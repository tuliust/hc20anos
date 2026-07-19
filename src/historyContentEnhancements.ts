import { getApprovedPhotos } from "./lib/services";
import type { DbPhoto } from "./lib/database.types";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const INJECTED_PHOTO_ATTRIBUTE = "data-approved-photo-card";

let approvedPhotosRequest: Promise<DbPhoto[]> | null = null;
let enhancementScheduled = false;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
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

function getActiveYear(root: HTMLElement) {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "todos os anos" || /^20\d{2}$/.test(normalizeText(button.textContent)));
  const active = buttons.find(button =>
    button.getAttribute("aria-pressed") === "true"
    || button.className.includes("bg-[#c9a84c]"),
  );
  const label = normalizeText(active?.textContent);
  return /^20\d{2}$/.test(label) ? label : null;
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

async function enhancePublicPhotoWall() {
  if ((window.location.pathname.replace(/\/+$/, "") || "/") !== "/nossa-historia") return;

  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
    .find(element => normalizeText(element.textContent) === "fotos da época");
  const root = title?.closest<HTMLElement>(".max-w-7xl");
  if (!root) return;

  const gallery = Array.from(root.querySelectorAll<HTMLElement>("div.grid"))
    .find(element => element.classList.contains("grid-cols-2") && element.classList.contains("md:grid-cols-3"));
  if (!gallery) return;

  let approvedPhotos: DbPhoto[];
  try {
    approvedPhotos = await getApprovedPhotoList();
  } catch {
    return;
  }

  const counter = Array.from(root.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent).includes("fotos selecionadas pela organização"));
  if (counter) counter.textContent = `${approvedPhotos.length} fotos selecionadas pela organização`;

  gallery.querySelectorAll<HTMLElement>(`[${INJECTED_PHOTO_ATTRIBUTE}]`).forEach(element => element.remove());

  const existingSources = new Set(
    Array.from(gallery.querySelectorAll<HTMLImageElement>("img"))
      .flatMap(image => [image.getAttribute("src") ?? "", image.src])
      .filter(Boolean),
  );
  const activeYear = getActiveYear(root);

  approvedPhotos
    .filter(photo => !activeYear || String(photo.year_approx ?? "") === activeYear)
    .filter(photo => {
      const source = getPhotoSource(photo);
      return source && !existingSources.has(source) && !existingSources.has(new URL(source, window.location.href).href);
    })
    .forEach(photo => gallery.appendChild(createApprovedPhotoCard(photo)));
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
      button.style.removeProperty("display");
      button.removeAttribute("data-admin-approved-hidden");
    });

  if (!approvedIsActive) return;

  Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "aprovar")
    .forEach(button => {
      button.style.display = "none";
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
    anonymousControl.style.display = "none";
  }

  Array.from(formCard.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "enviar para moderação")
    .forEach(button => replaceButtonLabel(button, "Enviar"));
}

function runEnhancements() {
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

export function installHistoryContentEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleEnhancements);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", scheduleEnhancements, true);
    window.addEventListener("popstate", scheduleEnhancements);
    window.addEventListener("pushstate", scheduleEnhancements);
    scheduleEnhancements();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
