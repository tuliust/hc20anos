import { CMS_EVENT_ID, DEFAULT_CMS_ASSETS, type CmsAsset } from "./lib/cmsAdmin";
import { supabase } from "./lib/supabase";

const ATTRACTION_ASSETS = [
  {
    asset_key: "event_program_banda_grafith_image",
    label: "Evento — atração: Banda Grafith",
    alt_text: "Banda Grafith",
    usage_context: "event.program.attraction.banda-grafith",
    sort_order: 31,
    is_active: true,
    titleMatch: "banda grafith",
    fallbackIndex: 0,
  },
  {
    asset_key: "event_program_dj_pedro_sampaio_image",
    label: "Evento — atração: DJ Pedro Sampaio",
    alt_text: "DJ Pedro Sampaio",
    usage_context: "event.program.attraction.dj-pedro-sampaio",
    sort_order: 32,
    is_active: true,
    titleMatch: "dj pedro sampaio",
    fallbackIndex: 1,
  },
] as const;

type AttractionAssetKey = (typeof ATTRACTION_ASSETS)[number]["asset_key"];
type PublicCmsAsset = Pick<CmsAsset, "asset_key" | "file_url" | "alt_text" | "label" | "is_active">;

let assetsPromise: Promise<Map<AttractionAssetKey, PublicCmsAsset>> | null = null;
let lastPath = "";
let frameId: number | null = null;
let applying = false;
let applyAgain = false;

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

function registerAdminAssets() {
  for (const config of ATTRACTION_ASSETS) {
    if (DEFAULT_CMS_ASSETS.some(asset => asset.asset_key === config.asset_key)) continue;
    DEFAULT_CMS_ASSETS.push({
      event_id: CMS_EVENT_ID,
      asset_key: config.asset_key,
      label: config.label,
      alt_text: config.alt_text,
      usage_context: config.usage_context,
      sort_order: config.sort_order,
      is_active: config.is_active,
    });
  }
}

async function loadAttractionAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      try {
        const keys = ATTRACTION_ASSETS.map(item => item.asset_key);
        const { data, error } = await (supabase as any)
          .from("cms_assets")
          .select("asset_key,file_url,alt_text,label,is_active")
          .eq("event_id", CMS_EVENT_ID)
          .in("asset_key", keys)
          .eq("is_active", true);

        if (error) throw error;

        return new Map<AttractionAssetKey, PublicCmsAsset>(
          ((data ?? []) as PublicCmsAsset[])
            .filter(asset => keys.includes(asset.asset_key as AttractionAssetKey))
            .map(asset => [asset.asset_key as AttractionAssetKey, asset]),
        );
      } catch (error) {
        console.warn("Não foi possível carregar as imagens das atrações.", error);
        return new Map<AttractionAssetKey, PublicCmsAsset>();
      }
    })();
  }

  return assetsPromise;
}

function findEventHero() {
  return Array.from(document.querySelectorAll<HTMLElement>("main section"))
    .find(section => {
      const heading = section.querySelector("h1");
      return heading && normalizeText(heading.textContent).includes("o evento");
    }) ?? null;
}

function removeConfirmedButton() {
  const hero = findEventHero();
  if (!hero) return;

  const button = Array.from(hero.querySelectorAll<HTMLButtonElement>("button"))
    .find(item => normalizeText(item.textContent).includes("ver confirmados"));

  button?.remove();
}

function findProgramCards() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
  const section = sections.find(item => {
    const heading = item.querySelector("h2");
    return normalizeText(heading?.textContent).includes("horarios e atracoes");
  });

  if (!section) return [] as HTMLElement[];

  const programGrid = Array.from(section.querySelectorAll<HTMLElement>("div"))
    .find(item => String(item.className).includes("lg:grid-cols-[0.9fr_1.1fr]"));
  const attractionsColumn = programGrid?.children.item(1);
  if (!(attractionsColumn instanceof HTMLElement)) return [] as HTMLElement[];

  return Array.from(attractionsColumn.children)
    .filter((item): item is HTMLElement => item instanceof HTMLElement);
}

function cardTitle(card: HTMLElement) {
  const title = Array.from(card.querySelectorAll<HTMLElement>("p,h3"))
    .find(item => String(item.className).includes("font-semibold"));
  return normalizeText(title?.textContent);
}

function renderCardImage(card: HTMLElement, asset: PublicCmsAsset | undefined, fallbackAlt: string) {
  const existing = card.querySelector<HTMLElement>("[data-event-program-attraction-image]");
  const imageUrl = asset?.file_url?.trim() ?? "";

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

async function applyEventProgramEnhancements() {
  if (applying) {
    applyAgain = true;
    return;
  }

  applying = true;
  try {
    const path = currentPath();
    if (path !== lastPath) {
      lastPath = path;
      assetsPromise = null;
    }
    if (path !== "/evento") return;

    removeConfirmedButton();

    const cards = findProgramCards();
    if (!cards.length) return;

    const assets = await loadAttractionAssets();
    for (const config of ATTRACTION_ASSETS) {
      const matchedCard = cards.find(card => cardTitle(card).includes(config.titleMatch));
      const card = matchedCard ?? cards[config.fallbackIndex];
      if (!card) continue;
      renderCardImage(card, assets.get(config.asset_key), config.alt_text);
    }
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

  registerAdminAssets();
  scheduleApply();

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) startObserver();
  else window.addEventListener("DOMContentLoaded", startObserver, { once: true });

  window.addEventListener("popstate", scheduleApply);
}
