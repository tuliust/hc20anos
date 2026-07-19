const ALUMNI_AREA_PATHS = new Set(["/minha-area", "/alumni-area"]);
const EX_ALUMNI_PATH = "/ex-alunos";
const PENDING_CLASS_KEY = "hc-ex-alumni-class-filter";

let scheduled = false;

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function validClassGroup(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return /^[A-D]$/.test(normalized) ? normalized : null;
}

function findClassmatesSection() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .find(element => normalizeText(element.textContent) === "ex-colegas da turma");

  if (!heading) return null;

  let current: HTMLElement | null = heading.parentElement;
  while (current && current.tagName !== "MAIN") {
    const hasViewAllButton = Array.from(current.querySelectorAll<HTMLButtonElement>("button"))
      .some(button => normalizeText(button.textContent) === "ver todos");
    if (hasViewAllButton) return current;
    current = current.parentElement;
  }

  return null;
}

function findCurrentClassGroup() {
  const profileLabel = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .find(element => normalizeText(element.textContent) === "meu perfil");
  const profileCard = profileLabel?.parentElement;

  const candidates = [
    ...Array.from(profileCard?.querySelectorAll<HTMLElement>("p") ?? []),
    ...Array.from(document.querySelectorAll<HTMLElement>("main p")),
  ];

  for (const element of candidates) {
    const match = normalizeText(element.textContent).match(/^turma\s+([a-d])$/i);
    const group = validClassGroup(match?.[1]);
    if (group) return group;
  }

  return null;
}

function rememberPendingClass(group: string) {
  try {
    window.sessionStorage.setItem(PENDING_CLASS_KEY, group);
  } catch {
    // A navegação continua funcionando mesmo sem sessionStorage.
  }
}

function readPendingClass() {
  const queryGroup = validClassGroup(new URLSearchParams(window.location.search).get("turma"));
  if (queryGroup) return queryGroup;

  try {
    return validClassGroup(window.sessionStorage.getItem(PENDING_CLASS_KEY));
  } catch {
    return null;
  }
}

function clearPendingClass() {
  try {
    window.sessionStorage.removeItem(PENDING_CLASS_KEY);
  } catch {
    // Nada a limpar quando o armazenamento está indisponível.
  }
}

function navigateToClassDirectory(group: string | null) {
  const target = group
    ? `${EX_ALUMNI_PATH}?turma=${encodeURIComponent(group)}`
    : EX_ALUMNI_PATH;

  if (group) rememberPendingClass(group);
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function handleViewAllClick(event: MouseEvent) {
  if (!ALUMNI_AREA_PATHS.has(normalizePath(window.location.pathname))) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest<HTMLButtonElement>("button");
  if (!button || normalizeText(button.textContent) !== "ver todos") return;

  const section = findClassmatesSection();
  if (!section || !section.contains(button)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  navigateToClassDirectory(findCurrentClassGroup());
}

function applyPendingClassFilter() {
  if (normalizePath(window.location.pathname) !== EX_ALUMNI_PATH) return;

  const group = readPendingClass();
  if (!group) return;

  const title = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2"))
    .find(element => normalizeText(element.textContent) === "ex-alunos");
  const pageRoot = title?.closest<HTMLElement>("section")?.parentElement;
  if (!pageRoot) return;

  const button = Array.from(pageRoot.querySelectorAll<HTMLButtonElement>("button"))
    .find(candidate => normalizeText(candidate.textContent) === `turma ${group.toLowerCase()}`);
  if (!button) return;

  const isSelected = typeof button.className === "string"
    && button.className.includes("bg-[#c9a84c]");

  if (!isSelected) button.click();

  clearPendingClass();
  if (window.location.search) {
    window.history.replaceState({}, "", EX_ALUMNI_PATH);
    window.dispatchEvent(new Event("pushstate"));
  }
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyPendingClassFilter();
  });
}

export function installClassmatesDirectoryNavigation() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcClassmatesDirectoryNavigationInstalled) return;
  (window as any).__hcClassmatesDirectoryNavigationInstalled = true;

  document.addEventListener("click", handleViewAllClick, true);

  const start = () => {
    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
    });
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("pushstate", scheduleApply);
    scheduleApply();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
