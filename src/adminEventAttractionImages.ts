import { CMS_ASSETS_BUCKET, CMS_EVENT_ID } from "./lib/cmsAdmin";
import { supabase } from "./lib/supabase";

const KNOWN_KEYS: Record<string, string> = {
  "banda grafith": "event_program_banda_grafith_image",
  "dj pedro sampaio": "event_program_dj_pedro_sampaio_image",
};

interface AttractionAsset {
  asset_key: string;
  file_url?: string | null;
  storage_path?: string | null;
  alt_text?: string | null;
  label?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
}

let cache = new Map<string, AttractionAsset>();
let loaded = false;
let scheduled = false;
let applying = false;

function normalize(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slug(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "atracao";
}

function assetKey(title: string, index: number) {
  const normalized = normalize(title);
  return KNOWN_KEYS[normalized] ?? `event_program_attraction_${slug(normalized || `item-${index + 1}`)}_image`;
}

function isEventEditor() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/admin/content" && new URLSearchParams(window.location.search).get("tab") === "event";
}

async function loadAssets(force = false) {
  if (loaded && !force) return cache;

  const { data, error } = await (supabase as any)
    .from("cms_assets")
    .select("asset_key,file_url,storage_path,alt_text,label,is_active,sort_order")
    .eq("event_id", CMS_EVENT_ID);

  if (error) throw error;

  cache = new Map<string, AttractionAsset>(
    ((data ?? []) as AttractionAsset[])
      .filter(item => item.asset_key.startsWith("event_program_attraction_") || Object.values(KNOWN_KEYS).includes(item.asset_key))
      .map(item => [item.asset_key, item]),
  );
  loaded = true;
  return cache;
}

async function saveAsset(asset: AttractionAsset) {
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
  cache.set(payload.asset_key, payload);
  return payload;
}

