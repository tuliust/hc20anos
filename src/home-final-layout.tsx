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

function installDesktopViewportCalibration() {
  if (document.querySelector('[data-home-desktop-viewport-calibration="true"]')) return true;
  document.documentElement.dataset.homeDesktopScale = 'true';

  const style = document.createElement('style');
  style.dataset.homeDesktopViewportCalibration = 'true';
  style.textContent = `
    @media (min-width: 1024px) {
      html[data-home-desktop-scale="true"] {
        font-size: 88%;
      }

      html[data-home-desktop-scale="true"] header {
        height: 56px !important;
        min-height: 56px !important;
        max-height: 56px !important;
      }

      html[data-home-desktop-scale="true"] header > div {
        height: 56px !important;
        min-height: 56px !important;
        max-height: 56px !important;
        max-width: 76rem !important;
      }

      html[data-home-desktop-scale="true"] header button[aria-label^="Início"] {
        transform: scale(0.82) !important;
        transform-origin: left center !important;
        margin-left: -0.65rem !important;
        gap: 0.6rem !important;
      }

      html[data-home-desktop-scale="true"] header button[aria-label^="Início"] img {
        height: 44px !important;
        width: 88px !important;
        max-height: 44px !important;
        max-width: 88px !important;
        object-fit: contain !important;
      }

      html[data-home-desktop-scale="true"] header nav {
        gap: 1rem !important;
      }

      html[data-home-desktop-scale="true"] header nav button {
        font-size: 0.72rem !important;
        letter-spacing: 0.11em !important;
      }

      html[data-home-desktop-scale="true"] header > div > div:last-child {
        gap: 0.55rem !important;
      }

      html[data-home-desktop-scale="true"] header > div > div:last-child button,
      html[data-home-desktop-scale="true"] header > div > div:last-child a {
        font-size: 0.72rem !important;
        letter-spacing: 0.11em !important;
        padding: 0.6rem 1.05rem !important;
      }

      html[data-home-desktop-scale="true"] section:not([data-home-hero-compact="true"]) {
        padding-top: 4.25rem !important;
        padding-bottom: 4.25rem !important;
      }

      html[data-home-desktop-scale="true"] section:not([data-home-hero-compact="true"]) .max-w-7xl {
        max-width: 72rem !important;
      }

      [data-home-hero-compact="true"] {
        min-height: 100svh !important;
        padding-top: 4.25rem !important;
        padding-bottom: 1.35rem !important;
      }

      [data-home-hero-compact="true"] > .relative.z-10 {
        max-width: 68rem !important;
        transform: translateY(0.35rem);
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(3.85rem, 6.2vw, 5.85rem) !important;
        letter-spacing: -0.04em !important;
      }

      [data-home-hero-compact="true"] h1 + p {
        font-size: clamp(1.05rem, 1.85vw, 1.45rem) !important;
      }

      [data-home-hero-compact="true"] .w-20.h-px {
        margin-top: 1.1rem !important;
        margin-bottom: 1.1rem !important;
      }

      [data-home-hero-compact="true"] .font-mono.tracking-\[0\.24em\] {
        font-size: 0.68rem !important;
        letter-spacing: 0.20em !important;
        margin-bottom: 1.55rem !important;
      }

      [data-home-hero-compact="true"] .flex.flex-col.sm\:flex-row {
        margin-bottom: 2rem !important;
      }

      [data-home-hero-compact="true"] .flex.flex-col.sm\:flex-row button {
        padding: 0.9rem 2.15rem !important;
        font-size: 0.78rem !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(2.45rem, 3.9vw, 3.25rem) !important;
        line-height: 0.95 !important;
      }

      [data-home-hero-compact="true"] .tabular-nums + div {
        font-size: 0.42rem !important;
        letter-spacing: 0.26em !important;
      }

      [data-home-hero-compact="true"] .inline-flex > div > span {
        font-size: 1.75rem !important;
        margin-left: 0.85rem !important;
        margin-right: 0.85rem !important;
      }
    }

    @media (min-width: 1280px) and (max-height: 860px) {
      html[data-home-desktop-scale="true"] {
        font-size: 86%;
      }

      [data-home-hero-compact="true"] > .relative.z-10 {
        transform: translateY(0.6rem);
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(3.65rem, 5.8vw, 5.45rem) !important;
      }

      [data-home-hero-compact="true"] h1 + p {
        font-size: clamp(1rem, 1.65vw, 1.3rem) !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(2.2rem, 3.5vw, 2.95rem) !important;
      }
    }
  `;
  document.head.appendChild(style);
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
  if (!isHomePath()) return true;

  const results = [
    installDesktopViewportCalibration(),
    compactHeroViewport(),
    removeStandaloneHistorySection(),
    addEventInfoMoreButton(),
    removeClassDistributionOuterBox(),
    replaceTimelineBoxWithCompactTimeline(),
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
