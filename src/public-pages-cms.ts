import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';

type LocationRow = {
  current_city?: string | null;
  current_state?: string | null;
  current_country?: string | null;
};

type LocationCardConfig = {
  key?: 'natal' | 'interior' | 'brazil' | 'foreign' | string;
  title?: string | null;
  subtitle?: string | null;
};

type PageContent = Record<string, any>;

let contentPromise: Promise<PageContent | null> | null = null;

function path() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function pageSlug() {
  const current = path();
  if (current === '/ex-alunos') return 'ex-alunos';
  if (current === '/nossa-historia/memorias') return 'memorias';
  if (current === '/curiosidades') return 'curiosidades';
  if (current === '/pos-festa') return 'pos-festa';
  return null;
}

function norm(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function txt(element: Element | null | undefined) {
  return norm(element?.textContent ?? '');
}

function textNodes() {
  return Array.from(document.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,span,button,a,label'));
}

function findText(predicate: (text: string, element: HTMLElement) => boolean) {
  return textNodes().find(element => predicate(txt(element), element)) ?? null;
}

function findTitle(text: string) {
  const normalized = norm(text);
  return Array.from(document.querySelectorAll<HTMLElement>('h1,h2'))
    .find(element => txt(element) === normalized || txt(element).includes(normalized)) ?? null;
}

function closestCard(element: HTMLElement | null) {
  if (!element) return null;
  return Array.from(document.querySelectorAll<HTMLElement>('article,div,section'))
    .filter(item => item.contains(element))
    .sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0))
    .find(item => {
      const className = String(item.className ?? '');
      return className.includes('border') || className.includes('bg-') || item.tagName.toLowerCase() === 'article';
    }) ?? element.parentElement;
}

function findSectionByText(...needles: string[]) {
  const normalized = needles.map(norm);
  return Array.from(document.querySelectorAll<HTMLElement>('section,main > div,#root > div > div'))
    .filter(section => {
      const sectionText = txt(section);
      return normalized.every(needle => sectionText.includes(needle));
    })
    .sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0))[0] ?? null;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchPageContent() {
  const slug = pageSlug();
  if (!slug) return null;
  if (!contentPromise) {
    contentPromise = (async () => {
      const { data, error } = await (supabase as any)
        .from('public_page_content')
        .select('content_json')
        .eq('event_id', DEFAULT_EVENT_ID)
        .eq('page_slug', slug)
        .maybeSingle();
      if (error) return null;
      return (data?.content_json ?? null) as PageContent | null;
    })();
  }
  return contentPromise;
}

function installStyles() {
  if (document.querySelector('[data-public-pages-cms-style="true"]')) return;
  const style = document.createElement('style');
  style.dataset.publicPagesCmsStyle = 'true';
  style.textContent = `
    [data-public-cms-claim-button="true"] {
      background: transparent !important;
      color: #c9a84c !important;
      border-color: rgba(201, 168, 76, 0.72) !important;
      padding: 0.32rem 0.58rem !important;
      font-size: 0.58rem !important;
      line-height: 1 !important;
      min-height: auto !important;
    }

    [data-public-cms-title-copy-inline="true"] {
      display: grid !important;
      grid-template-columns: minmax(0, auto) minmax(18rem, 34rem) !important;
      align-items: end !important;
      column-gap: clamp(1.5rem, 4vw, 4rem) !important;
    }

    [data-public-cms-title-copy-inline="true"] > p[data-public-cms-inline-copy="true"] {
      margin: 0 !important;
      text-align: left !important;
      max-width: 34rem !important;
    }

    @media (max-width: 767px) {
      [data-public-cms-title-copy-inline="true"] {
        grid-template-columns: 1fr !important;
        row-gap: 1rem !important;
      }
    }

    [data-public-cms-location="true"] .public-cms-location-bar {
      height: 0.42rem;
      background: rgba(13, 26, 15, 0.88);
      border: 1px solid rgba(45, 106, 79, 0.24);
      overflow: hidden;
    }

    [data-public-cms-location="true"] .public-cms-location-bar > span {
      display: block;
      height: 100%;
      background: rgba(201, 168, 76, 0.82);
    }
  `;
  document.head.appendChild(style);
}

function inlineHeaderCopy(titleText?: string, description?: string) {
  if (!titleText || !description) return;
  const title = findTitle(titleText);
  const copy = textNodes().find(element => norm(element.textContent).includes(norm(description).slice(0, 40))) ?? null;
  if (!title || !copy) return;
  const parent = title.parentElement;
  if (!parent || !parent.contains(copy)) return;
  parent.dataset.publicCmsTitleCopyInline = 'true';
  copy.dataset.publicCmsInlineCopy = 'true';
  copy.textContent = description;
}

