import { supabase } from './lib/supabase';

type LocationRow = {
  current_city?: string | null;
  current_state?: string | null;
  current_country?: string | null;
  display_name?: string | null;
  full_name?: string | null;
};

const DEFAULT_EVENT_MAP_QUERY = 'Espaço Cultural Ponta Negra Av. Eng. Roberto Freire Ponta Negra Natal RN';
const EVENT_PROGRAM_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1400&h=1000&fit=crop&auto=format';

function currentPathname() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function normalizedText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function elementText(element: Element | null | undefined) {
  return normalizedText(element?.textContent ?? '');
}

function textElements() {
  return Array.from(document.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, span, button, a, label'));
}

function findTextElement(predicate: (text: string, element: HTMLElement) => boolean) {
  return textElements().find(element => predicate(elementText(element), element)) ?? null;
}

function findSectionContaining(...needles: string[]) {
  const normalizedNeedles = needles.map(normalizedText);
  return Array.from(document.querySelectorAll<HTMLElement>('section, main > div, #root > div > div'))
    .find(section => {
      const text = elementText(section);
      return normalizedNeedles.every(needle => text.includes(needle));
    }) ?? null;
}

function findClosestCard(element: HTMLElement | null) {
  if (!element) return null;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('div, article, section'))
    .filter(item => item.contains(element));
  return candidates
    .sort((a, b) => a.textContent!.length - b.textContent!.length)
    .find(item => {
      const className = String(item.className ?? '');
      return className.includes('border') || className.includes('bg-') || item.tagName.toLowerCase() === 'section';
    }) ?? element.parentElement;
}

function installFinalStyles() {
  if (document.querySelector('[data-hc-final-adjustments-style="true"]')) return;

  const style = document.createElement('style');
  style.dataset.hcFinalAdjustmentsStyle = 'true';
  style.textContent = `
    [data-home-event-more="true"] a {
      color: #0d1a0f !important;
      font-weight: 800 !important;
    }

    [data-home-event-more="true"] a:hover {
      color: #2d6a4f !important;
    }

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
      [data-hc-title-copy-inline="true"] {
        grid-template-columns: 1fr !important;
        row-gap: 1rem !important;
      }
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
  if (currentPathname() !== '/') return;
  const target = document.querySelector<HTMLElement>('[data-home-nostalgia-timeline="true"]');
  if (!target || target.dataset.homeTimelineScrollApplied === 'true') return;

  const buttons = Array.from(target.querySelectorAll<HTMLButtonElement>('button'));
  if (buttons.length < 2) return;

  target.dataset.homeTimelineScrollApplied = 'true';
  let activeButton: HTMLButtonElement | null = null;
  let ticking = false;

  function activateClosestToViewportCenter() {
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

  function requestActivation() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(activateClosestToViewportCenter);
  }

  const observer = new IntersectionObserver(requestActivation, {
    root: null,
    rootMargin: '-18% 0px -36% 0px',
    threshold: [0.15, 0.35, 0.55, 0.75],
  });

  buttons.forEach(button => observer.observe(button));
  window.addEventListener('scroll', requestActivation, { passive: true });
  window.addEventListener('resize', requestActivation);
  requestActivation();
}

function applyHomeFaqAndMoreButton() {
  if (currentPathname() !== '/') return;
  const faq = findSectionContaining('faq') ?? findSectionContaining('duvidas frequentes');
  if (faq) faq.dataset.homeFaqFinal = 'true';

  document.querySelectorAll<HTMLElement>('[data-home-event-more="true"] a').forEach(link => {
    link.style.color = '#0d1a0f';
    link.style.fontWeight = '800';
  });
}

function mapEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query.trim() || DEFAULT_EVENT_MAP_QUERY)}&output=embed`;
}

