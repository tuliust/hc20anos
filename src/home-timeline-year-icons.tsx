import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const HOME_PATHS = new Set(['', '/', '/index.html']);

const TIMELINE_ITEMS = [
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

function TimelineYearIconPreview() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mt-8 lg:pr-2" data-home-year-icon-timeline="true">
      <div className="relative ml-7 border-l border-[#2d6a4f]/35 pl-10">
        {TIMELINE_ITEMS.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.year} className={index < TIMELINE_ITEMS.length - 1 ? 'relative pb-4 md:pb-5' : 'relative'}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="w-full text-left group"
                aria-expanded={open}
              >
                <span
                  className={
                    'absolute rounded-full border bg-[#0d1a0f] text-[#c9a84c] flex items-center justify-center font-mono font-bold text-center leading-none transition-all duration-300 ' +
                    (open
                      ? '-left-[76px] top-[-8px] w-16 h-16 border-[#c9a84c]/75 text-sm shadow-[0_0_0_5px_rgba(201,168,76,0.07)]'
                      : '-left-[59px] top-0 w-12 h-12 border-[#2d6a4f]/50 text-[11px]')
                  }
                >
                  {item.year}
                </span>
                <span
                  className={
                    'block text-[#c9a84c] font-mono uppercase leading-none mb-2 transition-all duration-300 ' +
                    (open ? 'text-sm tracking-[0.24em]' : 'text-[10px] tracking-[0.2em]')
                  }
                >
                  {item.visual}
                </span>
                <span
                  className={
                    'block font-[\'Playfair_Display\'] font-bold leading-tight transition-colors ' +
                    (open ? 'text-[#f0ebe0] text-2xl md:text-[1.7rem]' : 'text-[#f0ebe0] text-xl group-hover:text-[#c9a84c]')
                  }
                >
                  {item.title}
                </span>
              </button>
              {open && (
                <p className="text-[#7a9a7a] text-sm md:text-[15px] leading-relaxed mt-3 max-w-md">
                  {item.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function replaceTimeline() {
  if (!isHomePath()) return true;
  const timeline = document.querySelector<HTMLElement>('[data-home-final-timeline="true"]');
  if (!timeline) return false;
  if (timeline.querySelector('[data-home-year-icon-timeline="true"]')) return true;

  const host = document.createElement('div');
  host.dataset.homeYearIconTimelineMount = 'true';
  timeline.replaceChildren(host);
  createRoot(host).render(<TimelineYearIconPreview />);
  return true;
}

function installTimelineYearIcons() {
  let attempts = 0;
  const run = () => {
    attempts += 1;
    const done = replaceTimeline();
    if (!done && attempts < 50) window.setTimeout(run, 120);
  };

  window.requestAnimationFrame(run);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installTimelineYearIcons, { once: true });
} else {
  installTimelineYearIcons();
}
