const FOOTER_LOGO_ATTRIBUTE = "data-footer-header-logo";
const FOOTER_REPLACED_IMAGE_ATTRIBUTE = "data-footer-replaced-image";
const FOOTER_TITLE_ATTRIBUTE = "data-footer-brand-title";
const FOOTER_SOURCE_ATTRIBUTE = "data-footer-logo-source";

let scheduled = false;
let observer: MutationObserver | null = null;
let retryTimer: number | null = null;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function usableImage(image: HTMLImageElement | null | undefined): image is HTMLImageElement {
  return Boolean(image && (image.getAttribute("src") || image.currentSrc || image.src));
}

function findHeaderLogo(): HTMLImageElement | null {
  // O botão do logo é a fonte canônica. Evita confundir o avatar do usuário
  // com a marca em layouts compactos, como checkout no mobile.
  const explicitLogo = document.querySelector<HTMLImageElement>("[data-public-header-logo] img");
  if (usableImage(explicitLogo)) return explicitLogo;

  const header = document.querySelector<HTMLElement>("[data-public-header]")
    ?? document.querySelector<HTMLElement>("header");
  if (!header) return null;

  const images = Array.from(header.querySelectorAll<HTMLImageElement>("img"))
    .filter(usableImage);
  if (!images.length) return null;

  const semanticLogo = images.find(image => {
    const label = `${image.alt} ${image.getAttribute("aria-label") ?? ""}`.toLocaleLowerCase("pt-BR");
    return label.includes("logo") || label.includes("pré hc") || label.includes("pre hc");
  });

  if (semanticLogo) return semanticLogo;

  return images.sort((left, right) => {
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    return leftRect.left - rightRect.left || rightRect.height - leftRect.height;
  })[0] ?? null;
}

function findFooterBrandTitle(footer: HTMLElement): HTMLElement | null {
  return Array.from(footer.querySelectorAll<HTMLElement>("h1, h2, h3, h4, p, span"))
    .find(element => normalizeText(element.textContent) === "pré hc 2026") ?? null;
}

function findFooterBrandColumn(footer: HTMLElement): HTMLElement | null {
  const existingLogo = footer.querySelector<HTMLImageElement>(`img[${FOOTER_LOGO_ATTRIBUTE}]`);
  if (existingLogo?.parentElement) return existingLogo.parentElement;

  const title = findFooterBrandTitle(footer);
  if (title) {
    let current: HTMLElement | null = title.parentElement;
    while (current && current !== footer) {
      const hasDescription = Array.from(current.querySelectorAll<HTMLElement>("p"))
        .some(element => normalizeText(element.textContent).includes("reencontro"));
      if (hasDescription) return current;
      current = current.parentElement;
    }
    if (title.parentElement) return title.parentElement;
  }

  // Estrutura canônica do Footer: footer > container > grid > coluna da marca.
  const footerContainer = footer.firstElementChild instanceof HTMLElement
    ? footer.firstElementChild
    : null;
  const directGrid = footerContainer
    ? Array.from(footerContainer.children).find(element => {
        if (!(element instanceof HTMLElement)) return false;
        const children = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
        return children.length >= 3;
      })
    : null;

  if (directGrid?.firstElementChild instanceof HTMLElement) return directGrid.firstElementChild;

  const fallbackGrid = Array.from(footer.querySelectorAll<HTMLElement>("div"))
    .find(element => {
      const children = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
      return children.length >= 3 && children.some(child => child.querySelector("button, a"));
    });

  if (fallbackGrid?.firstElementChild instanceof HTMLElement) return fallbackGrid.firstElementChild;
  return footerContainer;
}

function hideUnmanagedBrandImages(brandColumn: HTMLElement) {
  Array.from(brandColumn.querySelectorAll<HTMLImageElement>("img"))
    .filter(image => !image.hasAttribute(FOOTER_LOGO_ATTRIBUTE))
    .forEach(image => {
      image.setAttribute(FOOTER_REPLACED_IMAGE_ATTRIBUTE, "true");
      image.hidden = true;
      image.setAttribute("aria-hidden", "true");
      image.style.setProperty("display", "none", "important");
    });
}

function copyResponsiveImageAttributes(source: HTMLImageElement, target: HTMLImageElement) {
  const sourceUrl = source.getAttribute("src") || source.currentSrc || source.src;
  if (!sourceUrl) return;

  if (target.getAttribute("src") !== sourceUrl) target.setAttribute("src", sourceUrl);
  target.setAttribute(FOOTER_SOURCE_ATTRIBUTE, sourceUrl);

  (["srcset", "sizes", "crossorigin", "referrerpolicy"] as const).forEach(attribute => {
    const value = source.getAttribute(attribute);
    if (value) target.setAttribute(attribute, value);
    else target.removeAttribute(attribute);
  });

  target.alt = source.alt?.trim() || "Pré HC 2006";
}

function applyFooterLogo(): boolean {
  const footer = document.querySelector<HTMLElement>("footer");
  const headerLogo = findHeaderLogo();
  const brandColumn = footer ? findFooterBrandColumn(footer) : null;
  if (!footer || !headerLogo || !brandColumn) return false;

  const brandTitle = findFooterBrandTitle(footer);
  brandTitle?.setAttribute(FOOTER_TITLE_ATTRIBUTE, "true");

  hideUnmanagedBrandImages(brandColumn);

  let footerLogo = footer.querySelector<HTMLImageElement>(`img[${FOOTER_LOGO_ATTRIBUTE}]`);
  if (!footerLogo) {
    footerLogo = document.createElement("img");
    footerLogo.setAttribute(FOOTER_LOGO_ATTRIBUTE, "true");
    footerLogo.className = "footer-header-logo";
    footerLogo.loading = "lazy";
    footerLogo.decoding = "async";
  }

  if (footerLogo.parentElement !== brandColumn) {
    brandColumn.insertBefore(footerLogo, brandColumn.firstChild);
  }

  footerLogo.hidden = false;
  footerLogo.removeAttribute("aria-hidden");
  footerLogo.style.removeProperty("display");
  copyResponsiveImageAttributes(headerLogo, footerLogo);
  return true;
}

function scheduleRetry() {
  if (retryTimer !== null) window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    scheduleApply();
  }, 350);
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    if (!applyFooterLogo()) scheduleRetry();
  });
}

export function installFooterLogoEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcFooterLogoEnhancementsInstalled) return;
  (window as any).__hcFooterLogoEnhancementsInstalled = true;

  const start = () => {
    observer?.disconnect();
    observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "sizes"],
    });

    // Captura o carregamento/troca efetiva da imagem, inclusive quando currentSrc
    // muda por srcset em diferentes larguras de tela.
    document.addEventListener("load", scheduleApply, true);
    window.addEventListener("resize", scheduleApply);
    window.addEventListener("orientationchange", scheduleApply);
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("pushstate", scheduleApply);
    window.addEventListener("replacestate", scheduleApply);
    window.addEventListener("pageshow", scheduleApply);

    scheduleApply();
    window.setTimeout(scheduleApply, 100);
    window.setTimeout(scheduleApply, 700);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