function applyEventLocalMap() {
  if (currentPathname() !== '/evento') return;
  const section = findSectionContaining('local', 'como chegar');
  if (!section || section.dataset.eventLocalMapFinal === 'true') return;

  const rightColumn = Array.from(section.querySelectorAll<HTMLElement>('div'))
    .find(element => element.className.toString().includes('min-h-[320px]'));
  if (!rightColumn || rightColumn.querySelector('iframe')) {
    if (section) section.dataset.eventLocalMapFinal = 'true';
    return;
  }

  const locationName = rightColumn.querySelector('p:nth-of-type(1)')?.textContent?.trim() || 'Espaço Cultural Ponta Negra';
  const locationAddress = rightColumn.querySelector('p:nth-of-type(2)')?.textContent?.trim() || 'Av. Eng. Roberto Freire, Ponta Negra, Natal/RN';
  rightColumn.replaceChildren();
  rightColumn.className = 'bg-[#0d1a0f] min-h-[320px] border border-[#2d6a4f]/20 overflow-hidden';

  const iframe = document.createElement('iframe');
  iframe.title = 'Mapa do evento';
  iframe.src = mapEmbedUrl(`${locationName} ${locationAddress}`);
  iframe.className = 'w-full h-[360px] border-0';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  rightColumn.appendChild(iframe);
  section.dataset.eventLocalMapFinal = 'true';
}

function applyEventProgramImage() {
  if (currentPathname() !== '/evento') return;
  const section = findSectionContaining('programacao', 'horarios e atracoes');
  if (!section || section.dataset.eventProgramImageFinal === 'true') return;

  const grid = Array.from(section.querySelectorAll<HTMLElement>('div'))
    .find(element => String(element.className).includes('lg:grid-cols-[0.9fr_1.1fr]'));
  if (!grid || grid.children.length < 2) return;

  const rightColumn = grid.children[1] as HTMLElement;
  const pageHeroImage = document.querySelector<HTMLImageElement>('section img[src]')?.src || EVENT_PROGRAM_IMAGE_FALLBACK;
  rightColumn.dataset.eventProgramImageFinal = 'true';
  rightColumn.className = '';
  rightColumn.innerHTML = `
    <figure data-event-program-image-final="true" aria-label="Imagem da programação do evento">
      <img src="${pageHeroImage}" alt="Imagem da programação do evento" loading="lazy" />
    </figure>
  `;
  section.dataset.eventProgramImageFinal = 'true';
}

function structureCard(title: string, description: string) {
  const card = document.createElement('div');
  card.className = 'bg-[#141f14] border border-[#2d6a4f]/25 p-6';
  card.dataset.eventExtraStructureCard = title;
  card.innerHTML = `
    <div class="text-[#c9a84c] mb-4" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M6 20V8l6-4 6 4v12"/><path d="M9 20v-6h6v6"/></svg>
    </div>
    <p class="text-[#f0ebe0] font-semibold mb-2">${title}</p>
    <p class="text-[#7a9a7a] text-sm leading-relaxed">${description}</p>
  `;
  return card;
}

function applyEventStructureCardsAndRemovePreview() {
  if (currentPathname() !== '/evento') return;

  const structure = findSectionContaining('estrutura', 'bar, comidas');
  if (structure && structure.dataset.eventStructureFinal !== 'true') {
    const grid = Array.from(structure.querySelectorAll<HTMLElement>('div'))
      .find(element => element.className.toString().includes('md:grid-cols-3'));
    if (grid) {
      [
        ['Estacionamento', 'Consulte a organização sobre vagas, pontos de embarque/desembarque e opções próximas ao local.'],
        ['Área Kids', 'Espaço pensado para apoio às famílias, conforme estrutura final contratada para o evento.'],
        ['Registro de fotos e vídeos', 'A noite terá registros oficiais para preservar os principais momentos do reencontro.'],
      ].forEach(([title, description]) => {
        if (!grid.querySelector(`[data-event-extra-structure-card="${title}"]`)) {
          grid.appendChild(structureCard(title, description));
        }
      });
      structure.dataset.eventStructureFinal = 'true';
    }
  }

  const preview = findSectionContaining('fotos', 'previa do evento');
  if (preview) preview.remove();
}

function applyAlumniClaimButton() {
  if (currentPathname() !== '/ex-alunos' && currentPathname() !== '/quem-vai' && currentPathname() !== '/turma') return;
  Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .filter(button => normalizedText(button.textContent) === 'reivindicar')
    .forEach(button => {
      button.textContent = 'Sou eu';
      button.dataset.hcClaimButtonFinal = 'true';
    });
}

