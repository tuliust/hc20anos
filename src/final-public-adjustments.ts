import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';

type LocationRow = {
  current_city?: string | null;
  current_state?: string | null;
  current_country?: string | null;
  display_name?: string | null;
  full_name?: string | null;
};

type EventStructureCard = {
  title?: string | null;
  description?: string | null;
  icon?: string | null;
};

type EventCmsContent = {
  map_embed_url?: string | null;
  program_image_url?: string | null;
  program_image_alt?: string | null;
  structure_cards_json?: EventStructureCard[] | string | null;
  show_gallery_preview?: boolean | null;
  local_section_eyebrow?: string | null;
  local_section_title?: string | null;
  program_section_eyebrow?: string | null;
  program_section_title?: string | null;
  structure_section_eyebrow?: string | null;
  structure_section_title?: string | null;
  structure_section_subtitle?: string | null;
};

let eventCmsPromise: Promise<EventCmsContent | null> | null = null;

function path() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
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

function smallestMatch<T extends HTMLElement>(items: T[], needles: string[]) {
  const normalized = needles.map(norm);
  return items
    .filter(item => {
      const text = txt(item);
      return normalized.every(needle => text.includes(needle));
    })
    .sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0))[0] ?? null;
}

function findSection(...needles: string[]) {
  return smallestMatch(Array.from(document.querySelectorAll<HTMLElement>('section')), needles)
    ?? smallestMatch(Array.from(document.querySelectorAll<HTMLElement>('main > div, #root > div > div')), needles);
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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function installStyles() {
  if (document.querySelector('[data-hc-final-adjustments-style="true"]')) return;
  const style = document.createElement('style');
  style.dataset.hcFinalAdjustmentsStyle = 'true';
  style.textContent = `
    [data-home-event-more="true"] a { color: #0d1a0f !important; font-weight: 800 !important; }
    [data-home-event-more="true"] a:hover { color: #2d6a4f !important; }

    [data-home-faq-final="true"] button,
    [data-home-faq-final="true"] h3,
    [data-home-faq-final="true"] .font-semibold {
      font-size: clamp(1.06rem, 1.18vw, 1.28rem) !important;
      line-height: 1.35 !important;
    }
    [data-home-faq-final="true"] p:not(:first-child),
    [data-home-faq-final="true"] div:not(:first-child) > p {
      font-size: clamp(0.98rem, 1vw, 1.08rem) !important;
      line-height: 1.7 !important;
    }

    [data-hc-claim-button-final="true"] {
      background: transparent !important;
      color: #c9a84c !important;
      border-color: rgba(201, 168, 76, 0.72) !important;
      padding: 0.32rem 0.58rem !important;
      font-size: 0.58rem !important;
      line-height: 1 !important;
      min-height: auto !important;
    }
    [data-hc-claim-button-final="true"]:hover {
      background: rgba(201, 168, 76, 0.08) !important;
      border-color: #c9a84c !important;
      color: #e6c766 !important;
    }

    [data-hc-title-copy-inline="true"] {
      display: grid !important;
      grid-template-columns: minmax(0, auto) minmax(18rem, 34rem) !important;
      align-items: end !important;
      column-gap: clamp(1.5rem, 4vw, 4rem) !important;
    }
    [data-hc-title-copy-inline="true"] > p[data-hc-inline-copy="true"] {
      margin: 0 !important;
      text-align: left !important;
      max-width: 34rem !important;
    }
    @media (max-width: 767px) {
      [data-hc-title-copy-inline="true"] { grid-template-columns: 1fr !important; row-gap: 1rem !important; }
    }

    [data-event-program-image-final="true"] {
      min-height: 100%;
      border: 1px solid rgba(45, 106, 79, 0.25);
      background: #141f14;
      overflow: hidden;
    }
    [data-event-program-image-final="true"] img {
      width: 100%;
      height: 100%;
      min-height: 26rem;
      object-fit: cover;
      opacity: 0.76;
    }
    [data-event-program-image-placeholder="true"] {
      min-height: 26rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      border: 1px solid rgba(45, 106, 79, 0.25);
      background: #141f14;
      color: #7a9a7a;
      font: 600 0.78rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      text-align: center;
    }

    [data-curiosities-location-final="true"] .hc-location-bar {
      height: 0.42rem;
      background: rgba(13, 26, 15, 0.88);
      border: 1px solid rgba(45, 106, 79, 0.24);
      overflow: hidden;
    }
    [data-curiosities-location-final="true"] .hc-location-bar > span {
      display: block;
      height: 100%;
      background: rgba(201, 168, 76, 0.82);
    }
  `;
  document.head.appendChild(style);
}

function applyHomeTimelineScrollActivation() {
  if (path() !== '/') return;
  const timeline = document.querySelector<HTMLElement>('[data-home-nostalgia-timeline="true"]');
  if (!timeline || timeline.dataset.homeTimelineScrollApplied === 'true') return;
  const buttons = Array.from(timeline.querySelectorAll<HTMLButtonElement>('button'));
  if (buttons.length < 2) return;

  timeline.dataset.homeTimelineScrollApplied = 'true';
  let activeButton: HTMLButtonElement | null = null;
  let ticking = false;

  function activate() {
    ticking = false;
    const viewportCenter = window.innerHeight * 0.46;
    const closest = buttons
      .map(button => ({ button, distance: Math.abs(button.getBoundingClientRect().top + button.getBoundingClientRect().height / 2 - viewportCenter) }))
      .sort((a, b) => a.distance - b.distance)[0]?.button ?? null;
    if (closest && closest !== activeButton) {
      activeButton = closest;
      closest.click();
    }
  }

  function scheduleActivation() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(activate);
  }

  const observer = new IntersectionObserver(scheduleActivation, {
    root: null,
    rootMargin: '-18% 0px -36% 0px',
    threshold: [0.15, 0.35, 0.55, 0.75],
  });
  buttons.forEach(button => observer.observe(button));
  window.addEventListener('scroll', scheduleActivation, { passive: true });
  window.addEventListener('resize', scheduleActivation);
  scheduleActivation();
}

