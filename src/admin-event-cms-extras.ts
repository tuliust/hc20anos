import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const PANEL_ID = 'hc-admin-event-cms-extras';

const TEXT_FIELDS = [
  { key: 'local_section_eyebrow', label: 'Local — eyebrow', placeholder: 'Local' },
  { key: 'local_section_title', label: 'Local — título', placeholder: 'Como chegar' },
  { key: 'program_section_eyebrow', label: 'Programação — eyebrow', placeholder: 'Programação' },
  { key: 'program_section_title', label: 'Programação — título', placeholder: 'Horários e atrações' },
  { key: 'program_image_url', label: 'Programação — imagem', placeholder: 'URL pública da imagem no Supabase Storage' },
  { key: 'program_image_alt', label: 'Programação — texto alternativo', placeholder: 'Descrição da imagem' },
  { key: 'structure_section_eyebrow', label: 'Estrutura — eyebrow', placeholder: 'Estrutura' },
  { key: 'structure_section_title', label: 'Estrutura — título', placeholder: 'Bar, comidas, banheiros e segurança' },
] as const;

const DEFAULT_STRUCTURE_CARDS = [
  { title: 'Estacionamento', description: 'Consulte a organização sobre vagas, pontos de embarque/desembarque e opções próximas ao local.' },
  { title: 'Área Kids', description: 'Espaço pensado para apoio às famílias, conforme estrutura final contratada para o evento.' },
  { title: 'Registro de fotos e vídeos', description: 'A noite terá registros oficiais para preservar os principais momentos do reencontro.' },
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

function normalizeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function textNodes() {
  return Array.from(document.querySelectorAll<HTMLElement>('p,h1,h2,h3,button,label'));
}

function findTextNode(text: string) {
  const normalized = normalizeText(text);
  return textNodes().find(node => normalizeText(node.textContent) === normalized) ?? null;
}

function closestPanel(element: HTMLElement | null) {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const className = typeof current.className === 'string' ? current.className : '';
    if (className.includes('bg-[#141f14]') && className.includes('border')) return current;
    current = current.parentElement;
  }
  return element?.parentElement ?? null;
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
  const node = panel.querySelector<HTMLElement>('[data-event-cms-extra-status]');
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
  return JSON.stringify(value ?? DEFAULT_STRUCTURE_CARDS, null, 2);
}

async function fetchContent() {
  const { data, error } = await (supabase as any)
    .from('event_page_content')
    .select('*')
    .eq('event_id', DEFAULT_EVENT_ID)
    .maybeSingle();
  if (error) throw error;
  return data ?? { event_id: DEFAULT_EVENT_ID, structure_cards_json: DEFAULT_STRUCTURE_CARDS, show_gallery_preview: false };
}

function findAnchor() {
  const structure = findTextNode('Estrutura e orientações');
  if (structure instanceof HTMLElement) return closestPanel(structure);
  const schedule = findTextNode('Programação');
  if (schedule instanceof HTMLElement) return closestPanel(schedule);
  return null;
}

async function renderPanel(anchor: Element) {
  if (document.getElementById(PANEL_ID)) return;
  const content = await fetchContent();
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'bg-[#141f14] border border-[#2d6a4f]/25 p-6 mt-6';
  panel.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
      <div>
        <p class="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">CMS avançado do Evento</p>
        <p class="text-[#3a5a3a] text-xs mt-1">Campos usados para remover textos e imagens hardcoded da página /evento.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-event-cms-extra-reload class="${buttonClasses(false)}">Recarregar</button>
        <button type="button" data-event-cms-extra-save class="${buttonClasses(true)}">Salvar CMS do evento</button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${TEXT_FIELDS.map(field => `
        <div>
          <label class="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">${field.label}</label>
          <input data-event-cms-extra-field="${field.key}" class="${inputClasses()}" value="${escapeHtml(content[field.key] ?? '')}" placeholder="${escapeHtml(field.placeholder)}" />
        </div>
      `).join('')}
      <label class="md:col-span-2 flex items-center gap-3 bg-[#0a120a] border border-[#2d6a4f]/25 p-4 cursor-pointer">
        <input data-event-cms-extra-field="show_gallery_preview" type="checkbox" class="accent-[#2d6a4f]" ${content.show_gallery_preview === true ? 'checked' : ''} />
        <span class="text-[#f0ebe0] text-sm">Exibir seção Fotos / Prévia do evento</span>
      </label>
      <div class="md:col-span-2">
        <label class="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Cards adicionais da estrutura</label>
        <textarea data-event-cms-extra-field="structure_cards_json" rows="8" class="${inputClasses()}">${escapeHtml(prettyJson(content.structure_cards_json))}</textarea>
        <p class="text-[#3a5a3a] text-[11px] mt-2">JSON editável. Cada item aceita title e description.</p>
      </div>
    </div>

    <div class="mt-5 border-t border-[#2d6a4f]/20 pt-4">
      <p data-event-cms-extra-status class="text-[#7a9a7a] text-xs font-mono">Campos carregados de event_page_content.</p>
    </div>
  `;

  anchor.insertAdjacentElement('afterend', panel);

  panel.querySelector('[data-event-cms-extra-reload]')?.addEventListener('click', () => {
    panel.remove();
    void installAdminEventCmsExtras(true);
  });

  panel.querySelector('[data-event-cms-extra-save]')?.addEventListener('click', async () => {
    const button = panel.querySelector<HTMLButtonElement>('[data-event-cms-extra-save]');
    button?.setAttribute('disabled', 'true');
    status(panel, 'Salvando...', 'muted');
    try {
      const payload: Record<string, unknown> = { event_id: DEFAULT_EVENT_ID, updated_at: new Date().toISOString() };
      for (const field of TEXT_FIELDS) {
        const input = panel.querySelector<HTMLInputElement>(`[data-event-cms-extra-field="${field.key}"]`);
        payload[field.key] = input?.value.trim() || null;
      }
      const showGallery = panel.querySelector<HTMLInputElement>('[data-event-cms-extra-field="show_gallery_preview"]');
      payload.show_gallery_preview = showGallery?.checked === true;

      const cards = panel.querySelector<HTMLTextAreaElement>('[data-event-cms-extra-field="structure_cards_json"]')?.value.trim() || '[]';
      payload.structure_cards_json = JSON.parse(cards);

      const { error } = await (supabase as any)
        .from('event_page_content')
        .upsert(payload, { onConflict: 'event_id' });
      if (error) throw error;
      status(panel, 'CMS do evento salvo no Supabase.', 'ok');
    } catch (error) {
      status(panel, error instanceof Error ? error.message : 'Não foi possível salvar.', 'error');
    } finally {
      button?.removeAttribute('disabled');
    }
  });
}

async function installAdminEventCmsExtras(force = false) {
  if (!isAdminPath()) return;
  if (!force && document.getElementById(PANEL_ID)) return;
  const anchor = findAnchor();
  if (!anchor) return;
  await renderPanel(anchor);
}

let attempts = 0;
const interval = window.setInterval(() => {
  attempts += 1;
  void installAdminEventCmsExtras();
  if (attempts > 180 || document.getElementById(PANEL_ID)) window.clearInterval(interval);
}, 500);

new MutationObserver(() => { void installAdminEventCmsExtras(); }).observe(document.body, { childList: true, subtree: true });
