const ALUMNI_AREA_PATHS = new Set(["/minha-area", "/alumni-area"]);
const EX_ALUMNI_PATHS = new Set(["/ex-alunos", "/ex-alumni"]);
const HOME_ALUMNI_ROOT_SELECTOR = "[data-home-alumni-overview]";
const HOME_PERSON_ATTRIBUTE = "data-home-alumni-person";
const HOME_CAPTURE_ATTRIBUTE = "data-home-alumni-profile-capture";
const DIRECTORY_OPEN_ATTRIBUTE = "data-content-sync-person-opened";
const ORDERS_ACTION_ATTRIBUTE = "data-alumni-area-orders-card-action";
const HIDDEN_ORDERS_SHORTCUT_ATTRIBUTE = "data-alumni-area-orders-shortcut-hidden";

let scheduled = false;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function cleanPersonName(value: string | null | undefined) {
  let name = String(value ?? "").replace(/\s+/g, " ").trim();
  let previous = "";

  while (name && name !== previous) {
    previous = name;
    name = name
      .replace(/^(?:abrir\s+)?perfil\s+(?:de|do|da)\s+/i, "")
      .replace(/^(?:foto|imagem|avatar)\s+(?:de|do|da)\s+/i, "")
      .trim();
  }

  return name;
}

function isGenericPersonLabel(value: string) {
  const normalized = normalizeText(value);
  return !normalized
    || [
      "confirmados",
      "quem confirmou presenca",
      "turmas",
      "distribuicao por sala",
      "ver todos",
      "sou eu!",
      "reivindicar",
      "nao cadastrado",
      "perfil completo",
      "confirmado",
    ].includes(normalized);
}

function personNameCandidates(element: HTMLElement) {
  const textCandidates = Array.from(element.querySelectorAll<HTMLElement>("p,h2,h3,h4,strong"))
    .map(item => cleanPersonName(item.textContent));

  return [
    cleanPersonName(element.getAttribute(HOME_PERSON_ATTRIBUTE)),
    ...textCandidates,
    cleanPersonName(element.querySelector<HTMLImageElement>("img[alt]")?.alt),
    cleanPersonName(element.querySelector<HTMLElement>('[role="img"][aria-label]')?.getAttribute("aria-label")),
    cleanPersonName(element.getAttribute("aria-label")),
    cleanPersonName(element.getAttribute("title")),
  ].filter((candidate): candidate is string => Boolean(candidate) && !isGenericPersonLabel(candidate));
}

function getPersonName(element: HTMLElement) {
  const candidates = personNameCandidates(element);
  return candidates.find(candidate => candidate.includes(" ")) ?? candidates[0] ?? "";
}

function activeHomeClassGroup(root: HTMLElement) {
  const activeButton = root.querySelector<HTMLButtonElement>('[data-home-class-tabs] button[aria-pressed="true"]');
  const match = activeButton?.textContent?.match(/turma\s+([A-D])\b/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function homePersonElement(target: Element, root: HTMLElement) {
  const marked = target.closest<HTMLElement>(`[${HOME_PERSON_ATTRIBUTE}]`);
  if (marked && root.contains(marked)) return marked;

  const container = target.closest<HTMLElement>("[data-home-class-people], [data-home-confirmed-grid]");
  if (!container || !root.contains(container)) return null;

  let current: HTMLElement | null = target instanceof HTMLElement ? target : target.parentElement;
  while (current && current.parentElement !== container) current = current.parentElement;
  return current && current.parentElement === container ? current : null;
}

function openPersonDirectory(personName: string, person: HTMLElement, root: HTMLElement) {
  const url = new URL("/ex-alunos", window.location.origin);
  url.searchParams.set("pessoa", personName);

  if (person.closest("[data-home-class-people]")) {
    const group = activeHomeClassGroup(root);
    if (group) url.searchParams.set("turma", group);
  }
  if (person.closest("[data-home-confirmed-grid]")) {
    url.searchParams.set("presenca", "confirmed");
  }

  window.location.assign(`${url.pathname}${url.search}`);
}

function synchronizeHomePersonMarkers(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(`[${HOME_PERSON_ATTRIBUTE}]`).forEach(person => {
    const personName = getPersonName(person);
    if (!personName) return;
    person.setAttribute(HOME_PERSON_ATTRIBUTE, personName);
    person.setAttribute("aria-label", `Abrir perfil de ${personName}`);
    person.setAttribute("title", `Abrir perfil de ${personName}`);
  });
}

function installHomeProfileCapture() {
  if (currentPath() !== "/") return;
  const root = document.querySelector<HTMLElement>(HOME_ALUMNI_ROOT_SELECTOR);
  if (!root) return;

  synchronizeHomePersonMarkers(root);
  if (root.hasAttribute(HOME_CAPTURE_ATTRIBUTE)) return;
  root.setAttribute(HOME_CAPTURE_ATTRIBUTE, "true");

  root.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const person = homePersonElement(event.target, root);
    if (!person) return;

    const personName = getPersonName(person);
    if (!personName) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openPersonDirectory(personName, person, root);
  }, true);

  root.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!(event.target instanceof Element)) return;
    const person = homePersonElement(event.target, root);
    if (!person) return;

    const personName = getPersonName(person);
    if (!personName) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openPersonDirectory(personName, person, root);
  }, true);
}

