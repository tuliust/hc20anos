import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const PANEL_ID = 'hc-admin-public-pages-cms';

const PAGE_CONFIG = [
  { slug: 'ex-alunos', label: 'Ex-alunos', rows: 8 },
  { slug: 'memorias', label: 'Memórias', rows: 6 },
  { slug: 'curiosidades', label: 'Curiosidades', rows: 14 },
  { slug: 'pos-festa', label: 'Pós-festa', rows: 8 },
] as const;

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

function inputClasses() {
  return 'w-full bg-[#0a120a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-3 px-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-[#c9a84c]';
}

function buttonClasses(primary = false) {
  return primary
    ? 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c] transition-colors'
    : 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a] transition-colors';
}

function status(panel: HTMLElement, message: string, tone: 'ok' | 'error' | 'muted' = 'muted') {
  const node = panel.querySelector<HTMLElement>('[data-public-pages-cms-status]');
  if (!node) return;
  node.textContent = message;
  node.className = tone === 'error'
    ? 'text-[#e74c3c] text-xs font-mono'
    : tone === 'ok'
      ? 'text-[#74c69d] text-xs font-mono'
      : 'text-[#7a9a7a] text-xs font-mono';
}

function prettyJson(value: unknown) {
  if (typeof value === 'string') {
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
  }
  return JSON.stringify(value ?? {}, null, 2);
}

async function fetchPages() {
  const { data, error } = await (supabase as any)
    .from('public_page_content')
    .select('page_slug,content_json')
    .eq('event_id', DEFAULT_EVENT_ID);
  if (error) throw error;
  const map = new Map<string, unknown>();
  (data ?? []).forEach((row: any) => map.set(row.page_slug, row.content_json ?? {}));
  return map;
}

function findAnchor() {
  const preferred = document.getElementById('hc-admin-event-cms-extras')
    ?? document.getElementById('hc-admin-home-cms-extras');
  if (preferred) return preferred;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('main, [class*="max-w"], #root > div'));
  return candidates[candidates.length - 1] ?? document.body;
}

async function renderPanel(anchor: Element) {
  if (document.getElementById(PANEL_ID)) return;
  const pages = await fetchPages();
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'bg-[#141f14] border border-[#2d6a4f]/25 p-6 mt-6';
  panel.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
      <div>
        <p class="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">CMS das páginas públicas</p>
        <p class="text-[#3a5a3a] text-xs mt-1">Edite textos e regras das páginas Ex-alunos, Memórias, Curiosidades e Pós-festa.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-public-pages-cms-reload class="${buttonClasses(false)}">Recarregar</button>
        <button type="button" data-public-pages-cms-save class="${buttonClasses(true)}">Salvar páginas</button>
      </div>
    </div>
    <div class="grid grid-cols-1 gap-5">
      ${PAGE_CONFIG.map(page => `
        <div>
          <label class="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">${page.label}</label>
          <textarea data-public-pages-cms-field="${page.slug}" rows="${page.rows}" class="${inputClasses()}">${escapeHtml(prettyJson(pages.get(page.slug) ?? {}))}</textarea>
        </div>
      `).join('')}
    </div>
    <div class="mt-5 border-t border-[#2d6a4f]/20 pt-4">
      <p data-public-pages-cms-status class="text-[#7a9a7a] text-xs font-mono">Conteúdo carregado de public_page_content.</p>
    </div>
  `;

  anchor.insertAdjacentElement('afterend', panel);

  panel.querySelector('[data-public-pages-cms-reload]')?.addEventListener('click', () => {
    panel.remove();
    void installAdminPublicPagesCms(true);
  });

  panel.querySelector('[data-public-pages-cms-save]')?.addEventListener('click', async () => {
    const button = panel.querySelector<HTMLButtonElement>('[data-public-pages-cms-save]');
    button?.setAttribute('disabled', 'true');
    status(panel, 'Salvando...', 'muted');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminUserId = authData.user?.id ?? null;
      const rows = PAGE_CONFIG.map(page => {
        const field = panel.querySelector<HTMLTextAreaElement>(`[data-public-pages-cms-field="${page.slug}"]`);
        const raw = field?.value.trim() || '{}';
        return {
          event_id: DEFAULT_EVENT_ID,
          page_slug: page.slug,
          content_json: JSON.parse(raw),
          updated_by_admin_id: adminUserId,
        };
      });
      const { error } = await (supabase as any)
        .from('public_page_content')
        .upsert(rows, { onConflict: 'event_id,page_slug' });
      if (error) throw error;
      status(panel, 'Páginas públicas salvas no Supabase.', 'ok');
    } catch (error) {
      status(panel, error instanceof Error ? error.message : 'Não foi possível salvar.', 'error');
    } finally {
      button?.removeAttribute('disabled');
    }
  });
}

async function installAdminPublicPagesCms(force = false) {
  if (!isAdminPath()) return;
  if (!force && document.getElementById(PANEL_ID)) return;
  const anchor = findAnchor();
  if (!anchor) return;
  await renderPanel(anchor);
}

let attempts = 0;
const interval = window.setInterval(() => {
  attempts += 1;
  void installAdminPublicPagesCms();
  if (attempts > 180 || document.getElementById(PANEL_ID)) window.clearInterval(interval);
}, 500);

new MutationObserver(() => { void installAdminPublicPagesCms(); }).observe(document.body, { childList: true, subtree: true });
