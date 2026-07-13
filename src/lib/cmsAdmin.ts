import { supabase } from "./supabase";

export const CMS_EVENT_ID = "00000000-0000-0000-0000-000000000001";
export const CMS_ASSETS_BUCKET = "cms-assets";

export type PublicPageSlug = "ex-alunos" | "memorias" | "curiosidades" | "pos-festa";

export interface PublicPageConfig {
  slug: PublicPageSlug;
  label: string;
  rows: number;
}

export const PUBLIC_PAGE_CONFIG: PublicPageConfig[] = [
  { slug: "ex-alunos", label: "Ex-alunos", rows: 8 },
  { slug: "memorias", label: "Memórias", rows: 6 },
  { slug: "curiosidades", label: "Curiosidades", rows: 14 },
  { slug: "pos-festa", label: "Pós-festa", rows: 8 },
];

export interface PublicPageContentRow {
  event_id: string;
  page_slug: PublicPageSlug;
  content_json: Record<string, unknown>;
  updated_at?: string | null;
  updated_by_admin_id?: string | null;
}

export interface CmsAsset {
  id?: string;
  event_id?: string;
  asset_key: string;
  label: string;
  file_url?: string | null;
  storage_path?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  usage_context?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  updated_at?: string | null;
  updated_by_admin_id?: string | null;
}

export const DEFAULT_CMS_ASSETS: CmsAsset[] = [
  {
    event_id: CMS_EVENT_ID,
    asset_key: "home_hero_background",
    label: "Home — imagem de fundo do hero",
    alt_text: "Imagem de fundo da página inicial",
    usage_context: "home.hero",
    sort_order: 10,
    is_active: true,
  },
  {
    event_id: CMS_EVENT_ID,
    asset_key: "event_hero_image",
    label: "Evento — imagem principal",
    alt_text: "Imagem principal da página do evento",
    usage_context: "event.hero",
    sort_order: 20,
    is_active: true,
  },
  {
    event_id: CMS_EVENT_ID,
    asset_key: "event_program_image",
    label: "Evento — imagem da programação",
    alt_text: "Imagem da programação do evento",
    usage_context: "event.program",
    sort_order: 30,
    is_active: true,
  },
  {
    event_id: CMS_EVENT_ID,
    asset_key: "archive_coming_soon_image",
    label: "Pós-festa — imagem de espera",
    alt_text: "Imagem de espera da página pós-festa",
    usage_context: "archive.coming_soon",
    sort_order: 40,
    is_active: true,
  },
  {
    event_id: CMS_EVENT_ID,
    asset_key: "header_logo",
    label: "Cabeçalho — logo",
    alt_text: "Logo do site",
    usage_context: "global.header",
    sort_order: 50,
    is_active: true,
  },
  {
    event_id: CMS_EVENT_ID,
    asset_key: "favicon",
    label: "Navegador — favicon",
    alt_text: "Ícone do site",
    usage_context: "global.favicon",
    sort_order: 60,
    is_active: true,
  },
];

export interface CmsHealthRow {
  label: string;
  ok: boolean;
  detail: string;
}

const REQUIRED_HOME_FIELDS = [
  "hero_eyebrow",
  "hero_title",
  "hero_tagline",
  "hero_subtitle",
  "hero_event_line",
  "primary_cta_label",
  "secondary_cta_label",
  "about_eyebrow",
  "about_title",
  "about_body_1",
  "about_body_2",
  "info_eyebrow",
  "info_title",
  "tickets_eyebrow",
  "tickets_title",
  "confirmed_eyebrow",
  "confirmed_title",
  "photos_eyebrow",
  "photos_title",
  "timeline_eyebrow",
  "timeline_title",
  "faq_eyebrow",
  "faq_title",
];

const REQUIRED_EVENT_FIELDS = [
  "hero_eyebrow",
  "title",
  "subtitle",
  "description",
  "venue_notes",
  "food_bar_text",
  "bathrooms_text",
  "security_text",
];

const REQUIRED_PUBLIC_PAGES: PublicPageSlug[] = ["ex-alunos", "memorias", "curiosidades", "pos-festa"];
const REQUIRED_ASSETS = ["event_program_image", "header_logo", "favicon"];

function isBlank(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

function normalizeCmsAsset(asset: Partial<CmsAsset>, index: number, eventId: string): CmsAsset {
  const assetKey = asset.asset_key?.trim() || "";
  return {
    event_id: eventId,
    asset_key: assetKey,
    label: asset.label?.trim() || assetKey,
    file_url: asset.file_url?.trim() || null,
    storage_path: asset.storage_path?.trim() || null,
    alt_text: asset.alt_text?.trim() || null,
    caption: asset.caption?.trim() || null,
    usage_context: asset.usage_context?.trim() || null,
    sort_order: Number(asset.sort_order ?? index * 10),
    is_active: asset.is_active !== false,
  };
}

function safeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "asset";
}

export async function getPublicPageContentMap(eventId = CMS_EVENT_ID) {
  const { data, error } = await (supabase as any)
    .from("public_page_content")
    .select("page_slug,content_json")
    .eq("event_id", eventId);

  if (error) throw error;

  const map = new Map<PublicPageSlug, Record<string, unknown>>();
  (data ?? []).forEach((row: { page_slug?: PublicPageSlug; content_json?: Record<string, unknown> | null }) => {
    if (!row.page_slug) return;
    map.set(row.page_slug, row.content_json ?? {});
  });

  return map;
}

