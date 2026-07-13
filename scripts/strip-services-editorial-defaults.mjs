import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const servicesPath = path.join(root, 'src/lib/services.ts');

if (!fs.existsSync(servicesPath)) {
  console.error('src/lib/services.ts não encontrado. Execute este comando na raiz do projeto.');
  process.exit(1);
}

const rawSource = fs.readFileSync(servicesPath, 'utf8');
const preferredNewline = rawSource.includes('\r\n') ? '\r\n' : '\n';
let source = rawSource.replace(/\r\n/g, '\n');
const original = source;

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

`;

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

`;

function replaceBlock({ label, startMarker, endMarker, replacement }) {
  const start = source.indexOf(startMarker);
  if (start === -1) {
    console.error(`Não encontrei o início do bloco ${label}. Nenhuma alteração aplicada.`);
    process.exit(1);
  }

  const end = source.indexOf(endMarker, start);
  if (end === -1) {
    console.error(`Não encontrei o fim do bloco ${label}. Nenhuma alteração aplicada.`);
    process.exit(1);
  }

  source = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

replaceBlock({
  label: 'HOME_PAGE_CONTENT_DEFAULTS',
  startMarker: 'export const HOME_PAGE_CONTENT_DEFAULTS: HomePageContent = {',
  endMarker: 'export interface EventPageGalleryItem',
  replacement: neutralHomeDefaults,
});

replaceBlock({
  label: 'EVENT_PAGE_CONTENT_DEFAULTS',
  startMarker: 'export const EVENT_PAGE_CONTENT_DEFAULTS: EventPageContent = {',
  endMarker: 'function stringifyJsonField',
  replacement: neutralEventDefaults,
});

if (source === original) {
  console.log('Nenhuma alteração necessária. Defaults editoriais já estavam neutros.');
  process.exit(0);
}

const output = preferredNewline === '\r\n' ? source.replace(/\n/g, '\r\n') : source;
fs.writeFileSync(servicesPath, output, 'utf8');
console.log('Defaults editoriais de src/lib/services.ts neutralizados fisicamente.');
console.log('Agora rode: npm run audit:cms-strict && npm run build');