function applyHomeTextAdjustments() {
  if (path() !== '/') return;
  const faq = findSection('faq') ?? findSection('duvidas frequentes');
  if (faq) faq.dataset.homeFaqFinal = 'true';
  document.querySelectorAll<HTMLElement>('[data-home-event-more="true"] a').forEach(link => {
    link.style.color = '#0d1a0f';
    link.style.fontWeight = '800';
  });
}

function getEventCmsContent() {
  if (!eventCmsPromise) {
    eventCmsPromise = (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('event_page_content')
          .select('*')
          .eq('event_id', DEFAULT_EVENT_ID)
          .maybeSingle();
        if (error) return null;
        return (data ?? null) as EventCmsContent | null;
      } catch {
        return null;
      }
    })();
  }
  return eventCmsPromise;
}

function parseStructureCards(value: EventCmsContent['structure_cards_json']) {
  if (!value) return [] as EventStructureCard[];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as EventStructureCard[] : [];
  } catch {
    return [] as EventStructureCard[];
  }
}

function mapUrlFromCms(cms: EventCmsContent | null, locationQuery: string) {
  const raw = cms?.map_embed_url?.trim();
  if (raw) {
    const match = raw.match(/src=["']([^"']+)["']/i);
    return match?.[1] ?? raw;
  }
  return locationQuery.trim()
    ? `https://www.google.com/maps?q=${encodeURIComponent(locationQuery.trim())}&output=embed`
    : '';
}

function technicalPlaceholder(message: string) {
  const div = document.createElement('div');
  div.dataset.eventProgramImagePlaceholder = 'true';
  div.textContent = message;
  return div;
}

function setTextIfPresent(element: HTMLElement | null, value?: string | null) {
  const next = value?.trim();
  if (element && next) element.textContent = next;
}