export async function savePublicPageContent(
  rows: Array<Pick<PublicPageContentRow, "page_slug" | "content_json">>,
  eventId = CMS_EVENT_ID,
  adminId?: string | null,
) {
  const payload = rows.map(row => ({
    event_id: eventId,
    page_slug: row.page_slug,
    content_json: row.content_json ?? {},
    updated_by_admin_id: adminId ?? null,
  }));

  const { error } = await (supabase as any)
    .from("public_page_content")
    .upsert(payload, { onConflict: "event_id,page_slug" });

  if (error) throw error;
}

export async function listCmsAssets(eventId = CMS_EVENT_ID): Promise<CmsAsset[]> {
  const { data, error } = await (supabase as any)
    .from("cms_assets")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const byKey = new Map<string, CmsAsset>();
  [...DEFAULT_CMS_ASSETS.map(asset => ({ ...asset, event_id: eventId })), ...((data ?? []) as CmsAsset[])].forEach((asset, index) => {
    if (!asset.asset_key) return;
    byKey.set(asset.asset_key, normalizeCmsAsset({ ...byKey.get(asset.asset_key), ...asset }, index, eventId));
  });

  return Array.from(byKey.values()).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

export async function saveCmsAssets(assets: Partial<CmsAsset>[], eventId = CMS_EVENT_ID, adminId?: string | null) {
  const payload = assets
    .map((asset, index) => normalizeCmsAsset(asset, index, eventId))
    .filter(asset => asset.asset_key)
    .map(asset => ({ ...asset, updated_by_admin_id: adminId ?? null }));

  const { error } = await (supabase as any)
    .from("cms_assets")
    .upsert(payload, { onConflict: "event_id,asset_key" });

  if (error) throw error;
}

export async function uploadCmsAssetFile(file: File, assetKey: string, eventId = CMS_EVENT_ID) {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const storagePath = `${eventId}/${safeName(assetKey)}-${Date.now()}.${safeName(extension ?? "bin")}`;

  const { error } = await supabase.storage
    .from(CMS_ASSETS_BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(CMS_ASSETS_BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

export async function getCmsContentHealth(eventId = CMS_EVENT_ID): Promise<CmsHealthRow[]> {
  const [homeResult, eventResult, publicResult, assetsResult] = await Promise.all([
    (supabase as any).from("home_page_content").select("*").eq("event_id", eventId).maybeSingle(),
    (supabase as any).from("event_page_content").select("*").eq("event_id", eventId).maybeSingle(),
    (supabase as any).from("public_page_content").select("page_slug,content_json").eq("event_id", eventId),
    (supabase as any).from("cms_assets").select("asset_key,file_url,is_active").eq("event_id", eventId),
  ]);

  const rows: CmsHealthRow[] = [];

  if (homeResult.error) {
    rows.push({ label: "Home", ok: false, detail: homeResult.error.message });
  } else {
    const missing = REQUIRED_HOME_FIELDS.filter(field => isBlank(homeResult.data?.[field]));
    rows.push({
      label: "Home — campos editoriais",
      ok: missing.length === 0,
      detail: missing.length ? `Campos vazios: ${missing.join(", ")}` : "Todos os campos obrigatórios estão preenchidos no Supabase.",
    });
  }

  if (eventResult.error) {
    rows.push({ label: "Evento", ok: false, detail: eventResult.error.message });
  } else {
    const missing = REQUIRED_EVENT_FIELDS.filter(field => isBlank(eventResult.data?.[field]));
    const hasExternalFallback = String(eventResult.data?.gallery_json ?? "").includes("images.unsplash.com");
    rows.push({
      label: "Evento — campos editoriais",
      ok: missing.length === 0 && !hasExternalFallback,
      detail: [
        missing.length ? `Campos vazios: ${missing.join(", ")}` : "Campos principais preenchidos.",
        hasExternalFallback ? "Galeria ainda contém imagens Unsplash herdadas de fallback." : "Sem imagens Unsplash na galeria.",
      ].join(" "),
    });
  }

  if (publicResult.error) {
    rows.push({ label: "Páginas públicas", ok: false, detail: publicResult.error.message });
  } else {
    const existing = new Set((publicResult.data ?? []).map((row: { page_slug?: string }) => row.page_slug));
    const missingPages = REQUIRED_PUBLIC_PAGES.filter(slug => !existing.has(slug));
    rows.push({
      label: "Páginas públicas secundárias",
      ok: missingPages.length === 0,
      detail: missingPages.length ? `Páginas sem conteúdo: ${missingPages.join(", ")}` : "Todas as páginas secundárias têm content_json.",
    });
  }

  if (assetsResult.error) {
    rows.push({ label: "Assets", ok: false, detail: assetsResult.error.message });
  } else {
    const assetMap = new Map((assetsResult.data ?? []).map((asset: CmsAsset) => [asset.asset_key, asset]));
    const missingAssets = REQUIRED_ASSETS.filter(key => {
      const asset = assetMap.get(key);
      return !asset || asset.is_active === false || isBlank(asset.file_url);
    });
    rows.push({
      label: "Assets essenciais",
      ok: missingAssets.length === 0,
      detail: missingAssets.length ? `Sem URL ativa: ${missingAssets.join(", ")}` : "Assets essenciais têm URL ativa.",
    });
  }

  return rows;
}
