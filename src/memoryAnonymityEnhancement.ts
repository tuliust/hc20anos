const STYLE_ID = "hc-memory-anonymity-enhancement-style";
const CONTROL_ATTRIBUTE = "data-memory-anonymity-control";
const PROTECTED_ATTRIBUTE = "data-memory-anonymity-protected";
const MEMORY_PATH = "/nossa-historia/memorias";

let observer: MutationObserver | null = null;
let scheduled = false;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${CONTROL_ATTRIBUTE}="true"] {
      display: flex !important;
    }
  `;
  document.head.appendChild(style);
}

function protectFromLegacyProgrammaticClick(toggle: HTMLButtonElement) {
  if (toggle.getAttribute(PROTECTED_ATTRIBUTE) === "true") return;
  toggle.setAttribute(PROTECTED_ATTRIBUTE, "true");
  toggle.addEventListener("click", event => {
    const checked = toggle.className.includes("bg-[#2d6a4f]");
    if (!event.isTrusted && checked) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function syncControl() {
  scheduled = false;
  if (currentPath() !== MEMORY_PATH) return;

  const sectionLabel = Array.from(document.querySelectorAll<HTMLElement>("p"))
    .find(element => normalize(element.textContent) === "enviar memória");
  const formCard = sectionLabel?.parentElement;
  if (!formCard) return;

  const anonymousText = Array.from(formCard.querySelectorAll<HTMLElement>("span"))
    .find(element => normalize(element.textContent) === "enviar sem mostrar meu nome");
  const control = anonymousText?.closest<HTMLElement>("label");
  const toggle = control?.querySelector<HTMLButtonElement>("button");
  if (!control || !toggle) return;

  control.setAttribute(CONTROL_ATTRIBUTE, "true");
  control.removeAttribute("aria-hidden");
  toggle.type = "button";
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-label", "Enviar sem mostrar meu nome");
  protectFromLegacyProgrammaticClick(toggle);

  const checked = toggle.className.includes("bg-[#2d6a4f]");
  toggle.setAttribute("aria-checked", String(checked));
}

function scheduleSync() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(syncControl);
}

export function installMemoryAnonymityEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (document.documentElement.dataset.hcMemoryAnonymityEnhancement === "true") return;
  document.documentElement.dataset.hcMemoryAnonymityEnhancement = "true";

  injectStyle();
  observer?.disconnect();
  observer = new MutationObserver(scheduleSync);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });

  window.addEventListener("popstate", scheduleSync);
  window.addEventListener("pushstate", scheduleSync as EventListener);
  window.addEventListener("replacestate", scheduleSync as EventListener);
  scheduleSync();
}

installMemoryAnonymityEnhancement();
