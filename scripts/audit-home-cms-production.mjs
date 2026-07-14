import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const eventId = "00000000-0000-0000-0000-000000000001";
const productionMode = process.argv.includes("--production");

const fieldGroups = {
  header: [
    "header_logo_url", "header_logo_alt", "header_fallback_badge_main", "header_fallback_badge_year",
    "header_fallback_title", "header_fallback_subtitle", "header_cta_label", "header_cta_visible", "header_auth_visible",
  ],
  navigation: [
    "nav_home_label", "nav_event_label", "nav_ex_alumni_label", "nav_who_going_label", "nav_the_class_label",
    "nav_photos_label", "nav_memories_label", "nav_polls_label", "nav_where_now_label", "nav_archive_label",
    "nav_home_visible", "nav_event_visible", "nav_ex_alumni_visible", "nav_who_going_visible", "nav_the_class_visible",
    "nav_photos_visible", "nav_memories_visible", "nav_polls_visible", "nav_where_now_visible", "nav_archive_visible",
  ],
  hero: [
    "hero_eyebrow", "hero_title", "hero_tagline", "hero_subtitle", "hero_event_line",
    "primary_cta_label", "primary_cta_page", "secondary_cta_label", "secondary_cta_page",
    "countdown_days_label", "countdown_hours_label", "countdown_minutes_label", "countdown_seconds_label",
  ],
  home: [
    "home_sections_json", "about_eyebrow", "about_title", "about_body_1", "about_body_2",
    "home_about_overview_json", "home_alumni_overview_json", "home_nostalgia_timeline_json",
    "info_eyebrow", "info_title", "event_info_view_more_label", "info_date_label", "info_time_label",
    "info_location_label", "info_doors_subtitle_template", "info_dinner_subtitle_template", "info_time_fallback_label",
    "tickets_eyebrow", "tickets_title", "tickets_preview_limit", "tickets_view_all_label", "tickets_active_lot_label",
    "tickets_buy_label", "tickets_sold_out_label", "tickets_empty_title", "tickets_empty_subtitle",
    "tickets_empty_cta_label", "tickets_remaining_label_template", "confirmed_eyebrow", "confirmed_title",
    "confirmed_preview_limit", "confirmed_view_all_label", "confirmed_privacy_note", "photos_eyebrow", "photos_title",
    "photos_preview_limit", "photos_view_all_label", "photos_empty_title", "photos_empty_subtitle", "photos_empty_cta_label",
    "timeline_eyebrow", "timeline_title", "timeline_items_json", "faq_eyebrow", "faq_title", "faq_items_json",
  ],
  footer: [
    "footer_links_json", "footer_eyebrow", "footer_title", "footer_body", "footer_nav_title", "footer_contact_title",
    "footer_email", "footer_phone", "footer_location", "footer_copyright", "footer_terms_label",
    "footer_privacy_label", "footer_admin_label",
  ],
};

const fields = Object.values(fieldGroups).flat();
const jsonFields = new Set(fields.filter(field => field.endsWith("_json")));
const optionalValues = new Set(["header_logo_url", "hero_subtitle", "footer_phone"]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readEnv(relativePath) {
  const result = {};
  if (!fs.existsSync(path.join(root, relativePath))) return result;
  for (const line of read(relativePath).split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;
    result[match[1].trim()] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return result;
}

function hasValue(value) {
  if (typeof value === "boolean" || typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function validJsonValue(field, value) {
  if (!jsonFields.has(field)) return true;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return hasValue(parsed);
  } catch {
    return false;
  }
}

const migrations = fs.readdirSync(path.join(root, "supabase/migrations"))
  .filter(file => file.endsWith(".sql"))
  .map(file => read(`supabase/migrations/${file}`))
  .join("\n");
const databaseTypes = read("src/lib/database.types.ts");
const services = read("src/lib/services.ts");
const app = read("src/app/App.tsx");
const admin = `${app}\n${read("src/app/CmsAdminPanels.tsx")}`;
const failures = [];

for (const field of fields) {
  if (!migrations.includes(field)) failures.push(`${field}: ausente nas migrations`);
  if (!databaseTypes.includes(field)) failures.push(`${field}: ausente em database.types.ts`);
  if (!app.includes(field)) failures.push(`${field}: ausente no consumo da Home`);
  if (!admin.includes(field)) failures.push(`${field}: ausente no Admin`);
}

if (!services.includes('.from("home_page_content")') || !services.includes("updateHomePageContent")) {
  failures.push("home_page_content: leitura/gravação oficial ausente em services.ts");
}

let productionRow = null;
if (productionMode) {
  const env = { ...readEnv(".env"), ...readEnv(".env.local"), ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    failures.push("produção: VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não configurados");
  } else {
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/home_page_content?select=*&event_id=eq.${eventId}`;
    const response = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!response.ok) {
      failures.push(`produção: Supabase respondeu HTTP ${response.status}`);
    } else {
      const rows = await response.json();
      productionRow = rows[0] ?? null;
      if (!productionRow) failures.push(`produção: registro ${eventId} não encontrado`);
    }
  }
}

if (productionRow) {
  for (const field of fields) {
    if (!(field in productionRow)) {
      failures.push(`${field}: coluna ausente no Supabase de produção`);
      continue;
    }
    if (!optionalValues.has(field) && !hasValue(productionRow[field])) {
      failures.push(`${field}: valor obrigatório vazio no Supabase de produção`);
    }
    if (!validJsonValue(field, productionRow[field])) {
      failures.push(`${field}: JSON vazio ou inválido no Supabase de produção`);
    }
  }
}

console.log("\nAuditoria da Home CMS");
for (const [group, groupFields] of Object.entries(fieldGroups)) {
  const liveCount = productionRow ? groupFields.filter(field => field in productionRow && (optionalValues.has(field) || hasValue(productionRow[field]))).length : 0;
  console.log(`- ${group}: ${groupFields.length} campos integrados${productionRow ? `; ${liveCount}/${groupFields.length} preenchidos em produção` : ""}`);
}

if (failures.length) {
  console.error("\nAuditoria da Home CMS falhou:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(productionMode ? "\nAuditoria de código e Supabase de produção passou." : "\nAuditoria de código passou.");
