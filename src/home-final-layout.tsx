import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const HOME_PATHS = new Set(['', '/', '/index.html']);

const NOSTALGIA_TIMELINE = [
  {
    year: '1995',
    visual: '☎',
    title: 'Orelhão pra ligar pra casa',
    description: 'Ainda na nossa época de alfabetização, o normal ainda era usar o orelhão para ligar pra casa.',
  },
  {
    year: '1996',
    visual: 'Cadê?',
    title: 'Internet discada e Cadê?',
    description: 'Quando entramos na 1ª série, começava-se a era da internet discada e das buscas no site Cadê?.',
  },
  {
    year: '1999',
    visual: 'ICQ',
    title: 'mIRC e ICQ',
    description: 'Na 4ª série, começaram os tempos de mIRC e ICQ.',
  },
  {
    year: '2000',
    visual: 'MSN',
    title: 'MSN Messenger',
    description: 'Boa parte do nosso Ensino Fundamental foi conversando pelo MSN Messenger.',
  },
  {
    year: '2003',
    visual: '📱',
    title: 'Nokia e SMS',
    description: 'Na 8ª série, passamos a mandar SMS com nossos Nokias.',
  },
  {
    year: '2004',
    visual: 'ORK',
    title: 'Orkut e Fotolog',
    description: 'No Ensino Médio, Orkut e Fotolog marcaram para sempre nossas vidas.',
  },
];

function currentPathname() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function isHomePath() {
  return HOME_PATHS.has(currentPathname());
}

function normalizedText(element: Element) {
  return element.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
}

function findSectionContaining(...needles: string[]) {
  const normalizedNeedles = needles.map(item => item.toLowerCase());
  return Array.from(document.querySelectorAll<HTMLElement>('section'))
    .find(section => {
      const text = normalizedText(section);
      return normalizedNeedles.every(needle => text.includes(needle));
    }) ?? null;
}

function findPanelCardContaining(...needles: string[]) {
  const normalizedNeedles = needles.map(item => item.toLowerCase());
  return Array.from(document.querySelectorAll<HTMLElement>('[data-home-alumni-overview-panel="true"] div'))
    .find(element => {
      const text = normalizedText(element);
      return normalizedNeedles.every(needle => text.includes(needle));
    }) ?? null;
}