async function uploadFile(file: File, key: string) {
  const extension = slug(file.name.split(".").pop() || "bin");
  const storagePath = `${CMS_EVENT_ID}/${slug(key)}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(CMS_ASSETS_BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: true });

  if (error) throw error;
  const { data } = supabase.storage.from(CMS_ASSETS_BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

function findPanel() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("p,h2,h3"))
    .find(element => normalize(element.textContent) === "atracoes");
  if (!heading) return null;

  let current: HTMLElement | null = heading.parentElement;
  while (current && current !== document.body) {
    const hasAddButton = Array.from(current.querySelectorAll("button"))
      .some(button => normalize(button.textContent).includes("adicionar atracao"));
    const hasTitleFields = Array.from(current.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])'))
      .some(input => normalize(input.value) === "banda grafith" || normalize(input.value) === "dj pedro sampaio");

    if (hasAddButton && hasTitleFields) return current;
    current = current.parentElement;
  }

  return null;
}

function findCards(panel: HTMLElement) {
  const containers = Array.from(panel.querySelectorAll<HTMLElement>("div"));
  const container = containers.find(element => {
    const children = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    if (!children.length) return false;
    const cards = children.filter(child => child.querySelectorAll("input").length >= 2 && child.querySelector("button"));
    return cards.length > 0 && cards.length === children.length;
  });

  if (!container) return [] as HTMLElement[];
  return Array.from(container.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child.querySelectorAll("input").length >= 2);
}

function status(manager: HTMLElement, message: string, tone: "muted" | "ok" | "error" = "muted") {
  const element = manager.querySelector<HTMLElement>("[data-attraction-image-status]");
  if (!element) return;
  element.textContent = message;
  element.dataset.tone = tone;
}

function actionButton(label: string, onClick: () => void, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = danger
    ? "attraction-image-button attraction-image-button-danger"
    : "attraction-image-button";
  button.addEventListener("click", onClick);
  return button;
}

function renderManager(manager: HTMLElement, titleInput: HTMLInputElement, index: number, asset?: AttractionAsset) {
  manager.replaceChildren();

  const title = titleInput.value.trim() || `Atração ${index + 1}`;
  const key = assetKey(title, index);
  const imageUrl = asset?.is_active === false ? "" : asset?.file_url?.trim() || "";
  manager.dataset.attractionAssetKey = key;

  const heading = document.createElement("div");
  heading.className = "attraction-image-heading";
  heading.innerHTML = '<div><p class="attraction-image-label">Imagem da atração</p><p class="attraction-image-help">Upload integrado ao Supabase. A foto será exibida acima do título no card público.</p></div>';

  const preview = document.createElement("div");
  preview.className = "attraction-image-preview";
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = asset?.alt_text?.trim() || title;
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
  urlLabel.innerHTML = "<span>URL pública</span>";
  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.value = imageUrl;
  urlInput.placeholder = "https://...";
  urlLabel.appendChild(urlInput);

  const altLabel = document.createElement("label");
  altLabel.className = "attraction-image-field";
  altLabel.innerHTML = "<span>Texto alternativo</span>";
  const altInput = document.createElement("input");
  altInput.type = "text";
  altInput.value = asset?.alt_text?.trim() || title;
  altLabel.appendChild(altInput);
  fields.append(urlLabel, altLabel);

  const actions = document.createElement("div");
  actions.className = "attraction-image-actions";

  const uploadLabel = document.createElement("label");
  uploadLabel.className = "attraction-image-button attraction-image-upload";
  uploadLabel.textContent = "Enviar imagem";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/jpg,image/webp";
  fileInput.hidden = true;
  uploadLabel.appendChild(fileInput);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    fileInput.disabled = true;
    status(manager, "Enviando imagem...");
    try {
      const uploaded = await uploadFile(file, key);
      const saved = await saveAsset({
        asset_key: key,
        label: `Evento — atração: ${title}`,
        file_url: uploaded.publicUrl,
        storage_path: uploaded.storagePath,
        alt_text: altInput.value.trim() || title,
        sort_order: 100 + index,
        is_active: true,
      });
      renderManager(manager, titleInput, index, saved);
      status(manager, "Imagem enviada e salva no Supabase.", "ok");
    } catch (error) {
      status(manager, error instanceof Error ? error.message : "Não foi possível enviar a imagem.", "error");
    } finally {
      fileInput.disabled = false;
      fileInput.value = "";
    }
  });

  const saveButton = actionButton("Salvar URL", async () => {
    status(manager, "Salvando imagem...");
    try {
      const saved = await saveAsset({
        asset_key: key,
        label: `Evento — atração: ${title}`,
        file_url: urlInput.value.trim() || null,
        storage_path: asset?.storage_path ?? null,
        alt_text: altInput.value.trim() || title,
        sort_order: 100 + index,
        is_active: Boolean(urlInput.value.trim()),
      });
      renderManager(manager, titleInput, index, saved);
      status(manager, "Imagem salva no Supabase.", "ok");
    } catch (error) {
      status(manager, error instanceof Error ? error.message : "Não foi possível salvar a imagem.", "error");
    }
  });

  const removeButton = actionButton("Remover imagem", async () => {
    status(manager, "Removendo imagem...");
    try {
      const saved = await saveAsset({
        asset_key: key,
        label: `Evento — atração: ${title}`,
        file_url: null,
        storage_path: asset?.storage_path ?? null,
        alt_text: altInput.value.trim() || title,
        sort_order: 100 + index,
        is_active: false,
      });
      renderManager(manager, titleInput, index, saved);
      status(manager, "Imagem removida do card público.", "ok");
    } catch (error) {
      status(manager, error instanceof Error ? error.message : "Não foi possível remover a imagem.", "error");
    }
  }, true);

  actions.append(uploadLabel, saveButton);
  if (imageUrl) actions.appendChild(removeButton);

  const message = document.createElement("p");
  message.dataset.attractionImageStatus = "true";
  message.dataset.tone = "muted";
  message.className = "attraction-image-status";
  message.textContent = imageUrl ? "Imagem ativa no card público." : "Aguardando imagem.";

  manager.append(heading, preview, fields, actions, message);
}

async function apply() {
  if (applying || !isEventEditor()) return;
  applying = true;
  try {
    const panel = findPanel();
    if (!panel) return;

    const assets = await loadAssets();
    const cards = findCards(panel);

    cards.forEach((card, index) => {
      const inputs = Array.from(card.querySelectorAll<HTMLInputElement>("input"));
      const titleInput = inputs.find(input => input.type !== "file" && input.type !== "url");
      if (!titleInput) return;

      const key = assetKey(titleInput.value, index);
      let manager = card.querySelector<HTMLElement>("[data-attraction-image-manager-v2]");
      if (!manager) {
        manager = document.createElement("section");
        manager.dataset.attractionImageManagerV2 = "true";
        manager.className = "attraction-image-manager";
        card.appendChild(manager);

        titleInput.addEventListener("change", () => {
          const nextKey = assetKey(titleInput.value, index);
          renderManager(manager!, titleInput, index, cache.get(nextKey));
        });
      }

      if (manager.dataset.attractionAssetKey !== key || manager.childElementCount === 0) {
        renderManager(manager, titleInput, index, assets.get(key));
      }
    });
  } catch (error) {
    console.warn("Não foi possível montar o gerenciador de imagens das atrações.", error);
  } finally {
    applying = false;
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    void apply();
  });
}

export function installAdminEventAttractionImages() {
  if ((window as any).__hcAdminEventAttractionImagesInstalled) return;
  (window as any).__hcAdminEventAttractionImagesInstalled = true;

  schedule();
  const start = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });

  window.addEventListener("popstate", () => {
    loaded = false;
    schedule();
  });
}