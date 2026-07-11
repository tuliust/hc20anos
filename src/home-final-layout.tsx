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

  const style = document.createElement('style');
  style.dataset.homeDesktopViewportCalibration = 'true';
  style.textContent = `
    @media (min-width: 1024px) {
      header {
        min-height: 70px !important;
      }

      header img {
        max-height: 62px !important;
        width: auto !important;
      }

      header nav,
      header a,
      header button {
        letter-spacing: 0.16em !important;
      }

      [data-home-hero-compact="true"] {
        min-height: 100svh !important;
        padding-top: 5.25rem !important;
        padding-bottom: 2rem !important;
      }

      [data-home-hero-compact="true"] > .relative.z-10 {
        max-width: 72rem !important;
        transform: translateY(0.75rem);
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(4.5rem, 7.2vw, 7rem) !important;
        letter-spacing: -0.035em !important;
      }

      [data-home-hero-compact="true"] h1 + p {
        font-size: clamp(1.35rem, 2.35vw, 1.85rem) !important;
      }

      [data-home-hero-compact="true"] .font-mono.tracking-\[0\.24em\] {
        font-size: 0.78rem !important;
        letter-spacing: 0.22em !important;
        margin-bottom: 2rem !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(3rem, 4.8vw, 4.1rem) !important;
        line-height: 1 !important;
      }

      [data-home-hero-compact="true"] .tabular-nums + div {
        font-size: 0.48rem !important;
        letter-spacing: 0.28em !important;
      }

      [data-home-hero-compact="true"] .inline-flex > div > span {
        font-size: 2.2rem !important;
        margin-left: 1rem !important;
        margin-right: 1rem !important;
      }
    }

    @media (min-width: 1280px) and (max-height: 860px) {
      [data-home-hero-compact="true"] > .relative.z-10 {
        transform: translateY(1.15rem);
      }

      [data-home-hero-compact="true"] h1 {
        font-size: clamp(4.25rem, 6.8vw, 6.35rem) !important;
      }

      [data-home-hero-compact="true"] h1 + p {
        font-size: clamp(1.25rem, 2vw, 1.65rem) !important;
      }

      [data-home-hero-compact="true"] .tabular-nums {
        font-size: clamp(2.75rem, 4.4vw, 3.75rem) !important;
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
