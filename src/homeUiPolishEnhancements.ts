const HOME_PATH = "/";
const STYLE_ID = "hc-home-ui-polish-style";
const PROFILE_SUBTITLE_ATTRIBUTE = "data-home-profile-subtitle";

let installed = false;
let scheduled = false;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${PROFILE_SUBTITLE_ATTRIBUTE}] {
      margin: -0.15rem 0 0.9rem;
      color: #536158;
      font-size: 0.75rem;
      line-height: 1.45;
    }

    [data-home-section="about"] [data-home-poll] button {
      color: #35513f !important;
      font-weight: 500;
    }

    [data-home-section="about"] [data-home-poll] button:hover,
    [data-home-section="about"] [data-home-poll] button:focus-visible {
      color: #0d1a0f !important;
      border-color: rgba(45, 106, 79, 0.55) !important;
      background: #f6f5f0 !important;
    }

    [data-home-confirmed-grid] > [data-home-alumni-person],
    [data-home-confirmed-grid] > [data-home-alumni-person]:hover,
    [data-home-confirmed-grid] > [data-home-alumni-person]:focus-visible {
      background: transparent !important;
      box-shadow: none !important;
    }

    [data-home-confirmed-grid] > [data-home-alumni-person] > img,
    [data-home-confirmed-grid] > [data-home-alumni-person] > [role="img"] {
      border-radius: 9999px !important;
      transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
    }

    [data-home-confirmed-grid] > [data-home-alumni-person]:hover > img,
    [data-home-confirmed-grid] > [data-home-alumni-person]:hover > [role="img"],
    [data-home-confirmed-grid] > [data-home-alumni-person]:focus-visible > img,
    [data-home-confirmed-grid] > [data-home-alumni-person]:focus-visible > [role="img"] {
      border-color: rgba(201, 168, 76, 0.92) !important;
      box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.76);
    }

    @media (prefers-reduced-motion: reduce) {
      [data-home-confirmed-grid] > [data-home-alumni-person] > img,
      [data-home-confirmed-grid] > [data-home-alumni-person] > [role="img"] {
        transition: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureProfileSubtitle() {
  const metrics = document.querySelector<HTMLElement>("[data-home-profile-metrics]");
  const parent = metrics?.parentElement;
  if (!metrics || !parent) return;

  const existing = parent.querySelector<HTMLElement>(`[${PROFILE_SUBTITLE_ATTRIBUTE}]`);
  if (existing) return;

  const subtitle = document.createElement("p");
  subtitle.setAttribute(PROFILE_SUBTITLE_ATTRIBUTE, "true");
  subtitle.textContent = "De acordo com as pessoas cadastradas";
  parent.insertBefore(subtitle, metrics);
}

function enhanceHome() {
  scheduled = false;
  if (currentPath() !== HOME_PATH) return;

  injectStyles();
  ensureProfileSubtitle();
}

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(enhanceHome);
}

export function installHomeUiPolishEnhancements() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;

  const observer = new MutationObserver(scheduleEnhancement);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", scheduleEnhancement);
  window.addEventListener("pushstate", scheduleEnhancement as EventListener);
  window.addEventListener("focus", scheduleEnhancement);

  scheduleEnhancement();
}