function installResponsiveStandardization() {
  document.documentElement.dataset.hcGlobalHeader = 'true';
  if (isHomePath()) document.documentElement.dataset.homeDesktopScale = 'true';

  if (document.querySelector('[data-hc-responsive-standard="true"]')) return true;

  const style = document.createElement('style');
  style.dataset.hcResponsiveStandard = 'true';
  style.textContent = `
    [data-home-header-buy-cta-hidden="true"] {
      display: none !important;
    }

    html[data-hc-global-header="true"] header {
      background: rgba(8, 15, 8, 0.97) !important;
    }

    html[data-hc-global-header="true"] header > div {
      width: min(100% - 1.5rem, 86rem) !important;
    }

    html[data-hc-global-header="true"] header button[aria-label^="Início"] {
      overflow: visible !important;
    }

    html[data-hc-global-header="true"] header button[aria-label^="Início"] img {
      object-fit: contain !important;
      transform-origin: left center !important;
    }

    [data-home-confirmed-presence-card="true"] [data-home-confirmed-presence-grid="true"] {
      width: 100%;
      margin-top: auto;
      align-items: center;
    }

    [data-home-confirmed-presence-card="true"] [data-home-confirmed-presence-grid="true"] > div {
      align-items: center;
      justify-content: center;
    }

    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="1"] [data-home-confirmed-presence-grid="true"] {
      min-height: 9.5rem;
      display: flex !important;
      justify-content: center;
      align-items: center;
    }

    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="1"] [data-home-confirmed-presence-grid="true"] > div > img,
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="1"] [data-home-confirmed-presence-grid="true"] > div > div {
      width: min(9.5rem, 42vw) !important;
      height: min(9.5rem, 42vw) !important;
      font-size: 2.5rem !important;
    }

    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="2"] [data-home-confirmed-presence-grid="true"],
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="3"] [data-home-confirmed-presence-grid="true"],
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="4"] [data-home-confirmed-presence-grid="true"] {
      min-height: 9rem;
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 1rem !important;
    }

    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="2"] [data-home-confirmed-presence-grid="true"] > div > img,
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="2"] [data-home-confirmed-presence-grid="true"] > div > div,
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="3"] [data-home-confirmed-presence-grid="true"] > div > img,
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="3"] [data-home-confirmed-presence-grid="true"] > div > div,
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="4"] [data-home-confirmed-presence-grid="true"] > div > img,
    [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="4"] [data-home-confirmed-presence-grid="true"] > div > div {
      width: 5.4rem !important;
      height: 5.4rem !important;
      font-size: 1.35rem !important;
    }

    @media (max-width: 767px) {
      html[data-hc-global-header="true"] header > div {
        height: 4rem !important;
        min-height: 4rem !important;
        max-height: 4rem !important;
        padding-left: 0.75rem !important;
        padding-right: 0.75rem !important;
      }

      html[data-hc-global-header="true"] header button[aria-label^="Início"] img {
        width: 7.5rem !important;
        height: 3.85rem !important;
        max-width: 7.5rem !important;
        max-height: 3.85rem !important;
        transform: none !important;
      }

      html[data-hc-global-header="true"] header button[aria-label^="Início"] {
        height: 4rem !important;
      }

      html[data-home-desktop-scale="true"] section:not([data-home-hero-compact="true"]) {
        padding-top: 3rem !important;
        padding-bottom: 3rem !important;
      }

      [data-home-hero-compact="true"] {
        min-height: 100svh !important;
        padding-top: 5.25rem !important;
        padding-bottom: 1.25rem !important;
      }

      [data-home-hero-compact="true"] > .relative.z-10 {
        max-width: min(100% - 2rem, 28rem) !important;
        transform: translateY(-0.75rem) !important;
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(3.2rem, 18vw, 5rem) !important;
        line-height: 0.92 !important;
        letter-spacing: -0.045em !important;
      }

      [data-home-hero-compact="true"] h1 + p {
        font-size: clamp(1.15rem, 6vw, 1.65rem) !important;
        line-height: 1.1 !important;
      }

      [data-home-hero-compact="true"] .font-mono.tracking-\[0\.24em\] {
        font-size: 0.64rem !important;
        letter-spacing: 0.18em !important;
        line-height: 1.8 !important;
        margin-bottom: 1.5rem !important;
      }

      [data-home-hero-compact="true"] .flex.flex-col.sm\:flex-row {
        gap: 0.85rem !important;
        margin-bottom: 1.7rem !important;
      }

      [data-home-hero-compact="true"] .flex.flex-col.sm\:flex-row button {
        width: 100% !important;
        padding: 0.95rem 1rem !important;
        font-size: 0.78rem !important;
      }

      [data-home-hero-compact="true"] .inline-flex {
        max-width: 100% !important;
        gap: 0.55rem !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(2.35rem, 12vw, 3.35rem) !important;
        line-height: 1 !important;
      }

      [data-home-hero-compact="true"] .tabular-nums + div {
        font-size: 0.42rem !important;
        letter-spacing: 0.2em !important;
      }

      [data-home-hero-compact="true"] .inline-flex > div > span {
        font-size: 1.35rem !important;
        margin-left: 0.25rem !important;
        margin-right: 0.25rem !important;
      }

      [data-home-alumni-overview-panel="true"] .grid.lg\:grid-cols-2 > div {
        min-height: auto !important;
        padding: 1.2rem !important;
      }

      [data-home-class-tabs-compact="true"] .home-class-tabs-list {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0.65rem !important;
      }

      [data-home-class-tabs-compact="true"] .home-class-tabs-person-card {
        min-height: 4.75rem !important;
      }

      [data-home-class-tabs-compact="true"] button[aria-label="Ver pessoas anteriores"],
      [data-home-class-tabs-compact="true"] button[aria-label="Ver próximas pessoas"] {
        min-height: 4.75rem !important;
        width: 2rem !important;
      }

      [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="2"] [data-home-confirmed-presence-grid="true"],
      [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="3"] [data-home-confirmed-presence-grid="true"],
      [data-home-confirmed-presence-card="true"][data-home-confirmed-presence-count="4"] [data-home-confirmed-presence-grid="true"] {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      html[data-hc-global-header="true"] header > div {
        height: 4.25rem !important;
        min-height: 4.25rem !important;
        max-height: 4.25rem !important;
      }

      html[data-hc-global-header="true"] header button[aria-label^="Início"] img {
        width: 8.5rem !important;
        height: 4.2rem !important;
        max-height: 4.2rem !important;
      }

      html[data-home-desktop-scale="true"] section:not([data-home-hero-compact="true"]) {
        padding-top: 3.75rem !important;
        padding-bottom: 3.75rem !important;
      }

      [data-home-hero-compact="true"] {
        min-height: 100svh !important;
        padding-top: 5rem !important;
        padding-bottom: 1.75rem !important;
      }

      [data-home-hero-compact="true"] > .relative.z-10 {
        max-width: min(100% - 3rem, 48rem) !important;
        transform: translateY(-1.4rem) !important;
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(4.6rem, 12vw, 7rem) !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(3.1rem, 8vw, 4.4rem) !important;
      }
    }

    @media (min-width: 1024px) {
      html[data-home-desktop-scale="true"] {
        font-size: 88%;
      }

      html[data-hc-global-header="true"] header {
        min-height: 4.5rem !important;
      }

      html[data-hc-global-header="true"] header > div {
        height: 4.5rem !important;
        min-height: 4.5rem !important;
        max-height: 4.5rem !important;
        max-width: 84rem !important;
      }

      html[data-hc-global-header="true"] header button[aria-label^="Início"] {
        height: 4.5rem !important;
        transform: none !important;
        margin-left: 0 !important;
        gap: 0.8rem !important;
      }

      html[data-hc-global-header="true"] header button[aria-label^="Início"] img {
        height: 4.5rem !important;
        width: 10.25rem !important;
        max-height: none !important;
        max-width: none !important;
        transform: scale(1.14);
      }

      html[data-hc-global-header="true"] header nav {
        gap: clamp(1rem, 1.45vw, 1.35rem) !important;
      }

      html[data-hc-global-header="true"] header nav button {
        font-size: clamp(0.78rem, 0.92vw, 0.95rem) !important;
        letter-spacing: 0.15em !important;
      }

      html[data-hc-global-header="true"] header > div > div:last-child {
        gap: 0.8rem !important;
      }

      html[data-hc-global-header="true"] header > div > div:last-child button,
      html[data-hc-global-header="true"] header > div > div:last-child a {
        font-size: 0.86rem !important;
        letter-spacing: 0.14em !important;
        padding: 0.82rem 1.45rem !important;
      }

      html[data-home-desktop-scale="true"] section:not([data-home-hero-compact="true"]) {
        padding-top: 4rem !important;
        padding-bottom: 4rem !important;
      }

      html[data-home-desktop-scale="true"] section:not([data-home-hero-compact="true"]) .max-w-7xl {
        max-width: 72rem !important;
      }

      html[data-home-desktop-scale="true"] section:not([data-home-hero-compact="true"]) h2 {
        font-size: clamp(2.25rem, 3.5vw, 3.2rem) !important;
      }

      [data-home-hero-compact="true"] {
        min-height: 100svh !important;
        padding-top: 4.15rem !important;
        padding-bottom: 2rem !important;
      }

      [data-home-hero-compact="true"] > .relative.z-10 {
        max-width: 70rem !important;
        transform: translateY(-2.6rem) !important;
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(4.45rem, 7.1vw, 6.75rem) !important;
        letter-spacing: -0.035em !important;
      }

      [data-home-hero-compact="true"] h1 + p {
        font-size: clamp(1.35rem, 2.35vw, 1.85rem) !important;
      }

      [data-home-hero-compact="true"] .w-20.h-px {
        margin-top: 1.15rem !important;
        margin-bottom: 1.15rem !important;
      }

      [data-home-hero-compact="true"] .font-mono.tracking-\[0\.24em\] {
        font-size: 0.82rem !important;
        letter-spacing: 0.24em !important;
        margin-bottom: 2rem !important;
      }

      [data-home-hero-compact="true"] .flex.flex-col.sm\:flex-row {
        margin-bottom: 2.15rem !important;
      }

      [data-home-hero-compact="true"] .flex.flex-col.sm\:flex-row button {
        font-size: 0.92rem !important;
        padding: 1rem 2.75rem !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(3.7rem, 5.4vw, 5.25rem) !important;
        line-height: 1 !important;
      }

      [data-home-hero-compact="true"] .tabular-nums + div {
        font-size: 0.52rem !important;
        letter-spacing: 0.3em !important;
      }

      [data-home-hero-compact="true"] .inline-flex > div > span {
        font-size: 2.55rem !important;
        margin-left: 1.15rem !important;
        margin-right: 1.15rem !important;
      }

      [data-home-alumni-overview-panel="true"] .grid.lg\:grid-cols-2 > div {
        min-height: 240px !important;
        padding: 1.45rem !important;
      }

      [data-home-class-tabs-compact="true"] .home-class-tabs-list {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 0.75rem !important;
      }

      [data-home-class-tabs-compact="true"] .home-class-tabs-person-card {
        min-height: 6.6rem !important;
      }
    }

    @media (min-width: 1280px) and (max-height: 860px) {
      html[data-home-desktop-scale="true"] {
        font-size: 86%;
      }

      [data-home-hero-compact="true"] > .relative.z-10 {
        transform: translateY(-3.15rem) !important;
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(4.35rem, 6.8vw, 6.45rem) !important;
      }

      [data-home-hero-compact="true"] h1 + p {
        font-size: clamp(1.25rem, 2vw, 1.65rem) !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(3.35rem, 5.1vw, 4.75rem) !important;
      }
    }
  `;
  document.head.appendChild(style);
  return true;
}

