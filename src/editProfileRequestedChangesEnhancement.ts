const EDIT_PROFILE_PATHS = new Set(["/editar-perfil", "/edit-profile"]);
const QUESTIONNAIRE_SELECTOR = "[data-edit-profile-questionnaire]";
const SOURCE_SAVE_SELECTOR = ".edit-profile-questionnaire-save";
const SOURCE_AI_SELECTOR = "[data-edit-profile-regenerate-bio]";
const PROXY_AI_ATTRIBUTE = "data-hc-mini-bio-generate";
const PROXY_AI_ACTIONS_ATTRIBUTE = "data-hc-mini-bio-ai-actions";
const AUTOSAVE_DELAY_MS = 450;

let scheduled = false;
let autosaveTimer: number | null = null;
let observer: MutationObserver | null = null;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isEditProfilePage() {
  return EDIT_PROFILE_PATHS.has(currentPath());
}

function findEditProfileRoot() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3"))
    .find(element => normalize(element.textContent) === "editar meu perfil");
  return heading?.closest<HTMLElement>(".max-w-2xl") ?? heading?.parentElement ?? null;
}

function findFieldContainer(root: HTMLElement, labelText: string) {
  const label = Array.from(root.querySelectorAll<HTMLElement>("label,p"))
    .find(element => normalize(element.textContent) === normalize(labelText));
  if (!label) return null;

  let candidate: HTMLElement | null = label.parentElement;
  for (let depth = 0; candidate && depth < 4; depth += 1) {
    if (candidate.querySelector("textarea")) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}

function setQuestionnaireStatus(section: HTMLElement, message: string, tone: "muted" | "success" | "error" = "muted") {
  const status = section.querySelector<HTMLElement>("[data-edit-profile-questionnaire-status]");
  if (!status) return;
  if (status.textContent !== message) status.textContent = message;
  status.dataset.tone = tone;
}

function normalizeAutosaveStatus(section: HTMLElement) {
  const status = section.querySelector<HTMLElement>("[data-edit-profile-questionnaire-status]");
  if (!status) return;

  const text = status.textContent?.trim() ?? "";
  if (text === "Salvando respostas..." || text === "Salvando respostas automaticamente...") {
    setQuestionnaireStatus(section, "Salvando...");
    return;
  }
  if (text === "Respostas salvas com sucesso.") {
    setQuestionnaireStatus(section, "Respostas salvas automaticamente.", "success");
  }
}

function clickSaveWhenReady(section: HTMLElement) {
  const saveButton = section.querySelector<HTMLButtonElement>(SOURCE_SAVE_SELECTOR);
  if (!saveButton) {
    setQuestionnaireStatus(section, "Não foi possível salvar automaticamente as respostas.", "error");
    return;
  }

  if (saveButton.disabled) {
    autosaveTimer = window.setTimeout(() => clickSaveWhenReady(section), 180);
    return;
  }

  saveButton.click();
}

function scheduleAutosave(section: HTMLElement) {
  if (autosaveTimer !== null) window.clearTimeout(autosaveTimer);
  setQuestionnaireStatus(section, "Salvando...");
  autosaveTimer = window.setTimeout(() => {
    autosaveTimer = null;
    clickSaveWhenReady(section);
  }, AUTOSAVE_DELAY_MS);
}

function ensureQuestionnaireAutosave(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>(QUESTIONNAIRE_SELECTOR);
  if (!section) return;

  const saveButton = section.querySelector<HTMLButtonElement>(SOURCE_SAVE_SELECTOR);
  if (saveButton) {
    saveButton.hidden = true;
    saveButton.tabIndex = -1;
    saveButton.setAttribute("aria-hidden", "true");
    saveButton.dataset.hcAutosaveSource = "true";
  }

  section.querySelectorAll<HTMLButtonElement>("[data-question-id][data-option]").forEach(button => {
    if (button.dataset.hcAutosaveBound === "true") return;
    button.dataset.hcAutosaveBound = "true";
    button.addEventListener("click", () => scheduleAutosave(section));
  });

  normalizeAutosaveStatus(section);
}

function syncAiProxy(source: HTMLButtonElement, proxy: HTMLButtonElement) {
  proxy.disabled = source.disabled;
  proxy.textContent = source.disabled
    ? (source.textContent?.trim() || "Gerando Perfil...")
    : "Gerar Perfil com IA";
  proxy.setAttribute("aria-label", "Gerar Perfil com IA");
}

function ensureAiActionBelowBio(root: HTMLElement) {
  const bioContainer = findFieldContainer(root, "Mini bio");
  const sourceButton = root.querySelector<HTMLButtonElement>(SOURCE_AI_SELECTOR);
  if (!bioContainer || !sourceButton) return;

  sourceButton.hidden = true;
  sourceButton.tabIndex = -1;
  sourceButton.setAttribute("aria-hidden", "true");

  const legacyActions = sourceButton.closest<HTMLElement>("[data-edit-profile-questionnaire-actions]");
  if (legacyActions) legacyActions.hidden = true;

  let actions = root.querySelector<HTMLElement>(`[${PROXY_AI_ACTIONS_ATTRIBUTE}]`);
  if (!actions) {
    actions = document.createElement("div");
    actions.setAttribute(PROXY_AI_ACTIONS_ATTRIBUTE, "true");
    actions.className = "hc-mini-bio-ai-actions";
  }

  if (bioContainer.nextElementSibling !== actions) {
    bioContainer.insertAdjacentElement("afterend", actions);
  }

  let proxy = actions.querySelector<HTMLButtonElement>(`[${PROXY_AI_ATTRIBUTE}]`);
  if (!proxy) {
    proxy = document.createElement("button");
    proxy.type = "button";
    proxy.setAttribute(PROXY_AI_ATTRIBUTE, "true");
    proxy.className = "edit-profile-questionnaire-regenerate";
    proxy.addEventListener("click", () => {
      if (!sourceButton.disabled) sourceButton.click();
    });
    actions.appendChild(proxy);
  }

  syncAiProxy(sourceButton, proxy);
}

function injectStyles() {
  if (document.getElementById("hc-profile-requested-changes-style")) return;
  const style = document.createElement("style");
  style.id = "hc-profile-requested-changes-style";
  style.textContent = `
    [data-hc-autosave-source="true"],
    [data-edit-profile-questionnaire-actions][hidden] {
      display: none !important;
    }

    .hc-mini-bio-ai-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: .75rem;
      margin-bottom: .25rem;
    }

    .hc-mini-bio-ai-actions .edit-profile-questionnaire-regenerate {
      min-width: 14rem;
    }

    @media (max-width: 767px) {
      .hc-mini-bio-ai-actions,
      .hc-mini-bio-ai-actions .edit-profile-questionnaire-regenerate {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}

function applyEnhancements() {
  scheduled = false;
  if (!isEditProfilePage()) return;

  const root = findEditProfileRoot();
  if (!root) return;

  injectStyles();
  ensureQuestionnaireAutosave(root);
  ensureAiActionBelowBio(root);
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyEnhancements);
}

function resetForNavigation() {
  if (autosaveTimer !== null) window.clearTimeout(autosaveTimer);
  autosaveTimer = null;
  scheduleApply();
}

export function installEditProfileRequestedChangesEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcEditProfileRequestedChanges === "true") return;
  document.documentElement.dataset.hcEditProfileRequestedChanges = "true";

  const start = () => {
    if (!document.body) return;
    observer?.disconnect();
    observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled", "hidden"],
    });
    window.addEventListener("popstate", resetForNavigation);
    window.addEventListener("pushstate", resetForNavigation as EventListener);
    scheduleApply();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
