const FOOTER_LOGO_ATTRIBUTE = "data-footer-header-logo";
let scheduled = false;

function findHeaderLogo(): HTMLImageElement | null {
  const header = document.querySelector<HTMLElement>("[data-public-header]")
    ?? document.querySelector<HTMLElement>("header");
  if (!header) return null;

  const images = Array.from(header.querySelectorAll<HTMLImageElement>("img"))
    .filter(image => Boolean(image.currentSrc || image.src));
  if (!images.length) return null;

  const semanticLogo = images.find(image => {
    const label = `${image.alt} ${image.getAttribute("aria-label") ?? ""}`.toLocaleLowerCase("pt-BR");
    return label.includes("logo") || label.includes("hc") || label.includes("pré hc") || label.includes("pre hc");
  });

  if (semanticLogo) return semanticLogo;

  return images.sort((left, right) => {
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    return leftRect.left - rightRect.left || rightRect.height - leftRect.height;
  })[0] ?? null;
}

function findFooterBrandColumn(footer: HTMLElement): HTMLElement | null {
  const grid = Array.from(footer.querySelectorAll<HTMLElement>("div"))
    .find(element => {
      const children = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
      return children.length >= 3 && children.some(child => child.querySelector("button, a"));
    });

  if (grid?.firstElementChild instanceof HTMLElement) return grid.firstElementChild;
  return footer.firstElementChild instanceof HTMLElement ? footer.firstElementChild : null;
}

function applyFooterLogo() {
  const footer = document.querySelector<HTMLElement>("footer");
  const headerLogo = findHeaderLogo();
  const brandColumn = footer ? findFooterBrandColumn(footer) : null;
  if (!footer || !headerLogo || !brandColumn) return;

  let footerLogo = footer.querySelector<HTMLImageElement>(`img[${FOOTER_LOGO_ATTRIBUTE}]`);
  if (!footerLogo) {
    footerLogo = document.createElement("img");
    footerLogo.setAttribute(FOOTER_LOGO_ATTRIBUTE, "true");
    footerLogo.className = "footer-header-logo";
    footerLogo.loading = "lazy";
    footerLogo.decoding = "async";
    brandColumn.insertBefore(footerLogo, brandColumn.firstChild);
  }

  const source = headerLogo.currentSrc || headerLogo.src;
  if (footerLogo.src !== source) footerLogo.src = source;
  footerLogo.alt = headerLogo.alt?.trim() || "Pré HC 2006";
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyFooterLogo();
  });
}

export function installFooterLogoEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcFooterLogoEnhancementsInstalled) return;
  (window as any).__hcFooterLogoEnhancementsInstalled = true;

  const start = () => {
    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
    window.addEventListener("popstate", scheduleApply);
    scheduleApply();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