async function applyEventCmsAdjustments() {
  if (path() !== '/evento') return;
  const cms = await getEventCmsContent();

  const localSection = findSection('local', 'como chegar') ?? document.querySelector<HTMLElement>('[data-event-local-final="true"]');
  if (localSection) {
    localSection.dataset.eventLocalFinal = 'true';
    setTextIfPresent(localSection.querySelector('p'), cms?.local_section_eyebrow);
    setTextIfPresent(localSection.querySelector('h2'), cms?.local_section_title);

    const rightColumn = Array.from(localSection.querySelectorAll<HTMLElement>('div'))
      .find(element => String(element.className).includes('min-h-[320px]'));
    if (rightColumn && rightColumn.dataset.eventLocalMapFinal !== 'true') {
      const existingIframe = rightColumn.querySelector('iframe');
      if (existingIframe) {
        rightColumn.dataset.eventLocalMapFinal = 'true';
      } else {
        const locationName = rightColumn.querySelector('p:nth-of-type(1)')?.textContent?.trim() ?? '';
        const locationAddress = rightColumn.querySelector('p:nth-of-type(2)')?.textContent?.trim() ?? '';
        const iframeSrc = mapUrlFromCms(cms, `${locationName} ${locationAddress}`);
        rightColumn.replaceChildren();
        rightColumn.className = 'bg-[#0d1a0f] min-h-[320px] border border-[#2d6a4f]/20 overflow-hidden';
        if (iframeSrc) {
          const iframe = document.createElement('iframe');
          iframe.title = cms?.local_section_title?.trim() || 'Mapa do evento';
          iframe.src = iframeSrc;
          iframe.className = 'w-full h-[360px] border-0';
          iframe.loading = 'lazy';
          iframe.referrerPolicy = 'no-referrer-when-downgrade';
          rightColumn.appendChild(iframe);
        } else {
          rightColumn.appendChild(technicalPlaceholder('Mapa não configurado no Admin.'));
        }
        rightColumn.dataset.eventLocalMapFinal = 'true';
      }
    }
  }

  const programSection = findSection('programacao', 'horarios e atracoes') ?? document.querySelector<HTMLElement>('[data-event-program-final="true"]');
  if (programSection) {
    programSection.dataset.eventProgramFinal = 'true';
    const label = programSection.querySelector<HTMLElement>('p');
    const title = programSection.querySelector<HTMLElement>('h2');
    setTextIfPresent(label, cms?.program_section_eyebrow);
    setTextIfPresent(title, cms?.program_section_title);

    const grid = Array.from(programSection.querySelectorAll<HTMLElement>('div'))
      .find(element => String(element.className).includes('lg:grid-cols-[0.9fr_1.1fr]'));
    if (grid && grid.children.length >= 2 && (grid.children[1] as HTMLElement).dataset.eventProgramImageFinal !== 'true') {
      const rightColumn = grid.children[1] as HTMLElement;
      const image = cms?.program_image_url?.trim() || '';
      const alt = cms?.program_image_alt?.trim() || cms?.program_section_title?.trim() || 'Imagem da programação do evento';
      rightColumn.dataset.eventProgramImageFinal = 'true';
      rightColumn.className = '';
      rightColumn.replaceChildren();
      if (image) {
        rightColumn.innerHTML = `<figure data-event-program-image-final="true" aria-label="${escapeHtml(alt)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`;
      } else {
        rightColumn.appendChild(technicalPlaceholder('Imagem da programação não configurada no Admin.'));
      }
    }
  }

  const structure = findSection('estrutura', 'bar, comidas') ?? document.querySelector<HTMLElement>('[data-event-structure-final="true"]');
  if (structure) {
    structure.dataset.eventStructureFinal = 'true';
    const label = structure.querySelector<HTMLElement>('p');
    const title = structure.querySelector<HTMLElement>('h2');
    setTextIfPresent(label, cms?.structure_section_eyebrow);
    setTextIfPresent(title, cms?.structure_section_title || cms?.structure_section_subtitle);

    const grid = Array.from(structure.querySelectorAll<HTMLElement>('div'))
      .find(element => String(element.className).includes('md:grid-cols-3'));
    if (grid && grid.dataset.eventStructureCardsFinal !== 'true') {
      parseStructureCards(cms?.structure_cards_json)
        .filter(card => card.title?.trim())
        .forEach(card => {
          const titleText = card.title?.trim() ?? '';
          if (grid.querySelector(`[data-event-extra-structure-card="${CSS.escape(titleText)}"]`)) return;
          const item = document.createElement('div');
          item.className = 'bg-[#141f14] border border-[#2d6a4f]/25 p-6';
          item.dataset.eventExtraStructureCard = titleText;
          item.innerHTML = `
            <div class="text-[#c9a84c] mb-4" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M6 20V8l6-4 6 4v12"/><path d="M9 20v-6h6v6"/></svg>
            </div>
            <p class="text-[#f0ebe0] font-semibold mb-2">${escapeHtml(titleText)}</p>
            <p class="text-[#7a9a7a] text-sm leading-relaxed">${escapeHtml(card.description ?? '')}</p>
          `;
          grid.appendChild(item);
        });
      grid.dataset.eventStructureCardsFinal = 'true';
    }
  }

  const preview = findSection('fotos', 'previa do evento');
  if (preview && cms?.show_gallery_preview !== true) preview.remove();
}

