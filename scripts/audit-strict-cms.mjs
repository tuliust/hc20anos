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
const app = exists('src/app/App.tsx') ? read('src/app/App.tsx') : '';

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

// Apenas main.tsx pode criar o root React.
for (const file of srcFiles) {
  if (file === 'src/main.tsx') continue;
  if (read(file).includes('createRoot(')) {
    fail(`${file}: createRoot secundÃ¡rio nÃ£o deve ser reintroduzido.`);
  }
}

// Componentes restaurados da Home devem continuar montados nativamente.
for (const [text, message] of [
  ['function HomeAlumniOverviewPanel', 'painel restaurado de ex-alunos deve existir.'],
  ['<WhoGoingPreview', 'painel de ex-alunos deve estar montado na seÃ§Ã£o confirmed.'],
  ['function CompactNostalgiaTimeline', 'timeline nostÃ¡lgica compacta deve existir como componente React.'],
  ['<CompactNostalgiaTimeline', 'timeline nostÃ¡lgica compacta deve estar montada na seÃ§Ã£o Sobre.'],
  ['event_info_view_more_label', 'CTA de informaÃ§Ãµes do evento deve ser controlado pelo CMS.'],
  ['home_about_overview_json', 'copy restaurada da seÃ§Ã£o Sobre deve vir do CMS.'],
  ['data-home-event-cta', 'CTA de evento deve manter seletor estÃ¡vel para regressÃ£o.'],
  ['data-home-nostalgia-timeline', 'timeline deve manter seletor estÃ¡vel para regressÃ£o.'],
  ['data-home-alumni-overview', 'painel de ex-alunos deve manter seletor estÃ¡vel para regressÃ£o.'],
  ['confirmedPreviewLimit', 'grade de confirmados deve respeitar o limite configurado no CMS.'],
]) {
  if (!app.includes(text)) fail(`src/app/App.tsx: ${message}`);
}

for (const [file, message] of [
  ['scripts/audit-home-cms-production.mjs', 'auditoria de integraÃ§Ã£o e dados reais do CMS deve existir.'],
  ['playwright.config.ts', 'configuraÃ§Ã£o Playwright deve existir.'],
  ['tests/e2e/home-regression.spec.ts', 'testes funcionais da Home devem existir.'],
  ['tests/e2e/home-visual.spec.ts', 'testes responsivos da Home devem existir.'],
]) {
  if (!exists(file)) fail(`${file}: ${message}`);
}

assertIncludes('package.json', '"test:e2e"', 'script de regressÃ£o Playwright deve permanecer configurado.');
assertIncludes('package.json', '"audit:cms-production"', 'script de auditoria do Supabase real deve permanecer configurado.');

// FAQ relacional: fonte estruturada, filtros públicos e Admin individual não podem regredir.
for (const [file, message] of [
  ['src/lib/faq.ts', 'serviço relacional de FAQ deve existir.'],
  ['src/lib/faqPresentation.ts', 'filtros públicos puros do FAQ devem existir.'],
  ['src/app/home/HomeFaqSection.tsx', 'componente público estruturado deve existir.'],
  ['src/app/home/HomeFaqSectionLoader.tsx', 'loader público do FAQ deve existir.'],
  ['src/app/admin/faq/AdminFaqPanel.tsx', 'painel administrativo relacional deve existir.'],
  ['tests/unit/faq.test.mjs', 'testes unitários do FAQ devem existir.'],
]) {
  if (!exists(file)) fail(`${file}: ${message}`);
}

assertIncludes('src/app/App.tsx', '<HomeFaqSectionLoader', 'Home deve montar o FAQ estruturado.');
assertIncludes('src/app/App.tsx', '<AdminFaqPanel', 'AdminFaqPanel deve permanecer montado na aba FAQ.');
assertIncludes('src/app/App.tsx', 'faq_items_json: _legacyFaqItemsJson', 'salvamento geral da Home deve remover o JSON legado do payload.');
assertNotIncludes('src/app/App.tsx', 'setFaqDraftItems', 'editor antigo de array JSON não pode ser reintroduzido.');
assertNotIncludes('src/app/App.tsx', 'faqDraftItems', 'draft antigo do FAQ JSON não pode ser reintroduzido.');
assertNotIncludes('src/app/App.tsx', 'parseHomeJsonArray<FAQItemContent>', 'Home não pode voltar a ler FAQ exclusivamente do JSON.');
assertIncludes('src/app/home/HomeFaqSectionLoader.tsx', 'getPublicFaqItems(props.eventId)', 'Home deve usar getPublicFaqItems.');
assertIncludes('src/app/home/HomeFaqSectionLoader.tsx', 'getPublicFaqCategories(props.eventId)', 'Home deve carregar categorias relacionais.');
assertIncludes('src/lib/faq.ts', '.eq("is_visible", true)', 'consulta pública deve filtrar visibilidade.');
assertIncludes('src/lib/faq.ts', '.is("deleted_at", null)', 'consulta pública deve excluir soft deletes.');
assertIncludes('src/lib/faq.ts', '.eq("category.is_visible", true)', 'consulta pública deve filtrar categoria oculta.');
assertIncludes('src/lib/faq.ts', 'hasStructuredFaqItems(eventId)', 'fallback legado deve distinguir tabela vazia de itens ocultos.');
assertIncludes('src/lib/faqPresentation.ts', 'item.deleted_at === null', 'renderização pública deve defender contra item apagado.');
assertIncludes('src/lib/faqPresentation.ts', 'category.is_visible && category.deleted_at === null', 'renderização pública deve defender contra categoria oculta/apagada.');
assertIncludes('src/app/home/HomeFaqSection.tsx', 'aria-expanded={isOpen}', 'acordeão público deve preservar acessibilidade.');
assertIncludes('package.json', '"test:faq"', 'script de testes do FAQ deve permanecer configurado.');

for (const forbidden of ['"q": "Quem pode participar?"', 'const FAQ_CATEGORIES', 'const FAQ_CATEGORY']) {
  if (app.includes(forbidden) || services.includes(forbidden)) {
    fail(`FAQ: conteúdo editorial/categorias não podem ser hardcoded em App.tsx ou services.ts: ${forbidden}`);
  }
}

for (const forbiddenHomeText of [
  'Uma amostra dos momentos que conectam escola, reencontro e bastidores da turma.',
  'Relatos curtos, lembranÃ§as de corredor e histÃ³rias que ajudam a reconstruir a Ã©poca do HC.',
  'VotaÃ§Ãµes rÃ¡pidas para descobrir preferÃªncias, expectativas e lembranÃ§as coletivas.',
  'Respostas do questionÃ¡rio viram grÃ¡ficos sobre perfil, histÃ³rias, expectativas e fase atual.',
  'Um retrato atualizado de quem confirmou, quem jÃ¡ se cadastrou e como a turma se apresenta hoje.',
  'Uma prÃ©via da distribuiÃ§Ã£o da turma por cidades, estados e paÃ­ses.',
  'VER TUDO',
  'content.about_eyebrow ||',
  'content.about_title ||',
  'parseHomeJsonArray<TimelineItemContent>(extendedContent.timeline_items_json, TIMELINE)',
  'parseHomeJsonArray<FAQItemContent>(extendedContent.faq_items_json, FAQ_ITEMS)',
]) {
  if (app.includes(forbiddenHomeText)) {
    fail(`src/app/App.tsx: fallback/copy editorial restaurada no JSX: ${forbiddenHomeText}`);
  }
}

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