function applyInlineHeaderCopy(titleText: string, copyNeedle: string) {
  const title = findTextElement(text => text === normalizedText(titleText));
  const copy = findTextElement(text => text.includes(normalizedText(copyNeedle)));
  if (!title || !copy) return;

  const titleParent = title.parentElement;
  if (!titleParent || !titleParent.contains(copy)) return;

  titleParent.dataset.hcTitleCopyInline = 'true';
  copy.dataset.hcInlineCopy = 'true';
}

function applyAlumniHeaderLayout() {
  if (currentPathname() !== '/ex-alunos') return;
  applyInlineHeaderCopy('Ex-alunos', 'Uma visão consolidada da turma');
}

function applyMemoriesNoAnonymousUi() {
  if (currentPathname() !== '/nossa-historia/memorias') return;

  textElements().forEach(element => {
    const text = elementText(element);
    if (text.includes('enviar sem mostrar nome') || text.includes('sem mostrar nome') || text.includes('anonimo') || text.includes('anônimo')) {
      const label = element.closest('label') as HTMLElement | null;
      const target = label ?? element;
      target.style.display = 'none';
      const input = target.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (input) {
        input.checked = false;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    if (text.includes('moderacao') || text.includes('moderação')) {
      const paragraph = element.closest('p') as HTMLElement | null;
      if (paragraph) paragraph.style.display = 'none';
    }
  });
}

function applyCuriositiesHeaderAndCards() {
  if (currentPathname() !== '/curiosidades') return;
  applyInlineHeaderCopy('Curiosidades', 'Dados, lembranças, mapa, profissões');

  textElements().forEach(element => {
    const text = elementText(element);
    if (text.includes('leitura por ia') || text.includes('quantidade de filhos declarados') || text.includes('qaantidade de filhos declarados')) {
      const card = findClosestCard(element);
      if (card) card.style.display = 'none';
    }
  });
}

function categorizeLocation(row: LocationRow) {
  const city = normalizedText(row.current_city);
  const state = normalizedText(row.current_state);
  const country = normalizedText(row.current_country || 'Brasil');

  if (country && country !== 'brasil' && country !== 'brazil') return 'foreign';
  if (city === 'natal' && (state === 'rn' || state === 'rio grande do norte' || !state)) return 'natal';
  if (state === 'rn' || state === 'rio grande do norte') return 'interior';
  return 'brazil';
}

function displayLocationLabel(row: LocationRow, category: string) {
  const city = row.current_city?.trim();
  const state = row.current_state?.trim()?.toUpperCase();
  const country = row.current_country?.trim();

  if (category === 'foreign') return country || 'Exterior';
  if (category === 'brazil') return [city, state].filter(Boolean).join('/') || state || 'Brasil';
  if (category === 'interior') return [city, state || 'RN'].filter(Boolean).join('/');
  return 'Natal/RN';
}

function topBreakdown(rows: LocationRow[], category: string) {
  const counts = new Map<string, number>();
  rows.forEach(row => {
    const label = displayLocationLabel(row, category);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, 4);
}

function locationCard(title: string, subtitle: string, rows: LocationRow[], category: string, totalBase: number) {
  const breakdown = topBreakdown(rows, category);
  const max = Math.max(1, ...breakdown.map(item => item.count));
  const percent = totalBase ? Math.round((rows.length / totalBase) * 100) : 0;

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

async function fetchLocationRows() {
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

async function applyCuriositiesLocationMap() {
  if (currentPathname() !== '/curiosidades') return;
  const title = findTextElement(text => text === 'mapa da turma' || text.includes('mapa da turma'));
  if (!title) return;

  const section = title.closest('section') as HTMLElement | null;
  const header = title.closest('div') as HTMLElement | null;
  const root = section ?? header?.parentElement ?? null;
  if (!root || root.querySelector('[data-curiosities-location-final="true"]')) return;

  const mount = document.createElement('div');
  mount.dataset.curiositiesLocationFinal = 'true';
  mount.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-8';
  mount.innerHTML = `
    <div class="md:col-span-2 xl:col-span-4 border border-[#2d6a4f]/25 bg-[#141f14] p-6 text-[#7a9a7a] text-sm font-mono uppercase tracking-[0.16em]">
      Carregando mapa da turma...
    </div>
  `;

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

  const rows = await fetchLocationRows();
  const groups = {
    natal: rows.filter(row => categorizeLocation(row) === 'natal'),
    interior: rows.filter(row => categorizeLocation(row) === 'interior'),
    brazil: rows.filter(row => categorizeLocation(row) === 'brazil'),
    foreign: rows.filter(row => categorizeLocation(row) === 'foreign'),
  };
  const total = rows.length;

  mount.innerHTML = [
    locationCard('Em Natal/RN', 'Cidade: Natal · UF: RN', groups.natal, 'natal', total),
    locationCard('No interior do estado', 'Cidade diferente de Natal · UF: RN', groups.interior, 'interior', total),
    locationCard('Pelo Brasil', 'UF diferente de RN', groups.brazil, 'brazil', total),
    locationCard('Vivendo no Exterior', 'País diferente de Brasil', groups.foreign, 'foreign', total),
  ].join('');
}

async function applyQuestionnaireButtonVisibility() {
  if (currentPathname() !== '/curiosidades') return;
  const buttons = Array.from(document.querySelectorAll<HTMLElement>('button, a'))
    .filter(element => elementText(element).includes('responder questionario'));
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

    if ((count ?? 0) > 0) {
      buttons.forEach(button => { button.style.display = 'none'; });
    }
  } catch {
    // Mantém o botão visível se a checagem falhar.
  }
}

function applyArchiveComingSoon() {
  if (currentPathname() !== '/pos-festa') return;
  const label = findTextElement(text => text.includes('mensagem da organizacao'));
  if (!label || label.dataset.archiveFinalApplied === 'true') return;

  label.dataset.archiveFinalApplied = 'true';
  const card = findClosestCard(label);
  if (!card) return;

  label.textContent = 'EM BREVE';

  const oldSubtitle = findTextElement(text => text.includes('texto ficticio pos-evento'));
  if (oldSubtitle && card.contains(oldSubtitle)) {
    oldSubtitle.textContent = 'Confira aqui, depois da festa, as fotos, vídeos e todos os destaques deste evento que ficará na memória';
  } else {
    const paragraphs = Array.from(card.querySelectorAll<HTMLElement>('p'))
      .filter(item => item !== label && elementText(item) && !elementText(item).includes('em breve'));
    const target = paragraphs[0];
    if (target) target.textContent = 'Confira aqui, depois da festa, as fotos, vídeos e todos os destaques deste evento que ficará na memória';
  }

  const cardParent = card.parentElement;
  if (cardParent) {
    let sibling = card.nextElementSibling as HTMLElement | null;
    while (sibling) {
      sibling.style.display = 'none';
      sibling = sibling.nextElementSibling as HTMLElement | null;
    }
  }

  const section = card.closest('section') as HTMLElement | null;
  if (section?.parentElement) {
    let next = section.nextElementSibling as HTMLElement | null;
    while (next) {
      next.style.display = 'none';
      next = next.nextElementSibling as HTMLElement | null;
    }
  }
}

function applyPageAdjustments() {
  installFinalStyles();
  applyHomeTimelineScrollActivation();
  applyHomeFaqAndMoreButton();
  applyEventLocalMap();
  applyEventProgramImage();
  applyEventStructureCardsAndRemovePreview();
  applyAlumniClaimButton();
  applyAlumniHeaderLayout();
  applyMemoriesNoAnonymousUi();
  applyCuriositiesHeaderAndCards();
  void applyCuriositiesLocationMap();
  void applyQuestionnaireButtonVisibility();
  applyArchiveComingSoon();
}

let scheduled = false;
function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyPageAdjustments();
  });
}

applyPageAdjustments();
window.addEventListener('DOMContentLoaded', applyPageAdjustments);
window.addEventListener('popstate', () => {
  delete document.documentElement.dataset.hcQuestionnaireButtonChecked;
  setTimeout(applyPageAdjustments, 80);
});

const observer = new MutationObserver(scheduleApply);
observer.observe(document.body, { childList: true, subtree: true });

setTimeout(applyPageAdjustments, 250);
setTimeout(applyPageAdjustments, 900);
setTimeout(applyPageAdjustments, 1800);
