function installGlobalPageMargins() {
  if (document.querySelector('[data-hc-global-page-margins="true"]')) return;

  const style = document.createElement('style');
  style.dataset.hcGlobalPageMargins = 'true';
  style.textContent = `
    :root {
      --hc-page-gutter: clamp(3rem, 7vw, 9.75rem);
    }

    @media (max-width: 767px) {
      :root {
        --hc-page-gutter: clamp(1.25rem, 6vw, 2rem);
      }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      :root {
        --hc-page-gutter: clamp(2.5rem, 6vw, 4.75rem);
      }
    }

    @media (min-width: 1024px) {
      :root {
        --hc-page-gutter: clamp(5rem, 7.5vw, 10rem);
      }
    }

    @media (min-width: 1440px) {
      :root {
        --hc-page-gutter: clamp(6rem, 8vw, 12rem);
      }
    }

    main > div {
      padding-left: var(--hc-page-gutter) !important;
      padding-right: var(--hc-page-gutter) !important;
    }

    main > section:not([data-home-hero-compact="true"]) {
      padding-left: var(--hc-page-gutter) !important;
      padding-right: var(--hc-page-gutter) !important;
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
    main > div > .max-w-3xl,
    main > div .max-w-7xl,
    main > div .max-w-6xl,
    main > div .max-w-5xl,
    main > div .max-w-4xl,
    main > div .max-w-3xl {
      width: 100% !important;
      max-width: none !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    main > section:not([data-home-hero-compact="true"]) > .max-w-7xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-6xl,
    main > section:not([data-home-hero-compact="true"]) > .max-w-5xl,
    main > div > .max-w-7xl,
    main > div > .max-w-6xl,
    main > div > .max-w-5xl,
    main > div .max-w-7xl,
    main > div .max-w-6xl,
    main > div .max-w-5xl {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    @media (max-width: 767px) {
      main > div {
        padding-left: var(--hc-page-gutter) !important;
        padding-right: var(--hc-page-gutter) !important;
      }

      main > section:not([data-home-hero-compact="true"]) {
        padding-left: var(--hc-page-gutter) !important;
        padding-right: var(--hc-page-gutter) !important;
      }
    }
  `;

  document.head.appendChild(style);
}

installGlobalPageMargins();