function findDirectoryRoot() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1,h2"))
    .find(element => normalizeText(element.textContent) === "ex-alunos");
  const section = heading?.closest<HTMLElement>("section");
  return section?.parentElement instanceof HTMLElement ? section.parentElement : null;
}

function openRequestedDirectoryPerson() {
  if (!EX_ALUMNI_PATHS.has(currentPath())) return;
  const requested = new URLSearchParams(window.location.search).get("pessoa")?.trim();
  const root = findDirectoryRoot();
  if (!requested || !root) return;

  const normalizedRequested = normalizeText(cleanPersonName(requested));
  if (!normalizedRequested) return;

  const visibleModal = Array.from(document.querySelectorAll<HTMLElement>("[data-modal-root='true']"))
    .find(modal => modal.getClientRects().length > 0 && normalizeText(modal.textContent).includes(normalizedRequested));
  if (visibleModal) {
    root.setAttribute(DIRECTORY_OPEN_ATTRIBUTE, normalizedRequested);
    return;
  }

  if (root.getAttribute(DIRECTORY_OPEN_ATTRIBUTE) === normalizedRequested) return;

  const candidates = Array.from(root.querySelectorAll<HTMLElement>('[role="button"], [tabindex="0"]'))
    .filter(candidate => !candidate.closest("[data-modal-root='true']"));

  const card = candidates.find(candidate => personNameCandidates(candidate)
    .some(name => normalizeText(name) === normalizedRequested));
  if (!card) return;

  root.setAttribute(DIRECTORY_OPEN_ATTRIBUTE, normalizedRequested);
  card.click();
}

function findAlumniAreaTicketAction(main: HTMLElement) {
  const ticketLabel = Array.from(main.querySelectorAll<HTMLElement>("p,h2,h3"))
    .find(element => normalizeText(element.textContent) === "meu ingresso");

  let current = ticketLabel?.parentElement ?? null;
  for (let depth = 0; current && current !== main && depth < 6; depth += 1) {
    const action = Array.from(current.querySelectorAll<HTMLElement>("button,a"))
      .find(element => normalizeText(element.textContent) === "comprar ingresso");
    if (action) return action;
    current = current.parentElement;
  }

  return Array.from(main.querySelectorAll<HTMLElement>("button,a"))
    .find(element => normalizeText(element.textContent) === "comprar ingresso") ?? null;
}

function synchronizeAlumniAreaOrders() {
  if (!ALUMNI_AREA_PATHS.has(currentPath())) return;
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;

  main.querySelectorAll<HTMLElement>('a[data-buyer-orders-link]').forEach(link => {
    link.style.setProperty("display", "none", "important");
    link.setAttribute("aria-hidden", "true");
    link.setAttribute("tabindex", "-1");
    link.setAttribute(HIDDEN_ORDERS_SHORTCUT_ATTRIBUTE, "true");
  });

  const action = findAlumniAreaTicketAction(main);
  if (!action) return;

  action.textContent = "Comprar Ingresso";
  action.setAttribute("aria-label", "Abrir meus pedidos e ingressos");
  action.setAttribute("title", "Abrir meus pedidos e ingressos");

  if (action instanceof HTMLAnchorElement) action.href = "/meus-pedidos";
  if (action.hasAttribute(ORDERS_ACTION_ATTRIBUTE)) return;
  action.setAttribute(ORDERS_ACTION_ATTRIBUTE, "true");

  action.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign("/meus-pedidos");
  }, true);
}

function applyEnhancements() {
  scheduled = false;
  synchronizeAlumniAreaOrders();
  installHomeProfileCapture();
  openRequestedDirectoryPerson();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyEnhancements);
}

export function installContentSyncEnhancements() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcContentSyncEnhancements === "true") return;
  document.documentElement.dataset.hcContentSyncEnhancements = "true";

  const start = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", schedule);
    window.addEventListener("pushstate", schedule as EventListener);
    schedule();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
