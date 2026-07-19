function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function findPhotoUploadModal(button: HTMLButtonElement): HTMLElement | null {
  let current: HTMLElement | null = button.parentElement;

  while (current && current !== document.body) {
    const hasUploadInput = Boolean(current.querySelector('input[type="file"]'));
    const hasExpectedTitle = normalizeText(current.textContent).includes("enviar foto antiga");

    if (hasUploadInput && hasExpectedTitle) return current;
    current = current.parentElement;
  }

  return null;
}

function replaceButtonText(button: HTMLButtonElement) {
  const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    if (normalizeText(current.textContent) === "enviar para moderação") {
      current.textContent = "Enviar";
      button.setAttribute("data-photo-upload-label-adjusted", "true");
      return;
    }
    current = walker.nextNode();
  }
}

function enhancePhotoUploadModal() {
  const submitButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => {
      const label = normalizeText(button.textContent);
      return label === "enviar para moderação" || button.hasAttribute("data-photo-upload-label-adjusted");
    });

  submitButtons.forEach(button => {
    const modal = findPhotoUploadModal(button);
    if (!modal) return;

    replaceButtonText(button);

    const moderationNote = Array.from(modal.querySelectorAll<HTMLParagraphElement>("p"))
      .find(element => normalizeText(element.textContent).startsWith(
        "todas as fotos passam por moderação antes de aparecerem no mural",
      ));

    const noteContainer = moderationNote?.parentElement;
    if (noteContainer) noteContainer.style.setProperty("display", "none", "important");
  });
}

let scheduled = false;

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    enhancePhotoUploadModal();
  });
}

export function installPhotoUploadModalEnhancement() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleEnhancement);
  const start = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    document.addEventListener("click", scheduleEnhancement, true);
    scheduleEnhancement();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
