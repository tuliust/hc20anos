import { getPeople, MOCK_PEOPLE } from "./lib/services";

const CONSENT_FIXED_ATTRIBUTE = "data-photo-consent-fixed";
const YEARS_FIXED_ATTRIBUTE = "data-photo-years-fixed";
const SUCCESS_FIXED_ATTRIBUTE = "data-photo-success-fixed";
const START_YEAR = 2000;
const END_YEAR = 2007;
const UPLOAD_EVENT = "hc-photo-uploaded";

let peopleHydration: Promise<void> | null = null;
let scheduled = false;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function findPhotoUploadModal(button?: HTMLButtonElement): HTMLElement | null {
  if (button) {
    let current: HTMLElement | null = button.parentElement;

    while (current && current !== document.body) {
      const hasUploadInput = Boolean(current.querySelector('input[type="file"]'));
      const hasExpectedTitle = normalizeText(current.textContent).includes("enviar foto antiga");

      if (hasUploadInput && hasExpectedTitle) return current;
      current = current.parentElement;
    }
  }

  const title = Array.from(document.querySelectorAll<HTMLElement>("h1, h2, h3, p"))
    .find(element => normalizeText(element.textContent) === "enviar foto antiga");
  return title?.closest<HTMLElement>("[data-modal-root]")
    ?? title?.closest<HTMLElement>(".fixed")
    ?? null;
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

function hydrateRealPeople() {
  if (peopleHydration) return peopleHydration;

  peopleHydration = getPeople()
    .then(people => {
      const visiblePeople = people
        .filter(person => person.is_visible !== false)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));

      if (visiblePeople.length > 0) {
        // O modal legado consulta este array diretamente. Mantemos a mesma referência
        // e substituímos o conteúdo pelos registros reais do Supabase.
        MOCK_PEOPLE.splice(0, MOCK_PEOPLE.length, ...visiblePeople);
      }
    })
    .catch(error => {
      peopleHydration = null;
      console.warn("[Foto] Não foi possível carregar a base real para marcações.", error);
    });

  return peopleHydration;
}

function ensureYearOptions(modal: HTMLElement) {
  const yearLabel = Array.from(modal.querySelectorAll<HTMLElement>("p, label"))
    .find(element => normalizeText(element.textContent) === "ano aproximado");
  const select = yearLabel?.parentElement?.querySelector<HTMLSelectElement>("select");
  if (!select) return;

  const expectedYears = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => String(START_YEAR + index));
  const existingYears = new Set(Array.from(select.options).map(option => option.value));

  expectedYears.forEach(value => {
    if (existingYears.has(value)) return;

    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    const before = Array.from(select.options).find(item => Number(item.value) > Number(value)) ?? null;
    select.insertBefore(option, before);
    existingYears.add(value);
  });

  const complete = expectedYears.every(value => existingYears.has(value));
  if (complete) select.setAttribute(YEARS_FIXED_ATTRIBUTE, "true");
}

function fixConsentControl(modal: HTMLElement) {
  const consentText = Array.from(modal.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent).startsWith(
      "confirmo que tenho o direito de compartilhar esta imagem",
    ));
  const consentLabel = consentText?.closest<HTMLLabelElement>("label");
  if (!consentLabel || consentLabel.hasAttribute(CONSENT_FIXED_ATTRIBUTE)) return;

  // O botão da Política de Privacidade era o primeiro controle rotulável dentro do
  // <label>. Por isso, o clique no quadrado do aceite podia acionar esse botão.
  // Cancelamos apenas o comportamento padrão do label, preservando o onClick do React.
  consentLabel.addEventListener("click", event => {
    const target = event.target;
    if (target instanceof Element && target.closest("button")) return;
    event.preventDefault();
  });
  consentLabel.setAttribute(CONSENT_FIXED_ATTRIBUTE, "true");

  const privacyButton = consentText?.querySelector<HTMLButtonElement>("button");
  if (privacyButton) privacyButton.type = "button";
}

function enhanceSuccessState(modal: HTMLElement) {
  const successTitle = Array.from(modal.querySelectorAll<HTMLElement>("h1, h2, h3, p"))
    .find(element => normalizeText(element.textContent) === "foto enviada!");
  if (!successTitle) return;

  const successMessage = Array.from(modal.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent).startsWith("sua foto foi enviada para moderação"));
  if (successMessage) {
    successMessage.textContent = "Sucesso! Sua foto já está na página";
    successMessage.classList.remove("mb-6");
    successMessage.classList.add("mb-2");
  }

  const statusLabel = Array.from(modal.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent) === "status");
  const statusContainer = statusLabel?.parentElement;
  if (statusContainer) statusContainer.style.setProperty("display", "none", "important");

  Array.from(modal.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "fechar")
    .forEach(button => button.style.setProperty("display", "none", "important"));

  if (!modal.hasAttribute(SUCCESS_FIXED_ATTRIBUTE)) {
    modal.setAttribute(SUCCESS_FIXED_ATTRIBUTE, "true");
    window.dispatchEvent(new CustomEvent(UPLOAD_EVENT));
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(UPLOAD_EVENT)), 500);
  }
}

function enhancePhotoUploadModal() {
  const submitButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => {
      const label = normalizeText(button.textContent);
      return label === "enviar para moderação" || button.hasAttribute("data-photo-upload-label-adjusted");
    });

  const modal = findPhotoUploadModal(submitButtons[0]);
  if (!modal) return;

  submitButtons.forEach(button => {
    if (modal.contains(button)) replaceButtonText(button);
  });

  const moderationNote = Array.from(modal.querySelectorAll<HTMLParagraphElement>("p"))
    .find(element => normalizeText(element.textContent).startsWith(
      "todas as fotos passam por moderação antes de aparecerem no mural",
    ));

  const noteContainer = moderationNote?.parentElement;
  if (noteContainer) noteContainer.style.setProperty("display", "none", "important");

  ensureYearOptions(modal);
  fixConsentControl(modal);
  enhanceSuccessState(modal);
  void hydrateRealPeople();
}

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

  void hydrateRealPeople();

  const observer = new MutationObserver(scheduleEnhancement);
  const start = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    document.addEventListener("click", scheduleEnhancement, true);
    window.addEventListener("focus", () => void hydrateRealPeople());
    scheduleEnhancement();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
