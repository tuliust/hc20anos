import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function assertIncludes(file, text, message) {
  const content = read(file);
  if (!content.includes(text)) fail(`${file}: ${message}`);
}

function assertNotIncludes(file, text, message) {
  const content = read(file);
  if (content.includes(text)) fail(`${file}: ${message}`);
}

function assertNotExists(file, message) {
  if (exists(file)) fail(`${file}: ${message}`);
}

function countOccurrences(content, pattern) {
  if (typeof pattern === 'string') {
    return content.split(pattern).length - 1;
  }
  return [...content.matchAll(pattern)].length;
}

function collectFiles(dir, acc = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return acc;

  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      collectFiles(relative, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs|html)$/.test(entry.name)) {
      acc.push(relative);
    }
  }

  return acc;
}

function countInFiles(files, pattern) {
  return files.reduce((sum, file) => sum + countOccurrences(read(file), pattern), 0);
}

const srcFiles = collectFiles('src');
const indexHtml = read('index.html');
const services = exists('src/lib/services.ts') ? read('src/lib/services.ts') : '';

// Arquitetura de entrada única.
assertIncludes('index.html', '/src/main.tsx', 'index.html deve carregar apenas a entrada React principal.');
for (const obsoleteScript of [
  'home-final-layout',
  'home-timeline-year-icons',
  'home-confirmed-presence-layout',
  'navigation-fallback',
  'global-page-margins',
  'home-cms-strict',
  'admin-home-cms-extras',
  'admin-event-cms-extras',
  'admin-public-pages-cms',
  'admin-cms-assets',
  'admin-cms-content-health',
  'final-public-adjustments',
  'public-pages-cms',
]) {
  if (indexHtml.includes(obsoleteScript)) {
    fail(`index.html: script obsoleto reintroduzido: ${obsoleteScript}`);
  }
}

// Arquivos runtime obsoletos não podem voltar.
for (const file of [
  'src/global-page-margins.ts',
  'src/home-final-layout.tsx',
  'src/home-timeline-year-icons.tsx',
  'src/home-confirmed-presence-layout.ts',
  'src/navigation-fallback.ts',
  'src/home-cms-strict.tsx',
  'src/public-pages-cms.ts',
  'src/final-public-adjustments.ts',
  'src/admin-cms-content-health.ts',
  'src/admin-cms-assets.ts',
  'src/admin-public-pages-cms.ts',
  'src/admin-home-cms-extras.ts',
  'src/admin-event-cms-extras.ts',
]) {
  assertNotExists(file, 'runtime provisório obsoleto não deve existir.');
}

// Proteções strict obrigatórias.
assertIncludes('src/main.tsx', 'installNeutralCmsDefaults();', 'neutralização CMS deve rodar antes do primeiro render.');
assertIncludes('src/main.tsx', '<PublicCmsStrictGuard />', 'guard público strict deve estar montado no root React.');
assertIncludes('src/main.tsx', '<AdminCmsPanelsMount />', 'painéis CMS admin devem estar montados no root React.');
assertIncludes('src/lib/neutralCmsDefaults.ts', 'MOCK_PEOPLE.splice(0, MOCK_PEOPLE.length)', 'mock exportado de pessoas deve ser zerado em modo strict.');
assertIncludes('src/lib/neutralCmsDefaults.ts', 'is_visible: false', 'seções neutras da Home devem ficar invisíveis quando CMS estiver vazio.');
assertIncludes('src/app/PublicCmsStrictGuard.tsx', 'const EVENT_PATH = "/evento"', 'rota /evento deve estar protegida.');
assertIncludes('src/app/PublicCmsStrictGuard.tsx', 'getEventPageContent(DEFAULT_EVENT_ID)', 'guard deve validar CMS do evento pelo serviço oficial.');
assertIncludes('src/app/PublicCmsStrictGuard.tsx', 'const TICKET_PATHS', 'rotas de ingressos devem estar protegidas.');
assertIncludes('src/app/PublicCmsStrictGuard.tsx', 'const PEOPLE_PATHS', 'rotas de pessoas devem estar protegidas.');
assertIncludes('src/app/PublicCmsStrictGuard.tsx', '.from("ticket_types")', 'guard deve validar tipos de ingresso reais no Supabase.');
assertIncludes('src/app/PublicCmsStrictGuard.tsx', '.from("people")', 'guard deve validar base real de pessoas no Supabase.');

// Defaults editoriais do serviço já foram removidos fisicamente e não podem voltar.
for (const forbiddenServicesText of [
  'Colégio Henrique Castriciano · Natal, RN',
  'Turma 2006 — 20 anos depois',
  'O reencontro dos ex-alunos do Colégio Henrique Castriciano',
  '17 de Outubro de 2026 · Espaço Cultural Ponta Negra · Natal, RN',
  'Uma noite para celebrar quem a gente se tornou',
  'Tudo sobre a noite em que a Turma 2006 volta a se encontrar.',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
]) {
  if (services.includes(forbiddenServicesText)) {
    fail(`src/lib/services.ts: default editorial removido foi reintroduzido: ${forbiddenServicesText}`);
  }
}

// Relatório informativo dos legados físicos ainda pendentes.
const legacyCounts = {
  unsplashInSrc: countInFiles(srcFiles, 'images.unsplash.com'),
  colegioInSrc: countInFiles(srcFiles, 'Colégio Henrique Castriciano'),
  turma2006InSrc: countInFiles(srcFiles, 'Turma 2006'),
  fallbackEventDateInApp: exists('src/app/App.tsx') ? countOccurrences(read('src/app/App.tsx'), '2026-10-17') : 0,
  mockTicketTypesInServices: exists('src/lib/services.ts') ? countOccurrences(read('src/lib/services.ts'), 'MOCK_TICKET_TYPES') : 0,
};

for (const [key, value] of Object.entries(legacyCounts)) {
  warn(`${key}: ${value}`);
}

if (warnings.length) {
  console.log('\nStrict CMS audit — contagem informativa de legado físico:');
  for (const message of warnings) console.log(`- ${message}`);
}

if (failures.length) {
  console.error('\nStrict CMS audit falhou:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('\nStrict CMS audit passou.');
