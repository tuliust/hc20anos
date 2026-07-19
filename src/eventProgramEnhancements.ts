import { CMS_ASSETS_BUCKET, CMS_EVENT_ID, type CmsAsset } from "./lib/cmsAdmin";
import { supabase } from "./lib/supabase";

const KNOWN_ATTRACTION_KEYS: Record<string, string> = {
  "banda grafith": "event_program_banda_grafith_image",
  "dj pedro sampaio": "event_program_dj_pedro_sampaio_image",
};

const ATTRACTION_ASSET_PREFIX = "event_program_attraction_";

type PublicCmsAsset = Pick<
  CmsAsset,
  "asset_key" | "file_url" | "storage_path" | "alt_text" | "label" | "is_active" | "sort_order"
>;

let assetsPromise: Promise<Map<string, PublicCmsAsset>> | null = null;
let assetsCache = new Map<string, PublicCmsAsset>();
let lastLocation = "";
let frameId: number | null = null;
let applying = false;
let applyAgain = false;

function currentLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

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

function safeName(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "atracao";
}

function attractionAssetKey(title: string, index: number) {
  const normalizedTitle = normalizeText(title);
  return KNOWN_ATTRACTION_KEYS[normalizedTitle]
    ?? `${ATTRACTION_ASSET_PREFIX}${safeName(normalizedTitle || `item-${index + 1}`)}_image`;
}

function isAttractionAssetKey(key?: string | null) {
  if (!key) return false;
  return Object.values(KNOWN_ATTRACTION_KEYS).includes(key)
    || (key.startsWith(ATTRACTION_ASSET_PREFIX) && key.endsWith("_image"));
}

async function loadAttractionAssets(force = false) {
  if (force) assetsPromise = null;

  if (!assetsPromise) {
    assetsPromise = (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("cms_assets")
          .select("asset_key,file_url,storage_path,alt_text,label,is_active,sort_order")
          .eq("event_id", CMS_EVENT_ID);

        if (error) throw error;

        assetsCache = new Map<string, PublicCmsAsset>(
          ((data ?? []) as PublicCmsAsset[])
            .filter(asset => isAttractionAssetKey(asset.asset_key))
            .map(asset => [asset.asset_key, asset]),
        );
      } catch (error) {
        console.warn("Não foi possível carregar as imagens das atrações.", error);
        assetsCache = new Map<string, PublicCmsAsset>();
      }

      return assetsCache;
    })();
  }

  return assetsPromise;
}

async function saveAttractionAsset(asset: PublicCmsAsset) {
  const payload = {
    event_id: CMS_EVENT_ID,
    asset_key: asset.asset_key,
    label: asset.label || asset.asset_key,
    file_url: asset.file_url?.trim() || null,
    storage_path: asset.storage_path?.trim() || null,
    alt_text: asset.alt_text?.trim() || null,
    usage_context: "event.program.attraction",
    sort_order: Number(asset.sort_order ?? 100),
    is_active: asset.is_active !== false,
  };

  const { error } = await (supabase as any)
    .from("cms_assets")
    .upsert(payload, { onConflict: "event_id,asset_key" });

  if (error) throw error;
  assetsCache.set(payload.asset_key, payload);
  return payload;
}

