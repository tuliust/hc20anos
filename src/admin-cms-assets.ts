import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const PANEL_ID = 'hc-admin-cms-assets';
const BUCKET = 'cms-assets';

type CmsAsset = {
  id?: string;
  event_id?: string;
  asset_key?: string;
  label?: string;
  file_url?: string | null;
  storage_path?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  usage_context?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

const DEFAULT_ASSETS: CmsAsset[] = [
  { asset_key: 'home_hero_background', label: 'Home — imagem de fundo do hero', alt_text: 'Imagem de fundo da página inicial', usage_context: 'home.hero', sort_order: 10, is_active: true },
  { asset_key: 'event_hero_image', label: 'Evento — imagem principal', alt_text: 'Imagem principal da página do evento', usage_context: 'event.hero', sort_order: 20, is_active: true },
  { asset_key: 'event_program_image', label: 'Evento — imagem da programação', alt_text: 'Imagem da programação do evento', usage_context: 'event.program', sort_order: 30, is_active: true },
  { asset_key: 'archive_coming_soon_image', label: 'Pós-festa — imagem de espera', alt_text: 'Imagem de espera da página pós-festa', usage_context: 'archive.coming_soon', sort_order: 40, is_active: true },
  { asset_key: 'header_logo', label: 'Cabeçalho — logo', alt_text: 'Logo do site', usage_context: 'global.header', sort_order: 50, is_active: true },
  { asset_key: 'favicon', label: 'Navegador — favicon', alt_text: 'Ícone do site', usage_context: 'global.favicon', sort_order: 60, is_active: true },
];

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

function fieldClasses() {
  return 'w-full bg-[#0a120a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-3 px-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-[#c9a84c]';
}

function buttonClasses(primary = false) {
  return primary
    ? 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c] transition-colors disabled:opacity-50'
    : 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a] transition-colors disabled:opacity-50';
}

function status(panel: HTMLElement, message: string, tone: 'ok' | 'error' | 'muted' = 'muted') {
  const node = panel.querySelector<HTMLElement>('[data-cms-assets-status]');
  if (!node) return;
  node.textContent = message;
  node.className = tone === 'error'
    ? 'text-[#e74c3c] text-xs font-mono'
    : tone === 'ok'
      ? 'text-[#74c69d] text-xs font-mono'
      : 'text-[#7a9a7a] text-xs font-mono';
}

function normalizeAsset(asset: CmsAsset, index: number): CmsAsset {
  return {
    event_id: DEFAULT_EVENT_ID,
    asset_key: asset.asset_key ?? '',
    label: asset.label ?? '',
    file_url: asset.file_url ?? '',
    storage_path: asset.storage_path ?? '',
    alt_text: asset.alt_text ?? '',
    caption: asset.caption ?? '',
    usage_context: asset.usage_context ?? '',
    sort_order: Number(asset.sort_order ?? index * 10),
    is_active: asset.is_active !== false,
  };
}

