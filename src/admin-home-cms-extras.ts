import { getHomePageContent, updateHomePageContent } from './lib/services';
import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const PANEL_ID = 'hc-admin-home-cms-extras';

const FIELD_CONFIG = [
  {
    key: 'home_alumni_overview_json',
    label: 'Painel “A turma em movimento”',
    rows: 12,
    help: 'Textos e labels dos 4 cards do preview de ex-alunos.',
  },
  {
    key: 'home_nostalgia_timeline_json',
    label: 'Timeline nostálgica',
    rows: 10,
    help: 'Itens da timeline. Ícones aceitos: phone-call, laptop, messages-square, proportions, smartphone, book-image.',
  },
  {
    key: 'home_profile_stats_json',
    label: 'Estatísticas do card Perfil',
    rows: 8,
    help: 'Use mode:auto para calcular por profiles/people ou mode:fixed com value.',
  },
  {
    key: 'home_map_stats_json',
    label: 'Estatísticas do card Mapa da turma',
    rows: 8,
    help: 'Use mode:auto para calcular por cidade/estado/país dos perfis ou mode:fixed com value.',
  },
  {
    key: 'home_poll_fallback_json',
    label: 'Fallback da enquete da Home',
    rows: 6,
    help: 'Usado quando não houver enquete aberta em Supabase polls.',
  },
] as const;

function isAdminPath() {
  return window.location.pathname.replace(/\/+$/, '') === '/admin';
}

function findTextNode(text: string) {
  const normalized = text.trim().toLowerCase();
  return Array.from(document.querySelectorAll('p, h1, h2, h3, button'))
    .find(node => node.textContent?.trim().toLowerCase() === normalized) ?? null;
}

function findHomeContentAnchor() {
  const homeSections = findTextNode('Seções da home');
  if (homeSections instanceof HTMLElement) return homeSections.closest('.bg-[#141f14]') ?? homeSections.parentElement;
  const hero = findTextNode('Subtítulo do hero');
  if (hero instanceof HTMLElement) return hero.closest('.bg-[#141f14]') ?? hero.parentElement;
  return null;
}

function fieldBaseClasses() {
  return 'w-full bg-[#0a120a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-3 px-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-[#c9a84c]';
}

function buttonClasses(primary = false) {
  return primary
    ? 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c] transition-colors'
    : 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a] transition-colors';
}

function prettyJson(value: unknown) {
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value ?? null, null, 2);
}

function setStatus(panel: HTMLElement, message: string, tone: 'ok' | 'error' | 'muted' = 'muted') {
  const status = panel.querySelector<HTMLElement>('[data-hc-admin-home-cms-status]');
  if (!status) return;
  status.textContent = message;
  status.className = tone === 'error'
    ? 'text-[#e74c3c] text-xs font-mono'
    : tone === 'ok'
      ? 'text-[#74c69d] text-xs font-mono'
      : 'text-[#7a9a7a] text-xs font-mono';
}

async function renderPanel(anchor: Element) {
  if (document.getElementById(PANEL_ID)) return;
  const content = await getHomePageContent(DEFAULT_EVENT_ID) as Record<string, any>;
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'bg-[#141f14] border border-[#2d6a4f]/25 p-6 mt-6';
  panel.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
      <div>
        <p class="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Home dinâmica</p>
        <p class="text-[#3a5a3a] text-xs mt-1">Gerencie previews, estatísticas, timeline e fallback da enquete exibidos na Home.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-hc-admin-home-cms-reload class="${buttonClasses(false)}">Recarregar</button>
        <button type="button" data-hc-admin-home-cms-save class="${buttonClasses(true)}">Salvar extras</button>
      </div>
    </div>
    <div class="grid grid-cols-1 gap-5">
      <div>
        <label class="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">ID da enquete da Home</label>
        <input data-hc-admin-home-cms-field="home_poll_id" class="${fieldBaseClasses()}" value="${content.home_poll_id ?? ''}" placeholder="Opcional. Se vazio, usa a primeira enquete aberta." />
        <p class="text-[#3a5a3a] text-[11px] mt-2">A enquete usa as tabelas polls, poll_options e poll_votes. Crie a enquete na aba Enquetes e cole o ID aqui somente se quiser fixar uma específica.</p>
      </div>
      ${FIELD_CONFIG.map(field => `
        <div>
          <label class="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">${field.label}</label>
          <textarea data-hc-admin-home-cms-field="${field.key}" rows="${field.rows}" class="${fieldBaseClasses()}">${prettyJson(content[field.key] ?? '')}</textarea>
          <p class="text-[#3a5a3a] text-[11px] mt-2">${field.help}</p>
        </div>
      `).join('')}
    </div>
    <div class="mt-5 border-t border-[#2d6a4f]/20 pt-4">
      <p data-hc-admin-home-cms-status class="text-[#7a9a7a] text-xs font-mono">Campos carregados do Supabase.</p>
    </div>
  `;

  anchor.insertAdjacentElement('afterend', panel);

  panel.querySelector('[data-hc-admin-home-cms-reload]')?.addEventListener('click', () => {
    panel.remove();
    void installAdminHomeCmsExtras(true);
  });

  panel.querySelector('[data-hc-admin-home-cms-save]')?.addEventListener('click', async () => {
    const saveButton = panel.querySelector<HTMLButtonElement>('[data-hc-admin-home-cms-save]');
    saveButton?.setAttribute('disabled', 'true');
    setStatus(panel, 'Salvando...', 'muted');
    try {
      const { data } = await supabase.auth.getUser();
      const adminId = data.user?.id ?? undefined;
      const payload: Record<string, unknown> = { event_id: DEFAULT_EVENT_ID };
      const pollIdInput = panel.querySelector<HTMLInputElement>('[data-hc-admin-home-cms-field="home_poll_id"]');
      payload.home_poll_id = pollIdInput?.value.trim() || null;
      for (const field of FIELD_CONFIG) {
        const textarea = panel.querySelector<HTMLTextAreaElement>(`[data-hc-admin-home-cms-field="${field.key}"]`);
        const value = textarea?.value.trim() ?? '';
        if (value) JSON.parse(value);
        payload[field.key] = value;
      }
      await updateHomePageContent(DEFAULT_EVENT_ID, payload as any, adminId);
      setStatus(panel, 'Extras da Home salvos no Supabase.', 'ok');
    } catch (error) {
      setStatus(panel, error instanceof Error ? error.message : 'Não foi possível salvar os extras.', 'error');
    } finally {
      saveButton?.removeAttribute('disabled');
    }
  });
}

async function installAdminHomeCmsExtras(force = false) {
  if (!isAdminPath()) return;
  if (!force && document.getElementById(PANEL_ID)) return;
  const anchor = findHomeContentAnchor();
  if (!anchor) return;
  await renderPanel(anchor);
}

let attempts = 0;
const interval = window.setInterval(() => {
  attempts += 1;
  void installAdminHomeCmsExtras();
  if (attempts > 120 || document.getElementById(PANEL_ID)) window.clearInterval(interval);
}, 500);

const observer = new MutationObserver(() => void installAdminHomeCmsExtras());
observer.observe(document.body, { childList: true, subtree: true });
