import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BookImage,
  Laptop,
  MessagesSquare,
  PhoneCall,
  Proportions,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

const HOME_PATHS = new Set(['', '/', '/index.html']);

type TimelineItem = {
  year: string;
  Icon: LucideIcon;
  title: string;
  description: string;
};

const TIMELINE_ITEMS: TimelineItem[] = [
  {
    year: '1995',
    Icon: PhoneCall,
    title: 'Orelhão pra ligar pra casa',
    description: 'Ainda na nossa época de alfabetização, o normal ainda era usar o orelhão para ligar pra casa.',
  },
  {
    year: '1996',
    Icon: Laptop,
    title: 'Internet discada e Cadê?',
    description: 'Quando entramos na 1ª série, começava-se a era da internet discada e das buscas no site Cadê?.',
  },
  {
    year: '1999',
    Icon: MessagesSquare,
    title: 'mIRC e ICQ',
    description: 'Na 4ª série, começaram os tempos de mIRC e ICQ.',
  },
  {
    year: '2000',
    Icon: Proportions,
    title: 'MSN Messenger',
    description: 'Boa parte do nosso Ensino Fundamental foi conversando pelo MSN Messenger.',
  },
  {
    year: '2003',
    Icon: Smartphone,
    title: 'Nokia e SMS',
    description: 'Na 8ª série, passamos a mandar SMS com nossos Nokias.',
  },
  {
    year: '2004',
    Icon: BookImage,
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
      <div className="relative">
        <div className="absolute left-9 top-0 bottom-0 w-px bg-[#2d6a4f]/35" aria-hidden="true" />

        <div className="space-y-5 md:space-y-6">
          {TIMELINE_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const Icon = item.Icon;

            return (
              <div key={item.year} className="relative grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 md:gap-6">
                <div className="relative flex justify-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? -1 : index)}
                    className={
                      'relative z-10 rounded-full border bg-[#0d1a0f] text-[#c9a84c] flex items-center justify-center font-mono font-bold leading-none transition-all duration-300 ' +
                      (open
                        ? 'w-16 h-16 border-[#c9a84c]/75 text-sm shadow-[0_0_0_8px_rgba(201,168,76,0.07)]'
                        : 'w-12 h-12 border-[#2d6a4f]/50 text-[11px] hover:border-[#c9a84c]/55')
                    }
                    aria-expanded={open}
                    aria-label={`${open ? 'Recolher' : 'Abrir'} marco de ${item.year}`}
                  >
                    {item.year}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="w-full text-left group pt-1"
                  aria-expanded={open}
                >
                  <span className="block mb-2 text-[#c9a84c] transition-all duration-300">
                    <Icon
                      size={open ? 30 : 21}
                      strokeWidth={open ? 2.1 : 1.8}
                      className={open ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}
                      aria-hidden="true"
                    />
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
                  <p className="col-start-2 text-[#7a9a7a] text-sm md:text-[15px] leading-relaxed -mt-3 max-w-md">
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
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