async function fetchAssets() {
  const { data, error } = await (supabase as any)
    .from('cms_assets')
    .select('*')
    .eq('event_id', DEFAULT_EVENT_ID)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  const byKey = new Map<string, CmsAsset>();
  [...DEFAULT_ASSETS, ...(data ?? [])].forEach((asset, index) => {
    if (!asset.asset_key) return;
    byKey.set(asset.asset_key, normalizeAsset({ ...byKey.get(asset.asset_key), ...asset }, index));
  });
  return Array.from(byKey.values()).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

function cardHtml(asset: CmsAsset, index: number) {
  const active = asset.is_active !== false;
  return `
    <article data-cms-asset-card="true" class="bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_96px] gap-3 items-end">
        <div>
          <label class="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Chave técnica</label>
          <input data-cms-asset-field="asset_key" class="${fieldClasses()}" value="${escapeHtml(asset.asset_key)}" placeholder="event_program_image" />
        </div>
        <div>
          <label class="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Label no Admin</label>
          <input data-cms-asset-field="label" class="${fieldClasses()}" value="${escapeHtml(asset.label)}" />
        </div>
        <div>
          <label class="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Ordem</label>
          <input data-cms-asset-field="sort_order" type="number" class="${fieldClasses()}" value="${escapeHtml(asset.sort_order ?? index * 10)}" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end mt-3">
        <div>
          <label class="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">URL pública</label>
          <input data-cms-asset-field="file_url" class="${fieldClasses()}" value="${escapeHtml(asset.file_url)}" placeholder="https://..." />
          <input data-cms-asset-field="storage_path" type="hidden" value="${escapeHtml(asset.storage_path)}" />
        </div>
        <label class="${buttonClasses(false)} cursor-pointer">
          Upload
          <input data-cms-asset-upload="true" type="file" accept="image/*" class="hidden" />
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div>
          <label class="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Texto alternativo</label>
          <input data-cms-asset-field="alt_text" class="${fieldClasses()}" value="${escapeHtml(asset.alt_text)}" />
        </div>
        <div>
          <label class="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Contexto de uso</label>
          <input data-cms-asset-field="usage_context" class="${fieldClasses()}" value="${escapeHtml(asset.usage_context)}" placeholder="event.program" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end mt-3">
        <div>
          <label class="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Legenda</label>
          <input data-cms-asset-field="caption" class="${fieldClasses()}" value="${escapeHtml(asset.caption)}" />
        </div>
        <label class="flex items-center gap-3 border border-[#2d6a4f]/25 text-[#f0ebe0] px-4 py-3 cursor-pointer">
          <input data-cms-asset-field="is_active" type="checkbox" class="accent-[#2d6a4f]" ${active ? 'checked' : ''} />
          <span class="text-xs font-mono uppercase tracking-[0.14em]">Ativo</span>
        </label>
      </div>

      ${asset.file_url ? `<figure class="mt-4 border border-[#2d6a4f]/20 bg-[#141f14] p-3"><img src="${escapeHtml(asset.file_url)}" alt="${escapeHtml(asset.alt_text || asset.label)}" class="w-full max-h-52 object-cover" loading="lazy" /></figure>` : ''}
    </article>
  `;
}

function readAssetFromCard(card: HTMLElement): CmsAsset | null {
  const input = (name: string) => card.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-cms-asset-field="${name}"]`);
  const assetKey = input('asset_key')?.value.trim() ?? '';
  if (!assetKey) return null;
  return {
    event_id: DEFAULT_EVENT_ID,
    asset_key: assetKey,
    label: input('label')?.value.trim() || assetKey,
    file_url: input('file_url')?.value.trim() || null,
    storage_path: input('storage_path')?.value.trim() || null,
    alt_text: input('alt_text')?.value.trim() || null,
    caption: input('caption')?.value.trim() || null,
    usage_context: input('usage_context')?.value.trim() || null,
    sort_order: Number(input('sort_order')?.value || 0),
    is_active: (input('is_active') as HTMLInputElement | null)?.checked === true,
  };
}

function safeName(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || 'asset';
}

async function uploadForCard(card: HTMLElement, file: File) {
  const key = card.querySelector<HTMLInputElement>('[data-cms-asset-field="asset_key"]')?.value.trim() || 'asset';
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const storagePath = `${DEFAULT_EVENT_ID}/${safeName(key)}-${Date.now()}.${safeName(ext ?? 'bin')}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const urlField = card.querySelector<HTMLInputElement>('[data-cms-asset-field="file_url"]');
  const pathField = card.querySelector<HTMLInputElement>('[data-cms-asset-field="storage_path"]');
  if (urlField) urlField.value = data.publicUrl;
  if (pathField) pathField.value = storagePath;
}

function findAnchor() {
  return document.getElementById('hc-admin-public-pages-cms')
    ?? document.getElementById('hc-admin-event-cms-extras')
    ?? document.getElementById('hc-admin-home-cms-extras')
    ?? document.querySelector<HTMLElement>('main, #root > div')
    ?? document.body;
}

