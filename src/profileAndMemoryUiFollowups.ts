import { getMyProfile } from "./lib/services";
import { supabase } from "./lib/supabase";

const EDIT_PROFILE_PATHS = new Set(["/editar-perfil", "/edit-profile"]);
const MEMORY_CAROUSEL_SELECTOR = '[data-home-section="about"] [data-home-memory-carousel]';
const MEMORY_AVATAR_SLOT_SELECTOR = "[data-home-memory-avatar-slot]";
const REGENERATE_BIO_SELECTOR = "[data-edit-profile-regenerate-bio]";
const QUESTIONNAIRE_STATUS_SELECTOR = "[data-edit-profile-questionnaire-status]";

let installed = false;
let scheduled = false;
let generationWatchId = 0;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalizeLabel(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function isEditProfilePage() {
  return EDIT_PROFILE_PATHS.has(currentPath());
}

function findModalByTitle(title: string) {
  const expected = normalizeLabel(title);
  return Array.from(document.querySelectorAll<HTMLElement>('[data-modal-root="true"]'))
    .find(root => Array.from(root.querySelectorAll<HTMLElement>("p,h1,h2,h3"))
      .some(element => normalizeLabel(element.textContent) === expected)) ?? null;
}

function removeHomeMemoryAvatarDivider() {
  if (currentPath() !== "/") return;

  const carousel = document.querySelector<HTMLElement>(MEMORY_CAROUSEL_SELECTOR);
  const slot = carousel?.querySelector<HTMLElement>(MEMORY_AVATAR_SLOT_SELECTOR);
  if (!carousel || !slot) return;

  let candidate: HTMLElement | null = slot;
  for (let depth = 0; candidate && candidate !== carousel && depth < 4; depth += 1) {
    const computed = window.getComputedStyle(candidate);
    const hasLeftBorder = Number.parseFloat(computed.borderLeftWidth || "0") > 0
      || String(candidate.className ?? "").split(/\s+/).some(className => className === "border-l" || className.startsWith("border-l-"));

    if (hasLeftBorder) {
      candidate.style.setProperty("border-left-width", "0", "important");
      candidate.style.setProperty("border-left-style", "none", "important");
      candidate.style.setProperty("border-left-color", "transparent", "important");
      candidate.dataset.homeMemoryAvatarDividerRemoved = "true";
      break;
    }

    candidate = candidate.parentElement;
  }
}

function customizePasswordModal() {
  const modal = findModalByTitle("Mudar senha");
  if (!modal) return;

  const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>("button"));
  const saveButton = buttons.find(button => normalizeLabel(button.textContent) === "salvar nova senha");
  if (saveButton) {
    saveButton.textContent = "Salvar";
    saveButton.setAttribute("aria-label", "Salvar");
  }

  buttons
    .filter(button => normalizeLabel(button.textContent) === "esqueci minha senha")
    .forEach(button => button.remove());
}

function findMiniBioTextarea() {
  const label = Array.from(document.querySelectorAll<HTMLElement>("label,p"))
    .find(element => normalizeLabel(element.textContent) === "mini bio");
  if (!label) return null;

  let container: HTMLElement | null = label.parentElement;
  for (let depth = 0; container && depth < 4; depth += 1) {
    const textarea = container.querySelector<HTMLTextAreaElement>("textarea");
    if (textarea) return textarea;
    container = container.parentElement;
  }

  return null;
}

function decodeLegacyBio(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .trim();
}

