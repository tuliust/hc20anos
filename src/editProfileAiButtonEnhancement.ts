const EDIT_PROFILE_PATHS = new Set(["/editar-perfil", "/edit-profile"]);
const BUTTON_SELECTOR = "[data-edit-profile-regenerate-bio]";
const DEFAULT_LABEL = "Gerar perfil com IA";

let scheduled = false;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isEditProfilePage() {
  return EDIT_PROFILE_PATHS.has(currentPath());
}

function applyLabel() {
  scheduled = false;
  if (!isEditProfilePage()) return;

  const button = document.querySelector<HTMLButtonElement>(BUTTON_SELECTOR);
  if (!button || button.disabled) return;
  if (button.textContent?.trim() !== DEFAULT_LABEL) button.textContent = DEFAULT_LABEL;
  button.setAttribute("aria-label", DEFAULT_LABEL);
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyLabel);
}

export function installEditProfileAiButtonEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcEditProfileAiButton === "true") return;
  document.documentElement.dataset.hcEditProfileAiButton = "true";

  const start = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled"],
    });
    window.addEventListener("popstate", schedule);
    window.addEventListener("pushstate", schedule as EventListener);
    schedule();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
