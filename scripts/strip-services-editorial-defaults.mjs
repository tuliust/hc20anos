import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const servicesPath = path.join(root, 'src/lib/services.ts');

if (!fs.existsSync(servicesPath)) {
  console.error('src/lib/services.ts não encontrado. Execute este comando na raiz do projeto.');
  process.exit(1);
}

let source = fs.readFileSync(servicesPath, 'utf8');
const original = source;

const homeDefaultsPattern = /export const HOME_PAGE_CONTENT_DEFAULTS: HomePageContent = \{[\s\S]*?\n\};\n\nexport interface EventPageGalleryItem/;
const neutralHomeDefaults = `export const HOME_PAGE_CONTENT_DEFAULTS: HomePageContent = {
  event_id: DEFAULT_HOME_EVENT_ID,
  header_logo_url: null,
  favicon_url: null,
  hero_eyebrow: "",
  hero_title: "",
  hero_tagline: "",
  hero_subtitle: "",
  hero_event_line: "",
  primary_cta_label: "",
  secondary_cta_label: "",
  about_eyebrow: "",
  about_title: "",
  about_body_1: "",
  about_body_2: "",
  info_eyebrow: "",
  info_title: "",
  tickets_eyebrow: "",
  tickets_title: "",
  confirmed_eyebrow: "",
  confirmed_title: "",
  photos_eyebrow: "",
  photos_title: "",
  timeline_eyebrow: "",
  timeline_title: "",
  faq_eyebrow: "",
  faq_title: "",
};

export interface EventPageGalleryItem`;

const eventDefaultsPattern = /export const EVENT_PAGE_CONTENT_DEFAULTS: EventPageContent = \{[\s\S]*?\n\};\n\nfunction stringifyJsonField/;
const neutralEventDefaults = `export const EVENT_PAGE_CONTENT_DEFAULTS: EventPageContent = {
  event_id: DEFAULT_HOME_EVENT_ID,
  hero_eyebrow: "",
  title: "",
  subtitle: "",
  description: "",
  hero_image_url: null,
  gallery_json: "[]",
  map_embed_url: "",
  map_link_url: "",
  venue_notes: "",
  attractions_json: "[]",
  schedule_json: "[]",
  food_bar_text: "",
  bathrooms_text: "",
  security_text: "",
  extra_info_json: "[]",
};

function stringifyJsonField`;

if (!homeDefaultsPattern.test(source)) {
  console.error('Não encontrei o bloco HOME_PAGE_CONTENT_DEFAULTS no formato esperado. Nenhuma alteração aplicada.');
  process.exit(1);
}

if (!eventDefaultsPattern.test(source)) {
  console.error('Não encontrei o bloco EVENT_PAGE_CONTENT_DEFAULTS no formato esperado. Nenhuma alteração aplicada.');
  process.exit(1);
}

source = source.replace(homeDefaultsPattern, neutralHomeDefaults);
source = source.replace(eventDefaultsPattern, neutralEventDefaults);

if (source === original) {
  console.log('Nenhuma alteração necessária.');
  process.exit(0);
}

fs.writeFileSync(servicesPath, source, 'utf8');
console.log('Defaults editoriais de src/lib/services.ts neutralizados fisicamente.');
console.log('Agora rode: npm run audit:cms-strict && npm run build');