function hideHeaderBuyCta() {
  const header = document.querySelector<HTMLElement>('header');
  if (!header) return false;

  Array.from(header.querySelectorAll<HTMLElement>('button, a')).forEach(element => {
    if (normalizedText(element) !== 'comprar ingresso') return;
    element.dataset.homeHeaderBuyCtaHidden = 'true';
    element.setAttribute('aria-hidden', 'true');
    if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) element.tabIndex = -1;
    element.style.display = 'none';
  });

  return true;
}

function installGlobalHeaderObserver() {
  if (document.documentElement.dataset.homeGlobalHeaderObserver === 'true') return true;
  document.documentElement.dataset.homeGlobalHeaderObserver = 'true';

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(hideHeaderBuyCta);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return true;
}

function compactHeroViewport() {
  const heroSection = findSectionContaining('pré hc 2006', 'o reencontro de 20 anos');
  if (!heroSection) return false;
  heroSection.dataset.homeHeroCompact = 'true';
  return true;
}

function removeStandaloneHistorySection() {
  const section = findSectionContaining('nossa história', 'a linha do tempo da turma', 'caixa de memórias');
  if (!section) return false;
  section.remove();
  return true;
}

function addEventInfoMoreButton() {
  const section = findSectionContaining('data, hora e local');
  if (!section || section.querySelector('[data-home-event-more="true"]')) return Boolean(section);

  const container = section.querySelector<HTMLElement>('.max-w-7xl') ?? section;
  const wrapper = document.createElement('div');
  wrapper.dataset.homeEventMore = 'true';
  wrapper.className = 'mt-10 md:mt-12 flex justify-center';
  wrapper.innerHTML = `
    <a href="/evento" class="inline-flex items-center gap-2 text-[#8ab89a] hover:text-[#c9a84c] transition-colors font-mono text-sm uppercase tracking-[0.22em]">
      Ver mais <span aria-hidden="true">→</span>
    </a>
  `;
  container.appendChild(wrapper);
  return true;
}