function applyAlumni(content: PageContent) {
  if (path() !== '/ex-alunos') return;
  const label = String(content.claim_button_label ?? '').trim();
  if (label) {
    Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      .filter(button => ['reivindicar', 'sou eu'].includes(txt(button)))
      .forEach(button => {
        button.textContent = label;
        button.dataset.publicCmsClaimButton = 'true';
      });
  }
  inlineHeaderCopy(content.title, content.description);
}

function applyMemories(content: PageContent) {
  if (path() !== '/nossa-historia/memorias') return;
  const showAnonymous = content.show_anonymous_option === true;
  const showModeration = content.show_moderation_notice === true;

  textNodes().forEach(element => {
    const text = txt(element);
    if (!showAnonymous && (text.includes('enviar sem mostrar nome') || text.includes('sem mostrar nome') || text.includes('anonimo'))) {
      const label = element.closest('label') as HTMLElement | null;
      const target = label ?? element;
      target.style.display = 'none';
      const checkbox = target.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    if (!showModeration && text.includes('moderacao')) {
      const paragraph = element.closest('p') as HTMLElement | null;
      if (paragraph) paragraph.style.display = 'none';
    }
  });
}

function applyCuriositiesHeader(content: PageContent) {
  if (path() !== '/curiosidades') return;
  inlineHeaderCopy(content.title, content.description);
}

function applyCuriositiesRemovals(content: PageContent) {
  if (path() !== '/curiosidades') return;
  const showAi = content.show_ai_card === true;
  const showChildren = content.show_children_quantity_card === true;
  textNodes().forEach(element => {
    const text = txt(element);
    if (!showAi && text.includes('leitura por ia')) closestCard(element)?.remove();
    if (!showChildren && (text.includes('quantidade de filhos declarados') || text.includes('qaantidade de filhos declarados'))) closestCard(element)?.remove();
  });
}

function locationCategory(row: LocationRow) {
  const city = norm(row.current_city);
  const state = norm(row.current_state);
  const country = norm(row.current_country || 'Brasil');
  if (country && country !== 'brasil' && country !== 'brazil') return 'foreign';
  if (city === 'natal' && (state === 'rn' || state === 'rio grande do norte' || !state)) return 'natal';
  if (state === 'rn' || state === 'rio grande do norte') return 'interior';
  return 'brazil';
}

function locationLabel(row: LocationRow, category: string) {
  const city = row.current_city?.trim();
  const state = row.current_state?.trim()?.toUpperCase();
  const country = row.current_country?.trim();
  if (category === 'foreign') return country || 'Exterior';
  if (category === 'brazil') return [city, state].filter(Boolean).join('/') || state || 'Brasil';
  if (category === 'interior') return [city, state || 'RN'].filter(Boolean).join('/');
  return 'Natal/RN';
}

function topLocations(rows: LocationRow[], category: string) {
  const counts = new Map<string, number>();
  rows.forEach(row => {
    const label = locationLabel(row, category);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, 4);
}

function locationCard(config: LocationCardConfig, rows: LocationRow[], total: number, content: PageContent) {
  const key = String(config.key ?? '');
  const title = String(config.title ?? '');
  const subtitle = String(config.subtitle ?? '');
  if (!key || !title) return '';
  const breakdown = topLocations(rows, key);
  const max = Math.max(1, ...breakdown.map(item => item.count));
  const percent = total ? Math.round((rows.length / total) * 100) : 0;
  const suffix = String(content.location_percent_suffix ?? '');
  const emptyLabel = String(content.location_empty_label ?? '');

  return `
    <article class="bg-[#141f14] border border-[#2d6a4f]/25 p-6 min-h-[15rem] flex flex-col gap-5">
      <div>
        ${subtitle ? `<p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.24em] mb-2">${escapeHtml(subtitle)}</p>` : ''}
        <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold leading-none">${rows.length}</h3>
        <p class="text-[#7a9a7a] text-xs mt-2">${escapeHtml(title)}${suffix ? ` · ${percent}% ${escapeHtml(suffix)}` : ''}</p>
      </div>
      <div class="mt-auto flex flex-col gap-3">
        ${breakdown.length ? breakdown.map(item => `
          <div>
            <div class="flex items-center justify-between gap-3 mb-1">
              <span class="text-[#f0ebe0] text-xs font-semibold truncate">${escapeHtml(item.label)}</span>
              <span class="text-[#c9a84c] text-[10px] font-mono">${item.count}</span>
            </div>
            <div class="public-cms-location-bar"><span style="width:${Math.max(8, Math.round((item.count / max) * 100))}%"></span></div>
          </div>
        `).join('') : `<p class="text-[#7a9a7a] text-sm leading-relaxed">${escapeHtml(emptyLabel)}</p>`}
      </div>
    </article>
  `;
}

async function fetchLocations() {
  try {
    const { data, error } = await (supabase as any)
      .from('public_profile_locations')
      .select('current_city,current_state,current_country');
    if (error) return [];
    return (data ?? []) as LocationRow[];
  } catch {
    return [];
  }
}

async function applyCuriositiesMap(content: PageContent) {
  if (path() !== '/curiosidades') return;
  const cards = Array.isArray(content.location_cards) ? content.location_cards as LocationCardConfig[] : [];
  if (!cards.length) return;

  const title = findText(text => text === 'mapa da turma' || text.includes('mapa da turma'));
  if (!title) return;
  const section = title.closest('section') as HTMLElement | null;
  const header = title.closest('div') as HTMLElement | null;
  const root = section ?? header?.parentElement ?? null;
  if (!root) return;

  root.querySelector('[data-public-cms-location="true"]')?.remove();
  const finalMount = root.querySelector('[data-curiosities-location-final="true"]') as HTMLElement | null;
  if (finalMount) finalMount.remove();

  const mount = document.createElement('div');
  mount.dataset.publicCmsLocation = 'true';
  mount.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-8';

  const headerBlock = header ?? title.parentElement;
  if (headerBlock?.parentElement) {
    let sibling = headerBlock.nextElementSibling as HTMLElement | null;
    while (sibling) {
      const next = sibling.nextElementSibling as HTMLElement | null;
      if (!sibling.dataset.publicCmsLocation) sibling.style.display = 'none';
      sibling = next;
    }
    headerBlock.insertAdjacentElement('afterend', mount);
  } else {
    root.appendChild(mount);
  }

  const rows = await fetchLocations();
  const groups: Record<string, LocationRow[]> = {
    natal: rows.filter(row => locationCategory(row) === 'natal'),
    interior: rows.filter(row => locationCategory(row) === 'interior'),
    brazil: rows.filter(row => locationCategory(row) === 'brazil'),
    foreign: rows.filter(row => locationCategory(row) === 'foreign'),
  };

  mount.innerHTML = cards.map(card => locationCard(card, groups[String(card.key ?? '')] ?? [], rows.length, content)).join('');
}

async function applyQuestionnaireButton(content: PageContent) {
  if (path() !== '/curiosidades') return;
  const label = String(content.questionnaire_button_label ?? '').trim();
  const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,a'))
    .filter(element => txt(element).includes('responder questionario'));
  if (label) buttons.forEach(button => { button.textContent = label; });

  if (content.questionnaire_answered_behavior !== 'hide') return;
  if (!buttons.length || document.documentElement.dataset.publicCmsQuestionnaireChecked === 'true') return;
  document.documentElement.dataset.publicCmsQuestionnaireChecked = 'true';
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return;
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!profile?.id) return;
    const { count } = await (supabase as any)
      .from('profile_school_questionnaire_answers')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id);
    if ((count ?? 0) > 0) buttons.forEach(button => { button.style.display = 'none'; });
  } catch {
    // Mantém o botão visível se a consulta falhar.
  }
}

function applyArchive(content: PageContent) {
  if (path() !== '/pos-festa') return;
  const title = String(content.organization_card_title ?? '').trim();
  const subtitle = String(content.organization_card_subtitle ?? '').trim();
  const showAfter = content.show_content_after_message === true;

  const label = findText(text => text.includes('mensagem da organizacao') || text.includes('em breve'));
  if (!label) return;
  const card = closestCard(label);
  if (!card) return;
  if (title) label.textContent = title;

  if (subtitle) {
    const target = Array.from(card.querySelectorAll<HTMLElement>('p'))
      .find(item => item !== label && txt(item) && !txt(item).includes(norm(title)));
    if (target) target.textContent = subtitle;
  }

  if (!showAfter) {
    let sibling = card.nextElementSibling as HTMLElement | null;
    while (sibling) {
      sibling.style.display = 'none';
      sibling = sibling.nextElementSibling as HTMLElement | null;
    }
    const section = card.closest('section') as HTMLElement | null;
    let nextSection = section?.nextElementSibling as HTMLElement | null;
    while (nextSection) {
      nextSection.style.display = 'none';
      nextSection = nextSection.nextElementSibling as HTMLElement | null;
    }
  }
}

async function applyAll() {
  const slug = pageSlug();
  if (!slug) return;
  installStyles();
  const content = await fetchPageContent();
  if (!content) return;
  applyAlumni(content);
  applyMemories(content);
  applyCuriositiesHeader(content);
  applyCuriositiesRemovals(content);
  await applyCuriositiesMap(content);
  await applyQuestionnaireButton(content);
  applyArchive(content);
}

let scheduled = false;
function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    void applyAll();
  });
}

void applyAll();
window.addEventListener('DOMContentLoaded', () => { void applyAll(); });
window.addEventListener('popstate', () => {
  contentPromise = null;
  delete document.documentElement.dataset.publicCmsQuestionnaireChecked;
  setTimeout(() => { void applyAll(); }, 100);
});
new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
setTimeout(() => { void applyAll(); }, 400);
setTimeout(() => { void applyAll(); }, 1200);