async function uploadAttractionFile(file: File, assetKey: string) {
  const rawExtension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const extension = safeName(rawExtension ?? "bin");
  const storagePath = `${CMS_EVENT_ID}/${safeName(assetKey)}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(CMS_ASSETS_BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(CMS_ASSETS_BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

function findEventHero() {
  return Array.from(document.querySelectorAll<HTMLElement>("main section"))
    .find(section => normalizeText(section.querySelector("h1")?.textContent).includes("o evento")) ?? null;
}

function removeConfirmedButton() {
  const hero = findEventHero();
  if (!hero) return;

  const button = Array.from(hero.querySelectorAll<HTMLButtonElement>("button"))
    .find(item => normalizeText(item.textContent).includes("ver confirmados"));

  button?.remove();
}

function findPublicProgramCards() {
  const section = Array.from(document.querySelectorAll<HTMLElement>("main section"))
    .find(item => normalizeText(item.querySelector("h2")?.textContent).includes("horarios e atracoes"));

  if (!section) return [] as HTMLElement[];

  const programGrid = Array.from(section.querySelectorAll<HTMLElement>("div"))
    .find(item => String(item.className).includes("lg:grid-cols-[0.9fr_1.1fr]"));
  const attractionsColumn = programGrid?.children.item(1);
  if (!(attractionsColumn instanceof HTMLElement)) return [] as HTMLElement[];

  return Array.from(attractionsColumn.children)
    .filter((item): item is HTMLElement => item instanceof HTMLElement);
}

function publicCardTitle(card: HTMLElement) {
  const title = Array.from(card.querySelectorAll<HTMLElement>("p,h3"))
    .find(item => String(item.className).includes("font-semibold"));
  return title?.textContent?.trim() || "Atração";
}

function renderPublicCardImage(card: HTMLElement, asset: PublicCmsAsset | undefined, fallbackAlt: string) {
  const existing = card.querySelector<HTMLElement>("[data-event-program-attraction-image]");
  const imageUrl = asset?.is_active === false ? "" : asset?.file_url?.trim() ?? "";

  if (!imageUrl) {
    existing?.remove();
    card.removeAttribute("data-event-program-attraction-card");
    return;
  }

  const figure = existing ?? document.createElement("figure");
  figure.dataset.eventProgramAttractionImage = asset?.asset_key ?? "attraction";
  figure.className = "event-program-attraction-image";

  let image = figure.querySelector("img");
  if (!image) {
    image = document.createElement("img");
    image.loading = "lazy";
    image.decoding = "async";
    figure.appendChild(image);
  }

  image.src = imageUrl;
  image.alt = asset?.alt_text?.trim() || fallbackAlt;

  if (!existing) card.prepend(figure);
  card.dataset.eventProgramAttractionCard = "true";
}

function isAdminEventContentPage() {
  if (currentPath() !== "/admin/content") return false;
  return new URLSearchParams(window.location.search).get("tab") === "event";
}

function findAdminAttractionsPanel() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("p,h2,h3"))
    .find(item => normalizeText(item.textContent) === "atracoes");

  let current = heading?.parentElement ?? null;
  while (current && current !== document.body) {
    const hasAddButton = Array.from(current.querySelectorAll("button"))
      .some(button => normalizeText(button.textContent).includes("adicionar atracao"));
    if (hasAddButton) return current;
    current = current.parentElement;
  }

  return null;
}

function findAdminAttractionCards(panel: HTMLElement) {
  const container = Array.from(panel.querySelectorAll<HTMLElement>("div"))
    .find(item => Array.from(item.children).some(child => child instanceof HTMLElement && child.querySelectorAll("input").length >= 2));

  if (!container) return [] as HTMLElement[];

  return Array.from(container.children)
    .filter((item): item is HTMLElement => item instanceof HTMLElement && item.querySelectorAll("input").length >= 2);
}

function setManagerStatus(manager: HTMLElement, message: string, tone: "muted" | "ok" | "error" = "muted") {
  const status = manager.querySelector<HTMLElement>("[data-attraction-image-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function managerButton(label: string, action: () => void, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = danger ? "attraction-image-button attraction-image-button-danger" : "attraction-image-button";
  button.addEventListener("click", action);
  return button;
}

function renderAdminManagerContent(
  manager: HTMLElement,
  titleInput: HTMLInputElement,
  index: number,
  asset: PublicCmsAsset | undefined,
) {
  manager.replaceChildren();

  const currentTitle = titleInput.value.trim() || `Atração ${index + 1}`;
  const key = attractionAssetKey(currentTitle, index);
  manager.dataset.attractionAssetKey = key;

  const heading = document.createElement("div");
  heading.className = "attraction-image-heading";
  const headingText = document.createElement("div");
  const label = document.createElement("p");
  label.className = "attraction-image-label";
  label.textContent = "Imagem da atração";
  const help = document.createElement("p");
  help.className = "attraction-image-help";
  help.textContent = "Upload integrado ao Supabase. A foto será exibida acima do título no card público.";
  headingText.append(label, help);
  heading.appendChild(headingText);

  const preview = document.createElement("div");
  preview.className = "attraction-image-preview";
  const imageUrl = asset?.is_active === false ? "" : asset?.file_url?.trim() ?? "";
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = asset?.alt_text?.trim() || currentTitle;
    preview.appendChild(image);
  } else {
    const empty = document.createElement("span");
    empty.textContent = "Nenhuma imagem configurada";
    preview.appendChild(empty);
  }

  const fields = document.createElement("div");
  fields.className = "attraction-image-fields";

  const urlLabel = document.createElement("label");
  urlLabel.className = "attraction-image-field";
  const urlText = document.createElement("span");
  urlText.textContent = "URL pública";
  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.value = imageUrl;
  urlInput.placeholder = "https://...";
  urlLabel.append(urlText, urlInput);

  const altLabel = document.createElement("label");
  altLabel.className = "attraction-image-field";
  const altText = document.createElement("span");
  altText.textContent = "Texto alternativo";
  const altInput = document.createElement("input");
  altInput.type = "text";
  altInput.value = asset?.alt_text?.trim() || currentTitle;
  altLabel.append(altText, altInput);

  fields.append(urlLabel, altLabel);

  const actions = document.createElement("div");
  actions.className = "attraction-image-actions";

  const fileLabel = document.createElement("label");
  fileLabel.className = "attraction-image-button attraction-image-upload";
  fileLabel.textContent = "Enviar imagem";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/jpg,image/webp";
  fileInput.hidden = true;
  fileLabel.appendChild(fileInput);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    fileInput.disabled = true;
    setManagerStatus(manager, "Enviando imagem...", "muted");
    try {
      const uploaded = await uploadAttractionFile(file, key);
      const saved = await saveAttractionAsset({
        asset_key: key,
        label: `Evento — atração: ${currentTitle}`,
        file_url: uploaded.publicUrl,
        storage_path: uploaded.storagePath,
        alt_text: altInput.value.trim() || currentTitle,
        sort_order: 100 + index,
        is_active: true,
      });
      assetsCache.set(key, saved);
      renderAdminManagerContent(manager, titleInput, index, saved);
      setManagerStatus(manager, "Imagem enviada e salva no Supabase.", "ok");
    } catch (error) {
      setManagerStatus(manager, error instanceof Error ? error.message : "Não foi possível enviar a imagem.", "error");
    } finally {
      fileInput.disabled = false;
      fileInput.value = "";
    }
  });

  const saveButton = managerButton("Salvar URL", async () => {
    setManagerStatus(manager, "Salvando imagem...", "muted");
    try {
      const saved = await saveAttractionAsset({
        asset_key: key,
        label: `Evento — atração: ${currentTitle}`,
        file_url: urlInput.value.trim() || null,
        storage_path: asset?.storage_path ?? null,
        alt_text: altInput.value.trim() || currentTitle,
        sort_order: 100 + index,
        is_active: Boolean(urlInput.value.trim()),
      });
      assetsCache.set(key, saved);
      renderAdminManagerContent(manager, titleInput, index, saved);
      setManagerStatus(manager, "Imagem salva no Supabase.", "ok");
    } catch (error) {
      setManagerStatus(manager, error instanceof Error ? error.message : "Não foi possível salvar a imagem.", "error");
    }
  });

  const removeButton = managerButton("Remover imagem", async () => {
    setManagerStatus(manager, "Removendo imagem...", "muted");
    try {
      const saved = await saveAttractionAsset({
        asset_key: key,
        label: `Evento — atração: ${currentTitle}`,
        file_url: null,
        storage_path: asset?.storage_path ?? null,
        alt_text: altInput.value.trim() || currentTitle,
        sort_order: 100 + index,
        is_active: false,
      });
      assetsCache.set(key, saved);
      renderAdminManagerContent(manager, titleInput, index, saved);
      setManagerStatus(manager, "Imagem removida do card público.", "ok");
    } catch (error) {
      setManagerStatus(manager, error instanceof Error ? error.message : "Não foi possível remover a imagem.", "error");
    }
  }, true);

  actions.append(fileLabel, saveButton);
  if (imageUrl) actions.appendChild(removeButton);

  const status = document.createElement("p");
  status.dataset.attractionImageStatus = "true";
  status.dataset.tone = "muted";
  status.className = "attraction-image-status";
  status.textContent = imageUrl ? "Imagem ativa no card público." : "Aguardando imagem.";

  manager.append(heading, preview, fields, actions, status);
}

async function applyAdminAttractionManagers() {
  if (!isAdminEventContentPage()) return;
  const panel = findAdminAttractionsPanel();
  if (!panel) return;

  const assets = await loadAttractionAssets();
  const cards = findAdminAttractionCards(panel);

  cards.forEach((card, index) => {
    const inputs = Array.from(card.querySelectorAll<HTMLInputElement>("input"));
    const titleInput = inputs[0];
    if (!titleInput) return;

    let manager = card.querySelector<HTMLElement>("[data-attraction-image-manager]");
    const key = attractionAssetKey(titleInput.value, index);

    if (!manager) {
      manager = document.createElement("section");
      manager.dataset.attractionImageManager = "true";
      manager.className = "attraction-image-manager";
      card.appendChild(manager);

      titleInput.addEventListener("change", () => {
        const nextKey = attractionAssetKey(titleInput.value, index);
        renderAdminManagerContent(manager!, titleInput, index, assetsCache.get(nextKey));
      });
    }

    if (manager.dataset.attractionAssetKey !== key || manager.childElementCount === 0) {
      renderAdminManagerContent(manager, titleInput, index, assets.get(key));
    }
  });
}

async function applyPublicEventEnhancements() {
  if (currentPath() !== "/evento") return;

  removeConfirmedButton();

  const cards = findPublicProgramCards();
  if (!cards.length) return;

  const assets = await loadAttractionAssets();
  cards.forEach((card, index) => {
    const title = publicCardTitle(card);
    const key = attractionAssetKey(title, index);
    renderPublicCardImage(card, assets.get(key), title);
  });
}

async function applyEventProgramEnhancements() {
  if (applying) {
    applyAgain = true;
    return;
  }

  applying = true;
  try {
    const locationKey = currentLocationKey();
    if (locationKey !== lastLocation) {
      lastLocation = locationKey;
      assetsPromise = null;
    }

    await Promise.all([
      applyPublicEventEnhancements(),
      applyAdminAttractionManagers(),
    ]);
  } finally {
    applying = false;
    if (applyAgain) {
      applyAgain = false;
      scheduleApply();
    }
  }
}

function scheduleApply() {
  if (frameId !== null) return;
  frameId = window.requestAnimationFrame(() => {
    frameId = null;
    void applyEventProgramEnhancements();
  });
}

export function installEventProgramEnhancements() {
  if ((window as any).__hcEventProgramEnhancementsInstalled) return;
  (window as any).__hcEventProgramEnhancementsInstalled = true;

  scheduleApply();

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) startObserver();
  else window.addEventListener("DOMContentLoaded", startObserver, { once: true });

  window.addEventListener("popstate", scheduleApply);
}