function normalizeBioText(value: string | null | undefined) {
  let candidate = String(value ?? "").trim();
  if (!candidate) return "";

  const fenced = candidate.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) candidate = fenced[1].trim();

  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (typeof parsed === "string" && parsed.trim() && parsed.trim() !== candidate) {
        candidate = parsed.trim();
        continue;
      }
      if (parsed && typeof parsed === "object" && typeof (parsed as { bio?: unknown }).bio === "string") {
        return (parsed as { bio: string }).bio.replace(/\s+/g, " ").trim();
      }
    } catch {
      break;
    }
  }

  const legacyMatch = candidate.match(/^\s*\{\s*["']?bio["']?\s*:\s*["']([\s\S]*?)["']\s*\}\s*$/i);
  if (legacyMatch) return decodeLegacyBio(legacyMatch[1]).replace(/\s+/g, " ").trim();

  if (/^\s*\{\s*["']?bio["']?\s*:/i.test(candidate)) {
    return decodeLegacyBio(
      candidate
        .replace(/^\s*\{\s*["']?bio["']?\s*:\s*["']?/i, "")
        .replace(/["']?\s*\}\s*$/, ""),
    ).replace(/\s+/g, " ").trim();
  }

  return candidate.replace(/\s+/g, " ").trim();
}

function appearsSerializedBio(value: string) {
  const raw = value.trim();
  return /^```(?:json)?/i.test(raw) || /^\s*\{\s*["']?bio["']?\s*:/i.test(raw);
}

function setControlledTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(textarea, value);
  else textarea.value = value;

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
  textarea.scrollTop = 0;
  try {
    textarea.setSelectionRange(0, 0);
  } catch {
    // Alguns navegadores não permitem seleção quando o campo ainda não está visível.
  }
}

function sanitizeVisibleMiniBio() {
  if (!isEditProfilePage()) return;
  const textarea = findMiniBioTextarea();
  if (!textarea || !appearsSerializedBio(textarea.value)) return;

  const normalized = normalizeBioText(textarea.value);
  if (normalized !== textarea.value) setControlledTextareaValue(textarea, normalized);
}

async function refreshMiniBioFromProfile(watchId: number) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.id || watchId !== generationWatchId || !isEditProfilePage()) return;

  const profile = await getMyProfile(user.id).catch(() => null);
  if (!profile || watchId !== generationWatchId || !isEditProfilePage()) return;

  const bio = normalizeBioText(profile.bio);
  const textarea = findMiniBioTextarea();
  if (!textarea || !bio) return;

  if (textarea.value !== bio) setControlledTextareaValue(textarea, bio);
  else {
    textarea.scrollTop = 0;
    try {
      textarea.setSelectionRange(0, 0);
    } catch {
      // Sem ação adicional.
    }
  }
}

function watchBioGeneration() {
  const watchId = ++generationWatchId;
  const startedAt = Date.now();

  const poll = () => {
    if (watchId !== generationWatchId || !isEditProfilePage()) return;

    const status = document.querySelector<HTMLElement>(QUESTIONNAIRE_STATUS_SELECTOR);
    const statusText = normalizeLabel(status?.textContent);
    const tone = status?.dataset.tone;
    const succeeded = tone === "success"
      || statusText.includes("descricao do perfil gerada e salva com sucesso")
      || statusText.includes("perfil gerado e salvo com sucesso");
    const failed = tone === "error";

    if (succeeded) {
      window.setTimeout(() => void refreshMiniBioFromProfile(watchId), 0);
      return;
    }
    if (failed || Date.now() - startedAt > 45_000) return;

    window.setTimeout(poll, 250);
  };

  window.setTimeout(poll, 250);
}

function handleDocumentClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>(REGENERATE_BIO_SELECTOR);
  if (!button || !isEditProfilePage()) return;
  watchBioGeneration();
}

function handleMiniBioInput(event: Event) {
  if (!isEditProfilePage() || !(event.target instanceof HTMLTextAreaElement)) return;
  const textarea = findMiniBioTextarea();
  if (!textarea || textarea !== event.target || !appearsSerializedBio(textarea.value)) return;

  const normalized = normalizeBioText(textarea.value);
  if (normalized !== textarea.value) setControlledTextareaValue(textarea, normalized);
}

function handleProfileModalBackdrop(event: PointerEvent) {
  if (currentPath() !== "/ex-alunos" || !(event.target instanceof HTMLElement)) return;
  const modalRoot = event.target.closest<HTMLElement>('[data-modal-root="true"]');
  if (!modalRoot || event.target !== modalRoot) return;

  const titleMatches = Array.from(modalRoot.querySelectorAll<HTMLElement>("p,h1,h2,h3"))
    .some(element => normalizeLabel(element.textContent) === "perfil da turma");
  if (!titleMatches) return;

  const closeButton = modalRoot.querySelector<HTMLButtonElement>('button[aria-label="Fechar modal"]');
  if (!closeButton) return;

  event.preventDefault();
  event.stopPropagation();
  closeButton.click();
}

function applyFollowups() {
  scheduled = false;
  removeHomeMemoryAvatarDivider();
  customizePasswordModal();
  sanitizeVisibleMiniBio();
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyFollowups);
}

export function installProfileAndMemoryUiFollowups() {
  if (installed || typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  installed = true;

  const start = () => {
    if (!document.body) return;

    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("input", handleMiniBioInput, true);
    document.addEventListener("change", handleMiniBioInput, true);
    document.addEventListener("pointerdown", handleProfileModalBackdrop, true);
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("pushstate", scheduleApply as EventListener);
    scheduleApply();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
