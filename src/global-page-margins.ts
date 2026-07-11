function installGlobalPageMargins() {
  if (document.querySelector('[data-hc-global-page-margins="true"]')) return;

  const style = document.createElement('style');
  style.dataset.hcGlobalPageMargins = 'true';
  style.textContent = `
    :root {
      --hc-page-gutter: clamp(2rem, 4.5vw, 5.5rem);
    }

    @media (max-width: 767px) {
      :root {
        --hc-page-gutter: clamp(1rem, 5vw, 1.5rem);
      }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      :root {
        --hc-page-gutter: clamp(1.75rem, 4vw, 3rem);
      }
    }

    @media (min-width: 1024px) {
      :root {
        --hc-page-gutter: clamp(3rem, 4.6vw, 5.75rem);
      }
    }

    main > section:not([data-home-hero-compact="true"]) > .max-w-7xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-6xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-5xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-4xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-3xl,
    main > div > .max-w-7xl,
    main > div > .max-w-6xl,
    main > div > .max-w-5xl,
    main > div > .max-w-4xl,
    main > div > .max-w-3xl {
      width: min(calc(100% - (var(--hc-page-gutter) * 2)), 100%) !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    main > section:not([data-home-hero-compact="true"]) > .max-w-7xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-6xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-5xl,
    main > div > .max-w-7xl,
    main > div > .max-w-6xl,
    main > div > .max-w-5xl {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    @media (max-width: 767px) {
      main > section:not([data-home-hero-compact="true"]) > .max-w-7xl,
      main > section:not([data-home-hero-compact="true"]) > .max-w-6xl,
      main > section:not([data-home-hero-compact="true"]) > .max-w-5xl,
      main > section:not([data-home-hero-compact="true"]) > .max-w-4xl,
      main > section:not([data-home-hero-compact="true"]) > .max-w-3xl,
      main > div > .max-w-7xl,
      main > div > .max-w-6xl,
      main > div > .max-w-5xl,
      main > div > .max-w-4xl,
      main > div > .max-w-3xl {
        width: min(calc(100% - (var(--hc-page-gutter) * 2)), 100%) !important;
      }
    }
  `;

  document.head.appendChild(style);
}

installGlobalPageMargins();