async function renderPanel(anchor: Element) {
  if (document.getElementById(PANEL_ID)) return;
  const assets = await fetchAssets();
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'bg-[#141f14] border border-[#2d6a4f]/25 p-6 mt-6';
  panel.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
      <div>
        <p class="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">CMS de imagens e assets</p>
        <p class="text-[#3a5a3a] text-xs mt-1">Gerencie URLs públicas, textos alternativos e uploads usados pelas páginas do evento.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-cms-assets-add class="${buttonClasses(false)}">Adicionar asset</button>
        <button type="button" data-cms-assets-reload class="${buttonClasses(false)}">Recarregar</button>
        <button type="button" data-cms-assets-save class="${buttonClasses(true)}">Salvar assets</button>
      </div>
    </div>
    <div data-cms-assets-list class="grid grid-cols-1 gap-4">
      ${assets.map(cardHtml).join('')}
    </div>
    <div class="mt-5 border-t border-[#2d6a4f]/20 pt-4">
      <p data-cms-assets-status class="text-[#7a9a7a] text-xs font-mono">Assets carregados de cms_assets.</p>
    </div>
  `;
  anchor.insertAdjacentElement('afterend', panel);

  function bindUploads() {
    panel.querySelectorAll<HTMLInputElement>('[data-cms-asset-upload="true"]').forEach(input => {
      if (input.dataset.bound === 'true') return;
      input.dataset.bound = 'true';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        const card = input.closest<HTMLElement>('[data-cms-asset-card="true"]');
        if (!file || !card) return;
        status(panel, 'Enviando imagem...', 'muted');
        try {
          await uploadForCard(card, file);
          status(panel, 'Upload concluído. Salve os assets para persistir a URL.', 'ok');
        } catch (error) {
          status(panel, error instanceof Error ? error.message : 'Falha no upload.', 'error');
        } finally {
          input.value = '';
        }
      });
    });
  }

  bindUploads();

  panel.querySelector('[data-cms-assets-add]')?.addEventListener('click', () => {
    const list = panel.querySelector<HTMLElement>('[data-cms-assets-list]');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', cardHtml({ asset_key: '', label: '', sort_order: list.children.length * 10, is_active: true }, list.children.length));
    bindUploads();
  });

  panel.querySelector('[data-cms-assets-reload]')?.addEventListener('click', () => {
    panel.remove();
    void installAdminCmsAssets(true);
  });

  panel.querySelector('[data-cms-assets-save]')?.addEventListener('click', async () => {
    const button = panel.querySelector<HTMLButtonElement>('[data-cms-assets-save]');
    button?.setAttribute('disabled', 'true');
    status(panel, 'Salvando...', 'muted');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      let adminId: string | null = null;
      if (userId) {
        const { data: adminRow } = await (supabase as any)
          .from('admin_users')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        adminId = adminRow?.id ?? null;
      }
      const rows = Array.from(panel.querySelectorAll<HTMLElement>('[data-cms-asset-card="true"]'))
        .map(readAssetFromCard)
        .filter(Boolean)
        .map(row => ({ ...row, updated_by_admin_id: adminId }));
      const { error } = await (supabase as any)
        .from('cms_assets')
        .upsert(rows, { onConflict: 'event_id,asset_key' });
      if (error) throw error;
      status(panel, 'Assets salvos no Supabase.', 'ok');
    } catch (error) {
      status(panel, error instanceof Error ? error.message : 'Não foi possível salvar assets.', 'error');
    } finally {
      button?.removeAttribute('disabled');
    }
  });
}

async function installAdminCmsAssets(force = false) {
  if (!isAdminPath()) return;
  if (!force && document.getElementById(PANEL_ID)) return;
  const anchor = findAnchor();
  await renderPanel(anchor);
}

let attempts = 0;
const interval = window.setInterval(() => {
  attempts += 1;
  void installAdminCmsAssets();
  if (attempts > 180 || document.getElementById(PANEL_ID)) window.clearInterval(interval);
}, 500);

new MutationObserver(() => { void installAdminCmsAssets(); }).observe(document.body, { childList: true, subtree: true });
