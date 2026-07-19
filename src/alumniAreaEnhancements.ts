const ALUMNI_AREA_ROUTES = new Set(["/minha-area", "/alumni-area"]);
const HEADER_EXIT_ATTRIBUTE = "data-alumni-area-header-exit-hidden";
const GREETING_CLASS_ATTRIBUTE = "data-alumni-area-greeting-class-hidden";
const TICKET_MESSAGE_ATTRIBUTE = "data-alumni-area-ticket-message-hidden";
const PHOTOS_LINK_ATTRIBUTE = "data-alumni-area-photos-link-hidden";
const PROFILE_NAME_ATTRIBUTE = "data-alumni-area-profile-name-expanded";
const ACTION_BORDER_ATTRIBUTE = "data-alumni-area-action-bordered";

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isAlumniAreaRoute() {
  return ALUMNI_AREA_ROUTES.has(currentPath());
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function hideElement(element: HTMLElement | null, attribute: string) {
  if (!element) return;
  element.style.setProperty("display", "none", "important");
  element.setAttribute("aria-hidden", "true");
  element.setAttribute(attribute, "true");
}

function restoreHiddenElements(attribute: string) {
  document.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach(element => {
    element.style.removeProperty("display");
    element.removeAttribute("aria-hidden");
    element.removeAttribute(attribute);
  });
}

function updateHeaderExitButton() {
  restoreHiddenElements(HEADER_EXIT_ATTRIBUTE);
  if (!isAlumniAreaRoute()) return;

  const button = Array.from(document.querySelectorAll<HTMLButtonElement>('main button[title="Voltar ao início"], button[title="Voltar ao início"]'))
    .find(candidate => Boolean(candidate.querySelector("svg.lucide-log-out")));

  hideElement(button ?? null, HEADER_EXIT_ATTRIBUTE);
}

function updateGreetingClassLabel() {
  restoreHiddenElements(GREETING_CLASS_ATTRIBUTE);
  if (!isAlumniAreaRoute()) return;

  const greeting = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2, main h3"))
    .find(element => normalizeText(element.textContent).startsWith("olá,"));
  const classLabel = Array.from(greeting?.parentElement?.children ?? [])
    .find((element): element is HTMLElement => (
      element instanceof HTMLElement
      && element.tagName === "P"
      && normalizeText(element.textContent).startsWith("turma ")
    ));

  hideElement(classLabel ?? null, GREETING_CLASS_ATTRIBUTE);
}

function updateProfileName() {
  document.querySelectorAll<HTMLElement>(`[${PROFILE_NAME_ATTRIBUTE}]`).forEach(element => {
    if (isAlumniAreaRoute()) return;
    element.style.removeProperty("white-space");
    element.style.removeProperty("overflow");
    element.style.removeProperty("text-overflow");
    element.style.removeProperty("max-width");
    element.style.removeProperty("line-height");
    if (element.dataset.alumniAreaWasTruncated === "true") element.classList.add("truncate");
    delete element.dataset.alumniAreaWasTruncated;
    element.removeAttribute(PROFILE_NAME_ATTRIBUTE);
  });

  if (!isAlumniAreaRoute()) return;

  const profileLabel = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .find(element => normalizeText(element.textContent) === "meu perfil");
  const profileCard = profileLabel?.parentElement;
  const name = Array.from(profileCard?.querySelectorAll<HTMLElement>("p") ?? [])
    .find(element => element.className.includes("Playfair_Display") && normalizeText(element.textContent) !== "meu perfil");

  if (!name) return;
  if (!name.hasAttribute(PROFILE_NAME_ATTRIBUTE)) {
    name.dataset.alumniAreaWasTruncated = String(name.classList.contains("truncate"));
    name.classList.remove("truncate");
    name.setAttribute(PROFILE_NAME_ATTRIBUTE, "true");
  }

  name.style.whiteSpace = "normal";
  name.style.overflow = "visible";
  name.style.textOverflow = "clip";
  name.style.maxWidth = "225px";
  name.style.lineHeight = "1.15";
}

function updateTicketMessage() {
  restoreHiddenElements(TICKET_MESSAGE_ATTRIBUTE);
  if (!isAlumniAreaRoute()) return;

  const message = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .find(element => normalizeText(element.textContent) === "não foi possível conferir ingressos agora.");
  hideElement(message ?? null, TICKET_MESSAGE_ATTRIBUTE);
}

function updatePhotosHeaderLink() {
  restoreHiddenElements(PHOTOS_LINK_ATTRIBUTE);
  if (!isAlumniAreaRoute()) return;

  const photosLabel = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .find(element => normalizeText(element.textContent) === "minhas fotos");
  const photosCard = photosLabel?.parentElement;
  const link = Array.from(photosCard?.querySelectorAll<HTMLButtonElement>("button") ?? [])
    .find(button => normalizeText(button.textContent) === "nossa história");

  hideElement(link ?? null, PHOTOS_LINK_ATTRIBUTE);
}

function updateEmptyStateActionBorders() {
  document.querySelectorAll<HTMLButtonElement>(`button[${ACTION_BORDER_ATTRIBUTE}]`).forEach(button => {
    if (isAlumniAreaRoute()) return;
    button.style.removeProperty("border");
    button.style.removeProperty("box-sizing");
    button.removeAttribute(ACTION_BORDER_ATTRIBUTE);
  });

  if (!isAlumniAreaRoute()) return;

  const labels = new Set(["ir para nossa história", "enviar memória"]);
  Array.from(document.querySelectorAll<HTMLButtonElement>("main button"))
    .filter(button => labels.has(normalizeText(button.textContent)))
    .forEach(button => {
      button.style.setProperty("border", "1px solid rgba(45, 106, 79, 0.65)", "important");
      button.style.boxSizing = "border-box";
      button.setAttribute(ACTION_BORDER_ATTRIBUTE, "true");
    });
}

function updateAlumniArea() {
  updateHeaderExitButton();
  updateGreetingClassLabel();
  updateProfileName();
  updateTicketMessage();
  updatePhotosHeaderLink();
  updateEmptyStateActionBorders();
}

let scheduled = false;

function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    updateAlumniArea();
  });
}

export function installAlumniAreaEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(scheduleUpdate);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("popstate", scheduleUpdate);
    window.addEventListener("pushstate", scheduleUpdate);
    scheduleUpdate();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
