const HOME_CONFIRMED_LAYOUT_PATHS = new Set(['', '/', '/index.html']);

function homeConfirmedCurrentPathname() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function homeConfirmedIsHomePath() {
  return HOME_CONFIRMED_LAYOUT_PATHS.has(homeConfirmedCurrentPathname());
}

function homeConfirmedNormalizedText(element: Element) {
  return element.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
}

function installConfirmedPresenceStyles() {
  if (document.querySelector('[data-home-confirmed-presence-layout-style="true"]')) return true;

  const style = document.createElement('style');
  style.dataset.homeConfirmedPresenceLayoutStyle = 'true';
  style.textContent = `
    [data-hc-confirmed-presence-card="true"] {
      min-height: 260px !important;
    }

    [data-hc-confirmed-presence-card="true"] [data-hc-confirmed-presence-grid="true"] {
      width: 100% !important;
      flex: 1 1 auto !important;
      margin-top: 0 !important;
      padding-top: 1rem !important;
      align-items: center !important;
      justify-items: center !important;
    }

    [data-hc-confirmed-presence-card="true"] [data-hc-confirmed-presence-grid="true"] > div {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 0 !important;
    }

    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="1"] [data-hc-confirmed-presence-grid="true"] {
      min-height: 13rem !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
    }

    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="1"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="1"] [data-hc-confirmed-presence-grid="true"] > div > div {
      width: min(13rem, 52vw) !important;
      height: min(13rem, 52vw) !important;
      font-size: 3rem !important;
    }

    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="2"] [data-hc-confirmed-presence-grid="true"],
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="3"] [data-hc-confirmed-presence-grid="true"],
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="4"] [data-hc-confirmed-presence-grid="true"] {
      min-height: 12rem !important;
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 1rem !important;
    }

    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="2"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="2"] [data-hc-confirmed-presence-grid="true"] > div > div,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="3"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="3"] [data-hc-confirmed-presence-grid="true"] > div > div,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="4"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="4"] [data-hc-confirmed-presence-grid="true"] > div > div {
      width: min(7rem, 18vw) !important;
      height: min(7rem, 18vw) !important;
      font-size: 1.65rem !important;
    }

    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="5"] [data-hc-confirmed-presence-grid="true"],
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="6"] [data-hc-confirmed-presence-grid="true"],
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="7"] [data-hc-confirmed-presence-grid="true"],
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="8"] [data-hc-confirmed-presence-grid="true"],
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="9"] [data-hc-confirmed-presence-grid="true"] {
      display: grid !important;
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      gap: 0.9rem !important;
    }

    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="5"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="5"] [data-hc-confirmed-presence-grid="true"] > div > div,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="6"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="6"] [data-hc-confirmed-presence-grid="true"] > div > div,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="7"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="7"] [data-hc-confirmed-presence-grid="true"] > div > div,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="8"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="8"] [data-hc-confirmed-presence-grid="true"] > div > div,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="9"] [data-hc-confirmed-presence-grid="true"] > div > img,
    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="9"] [data-hc-confirmed-presence-grid="true"] > div > div {
      width: min(4.75rem, 14vw) !important;
      height: min(4.75rem, 14vw) !important;
      font-size: 1.15rem !important;
    }

    [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="many"] [data-hc-confirmed-presence-grid="true"] {
      display: grid !important;
      grid-template-columns: repeat(10, minmax(0, 1fr)) !important;
      gap: 0.75rem !important;
    }

    @media (max-width: 767px) {
      [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="1"] [data-hc-confirmed-presence-grid="true"] > div > img,
      [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="1"] [data-hc-confirmed-presence-grid="true"] > div > div {
        width: min(11rem, 58vw) !important;
        height: min(11rem, 58vw) !important;
      }

      [data-hc-confirmed-presence-card="true"][data-hc-confirmed-presence-count="many"] [data-hc-confirmed-presence-grid="true"] {
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
      }
    }
  `;
  document.head.appendChild(style);
  return true;
}

function findConfirmedPresenceCard() {
  const title = Array.from(document.querySelectorAll<HTMLElement>('p, h2, h3'))
    .find(element => homeConfirmedNormalizedText(element) === 'quem confirmou presença');

  if (!title) return null;

  let current: HTMLElement | null = title;
  while (current && current.parentElement) {
    current = current.parentElement;
    const text = homeConfirmedNormalizedText(current);
    const className = String(current.className ?? '');
    if (
      text.includes('confirmados') &&
      text.includes('quem confirmou presença') &&
      className.includes('border') &&
      className.includes('flex') &&
      className.includes('flex-col')
    ) {
      return current;
    }
  }

  return title.closest('[class*="border"]') as HTMLElement | null;
}

function findConfirmedPresenceGrid(card: HTMLElement) {
  const candidates = Array.from(card.querySelectorAll<HTMLElement>('div'));
  return candidates.find(element => {
    const className = String(element.className ?? '');
    if (className.includes('grid-cols-6') || className.includes('sm:grid-cols-10')) return true;
    const children = Array.from(element.children);
    return children.length > 0 && children.every(child => child.querySelector('img, [class*="rounded-full"]'));
  }) ?? null;
}

function getConfirmedCountKey(count: number) {
  if (count <= 0) return '0';
  if (count <= 9) return String(count);
  return 'many';
}

function applyConfirmedPresenceLayout() {
  if (!homeConfirmedIsHomePath()) return true;
  installConfirmedPresenceStyles();

  const card = findConfirmedPresenceCard();
  if (!card) return false;

  const grid = findConfirmedPresenceGrid(card);
  if (!grid) return false;

  const count = grid.children.length;
  card.dataset.hcConfirmedPresenceCard = 'true';
  card.dataset.hcConfirmedPresenceCount = getConfirmedCountKey(count);
  grid.dataset.hcConfirmedPresenceGrid = 'true';

  if (count === 1) {
    grid.className = 'hc-confirmed-presence-grid mt-auto flex items-center justify-center w-full min-h-[13rem]';
  } else if (count > 1 && count <= 4) {
    grid.className = 'hc-confirmed-presence-grid mt-auto grid grid-cols-4 items-center gap-4 w-full min-h-[12rem]';
  } else if (count > 4 && count <= 9) {
    grid.className = 'hc-confirmed-presence-grid mt-auto grid grid-cols-5 items-center gap-3 w-full';
  } else {
    grid.className = 'hc-confirmed-presence-grid mt-auto grid grid-cols-6 sm:grid-cols-10 gap-3 w-full';
  }

  return true;
}

function installConfirmedPresenceLayout() {
  let attempts = 0;
  const run = () => {
    attempts += 1;
    const done = applyConfirmedPresenceLayout();
    if (!done && attempts < 60) window.setTimeout(run, 120);
  };

  window.requestAnimationFrame(run);

  if (document.documentElement.dataset.hcConfirmedPresenceObserver === 'true') return;
  document.documentElement.dataset.hcConfirmedPresenceObserver = 'true';

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(applyConfirmedPresenceLayout);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installConfirmedPresenceLayout, { once: true });
} else {
  installConfirmedPresenceLayout();
}
