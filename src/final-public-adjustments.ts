import { supabase } from './lib/supabase';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';

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

type CmsAsset = {
  asset_key?: string | null;
  file_url?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  usage_context?: string | null;
  is_active?: boolean | null;
};

let eventCmsPromise: Promise<EventCmsContent | null> | null = null;
let cmsAssetsPromise: Promise<Record<string, CmsAsset>> | null = null;

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

function getCmsAssets() {
  if (!cmsAssetsPromise) {
    cmsAssetsPromise = (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('cms_assets')
          .select('asset_key,file_url,alt_text,caption,usage_context,is_active')
          .eq('event_id', DEFAULT_EVENT_ID)
          .eq('is_active', true);
        if (error) return {};
        return Object.fromEntries((data ?? [])
          .filter((asset: CmsAsset) => asset.asset_key)
          .map((asset: CmsAsset) => [asset.asset_key, asset]));
      } catch {
        return {};
      }
    })();
  }
  return cmsAssetsPromise;
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
  const [cms, assets] = await Promise.all([getEventCmsContent(), getCmsAssets()]);

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
      const programAsset = assets.event_program_image;
      const image = cms?.program_image_url?.trim() || programAsset?.file_url?.trim() || '';
      const alt = cms?.program_image_alt?.trim()
        || programAsset?.alt_text?.trim()
        || cms?.program_section_title?.trim()
        || 'Imagem da programação do evento';
      rightColumn.dataset.eventProgramImageFinal = 'true';
      rightColumn.className = '';
      rightColumn.replaceChildren();
      if (image) {
        rightColumn.innerHTML = `<figure data-event-program-image-final="true" aria-label="${escapeHtml(alt)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`;
      } else {
        rightColumn.appendChild(technicalPlaceholder('Imagem da programação não configurada no CMS de assets.'));
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
          const alreadyExists = Array.from(grid.querySelectorAll<HTMLElement>('[data-event-extra-structure-card]'))
            .some(item => item.dataset.eventExtraStructureCard === titleText);
          if (alreadyExists) return;
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

function applyAll() {
  installStyles();
  applyHomeTimelineScrollActivation();
  applyHomeTextAdjustments();
  void applyEventCmsAdjustments();
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
  eventCmsPromise = null;
  cmsAssetsPromise = null;
  setTimeout(applyAll, 80);
});

new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
setTimeout(applyAll, 250);
setTimeout(applyAll, 900);
setTimeout(applyAll, 1800);