function removeClassDistributionOuterBox() {
  const card = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'))
    .find(element => {
      const text = normalizedText(element);
      return text.includes('formados em 2006') && text.includes('turma a') && text.includes('turma d');
    });

  if (!card) return false;
  if (card.dataset.homeDistributionUnboxed === 'true') return true;

  card.dataset.homeDistributionUnboxed = 'true';
  card.className = 'group text-left transition-all sm:col-span-2';
  card.style.background = 'transparent';
  card.style.borderColor = 'transparent';
  card.style.padding = '0';
  card.style.boxShadow = 'none';

  const mount = card.querySelector<HTMLElement>('[data-home-preview-react-mount]');
  if (mount) mount.classList.add('w-full');
  return true;
}

function applyClassTabsEnhancements() {
  const card = findPanelCardContaining('turmas', 'distribuição por sala');
  if (!card) return false;

  card.dataset.homeClassTabsCompact = 'true';

  Array.from(card.querySelectorAll<HTMLButtonElement>('button')).forEach(button => {
    const match = button.textContent?.match(/Turma\s+([ABCD])(?:\s*·\s*\d+)?/i);
    if (match && !button.getAttribute('aria-label')?.toLowerCase().includes('pessoas')) {
      button.textContent = `Turma ${match[1].toUpperCase()}`;
    }
  });

  const previousButton = card.querySelector<HTMLButtonElement>('button[aria-label="Ver pessoas anteriores"]');
  const nextButton = card.querySelector<HTMLButtonElement>('button[aria-label="Ver próximas pessoas"]');
  const row = previousButton?.parentElement;
  const list = previousButton?.nextElementSibling instanceof HTMLElement ? previousButton.nextElementSibling : null;

  if (row) {
    row.className = 'mt-auto grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3';
  }

  [previousButton, nextButton].forEach(button => {
    if (!button) return;
    button.className = 'w-10 min-h-[6.6rem] border border-[#2d6a4f]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 transition-colors shrink-0';
  });

  if (list) {
    list.className = 'home-class-tabs-list min-w-0';
    Array.from(list.children).forEach(child => {
      if (!(child instanceof HTMLElement)) return;
      child.className = 'home-class-tabs-person-card flex flex-col items-center justify-center text-center gap-2 border border-[#2d6a4f]/25 bg-[#0d1a0f] px-3 py-3 min-w-0';
      const name = child.querySelector<HTMLElement>('p');
      if (name) name.className = 'text-[#f0ebe0] text-sm font-semibold leading-tight line-clamp-2';
    });
  }

  return true;
}

