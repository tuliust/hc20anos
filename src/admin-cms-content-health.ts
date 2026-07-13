import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const PANEL_ID = 'hc-admin-cms-content-health';

const REQUIRED_HOME_FIELDS = [
  'hero_eyebrow', 'hero_title', 'hero_tagline', 'hero_subtitle', 'hero_event_line',
  'primary_cta_label', 'secondary_cta_label', 'about_eyebrow', 'about_title',
  'about_body_1', 'about_body_2', 'info_eyebrow', 'info_title', 'tickets_eyebrow',
  'tickets_title', 'confirmed_eyebrow', 'confirmed_title', 'photos_eyebrow',
  'photos_title', 'timeline_eyebrow', 'timeline_title', 'faq_eyebrow', 'faq_title',
];

const REQUIRED_EVENT_FIELDS = [
  'hero_eyebrow', 'title', 'subtitle', 'description', 'venue_notes',
  'food_bar_text', 'bathrooms_text', 'security_text',
];

const REQUIRED_PUBLIC_PAGES = ['ex-alunos', 'memorias', 'curiosidades', 'pos-festa'];
const REQUIRED_ASSETS = ['event_program_image', 'header_logo', 'favicon'];

function isAdminPath() {
  return window.location.pathname.replace(/\/+$/, '') === '/admin';
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isBlank(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

function buttonClasses() {
  return 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a] transition-colors';
}

function rowHtml(label: string, ok: boolean, detail: string) {
  return `
    <div class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border border-[#2d6a4f]/20 bg-[#0a120a] px-4 py-3">
      <span class="mt-0.5 h-2.5 w-2.5 rounded-full ${ok ? 'bg-[#74c69d]' : 'bg-[#e74c3c]'}"></span>
      <div>
        <p class="text-[#f0ebe0] text-sm font-semibold">${escapeHtml(label)}</p>
        <p class="text-[#7a9a7a] text-xs font-mono mt-1 break-words">${escapeHtml(detail)}</p>
      </div>
    </div>
  `;
}

async function fetchHealth() {
  const [homeResult, eventResult, publicResult, assetsResult] = await Promise.all([
    (supabase as any).from('home_page_content').select('*').eq('event_id', DEFAULT_EVENT_ID).maybeSingle(),
    (supabase as any).from('event_page_content').select('*').eq('event_id', DEFAULT_EVENT_ID).maybeSingle(),
    (supabase as any).from('public_page_content').select('page_slug,content_json').eq('event_id', DEFAULT_EVENT_ID),
    (supabase as any).from('cms_assets').select('asset_key,file_url,is_active').eq('event_id', DEFAULT_EVENT_ID),
  ]);

  const rows: { label: string; ok: boolean; detail: string }[] = [];

  if (homeResult.error) {
    rows.push({ label: 'Home', ok: false, detail: homeResult.error.message });
  } else {
    const missing = REQUIRED_HOME_FIELDS.filter(field => isBlank(homeResult.data?.[field]));
    rows.push({
      label: 'Home — campos editoriais',
      ok: missing.length === 0,
      detail: missing.length ? `Campos vazios: ${missing.join(', ')}` : 'Todos os campos obrigatórios estão preenchidos no Supabase.',
    });
  }

  if (eventResult.error) {
    rows.push({ label: 'Evento', ok: false, detail: eventResult.error.message });
  } else {
    const missing = REQUIRED_EVENT_FIELDS.filter(field => isBlank(eventResult.data?.[field]));
    const hasExternalFallback = String(eventResult.data?.gallery_json ?? '').includes('images.unsplash.com');
    rows.push({
      label: 'Evento — campos editoriais',
      ok: missing.length === 0 && !hasExternalFallback,
      detail: [
        missing.length ? `Campos vazios: ${missing.join(', ')}` : 'Campos principais preenchidos.',
        hasExternalFallback ? 'Galeria ainda contém imagens Unsplash herdadas de fallback.' : 'Sem imagens Unsplash na galeria.',
      ].join(' '),
    });
  }

  if (publicResult.error) {
    rows.push({ label: 'Páginas públicas', ok: false, detail: publicResult.error.message });
  } else {
    const existing = new Set((publicResult.data ?? []).map((row: any) => row.page_slug));
    const missingPages = REQUIRED_PUBLIC_PAGES.filter(slug => !existing.has(slug));
    rows.push({
      label: 'Páginas públicas secundárias',
      ok: missingPages.length === 0,
      detail: missingPages.length ? `Páginas sem conteúdo: ${missingPages.join(', ')}` : 'Todas as páginas secundárias têm content_json.',
    });
  }

  if (assetsResult.error) {
    rows.push({ label: 'Assets', ok: false, detail: assetsResult.error.message });
  } else {
    const assetMap = new Map((assetsResult.data ?? []).map((asset: any) => [asset.asset_key, asset]));
    const missingAssets = REQUIRED_ASSETS.filter(key => {
      const asset: any = assetMap.get(key);
      return !asset || asset.is_active === false || isBlank(asset.file_url);
    });
    rows.push({
      label: 'Assets essenciais',
      ok: missingAssets.length === 0,
      detail: missingAssets.length ? `Sem URL ativa: ${missingAssets.join(', ')}` : 'Assets essenciais têm URL ativa.',
    });
  }

  return rows;
}

function findAnchor() {
  return document.getElementById('hc-admin-cms-assets')
    ?? document.getElementById('hc-admin-public-pages-cms')
    ?? document.getElementById('hc-admin-event-cms-extras')
    ?? document.getElementById('hc-admin-home-cms-extras')
    ?? document.querySelector<HTMLElement>('main, #root > div')
    ?? document.body;
}

async function renderPanel(anchor: Element) {
  if (document.getElementById(PANEL_ID)) return;
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'bg-[#141f14] border border-[#2d6a4f]/25 p-6 mt-6';
  panel.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
      <div>
        <p class="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Saúde do CMS</p>
        <p class="text-[#3a5a3a] text-xs mt-1">Verifica se as páginas dependem de conteúdo configurado no Supabase, não de fallbacks editoriais.</p>
      </div>
      <button type="button" data-cms-health-refresh class="${buttonClasses()}">Verificar novamente</button>
    </div>
    <div data-cms-health-list class="grid grid-cols-1 gap-3">
      <div class="border border-[#2d6a4f]/20 bg-[#0a120a] px-4 py-3 text-[#7a9a7a] text-xs font-mono uppercase tracking-[0.14em]">Verificando...</div>
    </div>
  `;
  anchor.insertAdjacentElement('afterend', panel);

  async function refresh() {
    const list = panel.querySelector<HTMLElement>('[data-cms-health-list]');
    if (!list) return;
    list.innerHTML = '<div class="border border-[#2d6a4f]/20 bg-[#0a120a] px-4 py-3 text-[#7a9a7a] text-xs font-mono uppercase tracking-[0.14em]">Verificando...</div>';
    try {
      const rows = await fetchHealth();
      list.innerHTML = rows.map(row => rowHtml(row.label, row.ok, row.detail)).join('');
    } catch (error) {
      list.innerHTML = rowHtml('Erro na verificação', false, error instanceof Error ? error.message : 'Não foi possível verificar.');
    }
  }

  panel.querySelector('[data-cms-health-refresh]')?.addEventListener('click', () => { void refresh(); });
  await refresh();
}

async function installAdminCmsContentHealth() {
  if (!isAdminPath()) return;
  const anchor = findAnchor();
  if (!anchor) return;
  await renderPanel(anchor);
}

let attempts = 0;
const interval = window.setInterval(() => {
  attempts += 1;
  void installAdminCmsContentHealth();
  if (attempts > 180 || document.getElementById(PANEL_ID)) window.clearInterval(interval);
}, 500);

new MutationObserver(() => { void installAdminCmsContentHealth(); }).observe(document.body, { childList: true, subtree: true });