function applyAlumniButton() {
  if (!['/ex-alunos', '/quem-vai', '/turma'].includes(path())) return;
  Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .filter(button => norm(button.textContent) === 'reivindicar')
    .forEach(button => {
      button.textContent = 'Sou eu';
      button.dataset.hcClaimButtonFinal = 'true';
    });
}

function inlineHeaderCopy(titleText: string, copyNeedle: string) {
  const title = findText(text => text === norm(titleText));
  const copy = findText(text => text.includes(norm(copyNeedle)));
  if (!title || !copy) return;
  const parent = title.parentElement;
  if (!parent || !parent.contains(copy)) return;
  parent.dataset.hcTitleCopyInline = 'true';
  copy.dataset.hcInlineCopy = 'true';
}

function applyAlumniHeader() {
  if (path() === '/ex-alunos') inlineHeaderCopy('Ex-alunos', 'Uma visão consolidada da turma');
}

function applyMemoriesUi() {
  if (path() !== '/nossa-historia/memorias') return;
  textNodes().forEach(element => {
    const text = txt(element);
    if (text.includes('enviar sem mostrar nome') || text.includes('sem mostrar nome') || text.includes('anonimo') || text.includes('anônimo')) {
      const label = element.closest('label') as HTMLElement | null;
      const target = label ?? element;
      target.style.display = 'none';
      const checkbox = target.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    if (text.includes('moderacao') || text.includes('moderação')) {
      const paragraph = element.closest('p') as HTMLElement | null;
      if (paragraph) paragraph.style.display = 'none';
    }
  });
}

function applyCuriositiesHeaderAndRemovals() {
  if (path() !== '/curiosidades') return;
  inlineHeaderCopy('Curiosidades', 'Dados, lembranças, mapa, profissões');
  textNodes().forEach(element => {
    const text = txt(element);
    if (text.includes('leitura por ia') || text.includes('quantidade de filhos declarados') || text.includes('qaantidade de filhos declarados')) {
      const card = closestCard(element);
      if (card) card.style.display = 'none';
    }
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

function locationCard(title: string, subtitle: string, rows: LocationRow[], category: string, total: number) {
  const breakdown = topLocations(rows, category);
  const max = Math.max(1, ...breakdown.map(item => item.count));
  const percent = total ? Math.round((rows.length / total) * 100) : 0;
  return `
    <article class="bg-[#141f14] border border-[#2d6a4f]/25 p-6 min-h-[15rem] flex flex-col gap-5">
      <div>
        <p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.24em] mb-2">${subtitle}</p>
        <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold leading-none">${rows.length}</h3>
        <p class="text-[#7a9a7a] text-xs mt-2">${title} · ${percent}% dos perfis com localização pública</p>
      </div>
      <div class="mt-auto flex flex-col gap-3">
        ${breakdown.length ? breakdown.map(item => `
          <div>
            <div class="flex items-center justify-between gap-3 mb-1">
              <span class="text-[#f0ebe0] text-xs font-semibold truncate">${item.label}</span>
              <span class="text-[#c9a84c] text-[10px] font-mono">${item.count}</span>
            </div>
            <div class="hc-location-bar"><span style="width:${Math.max(8, Math.round((item.count / max) * 100))}%"></span></div>
          </div>
        `).join('') : '<p class="text-[#7a9a7a] text-sm leading-relaxed">Sem dados públicos ainda.</p>'}
      </div>
    </article>
  `;
}

async function fetchLocations() {
  try {
    const { data, error } = await (supabase as any)
      .from('public_profile_locations')
      .select('current_city,current_state,current_country,display_name,full_name');
    if (error) return [];
    return (data ?? []) as LocationRow[];
  } catch {
    return [];
  }
}

async function applyCuriositiesMap() {
  if (path() !== '/curiosidades') return;
  const title = findText(text => text === 'mapa da turma' || text.includes('mapa da turma'));
  if (!title) return;
  const section = title.closest('section') as HTMLElement | null;
  const header = title.closest('div') as HTMLElement | null;
  const root = section ?? header?.parentElement ?? null;
  if (!root || root.querySelector('[data-curiosities-location-final="true"]')) return;

  const mount = document.createElement('div');
  mount.dataset.curiositiesLocationFinal = 'true';
  mount.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-8';
  mount.innerHTML = '<div class="md:col-span-2 xl:col-span-4 border border-[#2d6a4f]/25 bg-[#141f14] p-6 text-[#7a9a7a] text-sm font-mono uppercase tracking-[0.16em]">Carregando mapa da turma...</div>';

  const headerBlock = header ?? title.parentElement;
  if (headerBlock?.parentElement) {
    let sibling = headerBlock.nextElementSibling as HTMLElement | null;
    while (sibling) {
      const next = sibling.nextElementSibling as HTMLElement | null;
      sibling.style.display = 'none';
      sibling = next;
    }
    headerBlock.insertAdjacentElement('afterend', mount);
  } else {
    root.appendChild(mount);
  }

  const rows = await fetchLocations();
  const groups = {
    natal: rows.filter(row => locationCategory(row) === 'natal'),
    interior: rows.filter(row => locationCategory(row) === 'interior'),
    brazil: rows.filter(row => locationCategory(row) === 'brazil'),
    foreign: rows.filter(row => locationCategory(row) === 'foreign'),
  };

  mount.innerHTML = [
    locationCard('Em Natal/RN', 'Cidade: Natal · UF: RN', groups.natal, 'natal', rows.length),
    locationCard('No interior do estado', 'Cidade diferente de Natal · UF: RN', groups.interior, 'interior', rows.length),
    locationCard('Pelo Brasil', 'UF diferente de RN', groups.brazil, 'brazil', rows.length),
    locationCard('Vivendo no Exterior', 'País diferente de Brasil', groups.foreign, 'foreign', rows.length),
  ].join('');
}

async function applyQuestionnaireButton() {
  if (path() !== '/curiosidades') return;
  const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,a'))
    .filter(element => txt(element).includes('responder questionario'));
  if (!buttons.length || document.documentElement.dataset.hcQuestionnaireButtonChecked === 'true') return;

  document.documentElement.dataset.hcQuestionnaireButtonChecked = 'true';
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
    // Se falhar, mantém visível.
  }
}

function applyArchiveComingSoon() {
  if (path() !== '/pos-festa') return;
  const label = findText(text => text.includes('mensagem da organizacao'));
  if (!label || label.dataset.archiveFinalApplied === 'true') return;
  label.dataset.archiveFinalApplied = 'true';

  const card = closestCard(label);
  if (!card) return;
  label.textContent = 'EM BREVE';

  const subtitle = findText(text => text.includes('texto ficticio pos-evento'));
  if (subtitle && card.contains(subtitle)) {
    subtitle.textContent = 'Confira aqui, depois da festa, as fotos, vídeos e todos os destaques deste evento que ficará na memória';
  } else {
    const target = Array.from(card.querySelectorAll<HTMLElement>('p'))
      .find(item => item !== label && txt(item) && !txt(item).includes('em breve'));
    if (target) target.textContent = 'Confira aqui, depois da festa, as fotos, vídeos e todos os destaques deste evento que ficará na memória';
  }

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

function applyAll() {
  installStyles();
  applyHomeTimelineScrollActivation();
  applyHomeTextAdjustments();
  void applyEventCmsAdjustments();
  applyAlumniButton();
  applyAlumniHeader();
  applyMemoriesUi();
  applyCuriositiesHeaderAndRemovals();
  void applyCuriositiesMap();
  void applyQuestionnaireButton();
  applyArchiveComingSoon();
}

let scheduled = false;
function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyAll();
  });
}

applyAll();
window.addEventListener('DOMContentLoaded', applyAll);
window.addEventListener('popstate', () => {
  delete document.documentElement.dataset.hcQuestionnaireButtonChecked;
  eventCmsPromise = null;
  setTimeout(applyAll, 80);
});

new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
setTimeout(applyAll, 250);
setTimeout(applyAll, 900);
setTimeout(applyAll, 1800);