function applyConfirmedPresenceEnhancements() {
  const card = findPanelCardContaining('confirmados', 'quem confirmou presença');
  if (!card) return false;

  card.dataset.homeConfirmedPresenceCard = 'true';

  const grid = Array.from(card.querySelectorAll<HTMLElement>('div'))
    .find(element => String(element.className).includes('grid-cols-6') || String(element.className).includes('sm:grid-cols-10'));
  if (!grid) return true;

  const count = grid.children.length;
  card.dataset.homeConfirmedPresenceCount = String(count);
  grid.dataset.homeConfirmedPresenceGrid = 'true';

  if (count === 1) {
    grid.className = 'mt-auto flex items-center justify-center min-h-[9.5rem] w-full';
  } else if (count > 1 && count <= 4) {
    grid.className = 'mt-auto grid grid-cols-4 items-center gap-4 min-h-[9rem] w-full';
  }

  return true;
}

function installClassTabsClickReflow() {
  if (document.documentElement.dataset.homeClassTabsClickReflow === 'true') return true;
  document.documentElement.dataset.homeClassTabsClickReflow = 'true';
  document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('[data-home-alumni-overview-panel="true"]')) return;
    window.setTimeout(applyClassTabsEnhancements, 0);
    window.setTimeout(applyClassTabsEnhancements, 80);
  });
  return true;
}

function CompactNostalgiaTimeline() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mt-8 lg:pr-2" data-home-final-timeline="true">
      <div className="relative ml-5 border-l border-[#2d6a4f]/35 pl-8">
        {NOSTALGIA_TIMELINE.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.year} className={index < NOSTALGIA_TIMELINE.length - 1 ? 'relative pb-4' : 'relative'}>
              <div className="absolute -left-[54px] top-0 w-10 h-10 rounded-full border border-[#2d6a4f]/50 bg-[#0d1a0f] text-[#c9a84c] flex items-center justify-center text-[11px] font-mono font-bold text-center leading-none">
                {item.visual}
              </div>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="w-full text-left group"
                aria-expanded={open}
              >
                <span className="block text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.24em] mb-1">{item.year}</span>
                <span className="block font-['Playfair_Display'] text-[#f0ebe0] text-xl font-bold leading-tight group-hover:text-[#c9a84c] transition-colors">{item.title}</span>
              </button>
              {open && (
                <p className="text-[#7a9a7a] text-sm leading-relaxed mt-2 max-w-md">{item.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function replaceTimelineBoxWithCompactTimeline() {
  const mount = document.querySelector<HTMLElement>('[data-home-nostalgia-timeline="true"]');
  if (!mount) return false;
  if (mount.dataset.homeFinalTimelineMounted === 'true') return true;

  mount.dataset.homeFinalTimelineMounted = 'true';
  mount.className = 'mb-0';
  const host = document.createElement('div');
  mount.replaceChildren(host);
  createRoot(host).render(<CompactNostalgiaTimeline />);
  return true;
}

function applyFinalHomeLayout() {
  const globalResults = [
    installResponsiveStandardization(),
    hideHeaderBuyCta(),
    installGlobalHeaderObserver(),
  ];

  if (!isHomePath()) return globalResults.every(Boolean);

  const results = [
    ...globalResults,
    compactHeroViewport(),
    removeStandaloneHistorySection(),
    addEventInfoMoreButton(),
    removeClassDistributionOuterBox(),
    replaceTimelineBoxWithCompactTimeline(),
    installClassTabsClickReflow(),
    applyClassTabsEnhancements(),
    applyConfirmedPresenceEnhancements(),
  ];

  return results.every(Boolean);
}

function installFinalHomeLayout() {
  let attempts = 0;
  const run = () => {
    attempts += 1;
    const done = applyFinalHomeLayout();
    if (!done && attempts < 40) window.setTimeout(run, 150);
  };

  window.requestAnimationFrame(run);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installFinalHomeLayout, { once: true });
} else {
  installFinalHomeLayout();
}
